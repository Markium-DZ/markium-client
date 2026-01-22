# EchoTrack API - Integration Report

## Summary
The API token works successfully with the correct base URL: **`https://mono2.ecotrack.dz`**

---

## 1. Working Base URL

```
https://mono2.ecotrack.dz
```

---

## 2. Authentication

### Headers Required:
| Header | Value |
|--------|-------|
| `Authorization` | `Bearer kPQ7SGtUwJjj2otauMHeuUDDYLuVxyXV5DmFUHbEJQa6wil9KpLxU8SmvaOw` |
| `Accept` | `application/json` |
| `Content-Type` | `application/json` |

---

## 3. Available Endpoints (All Working)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/get/wilayas` | GET | Retrieve wilayas list | ✅ 200 OK |
| `/api/v1/get/fees` | GET | Retrieve shipping fees | ✅ 200 OK |
| `/api/v1/create/order` | POST | Create shipping order | ✅ Available |
| `/api/v1/get/order/label?tracking={id}` | GET | Retrieve order label (PDF) | ✅ Available |

---

## 4. Sample Requests

### Get Wilayas List
```bash
curl -X GET "https://mono2.ecotrack.dz/api/v1/get/wilayas" \
  -H "Authorization: Bearer kPQ7SGtUwJjj2otauMHeuUDDYLuVxyXV5DmFUHbEJQa6wil9KpLxU8SmvaOw" \
  -H "Accept: application/json"
```

### Get Shipping Fees
```bash
curl -X GET "https://mono2.ecotrack.dz/api/v1/get/fees" \
  -H "Authorization: Bearer kPQ7SGtUwJjj2otauMHeuUDDYLuVxyXV5DmFUHbEJQa6wil9KpLxU8SmvaOw" \
  -H "Accept: application/json"
```

---

## 5. Request Format for Create Order

### Create Order Request:
```bash
curl -X POST "https://mono2.ecotrack.dz/api/v1/create/order" \
  -H "Authorization: Bearer kPQ7SGtUwJjj2otauMHeuUDDYLuVxyXV5DmFUHbEJQa6wil9KpLxU8SmvaOw" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_client": "Client Name",
    "telephone": "0555123456",
    "telephone_2": "0666789012",
    "adresse": "123 Main Street",
    "commune": "Alger Centre",
    "code_wilaya": 16,
    "montant": 2500,
    "type": 1,
    "remarque": "Delivery notes",
    "produit": "Product description",
    "reference": "ORDER-12345"
  }'
```

### Create Order Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nom_client` | string | Yes | Customer name (max 255 chars) |
| `telephone` | numeric | Yes | Phone number (9-10 digits) |
| `telephone_2` | numeric | No | Secondary phone number |
| `adresse` | string | Yes | Delivery address (max 255 chars) |
| `commune` | string | Yes | Commune name (max 255 chars) |
| `code_wilaya` | integer | Yes | Wilaya code (1-58) |
| `montant` | numeric | Yes | Amount to collect |
| `type` | integer | Yes | Operation type: 1=Delivery, 2=Exchange, 3=Pickup, 4=Collection |
| `remarque` | string | No | Notes (max 255 chars) |
| `produit` | string | No | Product description (max 255 chars) |
| `reference` | string | No | Order reference (max 255 chars) |
| `stock` | integer | No | Stock flag (0 or 1) |
| `quantite` | integer | Conditional | Required if stock=1 |
| `stop_desk` | integer | No | Stop desk flag (0 or 1) |

---

## 7. Fees Response Structure

The `/api/v1/get/fees` endpoint returns shipping rates organized by operation type:

```json
{
  "livraison": [{ "wilaya_id": 16, "tarif": "350", "tarif_stopdesk": "600" }, ...],
  "pickup": [...],
  "echange": [...],
  "recouvrement": [...],
  "retours": [...],
  "poids": {
    "livraison": {
      "surfacturation_a_domicile_DA": "50",
      "surfacturation_stopdesk_DA": "50",
      "pour_chaque_KG": "1.00",
      "a_partir_de_KG": "5.00"
    }
  }
}
```

---

## 8. References

- **EchoTrack Postman Documentation:** https://documenter.getpostman.com/view/14517169/Tz5je15g#intro
- **EchoTrack Tracking Portal:** https://suivi.ecotrack.dz
- **Working API Base URL:** https://mono2.ecotrack.dz

---

*Report generated on: January 7, 2026*
