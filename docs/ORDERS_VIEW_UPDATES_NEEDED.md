# Orders List View Updates Needed

## Overview
The order data model has been updated to support multiple items per order, better customer data structure, and store information. The OrdersListView component needs updates to handle the new data structure.

---

## Data Model Comparison

### Old Order Model (Current)
```json
{
  "id": 1,
  "status": "pending",
  "quantity": 2,
  "customer": {
    "id": 123,
    "full_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+213123456789"
  },
  "address": {
    "id": 456,
    "street_address": "123 Main St",
    "wilaya": {
      "id": 16,
      "name": "Algiers",
      "name_ar": "الجزائر"
    },
    "commune": {
      "id": 123,
      "name": "Bab Ezzouar",
      "name_ar": "باب الزوار"
    },
    "full_address": "123 Main St, Bab Ezzouar, Algiers"
  },
  "product": {
    "id": 789,
    "name": "T-Shirt Red",
    "price": 29.99
  },
  "variant": {
    "id": 101,
    "sku": "TSHIRT-RED-M",
    "options": ["M", "Red"]
  }
}
```

### New Order Model (Updated)
```json
{
  "id": 1,
  "ref": "ORD-2024-0001",
  "status": "pending",
  "subtotal": 59.98,
  "shipping_cost": 5.00,
  "total": 64.98,
  "total_items": 2,
  "notes": "Please call before delivery",
  "customer": {
    "id": 123,
    "full_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+213123456789",
    "email": "john@example.com"
  },
  "address": {
    "id": 456,
    "street_address": "123 Main St",
    "wilaya": {
      "id": 16,
      "name": "Algiers",
      "name_ar": "الجزائر",
      "code": "16"
    },
    "commune": {
      "id": 123,
      "name": "Bab Ezzouar",
      "name_ar": "باب الزوار",
      "code": "16001"
    },
    "full_address": "123 Main St, Bab Ezzouar, Algiers"
  },
  "store": {
    "id": 10,
    "name": "Main Store",
    "code": "STORE-001"
  },
  "items": [
    {
      "id": 1,
      "quantity": 2,
      "unit_price": 29.99,
      "total_price": 59.98,
      "product": {
        "id": 789,
        "name": "T-Shirt",
        "ref": "PROD-001"
      },
      "variant": {
        "id": 101,
        "sku": "TSHIRT-RED-M",
        "option_values": [
          {"definition": "Size", "value": "M"},
          {"definition": "Color", "value": "Red"}
        ]
      }
    }
  ]
}
```

---

## Breaking Changes

### 1. Single Product → Multiple Items Array

**Current Code (Line 105-111)**:
```javascript
return {
  ...item,
  name: item?.customer?.full_name,
  phone: item?.customer?.phone,
  product: item?.product?.name,
  quantity: item?.quantity,  // ❌ Direct access
  c_status: translatedStatus,
  full_address: /* address formatting */,
  color,
};
```

**Issue**:
- Old model: `order.product` and `order.quantity` (single product per order)
- New model: `order.items[]` array (multiple products per order)

**Required Changes**:
- Display `total_items` instead of single quantity
- Show combined product names or "Multiple items"
- Handle order details modal/expand for item breakdown

---

### 2. Variant Options Structure Changed

**Old Structure**:
```javascript
variant: {
  options: ["M", "Red"]  // Simple array of strings
}
```

**New Structure**:
```javascript
variant: {
  option_values: [
    {definition: "Size", value: "M"},
    {definition: "Color", value: "Red"}
  ]
}
```

**Impact**: If variant options are displayed anywhere, the access pattern needs updating.

---

### 3. New Fields Available

**Added Fields**:
- `ref` - Order reference number (e.g., "ORD-2024-0001")
- `subtotal` - Total before shipping
- `shipping_cost` - Delivery cost
- `total` - Final total amount
- `total_items` - Count of items in order
- `customer.email` - Customer email address
- `store` - Store information object
- `wilaya.code` and `commune.code` - Location codes
- `product.ref` - Product reference number

**Usage Recommendations**:
- Display `ref` instead of raw `id` in UI
- Show `total` in order summary
- Use `total_items` for quantity column
- Display `store.name` if managing multiple stores

---

## Required Updates to OrdersListView.jsx

### Update 1: TABLE_HEAD Configuration (Lines 66-77)

**Current**:
```javascript
let TABLE_HEAD = [
  { id: 'name', label: t('name'), type: "text", width: 180 },
  { id: 'phone', label: t('phone'), type: "text", width: 140 },
  { id: 'quantity', label: t('quantity'), type: "text", width: 60 },
  { id: 'product', label: t('product'), type: "text", width: 140 },
  { id: 'c_status', label: t('status'), type: "label", width: 100 },
  { id: 'full_address', label: t('address'), type: "long_text", length: 2, width: 200 },
  { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setTableData} />, width: 60, align: "right" },
]
```

**Recommended**:
```javascript
let TABLE_HEAD = [
  { id: 'ref', label: t('order_ref'), type: "text", width: 140 },  // ✅ Show ref instead of raw ID
  { id: 'name', label: t('customer'), type: "text", width: 180 },
  { id: 'phone', label: t('phone'), type: "text", width: 140 },
  { id: 'total_items', label: t('items'), type: "text", width: 80 },  // ✅ Changed from single quantity
  { id: 'total', label: t('total'), type: "currency", width: 120 },  // ✅ New: Show order total
  { id: 'c_status', label: t('status'), type: "label", width: 100 },
  { id: 'full_address', label: t('address'), type: "long_text", length: 2, width: 200 },
  { id: 'store', label: t('store'), type: "text", width: 120 },  // ✅ New: Store info (optional)
  { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setTableData} />, width: 60, align: "right" },
]
```

**Notes**:
- Removed `product` column (use expandable row or modal for item details)
- Added `ref` for better order identification
- Added `total` to show order value
- Added `store` if managing multiple stores
- Changed `quantity` → `total_items`

---

### Update 2: RformulateTable Function (Lines 80-113)

**Current**:
```javascript
const RformulateTable = (data) => {
  return data?.map((item) => {
    // Status logic...

    return {
      ...item,
      name: item?.customer?.full_name,
      phone: item?.customer?.phone,
      product: item?.product?.name,  // ❌ Single product
      c_status: translatedStatus,
      full_address: /* address formatting */,
      color,
    };
  }) || [];
};
```

**Updated**:
```javascript
const RformulateTable = (data) => {
  return data?.map((item) => {
    let color = "default";
    let translatedStatus = "";

    // Status conditions remain the same
    if (item?.status === "delivered") {
      color = "success";
      translatedStatus = t("delivered");
    } else if (item?.status === "shipped") {
      color = "info";
      translatedStatus = t("shipped");
    } else if (item?.status === "confirmed") {
      color = "secondary";
      translatedStatus = t("confirmed");
    } else if (item?.status === "pending") {
      color = "warning";
      translatedStatus = t("pending");
    } else if (item?.status === "cancelled") {
      color = "error";
      translatedStatus = t("cancelled");
    }

    // ✅ Handle multiple items
    const itemsSummary = item?.items?.length === 1
      ? item.items[0].product?.name
      : t('multiple_items', { count: item?.items?.length || 0 });

    return {
      ...item,
      ref: item?.ref || `#${item?.id}`,  // ✅ Use ref or fallback to ID
      name: item?.customer?.full_name,
      phone: item?.customer?.phone,
      total_items: item?.total_items || item?.items?.length || 0,  // ✅ Total items count
      total: item?.total || 0,  // ✅ Order total
      products_summary: itemsSummary,  // ✅ For tooltip/details
      store: item?.store?.name || '-',  // ✅ Store name
      c_status: translatedStatus,
      full_address: currentLang?.value === "ar"
        ? `${item?.address?.wilaya?.name_ar}, ${item?.address?.commune?.name_ar} ${item?.address?.street_address}`
        : `${item?.address?.wilaya?.name}, ${item?.address?.commune?.name} ${item?.address?.street_address}`,
      color,
    };
  }) || [];
};
```

---

### Update 3: Search Filter (Lines 116-133)

**Current**:
```javascript
const filters = [
  {
    key: 'search', label: t('search'), match: (item, value) =>
      item?.customer?.full_name?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.customer?.first_name?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.customer?.last_name?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.customer?.phone?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.product?.name?.toLowerCase().includes(value?.toLowerCase()) ||  // ❌ Single product
      item?.address?.street_address?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.address?.commune?.name?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.address?.commune?.name_ar?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.address?.wilaya?.name?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.address?.wilaya?.name_ar?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.address?.full_address?.toLowerCase().includes(value?.toLowerCase()) ||
      item?.id?.toString().includes(value) ||
      item?.notes?.toLowerCase().includes(value?.toLowerCase()),
  },
];
```

**Updated**:
```javascript
const filters = [
  {
    key: 'search', label: t('search'), match: (item, value) => {
      const lowerValue = value?.toLowerCase();

      // Search in customer fields
      const customerMatch =
        item?.customer?.full_name?.toLowerCase().includes(lowerValue) ||
        item?.customer?.first_name?.toLowerCase().includes(lowerValue) ||
        item?.customer?.last_name?.toLowerCase().includes(lowerValue) ||
        item?.customer?.phone?.toLowerCase().includes(lowerValue) ||
        item?.customer?.email?.toLowerCase().includes(lowerValue);  // ✅ New: email

      // ✅ Search in all items' product names
      const productsMatch = item?.items?.some(orderItem =>
        orderItem?.product?.name?.toLowerCase().includes(lowerValue) ||
        orderItem?.product?.ref?.toLowerCase().includes(lowerValue) ||
        orderItem?.variant?.sku?.toLowerCase().includes(lowerValue)
      );

      // Search in address fields
      const addressMatch =
        item?.address?.street_address?.toLowerCase().includes(lowerValue) ||
        item?.address?.commune?.name?.toLowerCase().includes(lowerValue) ||
        item?.address?.commune?.name_ar?.toLowerCase().includes(lowerValue) ||
        item?.address?.wilaya?.name?.toLowerCase().includes(lowerValue) ||
        item?.address?.wilaya?.name_ar?.toLowerCase().includes(lowerValue) ||
        item?.address?.full_address?.toLowerCase().includes(lowerValue);

      // Search in other fields
      const otherMatch =
        item?.ref?.toLowerCase().includes(lowerValue) ||  // ✅ New: order ref
        item?.id?.toString().includes(value) ||
        item?.store?.name?.toLowerCase().includes(lowerValue) ||  // ✅ New: store
        item?.notes?.toLowerCase().includes(lowerValue);

      return customerMatch || productsMatch || addressMatch || otherMatch;
    },
  },
];
```

---

### Update 4: ElementActions - updateOrder Call (Line 232)

**Current**:
```javascript
await updateOrder(item.product_id, item.id, { status: selectedStatus.key })
```

**Issue**: `item.product_id` no longer exists (orders can have multiple products).

**Options**:

**Option A - Remove product_id** (Recommended if backend API changed):
```javascript
// If backend endpoint changed from /products/{id}/orders/{id} to /orders/{id}
await updateOrder(item.id, { status: selectedStatus.key })
```

**Option B - Use first item's product_id** (If backend still requires it):
```javascript
const productId = item.items?.[0]?.product?.id || item.product_id;
await updateOrder(productId, item.id, { status: selectedStatus.key })
```

**Action Required**: Check with backend which endpoint is now used for order status updates.

---

## New Features to Consider

### 1. Order Details Modal/Expandable Row

Since orders now have multiple items, consider adding:

**Option A - Expandable Row**:
```javascript
// Add to TABLE_HEAD
{
  id: 'expand',
  label: '',
  type: "expand",
  component: (item) => <OrderItemsDetails items={item.items} />,
  width: 40
}
```

**Option B - Details Modal**:
```javascript
const [selectedOrder, setSelectedOrder] = useState(null);
const detailsModal = useBoolean();

// Add to actions menu
<MenuItem onClick={() => {
  setSelectedOrder(item);
  detailsModal.onTrue();
}}>
  <Iconify icon="eva:eye-fill" sx={{ mr: 1 }} />
  {t('view_details')}
</MenuItem>

// Modal component
<OrderDetailsModal
  open={detailsModal.value}
  onClose={detailsModal.onFalse}
  order={selectedOrder}
/>
```

### 2. Order Items Details Component

Create new component to display order items:

```javascript
// src/sections/order/components/order-items-details.jsx
function OrderItemsDetails({ items }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('product')}</TableCell>
          <TableCell>{t('variant')}</TableCell>
          <TableCell>{t('quantity')}</TableCell>
          <TableCell>{t('unit_price')}</TableCell>
          <TableCell align="right">{t('total')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items?.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.product?.name}</TableCell>
            <TableCell>
              {item.variant?.option_values?.map(ov => ov.value).join(' / ')}
            </TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
            <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 3. Items Column with Tooltip

Show item count with hover tooltip showing all products:

```javascript
{
  id: 'total_items',
  label: t('items'),
  type: "custom",
  component: (item) => (
    <Tooltip
      title={
        <Box>
          {item.items?.map((orderItem, idx) => (
            <Typography key={idx} variant="caption" display="block">
              {orderItem.quantity}× {orderItem.product?.name}
            </Typography>
          ))}
        </Box>
      }
    >
      <Chip
        label={item.total_items}
        size="small"
        color="primary"
        variant="outlined"
      />
    </Tooltip>
  ),
  width: 80
}
```

---

## Translation Keys Needed

Add to `src/locales/langs/*.json`:

```json
{
  "order_ref": "Order Reference",
  "customer": "Customer",
  "items": "Items",
  "total": "Total",
  "store": "Store",
  "multiple_items": "{{count}} Items",
  "unit_price": "Unit Price",
  "total_price": "Total Price",
  "view_details": "View Details",
  "order_details": "Order Details",
  "item_details": "Item Details",
  "subtotal": "Subtotal",
  "shipping_cost": "Shipping Cost",
  "variant": "Variant"
}
```

---

## API Updates Required

### Check Current Endpoints

**File**: `src/utils/axios.js`

Verify if endpoints need updating:

```javascript
// Old structure
order: {
  root: '/api/v1/orders',
  product: (id) => `/api/v1/products/${id}/orders`,  // ❌ May be outdated
  updateStatus: (id) => `/api/v1/orders/${id}/status`,
}

// May need to be:
order: {
  root: '/api/v1/orders',
  byProduct: (id) => `/api/v1/products/${id}/orders`,  // Keep if still needed
  details: (id) => `/api/v1/orders/${id}`,
  updateStatus: (id) => `/api/v1/orders/${id}`,  // PATCH with {status: "..."}
}
```

### Update orders.js API File

**File**: `src/api/orders.js`

Check if `updateOrder` function needs adjustment:

**Current** (Line 85-89):
```javascript
export async function updateOrder(product_id, order_id, body) {
  const URL = endpoints.product.updateOrdersStatus(product_id, order_id);
  return await axios.patch(URL, body);
}
```

**May need to be**:
```javascript
export async function updateOrder(order_id, body) {
  const URL = endpoints.order.updateStatus(order_id);  // Direct order endpoint
  return await axios.patch(URL, body);
}
```

**Action Required**: Confirm with backend team which endpoint structure is correct.

---

## Testing Checklist

### Data Display
- [ ] Order reference displays correctly instead of raw ID
- [ ] Customer name and phone display correctly
- [ ] Total items count displays correctly
- [ ] Order total amount displays correctly
- [ ] Address formatting works for both languages (AR/EN)
- [ ] Store name displays (if applicable)
- [ ] Status labels and colors display correctly

### Multiple Items Handling
- [ ] Orders with single item display product name
- [ ] Orders with multiple items show count or "Multiple items"
- [ ] Item details modal/expandable row works
- [ ] All product names searchable via search filter

### Search Functionality
- [ ] Search by customer name works
- [ ] Search by phone number works
- [ ] Search by email works (new field)
- [ ] Search by order reference works (new field)
- [ ] Search by product name works (across all items)
- [ ] Search by SKU works
- [ ] Search by address works
- [ ] Search by store name works (new field)

### Status Updates
- [ ] Status change API call works with new endpoint
- [ ] Table updates optimistically after status change
- [ ] All status transitions work (pending → confirmed → shipped → delivered)
- [ ] Cancel status works

### Edge Cases
- [ ] Empty orders array handled gracefully
- [ ] Order with no items handled
- [ ] Missing customer data handled
- [ ] Missing address data handled
- [ ] Missing store data handled (if optional)

---

## Summary of Changes

| # | Component | Change | Priority | Type |
|---|-----------|--------|----------|------|
| 1 | TABLE_HEAD | Update columns: ref, total_items, total, store | High | Breaking |
| 2 | RformulateTable | Handle items array instead of single product | High | Breaking |
| 3 | Search filters | Search across all order items | High | Breaking |
| 4 | updateOrder API | Remove product_id parameter | High | Breaking |
| 5 | OrderItemsDetails | Create new component for item breakdown | Medium | Feature |
| 6 | Items tooltip | Add hover tooltip showing all products | Low | Enhancement |
| 7 | Order details modal | Add modal to view full order details | Medium | Feature |
| 8 | Translation keys | Add new translation keys | Medium | Enhancement |
| 9 | Variant display | Update option_values access pattern | Low | Breaking |
| 10 | Export function | Update to handle new data structure | Medium | Breaking |

---

## Migration Path

### Phase 1: Critical Updates (Must Do)
1. Update `RformulateTable` to handle `items` array
2. Update `updateOrder` API call
3. Update search filters to search across items
4. Test basic functionality

### Phase 2: UI Improvements (Should Do)
1. Update TABLE_HEAD columns
2. Add order details modal/expandable row
3. Add translation keys
4. Test all scenarios

### Phase 3: Enhancements (Nice to Have)
1. Add items tooltip
2. Improve export functionality
3. Add store filter (if multi-store)
4. Add order total statistics

---

**Date**: 2025-12-10
**Prepared by**: Frontend Team
**For**: OrdersListView Component Update
