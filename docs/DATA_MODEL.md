# Markium Backend - Data Model Documentation

## Overview

Markium uses a **variant-based product architecture** with a **product options system** where products can have multiple variants (sizes, colors, etc.), each with their own pricing, inventory, and media. Media (images) are managed as a **separate entity** and uploaded independently via the `/api/v1/media` endpoint.

---

## Core Entities

### 1. Product
**Table**: `products`

The main product entity containing shared information across all variants.

**Key Fields**:
- `id` - Primary key
- `client_id` - Owner of the product
- `ref` - Unique reference code (auto-generated)
- `slug` - URL-friendly identifier
- `name` - Product name
- `description` - Short description
- `content` - Rich HTML content
- `category_id` - Optional category
- `tags` - JSON array of tags
- `status` - Enum: `draft`, `processing`, `deployed`, `failed`
- `is_active` - Boolean
- `published_at` - Timestamp

**Important**: Products do NOT store price, quantity, or images directly. These are in variants.

**Relationships**:
- `hasMany` ProductVariants
- `hasMany` ProductOptionDefinitions
- `hasMany` ProductOptionValues
- `belongsTo` Client
- `belongsTo` Category
- `hasManyThrough` Orders (via variants)

**Computed Properties**:
- `starting_price` - Minimum price across all variants
- `variants_count` - Number of variants
- `defaultVariant` - First variant marked as `is_default`

---

### 2. Media
**Table**: `media`

Standalone media entity for uploaded images. Owned by clients, referenced by variants.

**Key Fields**:
- `id` - Primary key (bigint)
- `client_id` - Owner of the media (FK → clients)
- `url` - Path/URL to the file
- `alt_text` - Alt text for accessibility (nullable)
- `width` - Image width in pixels (nullable)
- `height` - Image height in pixels (nullable)
- `mime_type` - MIME type (nullable)
- `file_size` - File size in bytes (nullable)
- `timestamps`

**Relationships**:
- `belongsTo` Client
- `hasMany` ProductVariants (referenced by media_id)

**API Endpoint**: `POST /api/v1/media` - Upload media files before creating products

---

### 3. ProductOptionDefinition
**Table**: `product_option_definitions`

Defines the options available for a product (e.g., "Size", "Color").

**Key Fields**:
- `id` - Primary key (bigint)
- `product_id` - Parent product (FK → products, cascade)
- `name` - Option name: "Size", "Color"
- `type` - Enum: `color`, `text`
- `style` - Enum: `color`, `dropdown`, `text`
- `position` - Display order (default 0)
- `timestamps`

**Relationships**:
- `belongsTo` Product
- `hasMany` ProductOptionValues

**Example**:
```php
// Product "Premium T-Shirt" has two option definitions:
[
    ['name' => 'Size', 'type' => 'text', 'style' => 'dropdown'],
    ['name' => 'Color', 'type' => 'color', 'style' => 'color']
]
```

---

### 4. ProductOptionValue
**Table**: `product_option_values`

Stores the possible values for each option definition.

**Key Fields**:
- `id` - Primary key (bigint)
- `product_id` - Parent product (FK → products, cascade)
- `option_definition_id` - Parent definition (FK → product_option_definitions, cascade)
- `value` - The value: "M", "XL", "Red"
- `color_hex` - Hex color code for color options: "#FF0000" (nullable)
- `position` - Display order (default 0)
- `timestamps`

**Relationships**:
- `belongsTo` Product
- `belongsTo` ProductOptionDefinition (as `definition`)
- `belongsToMany` ProductVariants (via `variant_option_values` pivot)

**Example**:
```php
// Option values for "Size" definition:
[
    ['value' => 'S', 'position' => 0],
    ['value' => 'M', 'position' => 1],
    ['value' => 'L', 'position' => 2],
    ['value' => 'XL', 'position' => 3]
]

// Option values for "Color" definition:
[
    ['value' => 'Red', 'color_hex' => '#FF0000', 'position' => 0],
    ['value' => 'Blue', 'color_hex' => '#0000FF', 'position' => 1]
]
```

---

### 5. ProductVariant
**Table**: `product_variants`

Individual product variations (e.g., "Red T-Shirt Size M").

**Key Fields**:
- `id` - Primary key (bigint, auto-increment)
- `product_id` - Parent product (FK → products, cascade)
- `media_id` - Associated media (FK → media, SET NULL on delete, nullable)
- `sku` - Stock Keeping Unit (unique, auto-generated if not provided)
- `price` - Current selling price
- `compare_at_price` - Original price (for showing discounts, nullable)
- `position` - Display order (default 0)
- `is_default` - Boolean (first variant is default)
- `is_active` - Boolean (default true)
- `timestamps`

**Relationships**:
- `belongsTo` Product
- `belongsTo` Media (nullable)
- `hasOne` Inventory (auto-created on variant creation)
- `belongsToMany` ProductOptionValues (via `variant_option_values` pivot)
- `hasMany` Orders

**Important Notes**:
- SKU is auto-generated using pattern: `{PRODUCT-REF}-{POSITION}-{RANDOM}`
- `quantity` is NOT stored in variants - it's in the `inventory` table
- Use `$variant->quantity` accessor to get inventory quantity
- Use `$variant->media` to get associated image
- Compare_at_price should be ≥ price (for valid discounts)

---

### 6. Variant Option Values (Pivot)
**Table**: `variant_option_values`

Links variants to their option values (Size=M, Color=Red).

**Key Fields**:
- `id` - Primary key (bigint)
- `variant_id` - FK → product_variants (cascade)
- `option_value_id` - FK → product_option_values (cascade)
- `timestamps`

**Constraint**: UNIQUE (variant_id, option_value_id)

**Example**:
```php
// Variant "Red T-Shirt Size M" has these option values linked:
[
    ['variant_id' => 1, 'option_value_id' => 2], // Size = M
    ['variant_id' => 1, 'option_value_id' => 5], // Color = Red
]
```

---

### 7. Inventory
**Table**: `inventory`

Tracks stock quantity for each variant.

**Key Fields**:
- `id` - Primary key
- `variant_id` - Parent variant (FK → product_variants, unique)
- `location_id` - Storage location (optional)
- `quantity` - Available stock (integer)
- `reserved_quantity` - Stock reserved by pending orders
- `track_quantity` - Boolean (enable stock tracking)

**Relationships**:
- `belongsTo` ProductVariant
- `belongsTo` Location

**Stock Management**:
```php
// Check stock
if ($variant->inventory->quantity >= $orderQuantity) {
    // Decrement stock
    $variant->inventory->decrement('quantity', $orderQuantity);
}

// Accessor for convenience
$stock = $variant->quantity; // Returns inventory->quantity
```

**Auto-Creation**: Inventory record is automatically created when a variant is created (via ProductVariant model boot method).

---

### 8. Order
**Table**: `orders`

Customer orders linked to specific variants.

**Key Fields**:
- `id` - Primary key
- `variant_id` - Specific variant ordered (FK → product_variants)
- `first_name`, `last_name` - Customer info
- `phone` - Customer contact
- `street_address` - Delivery address
- `wilaya_id`, `commune_id` - Algeria location
- `quantity` - Order quantity
- `unit_price` - Price at time of order (captured from variant)
- `total_price` - unit_price × quantity
- `notes` - Customer notes
- `status` - Enum: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

**Relationships**:
- `belongsTo` ProductVariant (as `variant`)
- `hasOneThrough` Product (via variant)
- `belongsTo` Wilaya
- `belongsTo` Commune

**Important**:
- Orders capture `unit_price` at order time (historical pricing)
- Stock is decremented from variant inventory when order is placed
- `product_id` is accessed via `$order->product` (through variant relationship)

---

## Data Flow

### Media Upload (Step 1)
```
1. Client uploads images via POST /api/v1/media
2. Media records created with client_id
3. Media IDs returned for use in product creation
```

### Product Creation (Step 2)
```
1. Create Product (name, description, etc.)
2. Create ProductOptionDefinition(s) (Size, Color)
3. Create ProductOptionValue(s) for each definition
4. Create ProductVariant(s) with pricing, media_id
5. Link variants to option values via pivot table
6. Inventory record auto-created per variant
7. Set inventory quantity
```

### Order Placement
```
1. Find Product by ID
2. Validate Variant belongs to Product
3. Check Variant inventory quantity
4. Create Order with variant_id and captured unit_price
5. Decrement variant inventory quantity
```

### Product Display
```
1. Load Product with relationships:
   - optionDefinitions.values
   - variants.optionValues.definition
   - variants.inventory
   - variants.media
2. Calculate starting_price (min variant price)
3. Show options with available values
4. Display variants with pricing and images
```

---

## API Request/Response Examples

### Upload Media (First)

**POST** `/api/v1/media`

```json
// Request (multipart/form-data)
{
  "files": ["<file1>", "<file2>"]
}

// Response (201)
{
  "success": true,
  "data": [
    {
      "id": 123,
      "url": "media/client-ref/abc123.webp",
      "alt_text": null,
      "width": 800,
      "height": 600,
      "mime_type": "image/webp",
      "file_size": 45678
    }
  ],
  "message": "Media uploaded successfully"
}
```

### Create Product with Options and Variants

**POST** `/api/v1/products`

```json
// Request
{
  "name": "Premium T-Shirt",
  "description": "High quality cotton",
  "option_definitions": [
    {
      "name": "Size",
      "type": "text",
      "style": "dropdown",
      "values": [
        {"value": "S"},
        {"value": "M"},
        {"value": "L"}
      ]
    },
    {
      "name": "Color",
      "type": "color",
      "style": "color",
      "values": [
        {"value": "Red", "color_hex": "#FF0000"},
        {"value": "Blue", "color_hex": "#0000FF"}
      ]
    }
  ],
  "variants": [
    {
      "price": 29.99,
      "compare_at_price": 39.99,
      "quantity": 50,
      "sku": "TSHIRT-S-RED",
      "option_values": ["S", "Red"],
      "media_id": 123,
      "is_default": true
    },
    {
      "price": 29.99,
      "quantity": 30,
      "option_values": ["M", "Blue"],
      "media_id": 124
    }
  ]
}

// Response (201)
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Premium T-Shirt",
    "status": "draft",
    "option_definitions": [
      {
        "id": 1,
        "name": "Size",
        "type": "text",
        "style": "dropdown",
        "values": [
          {"id": 1, "value": "S"},
          {"id": 2, "value": "M"},
          {"id": 3, "value": "L"}
        ]
      },
      {
        "id": 2,
        "name": "Color",
        "type": "color",
        "style": "color",
        "values": [
          {"id": 4, "value": "Red", "color_hex": "#FF0000"},
          {"id": 5, "value": "Blue", "color_hex": "#0000FF"}
        ]
      }
    ],
    "variants": [
      {
        "id": 1,
        "sku": "TSHIRT-S-RED",
        "price": 29.99,
        "compare_at_price": 39.99,
        "quantity": 50,
        "media": {
          "id": 123,
          "url": "media/client-ref/abc123.webp"
        },
        "option_values": [
          {"definition": "Size", "value": "S"},
          {"definition": "Color", "value": "Red"}
        ],
        "is_default": true
      }
    ],
    "variants_count": 2,
    "starting_price": 29.99
  }
}
```

### Place Order

**POST** `/api/v1/products/{product}/orders`

```json
// Request
{
  "variant_id": 1,
  "quantity": 2,
  "first_name": "Ahmed",
  "last_name": "Benzema",
  "phone": "+213555123456",
  "street_address": "123 Rue Didouche Mourad",
  "wilaya_id": 16,
  "commune_id": 1601,
  "notes": "Deliver before 5 PM"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "variant_id": 1,
    "quantity": 2,
    "unit_price": 29.99,
    "total_price": 59.98,
    "variant": {
      "id": 1,
      "sku": "TSHIRT-S-RED",
      "price": 29.99,
      "media": {
        "id": 123,
        "url": "media/client-ref/abc123.webp"
      },
      "option_values": [
        {"definition": "Size", "value": "S"},
        {"definition": "Color", "value": "Red"}
      ]
    },
    "status": "pending"
  }
}
```

---

## Database Schema Summary

### Relationships Diagram
```
Client
  ├─ hasMany → Media
  └─ hasMany → Product
                  ├─ hasMany → ProductOptionDefinition
                  │             └─ hasMany → ProductOptionValue
                  │                           └─ belongsToMany → ProductVariant
                  └─ hasMany → ProductVariant
                                ├─ belongsTo → Media
                                ├─ hasOne → Inventory
                                └─ hasMany → Order
```

### Key Constraints
- `product_variants.sku` - UNIQUE (across all products)
- `product_variants.media_id` - FOREIGN KEY to media (SET NULL on delete)
- `inventory.variant_id` - UNIQUE (one inventory per variant)
- `orders.variant_id` - FOREIGN KEY to product_variants
- `variant_option_values` - UNIQUE (variant_id, option_value_id)

---

## Migration from Old Schema

### Old Schema (Removed/Renamed)
```php
// Removed tables
'product_images'      => // Renamed to 'media' (decoupled from products)
'variant_attributes'  => // Replaced by option system

// Renamed tables
'variants'            => // Renamed to 'product_variants'

// Products table (OLD - removed columns)
'images'      => // Now in media table, referenced via variants.media_id
'quantity'    => // Moved to inventory table
'real_price'  => // Now compare_at_price in product_variants
'sale_price'  => // Now price in product_variants
'variations'  => // Now product_option_definitions + product_option_values
'colors'      => // Now product_option_values with type='color'
```

### New Schema
```php
// New tables
'media'                      => // Standalone media entity
'product_option_definitions' => // Option types (Size, Color)
'product_option_values'      => // Option values (S, M, L, Red, Blue)
'variant_option_values'      => // Pivot linking variants to option values

// Renamed tables
'product_variants'           => // Was 'variants'

// Products table (CURRENT)
- No price/quantity/images fields
- Relationships: variants, optionDefinitions, optionValues

// ProductVariants table (CURRENT)
- price, compare_at_price
- media_id (FK to media)
- Relationships: inventory, optionValues, media
```

---

## Factory Usage

### Create Product with Variants
```php
// Auto-create random variants (single, sizes, colors, or both)
$product = Product::factory()->create();

// Single default variant
$product = Product::factory()->withSingleVariant()->create();

// Size variants (S, M, L, XL)
$product = Product::factory()->withSizeVariants()->create();

// Color variants (Red, Blue, Black)
$product = Product::factory()->withColorVariants()->create();

// Size AND color variants (all combinations)
$product = Product::factory()->withSizeAndColorVariants()->create();

// No variants (create manually)
$product = Product::factory()->withoutVariants()->create();
```

### Create Variant with Media and Quantity
```php
// Create media first
$media = Media::factory()->forClient($client)->create();

// Create variant with media and quantity
$variant = ProductVariant::create([
    'product_id' => $product->id,
    'media_id' => $media->id,
    'sku' => 'TEST-SKU',
    'price' => 29.99,
    'compare_at_price' => 39.99,
    'position' => 0,
    'is_default' => true,
    'is_active' => true,
]);

// Set inventory quantity
$variant->inventory->update(['quantity' => 100]);

// Access quantity
$stock = $variant->inventory->quantity; // 100
$stock = $variant->quantity; // 100 (accessor)
```

### Create Order
```php
// Using factory with forVariant helper
Order::factory()->forVariant($variant)->create([
    'quantity' => 2,
    'first_name' => 'Ahmed',
    'last_name' => 'Benzema',
]);
```

---

## Common Queries

### Get Product with All Relationships
```php
$product = Product::with([
    'optionDefinitions.values',
    'variants.optionValues.definition',
    'variants.inventory',
    'variants.media',
    'category',
    'client.store'
])->find($id);

$startingPrice = $product->starting_price;
$variantsCount = $product->variants_count;
$defaultVariant = $product->defaultVariant;
```

### Get Variant with Stock and Media
```php
$variant = ProductVariant::with('inventory', 'optionValues.definition', 'media')
    ->find($id);

$inStock = $variant->inventory->quantity > 0;
$hasDiscount = $variant->compare_at_price > $variant->price;
$imageUrl = $variant->media?->url;
```

### Check Stock Before Order
```php
$variant = ProductVariant::find($variantId);

if ($variant->inventory->quantity < $orderQuantity) {
    throw new InsufficientStockException();
}

$variant->inventory->decrement('quantity', $orderQuantity);
```

### Get Orders with Variant Info
```php
$orders = Order::with([
    'variant.product',
    'variant.optionValues.definition',
    'variant.media',
    'wilaya.translations',
    'commune.translations'
])->whereHas('variant.product', function ($q) use ($clientId) {
    $q->where('client_id', $clientId);
})->get();
```

---

## Validation Rules

### Product Creation
```php
'name' => 'required|string|max:255',

// Option definitions
'option_definitions' => 'nullable|array|max:10',
'option_definitions.*.name' => 'required|string|max:100',
'option_definitions.*.type' => 'required|in:color,text',
'option_definitions.*.style' => 'required|in:color,dropdown,text',
'option_definitions.*.values' => 'required|array|min:1|max:50',
'option_definitions.*.values.*.value' => 'required|string|max:255',
'option_definitions.*.values.*.color_hex' => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',

// Variants
'variants' => 'required|array|min:1|max:100',
'variants.*.price' => 'required|numeric|min:0|max:999999.99',
'variants.*.compare_at_price' => 'nullable|numeric|gte:variants.*.price',
'variants.*.quantity' => 'required|integer|min:0',
'variants.*.sku' => 'nullable|string|unique:product_variants,sku',
'variants.*.option_values' => 'nullable|array',
'variants.*.media_id' => 'nullable|exists:media,id',
```

### Order Placement
```php
'variant_id' => 'required|exists:product_variants,id',
'quantity' => 'required|integer|min:1',
// Business logic validation:
// - Variant belongs to product
// - Sufficient stock available
// - Product status is 'deployed'
```

---

## Best Practices

### ✅ DO
- Upload media FIRST via `/api/v1/media` before creating products
- Always load variants with `inventory` and `media` relationships
- Capture `unit_price` from variant at order time (historical pricing)
- Use `$variant->quantity` accessor for convenience
- Validate variant belongs to product before creating order
- Auto-generate SKU if not provided (via ProductVariant boot method)
- Mark first variant as `is_default` if not specified
- Use option system for product variations (Size, Color)

### ❌ DON'T
- Don't store price/quantity/images on Product model
- Don't try to insert `quantity` directly into product_variants table
- Don't update variant price after orders exist (historical integrity)
- Don't allow orders without `variant_id`
- Don't assume all products have the same number of variants
- Don't upload images with product creation - use media endpoint first

---

## Related Documentation

- **API Documentation**: See `/CLAUDE.md` for complete API reference
- **Test Coverage**: 357 tests validate this data model
- **Migrations**: See `/database/migrations/2025_10_02_*` for schema

---

**Last Updated**: 2025-12-05
**Schema Version**: Options-based v3.0 (Media decoupled)
**Migration Status**: Complete - variant_attributes deprecated, media decoupled
