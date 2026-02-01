# Backend Updates Needed for Product API

## Overview
The frontend product creation form has been updated to align with the new variant-based product architecture. Below are the required backend adjustments to ensure compatibility.

---

## 1. Backend Response Format - Product Retrieval

### Issue
When fetching a product for editing (GET `/api/v1/products/{id}`), the backend response structure for variant option values needs adjustment.

### Current Backend Response (Expected)
```json
{
  "variants": [
    {
      "id": 1,
      "price": 29.99,
      "compare_at_price": 39.99,
      "quantity": 50,
      "sku": "TSHIRT-S-RED",
      "media_id": 123,
      "is_default": true,
      "options": ["S", "Red"]  // ❌ Frontend expects different structure
    }
  ]
}
```

### Required Backend Response
```json
{
  "variants": [
    {
      "id": 1,
      "price": 29.99,
      "compare_at_price": 39.99,
      "quantity": 50,
      "sku": "TSHIRT-S-RED",
      "media_id": 123,
      "is_default": true,
      "option_values": [  // ✅ Use this structure
        {"definition": "Size", "value": "S"},
        {"definition": "Color", "value": "Red"}
      ],
      "media": {  // ✅ Include media object
        "id": 123,
        "url": "media/client-ref/abc123.webp"
      }
    }
  ]
}
```

### Action Required
- Change variant response to include `option_values` array with objects containing `definition` and `value`
- Include full `media` object (not just `media_id`) in variant response
- Ensure `quantity` is accessible from variant object (from inventory relationship)

---

## 2. Variant Fields - Missing in Payload

### Issue
Frontend is not sending `position` and `is_active` fields, but these exist in the database schema.

### Current Frontend Payload
```json
{
  "variants": [
    {
      "price": 29.99,
      "compare_at_price": 39.99,
      "quantity": 50,
      "sku": "TSHIRT-S-RED",
      "option_values": ["S", "Red"],
      "media_id": 123,
      "is_default": true
      // Missing: position, is_active
    }
  ]
}
```

### Action Required
**Backend should auto-set these fields if not provided:**
- `position`: Auto-assign based on array index (0, 1, 2, etc.)
- `is_active`: Default to `true` if not provided
- `is_default`: If no variant has `is_default: true`, set first variant as default

---

## 3. Validation Rules Alignment

### Issue
Backend validation rules must match frontend validation.

### Required Validations

#### Option Definitions
```php
'option_definitions.*.style' => 'required|in:color,dropdown,text'
```
**Allowed values ONLY**: `color`, `dropdown`, `text`

#### Variants
```php
'variants.*.compare_at_price' => 'nullable|numeric|gte:variants.*.price'
```
**Rule**: `compare_at_price` must be ≥ `price` (or null/0)

#### Media ID
```php
'variants.*.media_id' => 'nullable|exists:media,id'
```
**Rule**: Media must exist and belong to the authenticated client

---

## 4. Inventory Handling

### Issue
Frontend sends `quantity` in variant payload, but according to DATA_MODEL, quantity is stored in `inventory` table.

### Current Frontend Payload
```json
{
  "variants": [
    {
      "quantity": 50  // Frontend sends this
    }
  ]
}
```

### Action Required
**Backend should:**
1. Accept `quantity` in variant payload
2. Auto-create inventory record for each variant
3. Store `quantity` in `inventory.quantity` field
4. Return `quantity` in variant response via accessor

**Implementation Example:**
```php
// When creating variant
$variant = ProductVariant::create($variantData);

// Auto-create inventory (should be handled in boot method)
$variant->inventory()->create([
    'quantity' => $variantData['quantity'] ?? 0,
    'track_quantity' => true
]);

// When returning variant
$variant->load('inventory');
// Accessor should return: $variant->quantity => $variant->inventory->quantity
```

---

## 5. Option Values Matching

### Issue
Frontend sends option values as simple strings, backend needs to match them to IDs.

### Frontend Payload
```json
{
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
    }
  ],
  "variants": [
    {
      "option_values": ["S", "Red"]  // Simple strings
    }
  ]
}
```

### Action Required
**Backend should:**
1. Create option definitions and their values
2. When processing variants, match `option_values` strings to the created `ProductOptionValue` IDs
3. Insert into `variant_option_values` pivot table

**Matching Logic:**
```php
foreach ($variant['option_values'] as $optionValueString) {
    // Find option value by string match
    $optionValue = ProductOptionValue::where('product_id', $product->id)
        ->where('value', $optionValueString)
        ->first();

    // Attach to variant
    $variant->optionValues()->attach($optionValue->id);
}
```

---

## 6. SKU Auto-Generation

### Issue
Frontend may send empty SKU string, backend should auto-generate.

### Action Required
**Backend should auto-generate SKU if:**
- `sku` is `null`
- `sku` is empty string `""`
- `sku` is not provided

**Pattern** (from DATA_MODEL):
```
{PRODUCT-REF}-{POSITION}-{RANDOM}
```

**Example:**
```
PROD-ABC-0-X7K9
PROD-ABC-1-M2P4
```

---

## 7. Media Upload Endpoint

### Current Status
✅ Already implemented: `POST /api/v1/media`

### Verify Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "url": "temp/media/123/filename.webp",
      "full_url": "https://cdn.example.com/temp/media/123/filename.webp",
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

### Action Required
- Verify response structure matches above
- Ensure media is stored in `temp/` folder initially
- Move media from `temp/` to permanent storage after product creation

---

## 8. Error Response Format

### Frontend Expects
The frontend handles errors in multiple formats:

```javascript
// Format 1: Nested error with details
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "البيانات المدخلة غير صالحة",
    "details": {
      "variants.0.compare_at_price": ["Compare at price must be greater than or equal to the variant price."]
    }
  }
}

// Format 2: Flat errors object
{
  "errors": {
    "option_definitions.1.style": ["Option definition style must be one of: color, dropdown, text."],
    "variants.0.compare_at_price": ["Compare at price must be greater than or equal to the variant price."]
  }
}

// Format 3: Simple message
{
  "message": "Validation failed"
}
```

### Action Required
✅ Ensure backend returns validation errors in one of the above formats

---

## 9. Product Update (PUT/PATCH)

### Issue
When updating existing product, variant IDs must be preserved.

### Frontend Payload for Update
```json
{
  "variants": [
    {
      "id": 1,  // Existing variant ID
      "price": 29.99,
      "compare_at_price": 39.99,
      "quantity": 60,  // Updated quantity
      "sku": "TSHIRT-S-RED",
      "option_values": ["S", "Red"],
      "media_id": 123,
      "is_default": true
    },
    {
      // No ID = new variant
      "price": 25.99,
      "option_values": ["M", "Blue"],
      "media_id": 124,
      "is_default": false
    }
  ]
}
```

### Action Required
**Backend should:**
1. **If variant has `id`**: Update existing variant
2. **If variant has no `id`**: Create new variant
3. **Variants not in payload**: Delete them (or mark inactive)
4. **Inventory update**: Update `inventory.quantity` for existing variants
5. **Media update**: Allow updating `media_id` for variants

---

## 10. Testing Checklist

### Create Product
- [ ] Create product with single variant (simple mode)
- [ ] Create product with multiple variants (advanced mode)
- [ ] Upload media first, then attach to variants
- [ ] Verify option values are matched correctly
- [ ] Verify inventory records are created
- [ ] Verify SKU is auto-generated when empty
- [ ] Verify `position` and `is_active` are set automatically

### Update Product
- [ ] Update existing variant (price, quantity, media)
- [ ] Add new variant to existing product
- [ ] Remove variant from product
- [ ] Update option definitions
- [ ] Verify inventory is updated correctly

### Validation
- [ ] Reject invalid option styles (not in: color, dropdown, text)
- [ ] Reject compare_at_price < price
- [ ] Reject invalid media_id
- [ ] Require at least one variant
- [ ] Ensure one variant is default

### Response
- [ ] Return `option_values` with definition and value
- [ ] Return full `media` object in variant
- [ ] Return `quantity` from inventory
- [ ] Return proper error format

---

## Summary of Changes

| #  | Change | Priority | Status |
|----|--------|----------|--------|
| 1  | Fix variant `option_values` response structure | High | ⏳ Pending |
| 2  | Auto-set `position` and `is_active` fields | Medium | ⏳ Pending |
| 3  | Validate option styles (color/dropdown/text only) | High | ⏳ Pending |
| 4  | Handle `quantity` → inventory table | High | ⏳ Pending |
| 5  | Match option value strings to IDs | High | ⏳ Pending |
| 6  | Auto-generate SKU when empty | Medium | ⏳ Pending |
| 7  | Verify media upload response format | Low | ⏳ Pending |
| 8  | Ensure error response format | Low | ⏳ Pending |
| 9  | Handle variant updates with IDs | High | ⏳ Pending |
| 10 | Include `media` object in variant response | Medium | ⏳ Pending |

---

## Related Documentation
- **Data Model**: See `DATA_MODEL.md` for complete schema
- **Frontend Implementation**: See `MEDIA_UPLOAD_FLOW.md` for upload flow
- **API Reference**: See `/CLAUDE.md` for API documentation

---

**Date**: 2025-12-09
**Prepared by**: Frontend Team
**For**: Backend Development Team
