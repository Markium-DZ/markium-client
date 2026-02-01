# Media Upload Flow - Implementation Guide

## 🔄 **New Image Upload Flow**

The product creation now uses a **two-step process** for handling images:

### **Step 1: Upload Media** → **Step 2: Create Product with Media IDs**

---

## 📊 **Flow Diagram**

```
User selects images
       ↓
[Upload to POST /media]
       ↓
Backend creates media records
       ↓
Returns media IDs
       ↓
Attach media IDs to variants
       ↓
[Create product with media_id in variants]
       ↓
Product created ✅
```

---

## 🎯 **Implementation Details**

### **1. Create Media API** ([product.js:91-104](src/api/product.js#L91-L104))

```javascript
export async function createMedia(files) {
  const URL = '/media';
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
```

**Request Format:**
```
POST /media
Content-Type: multipart/form-data

files[]: [File object]
files[]: [File object]
files[]: [File object]
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "url": "temp/media/1/EdEa0SXMFALulrf516QKDRuEVb4RILjwFWdcNuLF.jpg",
      "full_url": "https://markium-stores.es-mad-1.linodeobjects.com/temp/media/1/EdEa0SXMFALulrf516QKDRuEVb4RILjwFWdcNuLF.jpg",
      "alt_text": null,
      "width": 780,
      "height": 1040,
      "mime_type": "image/jpeg",
      "file_size": 96608,
      "created_at": "2025-12-07T17:13:00.000000Z",
      "updated_at": "2025-12-07T17:13:00.000000Z"
    },
    {
      "id": 2,
      "url": "temp/media/2/...",
      "full_url": "https://...",
      ...
    }
  ]
}
```

---

### **2. Product Submission Flow** ([product-new-edit-form.jsx:212-368](src/sections/product/product-new-edit-form.jsx#L212-L368))

#### **Step 1: Upload Images to /media**

```javascript
const onSubmit = handleSubmit(async (data) => {
  try {
    // Step 1: Upload images and get media IDs
    let uploadedMedia = [];
    if (data.images && data.images.length > 0 && !currentProduct?.id) {
      const imageFiles = data.images.filter((img) => img instanceof File);

      if (imageFiles.length > 0) {
        console.info('Uploading images to /media...');
        const mediaResponse = await createMedia(imageFiles);
        uploadedMedia = mediaResponse.data.data || [];
        console.info('Media uploaded successfully:', uploadedMedia);
      }
    }
```

#### **Step 2: Attach Media IDs to Variants**

**Simple Mode:**
```javascript
const simpleVariant = {
  price: parseFloat(data.sale_price) || 0,
  compare_at_price: parseFloat(data.real_price) || 0,
  quantity: parseInt(data.quantity, 10) || 0,
  sku: '',
  option_values: [],
  media_id: uploadedMedia[0]?.id || null,  // ✅ First media ID
  is_default: true,
};
```

**Advanced Mode:**
```javascript
payload.variants = variants.map((variant, index) => {
  const variantData = {
    price: parseFloat(variant.price) || 0,
    compare_at_price: parseFloat(variant.compare_at_price) || 0,
    quantity: parseInt(variant.quantity, 10) || 0,
    sku: variant.sku || '',
    option_values: variant.option_values || [],
    media_id: variant.media_id || (uploadedMedia[index]?.id || null), // ✅ Map by index
    is_default: variant.is_default || false,
  };
  // ...
});
```

#### **Step 3: Create Product**

```javascript
// Submit product with media_ids in variants
const formData = new FormData();

formData.append('name', payload.name);
formData.append('description', payload.description);
// ... other fields

// Variants with media_ids
formData.append('variants[0][media_id]', 1);
formData.append('variants[1][media_id]', 2);

await createProduct(formData);
```

---

## 🔑 **Key Changes**

### **Before (Old Flow):**
```javascript
// Images sent directly with product
formData.append('images[]', file1);
formData.append('images[]', file2);

await createProduct(formData);
```

### **After (New Flow):**
```javascript
// Step 1: Upload media first
const mediaResponse = await createMedia([file1, file2]);
const uploadedMedia = mediaResponse.data.data;

// Step 2: Use media IDs in variants
formData.append('variants[0][media_id]', uploadedMedia[0].id);
formData.append('variants[1][media_id]', uploadedMedia[1].id);

await createProduct(formData);
```

---

## 📋 **Product Payload Structure**

### **Simple Mode Example:**

```javascript
// FormData sent to POST /products
name: "Premium T-Shirt"
description: "High quality..."
category_id: 1
tags[]: "premium"

variants[0][price]: 29.99
variants[0][compare_at_price]: 39.99
variants[0][quantity]: 100
variants[0][sku]: ""
variants[0][media_id]: 1           // ✅ Media ID from /media upload
variants[0][is_default]: "1"
```

### **Advanced Mode Example:**

```javascript
// FormData sent to POST /products
name: "Premium T-Shirt"

option_definitions[0][name]: "Size"
option_definitions[0][type]: "text"
option_definitions[0][style]: "dropdown"
option_definitions[0][values][0][value]: "S"
option_definitions[0][values][1][value]: "M"

option_definitions[1][name]: "Color"
option_definitions[1][type]: "color"
option_definitions[1][values][0][value]: "Red"
option_definitions[1][values][0][color_hex]: "#FF0000"

variants[0][price]: 29.99
variants[0][quantity]: 50
variants[0][sku]: "TSHIRT-S-RED"
variants[0][option_values][0]: "S"
variants[0][option_values][1]: "Red"
variants[0][media_id]: 1           // ✅ First uploaded image
variants[0][is_default]: "1"

variants[1][price]: 29.99
variants[1][quantity]: 30
variants[1][sku]: "TSHIRT-M-BLUE"
variants[1][option_values][0]: "M"
variants[1][option_values][1]: "Blue"
variants[1][media_id]: 2           // ✅ Second uploaded image
variants[1][is_default]: "0"
```

---

## 🎨 **Image Assignment in Advanced Mode**

In the variants manager UI, users can:

1. **Upload multiple images** via the image upload component
2. **Each image is uploaded to /media** and gets a media ID
3. **In the variants table**, users can assign specific images to variants
4. **Default behavior**: Images are mapped by index (first image → first variant)
5. **Manual assignment**: Users can click on variant row and select different image

---

## ⚠️ **Important Notes**

### **1. Only Upload on Create**
```javascript
if (data.images && data.images.length > 0 && !currentProduct?.id) {
  // Only upload media when creating new product
  await createMedia(imageFiles);
}
```

### **2. Media IDs are Preserved on Update**
```javascript
// When editing, existing media_id is kept
if (currentProduct?.id && variant.id) {
  variantData.media_id = variant.media_id; // Keep existing
}
```

### **3. Temporary Media Storage**
- Media uploaded to `/media` is stored in **temp** folder
- Backend should move it to permanent storage when product is created
- URL structure: `temp/media/{id}/{filename}.jpg`

---

## 🔧 **Backend Requirements**

### **1. Media Upload Endpoint**

```php
POST /media
Content-Type: multipart/form-data

// Expected Request
files[]: [File, File, File]

// Expected Response
{
  "data": [
    {
      "id": 1,
      "url": "temp/media/1/filename.jpg",
      "full_url": "https://cdn.example.com/temp/media/1/filename.jpg",
      "alt_text": null,
      "width": 1200,
      "height": 800,
      "mime_type": "image/jpeg",
      "file_size": 150000
    }
  ]
}
```

### **2. Product Creation Endpoint**

```php
POST /products

// Accepts:
- name, description, content, category_id, tags[]
- option_definitions[i][name|type|style|values]
- variants[i][price|quantity|sku|media_id|option_values|is_default]

// Backend should:
1. Validate media_id exists in media table
2. Move media from temp to permanent storage
3. Link media to variant
4. Create product with all relationships
```

---

## ✅ **Testing Checklist**

- [ ] Upload single image in simple mode → media_id attached to default variant
- [ ] Upload multiple images in advanced mode → media_ids mapped to variants
- [ ] Edit product without changing images → existing media_ids preserved
- [ ] Upload new images on edit → new media created and attached
- [ ] Verify media URLs are accessible after product creation
- [ ] Check media is moved from temp to permanent storage
- [ ] Verify variant images display correctly in product list

---

## 🚀 **Benefits of This Approach**

1. ✅ **Separation of concerns**: Media upload separate from product creation
2. ✅ **Reusable media**: Same media can be used across multiple products
3. ✅ **Better error handling**: If product creation fails, media is already uploaded
4. ✅ **Partial uploads**: Can upload media in batches if needed
5. ✅ **Preview before submit**: Users can see uploaded images before creating product
6. ✅ **Temporary storage**: Media in temp folder until product is finalized

---

**All media upload logic is now implemented and ready for testing!** 🎉
