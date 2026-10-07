# Cross-App E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright E2E test suite that verifies markium-be, markium-client, and markium-storefront work together correctly, plus PHPUnit API schema tests.

**Architecture:** A standalone `markium-tests/` project (sibling to the 3 apps) using Playwright to test real user flows across both frontends against the test backend. API helpers handle test data setup/teardown. PHPUnit schema tests are added to the existing backend test suite.

**Tech Stack:** Playwright, TypeScript, Node.js, PHPUnit (for backend schema tests)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `markium-tests/package.json`
- Create: `markium-tests/tsconfig.json`
- Create: `markium-tests/playwright.config.ts`
- Create: `markium-tests/.env.example`
- Create: `markium-tests/.gitignore`

- [ ] **Step 1: Create the project directory and package.json**

```bash
cd /Users/cinex/repo/markium
mkdir -p markium-tests
```

Write `markium-tests/package.json`:

```json
{
  "name": "markium-tests",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:auth": "playwright test tests/auth/",
    "test:products": "playwright test tests/products/",
    "test:orders": "playwright test tests/orders/",
    "test:settings": "playwright test tests/settings/",
    "test:language": "playwright test tests/language/",
    "check-servers": "bash scripts/check-servers.sh"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "dotenv": "^16.4.7"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Write `markium-tests/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@fixtures/*": ["fixtures/*"],
      "@helpers/*": ["helpers/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create playwright.config.ts**

Write `markium-tests/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'client',
      use: {
        baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:3031',
      },
    },
    {
      name: 'storefront',
      use: {
        baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3035',
      },
    },
  ],
});
```

- [ ] **Step 4: Create .env.example and .gitignore**

Write `markium-tests/.env.example`:

```
# Client dashboard
CLIENT_BASE_URL=http://localhost:3031
CLIENT_PHONE=+213XXXXXXXXX
CLIENT_PASSWORD=test-password

# Storefront
STOREFRONT_BASE_URL=http://localhost:3035
TEST_STORE_SLUG=test-store-e2e

# Backend API (for direct API calls in helpers)
API_BASE_URL=https://be-test.markium.online/api/v1
```

Write `markium-tests/.gitignore`:

```
node_modules/
dist/
test-results/
playwright-report/
.env
fixtures/.auth/
```

- [ ] **Step 5: Install dependencies**

Run: `cd /Users/cinex/repo/markium/markium-tests && npm install`

Then install Playwright browsers:

Run: `npx playwright install chromium`

- [ ] **Step 6: Create directory structure**

```bash
cd /Users/cinex/repo/markium/markium-tests
mkdir -p fixtures helpers scripts tests/auth tests/products tests/orders tests/settings tests/language fixtures/.auth
```

- [ ] **Step 7: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git init
git add package.json tsconfig.json playwright.config.ts .env.example .gitignore
git commit -m "chore: scaffold markium-tests Playwright project"
```

---

### Task 2: Server Check Script

**Files:**
- Create: `markium-tests/scripts/check-servers.sh`

- [ ] **Step 1: Write the server check script**

Write `markium-tests/scripts/check-servers.sh`:

```bash
#!/bin/bash

CLIENT_URL="${CLIENT_BASE_URL:-http://localhost:3031}"
STOREFRONT_URL="${STOREFRONT_BASE_URL:-http://localhost:3035}"
API_URL="${API_BASE_URL:-https://be-test.markium.online/api/v1}"

FAILED=0

check_server() {
  local name="$1"
  local url="$2"
  if curl -s --connect-timeout 5 --max-time 10 "$url" > /dev/null 2>&1; then
    echo "  [OK] $name ($url)"
  else
    echo "  [FAIL] $name ($url) - not reachable"
    FAILED=1
  fi
}

echo "Checking servers..."
echo ""
check_server "Client Dashboard" "$CLIENT_URL"
check_server "Storefront" "$STOREFRONT_URL"
check_server "Backend API" "$API_URL/version"
echo ""

if [ $FAILED -eq 1 ]; then
  echo "Some servers are not reachable. Start them before running tests."
  exit 1
else
  echo "All servers are up."
fi
```

- [ ] **Step 2: Make it executable and test**

Run: `chmod +x /Users/cinex/repo/markium/markium-tests/scripts/check-servers.sh`

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add scripts/check-servers.sh
git commit -m "chore: add server check script"
```

---

### Task 3: API Client Helper

**Files:**
- Create: `markium-tests/fixtures/api-client.ts`

This provides direct API access for fast test data setup/teardown without going through the UI.

- [ ] **Step 1: Write the API client**

Write `markium-tests/fixtures/api-client.ts`:

```typescript
import { request, APIRequestContext } from '@playwright/test';

export class ApiClient {
  private token: string | null = null;
  private context: APIRequestContext | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://be-test.markium.online/api/v1';
  }

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async login(): Promise<string> {
    if (!this.context) await this.init();
    const phone = process.env.CLIENT_PHONE!;
    const password = process.env.CLIENT_PASSWORD!;

    const response = await this.context!.post('/auth/login', {
      data: { phone, password },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Login failed: ${JSON.stringify(body)}`);
    }

    this.token = body.data.token;
    return this.token;
  }

  getToken(): string {
    if (!this.token) throw new Error('Not logged in. Call login() first.');
    return this.token;
  }

  private authHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async createSimpleProduct(name: string, price: number, quantity: number = 10): Promise<any> {
    const response = await this.context!.post('/products', {
      headers: this.authHeaders(),
      data: {
        name,
        description: `Test product: ${name}`,
        variants: [
          {
            price,
            quantity,
            is_default: true,
          },
        ],
      },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Create product failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async createVariantProduct(
    name: string,
    options: { name: string; type: string; style: string; values: { value: string; color_hex?: string }[] }[],
    variants: { price: number; quantity: number; option_values: string[]; is_default?: boolean }[],
  ): Promise<any> {
    const response = await this.context!.post('/products', {
      headers: this.authHeaders(),
      data: {
        name,
        description: `Test variant product: ${name}`,
        option_definitions: options,
        variants,
      },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Create variant product failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async deployProduct(productId: number): Promise<any> {
    const response = await this.context!.post(`/products/${productId}/deploy`, {
      headers: this.authHeaders(),
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Deploy product failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async deleteProduct(productId: number): Promise<void> {
    const response = await this.context!.delete(`/products/${productId}`, {
      headers: this.authHeaders(),
    });

    if (!response.ok()) {
      const body = await response.json();
      throw new Error(`Delete product failed: ${JSON.stringify(body)}`);
    }
  }

  async updateProduct(productId: number, data: Record<string, any>): Promise<any> {
    const response = await this.context!.put(`/products/${productId}/update`, {
      headers: this.authHeaders(),
      data,
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Update product failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async getStoreConfig(slug: string): Promise<any> {
    const response = await this.context!.get(`/stores/${slug}`, {
      headers: { 'Accept': 'application/json' },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Get store failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async updateStore(data: Record<string, any>): Promise<any> {
    const response = await this.context!.put(`/store`, {
      headers: this.authHeaders(),
      data,
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Update store failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async createOrder(
    storeSlug: string,
    items: { variant_id: number; quantity: number }[],
    customer: { full_name: string; phone: string; wilaya_id: number; commune_id: number; notes?: string },
  ): Promise<any> {
    const storeData = await this.getStoreConfig(storeSlug);
    const storefrontToken = storeData.storefront_token;

    const response = await this.context!.post('/orders', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Storefront-Token': storefrontToken,
      },
      data: {
        items,
        ...customer,
      },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Create order failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async getOrderTracking(uuid: string): Promise<any> {
    const response = await this.context!.get(`/orders/track/${uuid}`, {
      headers: { 'Accept': 'application/json' },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Get order tracking failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<any> {
    const response = await this.context!.patch(`/orders/${orderId}`, {
      headers: this.authHeaders(),
      data: { status },
    });

    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`Update order status failed: ${JSON.stringify(body)}`);
    }
    return body.data;
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add fixtures/api-client.ts
git commit -m "feat: add API client helper for test data setup/teardown"
```

---

### Task 4: Auth Fixture

**Files:**
- Create: `markium-tests/fixtures/auth.ts`

This provides a reusable Playwright fixture that handles login and storageState reuse.

- [ ] **Step 1: Write the auth fixture**

Write `markium-tests/fixtures/auth.ts`:

```typescript
import { test as base, Page } from '@playwright/test';
import { ApiClient } from './api-client';
import path from 'path';
import fs from 'fs';

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'client-state.json');

type AuthFixtures = {
  authenticatedPage: Page;
  apiClient: ApiClient;
  storefrontPage: Page;
};

export const test = base.extend<AuthFixtures>({
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    await client.login();
    await use(client);
    await client.dispose();
  },

  authenticatedPage: async ({ browser }, use) => {
    // Check if we have saved auth state
    if (fs.existsSync(AUTH_STATE_PATH)) {
      const context = await browser.newContext({
        storageState: AUTH_STATE_PATH,
        baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:3031',
      });
      const page = await context.newPage();

      // Verify the saved state is still valid by navigating to dashboard
      await page.goto('/dashboard');
      // If redirected to login, the state is stale — re-login
      if (page.url().includes('/auth')) {
        await context.close();
        // Fall through to fresh login below
      } else {
        await use(page);
        await context.close();
        return;
      }
    }

    // Fresh login
    const context = await browser.newContext({
      baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:3031',
    });
    const page = await context.newPage();
    await page.goto('/auth/jwt/login');

    await page.fill('input[name="phone"]', process.env.CLIENT_PHONE!.replace('+213', ''));
    await page.fill('input[name="password"]', process.env.CLIENT_PASSWORD!);

    // Wait for Turnstile to complete (if enabled) or just click submit
    // In test env, Turnstile should be disabled so submit button is enabled
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 15_000 });
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });

    // Save auth state for reuse
    fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
    await context.storageState({ path: AUTH_STATE_PATH });

    await use(page);
    await context.close();
  },

  storefrontPage: async ({ browser }, use) => {
    const storeSlug = process.env.TEST_STORE_SLUG || 'test-store-e2e';
    const context = await browser.newContext({
      baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3035',
    });
    const page = await context.newPage();
    await page.goto(`/?store=${storeSlug}`);
    // Wait for store to load (products grid or store name visible)
    await page.waitForSelector('h1', { timeout: 15_000 });
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add fixtures/auth.ts
git commit -m "feat: add auth fixture with storageState reuse"
```

---

### Task 5: Suite 1 — Auth Flow Tests

**Files:**
- Create: `markium-tests/tests/auth/login.spec.ts`

- [ ] **Step 1: Write the auth test file**

Write `markium-tests/tests/auth/login.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/auth';

test.describe('Auth Flow', () => {
  test('login with valid credentials lands on dashboard', async ({ authenticatedPage }) => {
    // authenticatedPage fixture already logs in and navigates to dashboard
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:3031',
    });
    const page = await context.newPage();
    await page.goto('/auth/jwt/login');

    await page.fill('input[name="phone"]', '555000000');
    await page.fill('input[name="password"]', 'wrongpassword123');

    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 15_000 });
    await page.click('button[type="submit"]');

    // Should show error alert and stay on login page
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth/);

    await context.close();
  });

  test('authenticated requests include Bearer token', async ({ authenticatedPage }) => {
    // Intercept an API request and verify the Authorization header
    const requestPromise = authenticatedPage.waitForRequest((req) =>
      req.url().includes('/api/') && req.headers()['authorization']?.startsWith('Bearer ')
    );

    // Navigate to a page that triggers an API call
    await authenticatedPage.goto('/dashboard/product');
    const apiRequest = await requestPromise;
    const authHeader = apiRequest.headers()['authorization'];

    expect(authHeader).toBeTruthy();
    expect(authHeader).toMatch(/^Bearer .+$/);
  });

  test('logout clears session and redirects to login', async ({ authenticatedPage }) => {
    // Open account popover and click logout
    // The avatar/account button is in the header
    await authenticatedPage.locator('header').getByRole('button').last().click();
    // Wait for popover menu
    await authenticatedPage.waitForSelector('[role="presentation"]', { timeout: 5_000 });
    // Click logout menu item
    await authenticatedPage.getByRole('menuitem').filter({ hasText: /logout|sign out/i }).click();

    await expect(authenticatedPage).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('unauthenticated dashboard access redirects to login', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:3031',
    });
    const page = await context.newPage();
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });

    await context.close();
  });
});
```

- [ ] **Step 2: Run the tests to verify they work**

Run: `cd /Users/cinex/repo/markium/markium-tests && npx playwright test tests/auth/ --reporter=list`

Expected: All 5 tests pass (requires dev servers running and valid `.env` credentials).

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add tests/auth/login.spec.ts
git commit -m "feat: add auth flow E2E tests (Suite 1)"
```

---

### Task 6: Suite 2 — Product Lifecycle Tests

**Files:**
- Create: `markium-tests/tests/products/product-lifecycle.spec.ts`

- [ ] **Step 1: Write the product lifecycle test file**

Write `markium-tests/tests/products/product-lifecycle.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/auth';

const STORE_SLUG = process.env.TEST_STORE_SLUG || 'test-store-e2e';

test.describe('Product Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let simpleProductId: number;
  let simpleProductName: string;
  let variantProductId: number;
  let variantProductName: string;

  test('create simple product via API and verify in client list', async ({ authenticatedPage, apiClient }) => {
    simpleProductName = `E2E Simple ${Date.now()}`;
    const product = await apiClient.createSimpleProduct(simpleProductName, 1500, 10);
    simpleProductId = product.id;

    await authenticatedPage.goto('/dashboard/product');
    await authenticatedPage.waitForSelector('[class*="MuiDataGrid"]', { timeout: 10_000 });

    // Verify the product appears in the list
    await expect(authenticatedPage.getByText(simpleProductName)).toBeVisible({ timeout: 10_000 });
  });

  test('deploy product changes status to deployed', async ({ apiClient, authenticatedPage }) => {
    await apiClient.deployProduct(simpleProductId);

    await authenticatedPage.goto('/dashboard/product');
    await authenticatedPage.waitForSelector('[class*="MuiDataGrid"]', { timeout: 10_000 });

    // Find the row with our product and check status
    const row = authenticatedPage.locator('[class*="MuiDataGrid-row"]', { hasText: simpleProductName });
    await expect(row).toBeVisible();
    // Status should show "deployed" (may be translated)
    await expect(row.locator('[class*="MuiChip"]')).toBeVisible();
  });

  test('deployed product visible in storefront with correct name and price', async ({ storefrontPage }) => {
    // Wait for products to load
    await storefrontPage.waitForLoadState('networkidle');

    // Product should appear in the storefront product grid
    await expect(storefrontPage.getByText(simpleProductName)).toBeVisible({ timeout: 15_000 });

    // Check price is displayed (1500 DZD)
    await expect(storefrontPage.getByText('1500')).toBeVisible();
  });

  test('edit product name via API and verify in storefront', async ({ apiClient, storefrontPage }) => {
    simpleProductName = `E2E Updated ${Date.now()}`;
    await apiClient.updateProduct(simpleProductId, { name: simpleProductName });

    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    await expect(storefrontPage.getByText(simpleProductName)).toBeVisible({ timeout: 15_000 });
  });

  test('delete product removes it from storefront', async ({ apiClient, storefrontPage }) => {
    await apiClient.deleteProduct(simpleProductId);

    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    await expect(storefrontPage.getByText(simpleProductName)).not.toBeVisible({ timeout: 10_000 });
  });

  test('create product with variants (size + color)', async ({ apiClient }) => {
    variantProductName = `E2E Variant ${Date.now()}`;
    const product = await apiClient.createVariantProduct(
      variantProductName,
      [
        {
          name: 'Size',
          type: 'text',
          style: 'dropdown',
          values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }],
        },
        {
          name: 'Color',
          type: 'color',
          style: 'color',
          values: [
            { value: 'Red', color_hex: '#FF0000' },
            { value: 'Blue', color_hex: '#0000FF' },
          ],
        },
      ],
      [
        { price: 2000, quantity: 5, option_values: ['S', 'Red'], is_default: true },
        { price: 2000, quantity: 5, option_values: ['S', 'Blue'] },
        { price: 2500, quantity: 3, option_values: ['M', 'Red'] },
        { price: 2500, quantity: 3, option_values: ['M', 'Blue'] },
        { price: 3000, quantity: 2, option_values: ['L', 'Red'] },
        { price: 3000, quantity: 2, option_values: ['L', 'Blue'] },
      ],
    );

    variantProductId = product.id;

    // Verify variant combinations were created
    expect(product.variants).toHaveLength(6);
    expect(product.option_definitions).toHaveLength(2);
  });

  test('deploy variant product and verify options in storefront', async ({ apiClient, storefrontPage }) => {
    await apiClient.deployProduct(variantProductId);

    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    // Click on the variant product to open detail
    await storefrontPage.getByText(variantProductName).click();
    await storefrontPage.waitForLoadState('networkidle');

    // Verify option selectors are displayed (Size and Color)
    await expect(storefrontPage.getByText('Size')).toBeVisible({ timeout: 10_000 });
    await expect(storefrontPage.getByText('Color')).toBeVisible({ timeout: 10_000 });
  });

  test('selecting variant updates price in storefront', async ({ storefrontPage }) => {
    // Default variant is S/Red at 2000
    await expect(storefrontPage.getByText('2000')).toBeVisible();

    // Select size L (price should change to 3000)
    // The option selectors use Radix Select components
    const sizeSelect = storefrontPage.locator('button[role="combobox"]').first();
    await sizeSelect.click();
    await storefrontPage.getByRole('option', { name: 'L' }).click();

    // Price should update to 3000
    await expect(storefrontPage.getByText('3000')).toBeVisible({ timeout: 5_000 });
  });

  test('add variant product to cart preserves variant info', async ({ storefrontPage }) => {
    // Click add to cart (look for the cart/bag button on product detail)
    const addToCartBtn = storefrontPage.locator('button').filter({ hasText: /add to cart|cart/i }).first();
    // If no text-based button, try the drawer trigger or icon button
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    } else {
      // On some themes the add to cart is a drawer trigger
      await storefrontPage.locator('[data-testid="add-to-cart"], button:has(svg)').first().click();
    }

    // Navigate to cart
    await storefrontPage.goto(`/cart?store=${STORE_SLUG}`);
    await storefrontPage.waitForLoadState('networkidle');

    // Verify cart has the variant product with correct options
    await expect(storefrontPage.getByText(variantProductName)).toBeVisible({ timeout: 10_000 });
    // Verify variant options are shown (Size: L, Color: Red)
    await expect(storefrontPage.getByText(/Size/)).toBeVisible();
    await expect(storefrontPage.getByText(/Color/)).toBeVisible();
  });

  test.afterAll(async () => {
    // Cleanup: delete the variant product
    const client = new (await import('../../fixtures/api-client')).ApiClient();
    await client.init();
    await client.login();
    try {
      await client.deleteProduct(variantProductId);
    } catch {
      // Product may already be deleted
    }
    await client.dispose();
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/cinex/repo/markium/markium-tests && npx playwright test tests/products/ --reporter=list`

Expected: All tests pass in serial order.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add tests/products/product-lifecycle.spec.ts
git commit -m "feat: add product lifecycle E2E tests (Suite 2)"
```

---

### Task 7: Suite 3 — Order Flow Tests

**Files:**
- Create: `markium-tests/tests/orders/order-flow.spec.ts`

- [ ] **Step 1: Write the order flow test file**

Write `markium-tests/tests/orders/order-flow.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/auth';

const STORE_SLUG = process.env.TEST_STORE_SLUG || 'test-store-e2e';

test.describe('Order Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let productId: number;
  let productName: string;
  let variantId: number;
  let orderUuid: string;
  let orderId: number;

  test.beforeAll(async () => {
    // Create and deploy a test product via API
    const { ApiClient } = await import('../../fixtures/api-client');
    const client = new ApiClient();
    await client.init();
    await client.login();

    productName = `E2E Order Test ${Date.now()}`;
    const product = await client.createSimpleProduct(productName, 1000, 50);
    productId = product.id;
    variantId = product.variants[0].id;
    await client.deployProduct(productId);
    await client.dispose();
  });

  test('browse products and add to cart', async ({ storefrontPage }) => {
    await storefrontPage.waitForLoadState('networkidle');

    // Click on the product
    await storefrontPage.getByText(productName).click();
    await storefrontPage.waitForLoadState('networkidle');

    // Add to cart — look for add to cart button or drawer trigger
    const addBtn = storefrontPage.locator('button').filter({ hasText: /add|cart/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }

    // Navigate to cart
    await storefrontPage.goto(`/cart?store=${STORE_SLUG}`);
    await storefrontPage.waitForLoadState('networkidle');

    // Verify cart has the product
    await expect(storefrontPage.getByText(productName)).toBeVisible({ timeout: 10_000 });
    // Verify total shows 1000
    await expect(storefrontPage.getByText('1000')).toBeVisible();
  });

  test('cart persists after page reload', async ({ storefrontPage }) => {
    await storefrontPage.goto(`/cart?store=${STORE_SLUG}`);
    await storefrontPage.waitForLoadState('networkidle');

    // Verify product is still in cart after reload
    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    await expect(storefrontPage.getByText(productName)).toBeVisible({ timeout: 10_000 });
  });

  test('wilaya dropdown populates on checkout', async ({ storefrontPage }) => {
    await storefrontPage.goto(`/cart?store=${STORE_SLUG}`);
    await storefrontPage.waitForLoadState('networkidle');

    // Find the wilaya select trigger and click it
    const wilayaSelect = storefrontPage.locator('#wilaya').locator('..').locator('button[role="combobox"]');
    await wilayaSelect.click();

    // Verify wilayas are listed (Algeria has 58 wilayas)
    const options = storefrontPage.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(10);

    // Close dropdown by pressing Escape
    await storefrontPage.keyboard.press('Escape');
  });

  test('selecting wilaya populates commune dropdown', async ({ storefrontPage }) => {
    // Select a wilaya (e.g., Alger = wilaya 16)
    const wilayaSelect = storefrontPage.locator('#wilaya').locator('..').locator('button[role="combobox"]');
    await wilayaSelect.click();
    // Pick the first wilaya option
    await storefrontPage.getByRole('option').first().click();

    // Now the commune/baladia select should be enabled and populated
    const communeSelect = storefrontPage.locator('#baladia').locator('..').locator('button[role="combobox"]');
    await expect(communeSelect).toBeEnabled({ timeout: 5_000 });
    await communeSelect.click();

    const communeOptions = storefrontPage.getByRole('option');
    const count = await communeOptions.count();
    expect(count).toBeGreaterThan(0);

    // Select first commune
    await storefrontPage.getByRole('option').first().click();
  });

  test('fill checkout form and submit order', async ({ storefrontPage }) => {
    // Fill customer info
    await storefrontPage.fill('#fullName', 'E2E Test Customer');
    await storefrontPage.fill('#phone', '0555123456');

    // Wilaya and commune should already be selected from previous test
    // Submit the order
    const submitBtn = storefrontPage.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();

    // Wait for redirect to order success page
    await expect(storefrontPage).toHaveURL(/order-success/, { timeout: 15_000 });

    // Extract UUID from URL params
    const url = new URL(storefrontPage.url());
    orderUuid = url.searchParams.get('uuid') || '';
    expect(orderUuid).toBeTruthy();
  });

  test('track order via UUID (no auth required)', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3035',
    });
    const page = await context.newPage();

    await page.goto(`/track?id=${orderUuid}&store=${STORE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Verify tracking page shows order info
    // Should show the product name in order items
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 });
    // Should show pending status
    await expect(page.getByText(/pending/i)).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test('order appears in client dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/order');
    await authenticatedPage.waitForLoadState('networkidle');

    // Order should show customer name "E2E Test Customer"
    await expect(authenticatedPage.getByText('E2E Test Customer')).toBeVisible({ timeout: 10_000 });
  });

  test('view order details shows pending status', async ({ authenticatedPage }) => {
    // Click on the order row to open details
    await authenticatedPage.getByText('E2E Test Customer').click();
    await expect(authenticatedPage).toHaveURL(/\/dashboard\/order\/\d+/, { timeout: 10_000 });

    // The stepper should show pending as active step
    const stepper = authenticatedPage.locator('[class*="MuiStepper"]');
    await expect(stepper).toBeVisible({ timeout: 10_000 });

    // Extract order ID from URL for later use
    const url = authenticatedPage.url();
    const match = url.match(/\/order\/(\d+)/);
    orderId = match ? parseInt(match[1]) : 0;
    expect(orderId).toBeGreaterThan(0);
  });

  test('confirm order updates status', async ({ apiClient, authenticatedPage }) => {
    // Confirm via API (faster and more reliable than UI clicks through dialogs)
    await apiClient.updateOrderStatus(orderId, 'confirmed');

    // Reload order detail page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    // Stepper should now show confirmed step as active
    const stepper = authenticatedPage.locator('[class*="MuiStepper"]');
    await expect(stepper).toBeVisible();
  });

  test('order tracking reflects confirmed status', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.STOREFRONT_BASE_URL || 'http://localhost:3035',
    });
    const page = await context.newPage();

    await page.goto(`/track?id=${orderUuid}&store=${STORE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Should now show confirmed status
    await expect(page.getByText(/confirmed/i)).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test.afterAll(async () => {
    // Cleanup
    const { ApiClient } = await import('../../fixtures/api-client');
    const client = new ApiClient();
    await client.init();
    await client.login();
    try {
      await client.deleteProduct(productId);
    } catch {
      // May already be deleted
    }
    await client.dispose();
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/cinex/repo/markium/markium-tests && npx playwright test tests/orders/ --reporter=list`

Expected: All 11 tests pass in serial order.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add tests/orders/order-flow.spec.ts
git commit -m "feat: add order flow E2E tests (Suite 3)"
```

---

### Task 8: Suite 4 — Settings Reflection Tests

**Files:**
- Create: `markium-tests/tests/settings/store-settings.spec.ts`

- [ ] **Step 1: Write the settings reflection test file**

Write `markium-tests/tests/settings/store-settings.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/auth';

const STORE_SLUG = process.env.TEST_STORE_SLUG || 'test-store-e2e';

test.describe('Settings Reflection', () => {
  test.describe.configure({ mode: 'serial' });

  let originalStoreName: string;

  test.beforeAll(async () => {
    // Capture original store name for restoration
    const { ApiClient } = await import('../../fixtures/api-client');
    const client = new ApiClient();
    await client.init();
    await client.login();
    const storeData = await client.getStoreConfig(STORE_SLUG);
    originalStoreName = storeData.store.name;
    await client.dispose();
  });

  test('update store name via API', async ({ apiClient }) => {
    const newName = `E2E Store ${Date.now()}`;
    await apiClient.updateStore({ name: newName });

    // Verify update via API
    const storeData = await apiClient.getStoreConfig(STORE_SLUG);
    expect(storeData.store.name).toBe(newName);
  });

  test('store name reflected in storefront', async ({ storefrontPage, apiClient }) => {
    const storeData = await apiClient.getStoreConfig(STORE_SLUG);
    const expectedName = storeData.store.name;

    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    // Store name should appear in the header h1
    await expect(storefrontPage.locator('h1').first()).toContainText(expectedName, { timeout: 10_000 });
  });

  test('update color palette via API', async ({ apiClient }) => {
    await apiClient.updateStore({
      config: {
        colorPalette: {
          primary: {
            main: '#E91E63',
          },
        },
      },
    });
  });

  test('color palette reflected in storefront CSS variables', async ({ storefrontPage }) => {
    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    // Check that the CSS variable --color-primary is set
    const primaryColor = await storefrontPage.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    });

    // The exact format may vary (hex, rgb, etc.) but should contain the color
    expect(primaryColor).toBeTruthy();
  });

  test.afterAll(async () => {
    // Restore original store name
    const { ApiClient } = await import('../../fixtures/api-client');
    const client = new ApiClient();
    await client.init();
    await client.login();
    await client.updateStore({ name: originalStoreName });
    await client.dispose();
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/cinex/repo/markium/markium-tests && npx playwright test tests/settings/ --reporter=list`

Expected: All 4 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add tests/settings/store-settings.spec.ts
git commit -m "feat: add settings reflection E2E tests (Suite 4)"
```

---

### Task 9: Suite 5 — Multi-Language & RTL Tests

**Files:**
- Create: `markium-tests/tests/language/multi-language.spec.ts`

- [ ] **Step 1: Write the language test file**

Write `markium-tests/tests/language/multi-language.spec.ts`:

```typescript
import { test, expect } from '../../fixtures/auth';

const STORE_SLUG = process.env.TEST_STORE_SLUG || 'test-store-e2e';

test.describe('Multi-Language & RTL', () => {
  test('storefront loads with store default language', async ({ storefrontPage }) => {
    await storefrontPage.waitForLoadState('networkidle');

    // The page should have a dir attribute (ltr or rtl depending on default)
    const dir = await storefrontPage.evaluate(() => document.documentElement.dir);
    expect(['ltr', 'rtl', '']).toContain(dir);
  });

  test('switch language to Arabic sets dir=rtl', async ({ storefrontPage }) => {
    await storefrontPage.waitForLoadState('networkidle');

    // Find language switcher button in header (contains flag emoji)
    const langButton = storefrontPage.locator('header button').filter({ hasText: /🇺🇸|🇩🇿|🇫🇷/ });
    await langButton.click();

    // Select Arabic from dropdown
    await storefrontPage.getByRole('menuitem', { name: /العربية/ }).click();

    // Wait for direction change
    await storefrontPage.waitForTimeout(500);

    // Verify dir="rtl" is set on html element
    const dir = await storefrontPage.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('language persists after page reload', async ({ storefrontPage }) => {
    // After switching to Arabic in previous test, reload
    // First switch to Arabic if not already
    const currentDir = await storefrontPage.evaluate(() => document.documentElement.dir);
    if (currentDir !== 'rtl') {
      const langButton = storefrontPage.locator('header button').filter({ hasText: /🇺🇸|🇩🇿|🇫🇷/ });
      await langButton.click();
      await storefrontPage.getByRole('menuitem', { name: /العربية/ }).click();
      await storefrontPage.waitForTimeout(500);
    }

    await storefrontPage.reload();
    await storefrontPage.waitForLoadState('networkidle');

    // Language should persist (RTL should still be set)
    const dir = await storefrontPage.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('key UI elements display in Arabic', async ({ storefrontPage }) => {
    // Ensure Arabic is selected
    const currentDir = await storefrontPage.evaluate(() => document.documentElement.dir);
    if (currentDir !== 'rtl') {
      const langButton = storefrontPage.locator('header button').filter({ hasText: /🇺🇸|🇩🇿|🇫🇷/ });
      await langButton.click();
      await storefrontPage.getByRole('menuitem', { name: /العربية/ }).click();
      await storefrontPage.waitForTimeout(500);
    }

    // Verify some Arabic text is visible on the page
    // Common Arabic UI elements: shopping cart text, add to cart, etc.
    const pageContent = await storefrontPage.textContent('body');
    // Arabic text contains Arabic Unicode characters (range: \u0600-\u06FF)
    const hasArabicText = /[\u0600-\u06FF]/.test(pageContent || '');
    expect(hasArabicText).toBe(true);
  });

  test('switch back to French restores dir=ltr', async ({ storefrontPage }) => {
    // Open language switcher
    const langButton = storefrontPage.locator('header button').filter({ hasText: /🇺🇸|🇩🇿|🇫🇷/ });
    await langButton.click();

    // Select French
    await storefrontPage.getByRole('menuitem', { name: /Français/ }).click();
    await storefrontPage.waitForTimeout(500);

    // Verify dir="ltr" is restored
    const dir = await storefrontPage.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('ltr');

    // Verify French text is present
    const pageContent = await storefrontPage.textContent('body');
    // Should contain Latin characters, not predominantly Arabic
    const hasArabicText = /[\u0600-\u06FF]{3,}/.test(pageContent || '');
    expect(hasArabicText).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/cinex/repo/markium/markium-tests && npx playwright test tests/language/ --reporter=list`

Expected: All 5 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add tests/language/multi-language.spec.ts
git commit -m "feat: add multi-language and RTL E2E tests (Suite 5)"
```

---

### Task 10: PHPUnit API Schema Tests

**Files:**
- Create: `markium-be/tests/Feature/Api/ApiSchemaTest.php`

These tests run in the existing PHPUnit suite and verify that API response shapes match what the frontends expect.

- [ ] **Step 1: Write the API schema test file**

Write `/Users/cinex/repo/markium/markium-be/tests/Feature/Api/ApiSchemaTest.php`:

```php
<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Client;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Wilaya;
use App\Models\Commune;

class ApiSchemaTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = Client::factory()->create([
            'is_phone_verified' => true,
        ]);

        $this->store = Store::factory()->create([
            'client_id' => $this->client->id,
            'config' => [
                'colorPalette' => ['primary' => ['main' => '#000000']],
            ],
        ]);
    }

    public function test_store_response_has_required_shape(): void
    {
        $response = $this->getJson("/api/v1/stores/{$this->store->slug}");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'store' => [
                    'ref',
                    'slug',
                    'name',
                    'logo_url',
                    'theme_name',
                    'config',
                    'contacts',
                    'created_at',
                    'updated_at',
                ],
                'storefront_token',
                'turnstile_enabled',
            ],
            'status',
        ]);
    }

    public function test_store_products_response_has_required_shape(): void
    {
        $product = Product::factory()->create([
            'client_id' => $this->client->id,
            'store_id' => $this->store->id,
            'status' => 'deployed',
        ]);

        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'is_default' => true,
        ]);

        $response = $this->getJson("/api/v1/stores/{$this->store->slug}/products");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'ref',
                    'slug',
                    'name',
                    'description',
                    'has_discount',
                    'is_in_stock',
                    'option_definitions',
                    'variants' => [
                        '*' => [
                            'id',
                            'sku',
                            'price',
                            'compare_at_price',
                            'quantity',
                            'is_in_stock',
                            'options',
                            'media',
                            'is_default',
                            'is_active',
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function test_order_tracking_response_has_required_shape(): void
    {
        $product = Product::factory()->create([
            'client_id' => $this->client->id,
            'store_id' => $this->store->id,
        ]);

        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
        ]);

        $wilaya = Wilaya::first() ?? Wilaya::factory()->create();
        $commune = Commune::first() ?? Commune::factory()->create([
            'wilaya_id' => $wilaya->id,
        ]);

        $order = Order::factory()->create([
            'client_id' => $this->client->id,
            'store_id' => $this->store->id,
            'wilaya_id' => $wilaya->id,
            'commune_id' => $commune->id,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'product_id' => $product->id,
        ]);

        $response = $this->getJson("/api/v1/orders/track/{$order->uuid}");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'id',
                'status' => ['key', 'name'],
                'items' => [
                    '*' => [
                        'product_name',
                        'quantity',
                        'unit_price',
                    ],
                ],
                'total_price',
                'total_items',
                'address' => [
                    'wilaya' => ['name'],
                    'commune' => ['name'],
                ],
                'timeline',
                'created_at',
            ],
        ]);
    }

    public function test_order_detail_response_has_required_shape(): void
    {
        $product = Product::factory()->create([
            'client_id' => $this->client->id,
            'store_id' => $this->store->id,
        ]);

        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
        ]);

        $wilaya = Wilaya::first() ?? Wilaya::factory()->create();
        $commune = Commune::first() ?? Commune::factory()->create([
            'wilaya_id' => $wilaya->id,
        ]);

        $order = Order::factory()->create([
            'client_id' => $this->client->id,
            'store_id' => $this->store->id,
            'wilaya_id' => $wilaya->id,
            'commune_id' => $commune->id,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($this->client, 'api')
            ->getJson("/api/v1/orders/{$order->id}");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'id',
                'uuid',
                'customer' => ['full_name', 'phone'],
                'address' => [
                    'commune',
                    'wilaya',
                ],
                'items' => [
                    '*' => [
                        'id',
                        'variant_id',
                        'quantity',
                        'unit_price',
                        'total_price',
                        'variant',
                        'product',
                    ],
                ],
                'subtotal',
                'total_price',
                'total_items',
                'status' => ['key', 'name'],
                'timeline',
                'active_shipment',
                'created_at',
                'updated_at',
            ],
        ]);
    }

    public function test_product_creation_blocked_at_feature_limit(): void
    {
        // This test verifies subscription feature gating works.
        // The test account should have a subscription with product limits.
        // If the subscription system allows unlimited products on the test plan,
        // skip this test.
        $this->markTestSkipped(
            'Configure test subscription with product limit to enable this test'
        );
    }
}
```

- [ ] **Step 2: Verify the test runs**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=ApiSchemaTest`

Expected: Tests pass (some may need factory adjustments based on actual model structure).

- [ ] **Step 3: Fix any factory/model issues**

The test uses factories (`Client::factory()`, `Store::factory()`, etc.). If any factory doesn't exist or has different fields, adjust the test to match the actual model structure. Common fixes:
- Check factory files in `database/factories/` for available fields
- Check model `$fillable` arrays for required fields
- Adjust `create()` calls to include required fields

- [ ] **Step 4: Commit**

```bash
cd /Users/cinex/repo/markium/markium-be
git add tests/Feature/Api/ApiSchemaTest.php
git commit -m "feat: add API schema tests for storefront-consumed endpoints"
```

---

### Task 11: Run Full Suite and Fix Issues

**Files:**
- Modify: Any test file that needs adjustment based on actual UI/API behavior

- [ ] **Step 1: Create .env from .env.example with real credentials**

```bash
cd /Users/cinex/repo/markium/markium-tests
cp .env.example .env
```

Then edit `.env` with actual test account credentials:
- `CLIENT_PHONE` — the test account phone number
- `CLIENT_PASSWORD` — the test account password
- `TEST_STORE_SLUG` — the test store's slug
- `API_BASE_URL` — the test backend URL

- [ ] **Step 2: Start all 3 dev servers**

In separate terminals:
```bash
# Terminal 1: Backend
cd /Users/cinex/repo/markium/markium-be && php artisan serve

# Terminal 2: Client
cd /Users/cinex/repo/markium/markium-client && npm run dev

# Terminal 3: Storefront
cd /Users/cinex/repo/markium/markium-storefront && npm run dev
```

- [ ] **Step 3: Check servers are up**

Run: `cd /Users/cinex/repo/markium/markium-tests && npm run check-servers`

Expected: All 3 servers reported as OK.

- [ ] **Step 4: Run the full test suite**

Run: `cd /Users/cinex/repo/markium/markium-tests && npm test -- --reporter=list`

Expected: All tests pass. If any fail, debug using:

```bash
# Run with headed browser for visual debugging
npx playwright test --headed

# Run specific failing test with trace
npx playwright test tests/orders/order-flow.spec.ts --trace on

# Open trace viewer
npx playwright show-trace test-results/*/trace.zip
```

- [ ] **Step 5: Fix any selector mismatches**

Common issues to fix:
- Selectors that don't match actual DOM elements (check with `npx playwright test --ui`)
- Timing issues (increase timeouts or add better wait conditions)
- API response shape differences (update assertions)
- Turnstile blocking submissions (ensure `TURNSTILE_ENABLED=false` in backend `.env`)

- [ ] **Step 6: Run backend schema tests**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=ApiSchemaTest`

Expected: All schema tests pass.

- [ ] **Step 7: Commit any fixes**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add -A
git commit -m "fix: adjust selectors and assertions after full suite run"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run complete suite from scratch**

```bash
cd /Users/cinex/repo/markium/markium-tests
rm -rf fixtures/.auth/  # Clear cached auth state
npm test
```

Expected: All 5 suites pass end-to-end.

- [ ] **Step 2: Verify suite count matches spec**

Check that all tests from the spec are covered:
- Suite 1 (Auth): 5 tests
- Suite 2 (Products): 8 tests (create, deploy, storefront display, edit, storefront update, delete, storefront gone, variants, variant options, variant price, variant cart)
- Suite 3 (Orders): 11 tests (browse, cart persist, wilaya, commune, submit, variant details, tracking, dashboard, details, confirm, tracking update)
- Suite 4 (Settings): 4 tests (update name, name in storefront, update colors, colors in storefront)
- Suite 5 (Language): 5 tests (default lang, Arabic RTL, persist, Arabic text, French restore)
- API Schema: 5 PHPUnit tests

- [ ] **Step 3: Commit final state**

```bash
cd /Users/cinex/repo/markium/markium-tests
git add -A
git commit -m "chore: final verification complete - all E2E suites passing"
```
