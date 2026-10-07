## NODE.JS

- Node 16.x || 18.x

## USING YARN (Recommend)

- yarn install
- yarn dev

## USING NPM

- npm i OR npm i --legacy-peer-deps
- npm run dev

## Deployment & CI/CD

### Environments
- **Production**: `markium-clients` Cloudflare Worker
- **Dev**: `markium-clients-dev` Cloudflare Worker

### How Deployment Works
Static SPA deployed to Cloudflare Workers. GitHub Actions handles everything:

```
push to main → build with production vars → wrangler deploy → markium-clients
push to dev  → build with dev vars        → wrangler deploy → markium-clients-dev
```

Manual deploy: `gh workflow run deploy.yml -f environment=production`

### Environment Variables
All env vars are centralized in **GitHub Settings > Environments** (production / dev):
- **Variables** (readable): `VITE_HOST_API`, `VITE_STORAGE_API`, `VITE_PUBLIC_POSTHOG_HOST`, `VITE_TURNSTILE_SITE_KEY`, etc.
- **Secrets** (write-only): `VITE_PUBLIC_POSTHOG_KEY`, `VITE_POSTHOG_PERSONAL_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

Env vars are **compile-time** (baked into JS bundle by Vite during build). No runtime config on the Worker.

To change a var: GitHub repo > Settings > Environments > [env] > Variables/Secrets. Next deploy picks it up.
