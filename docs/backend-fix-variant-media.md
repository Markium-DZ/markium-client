# Backend Fix: Variant Media Persistence

## Problem

The frontend sends `media_ids` when creating/updating product variants, but the backend does not persist these associations. The `GET /products` response returns `"media": []` for all variants, even after media was assigned.

This breaks the edit product flow: when reopening the edit form, no media appears selected, and previously assigned media-to-variant relationships are lost.

---

## Affected Endpoints

### 1. `POST /products` (Create Product)

**Current behavior:** Accepts `variants[].media_ids` — unknown if persisted.

**Required behavior:** For each variant in the payload, persist the relationship between the variant and the media IDs provided.

**Example payload the frontend sends:**

```json
{
  "name": "My Product",
  "description": "...",
  "option_definitions": [
    {
      "name": "اللون",
      "type": "color",
      "style": "color",
      "values": [
        { "value": "أسود", "color_hex": "#000000" },
        { "value": "أزرق", "color_hex": "#1E88E5" }
      ]
    }
  ],
  "variants": [
    {
      "price": 2800,
      "quantity": 20,
      "sku": "TFHZW-001",
      "option_values": ["أسود"],
      "media_ids": [3, 5],
      "is_default": true,
      "position": 0,
      "is_active": true
    },
    {
      "price": 780,
      "quantity": 20,
      "sku": "TFHZW-002",
      "option_values": ["أزرق"],
      "media_ids": [7],
      "is_default": false,
      "position": 1,
      "is_active": true
    }
  ]
}
```

**Action:** When creating each variant, attach the media records referenced by `media_ids` (pivot table or equivalent).

---

### 2. `POST /products/{id}/update` (Update Product)

**Current behavior:** Updates product-level fields (name, description, category, tags). Ignores `variants` in the payload.

**Required behavior:** Same as current — no change needed here. Variant updates are handled individually (see next endpoint).

---

### 3. `PUT /products/{id}/variants/{variantId}` (Update Variant)

**Current behavior:** Accepts price, quantity, sku, etc. Does NOT persist `media_ids`.

**Required behavior:** Accept `media_ids` array and **sync** (replace) the variant's media associations.

**Example payload the frontend sends:**

```json
{
  "price": 2800,
  "compare_at_price": null,
  "quantity": 20,
  "sku": "TFHZW-001",
  "media_ids": [3, 5],
  "is_default": true,
  "option_values": ["أسود"]
}
```

**Action:**
- Delete all existing media associations for this variant
- Create new associations for each ID in `media_ids`
- This is a **sync** operation (not append) — the frontend always sends the full list

---

### 4. `GET /products` (List Products)

**Current behavior:** Returns `"media": []` on every variant.

**Required behavior:** Return the full media objects for each variant.

**Expected response format per variant:**

```json
{
  "id": 1,
  "sku": "TFHZW-001",
  "price": 2800,
  "quantity": 20,
  "options": [
    {
      "definition_name": "اللون",
      "value": "أسود",
      "color_hex": "#000000"
    }
  ],
  "media": [
    {
      "id": 3,
      "full_url": "https://cdn.example.com/media/3.jpg",
      "alt_text": "Product front view",
      "file_size": 124500
    },
    {
      "id": 5,
      "full_url": "https://cdn.example.com/media/5.jpg",
      "alt_text": null,
      "file_size": 98200
    }
  ],
  "is_default": true,
  "is_active": true
}
```

**Required fields per media object:**
| Field       | Type    | Required | Description                    |
|-------------|---------|----------|--------------------------------|
| `id`        | integer | yes      | Media record ID                |
| `full_url`  | string  | yes      | Absolute URL to the file       |
| `alt_text`  | string  | no       | Alt text (nullable)            |
| `file_size` | integer | no       | File size in bytes (nullable)  |

---

## Suggested Database Schema

If not already present, a pivot table is needed:

```sql
CREATE TABLE variant_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT UNSIGNED NOT NULL,
    media_id BIGINT UNSIGNED NOT NULL,
    position INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    UNIQUE KEY unique_variant_media (variant_id, media_id)
);
```

---

## Implementation Checklist

- [ ] Create `variant_media` pivot table (migration)
- [ ] **Create product:** When processing `variants[].media_ids`, insert rows into `variant_media`
- [ ] **Update variant:** When `media_ids` is present in the PUT body, sync `variant_media` (delete old + insert new)
- [ ] **List products:** Eager-load `variant.media` relationship in the `GET /products` response
- [ ] **Delete variant:** Cascade deletes `variant_media` rows (handled by FK constraint)
- [ ] **Delete media:** Cascade deletes `variant_media` rows (handled by FK constraint)

---

## Validation Rules

- Each ID in `media_ids` must reference an existing media record owned by the same store
- Duplicate IDs in `media_ids` should be ignored (deduplicated)
- An empty `media_ids: []` should remove all media from the variant
- If `media_ids` is not present in the update payload, do not modify existing associations

---

## Testing

1. Create a product with variants that have `media_ids` → verify `GET /products` returns the media on each variant
2. Update a variant's `media_ids` → verify the response reflects the change
3. Send `media_ids: []` → verify all media is detached from the variant
4. Delete a media record → verify it's removed from all variant associations
5. Reopen the edit product page → verify media appears as selected
