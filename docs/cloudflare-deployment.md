# Cloudflare deployment

MnMapping deploys as a full-stack Next.js application on Cloudflare Workers. It uses vinext so the location-search and GIS-proxy route handlers continue to run on the same hostname as the map. A static Cloudflare Pages export is not used because it would remove those server routes.

Production URL (personal build): [mnmapping.eischens-brad.workers.dev](https://mnmapping.eischens-brad.workers.dev)

## Two builds from one codebase

One `main` branch produces two different deployments, distinguished only by a build-time environment variable — see `src/config/appMode.ts`:

| | Personal build | Public (sharing) build |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_MODE` | `personal` | `public` (or unset — this is the default) |
| Vendor county imagery (EagleView/Pictometry/etc., docs/licensing RISK-REGISTER.md item B1) | Embedded live | Linked out via "External imagery" only |
| Parcel owner/mailing-address/tax fields for the 10 counties in item H2 | Shown | Redacted, with a link to the county's own site |
| Esri 3D terrain (item H1) | Included | Not included |
| Worker name / `wrangler.jsonc` environment | `mn-mapping` (default env) | `public-mn-mapping` (`env.public`) |
| Access | Password-protected (Cloudflare Access) — operator only | Open to anyone |

Because this is a single codebase, every county or feature added in the future automatically exists in both builds — there is nothing to keep in sync between branches. `wrangler.jsonc` defines both Worker configurations; `package.json` has a matching `deploy:vinext:public` script alongside the existing `deploy:vinext`.

To build either version locally:

```bash
npm run build:vinext                                      # public (default)
NEXT_PUBLIC_APP_MODE=personal npm run build:vinext         # personal
```

## One-time repository preparation

The repository is already configured with:

- `vite.config.ts` for vinext and the Cloudflare Vite plugin
- `wrangler.jsonc` with the Worker name `mn-mapping`
- Cloudflare build, local-preview, and deploy scripts in `package.json`
- automatic copying of Cesium runtime assets before Next.js and vinext builds

Verify the Cloudflare artifact locally from the repository root:

```bash
npm install
npm run build:vinext
npm run start:vinext
```

Wrangler serves the production Worker at `http://localhost:8787`. Press `x` in that terminal to stop it.

Commit and push `package.json`, `package-lock.json`, `vite.config.ts`, `wrangler.jsonc`, and `.gitignore` before connecting Cloudflare. Cloudflare can only build files that exist in the GitHub repository.

## Connect GitHub for automatic deployment

1. Sign in to the Cloudflare dashboard and open **Workers & Pages**.
2. Select **Create application**.
3. Beside **Import a repository**, select **Get started**.
4. Connect GitHub. When GitHub asks which repositories Cloudflare may access, select **Only select repositories** and choose `eisch067/MnMapping`.
5. Select the `eisch067/MnMapping` repository.
6. Enter these settings:

| Setting | Value |
| --- | --- |
| Worker name | `mn-mapping` |
| Production branch | `main` |
| Root directory | Leave blank |
| Build command | `npm run build:vinext` |
| Deploy command | `npm run deploy:vinext` |
| Non-production branch deploy command | `npx wrangler versions upload --config dist/server/wrangler.json` |

The Worker name must match the `name` in `wrangler.jsonc`. No environment variables or secrets are currently required.

7. Select **Save and Deploy**.
8. When the build finishes, open the assigned `mn-mapping.<account-subdomain>.workers.dev` address.
9. Test location search, select a result, enter Map View, and enable one statewide layer and one county layer. This exercises the page, Cesium assets, location-search route, and GIS proxy.

After this connection, every push to `main` builds and deploys automatically. Builds from other branches can produce preview versions when non-production branch builds are enabled under **Settings > Build > Branch control**.

This `mn-mapping` application is the **personal** build. Two one-time steps turn it from the pre-audit configuration into the password-protected personal deployment:

1. Open the `mn-mapping` application, then **Settings > Variables and Secrets**, and add a build variable: `NEXT_PUBLIC_APP_MODE` = `personal`. Trigger a new deployment (push to `main`, or **Deployments > Retry deployment**) so the build picks it up.
2. Set up Cloudflare Access (below) so only you can reach it.

## Set up the public sharing deployment

This is a second, separate Cloudflare application built from the same repository and branch, deployed as its own Worker (`public-mn-mapping`, defined under `env.public` in `wrangler.jsonc`) so it gets its own URL and is never password-gated.

1. In the Cloudflare dashboard, open **Workers & Pages > Create application > Import a repository** and select `eisch067/MnMapping` again (the same repo can back more than one application).
2. Enter these settings:

| Setting | Value |
| --- | --- |
| Worker name | `public-mn-mapping` |
| Production branch | `main` |
| Root directory | Leave blank |
| Build command | `npm run build:vinext` |
| Deploy command | `npm run deploy:vinext:public` |
| Non-production branch deploy command | `npx wrangler versions upload --config dist/server/wrangler.json --env public` |

3. Under **Settings > Variables and Secrets**, add two build variables:
   - `NEXT_PUBLIC_APP_MODE` = `public`
   - `CLOUDFLARE_ENV` = `public` (this is what makes the build emit the `public-mn-mapping` Worker config instead of the default `mn-mapping` one — see the `env.public` block in `wrangler.jsonc`)
4. Select **Save and Deploy**. Do not add a Cloudflare Access policy to this application — it's meant to be open.
5. Open the assigned `public-mn-mapping.<account-subdomain>.workers.dev` address and run through the same smoke test as step 9 above, then confirm a county with unlicensed vendor imagery (e.g. Aitkin) shows an "External imagery ↗" link rather than an embedded layer, and that a county from the H2 redaction list (e.g. Hennepin) shows parcel shape/acres/legal description but no owner name or mailing address.

Every future push to `main` now deploys to both `mn-mapping` (personal) and `public-mn-mapping` (sharing) automatically, each built from the identical source with only the build variables differing.

## Continuous integration

The `CI` workflow (`.github/workflows/ci.yml`) runs on every pull request. It never deploys; Cloudflare deploys `main` separately, as described above.

| Check | What it runs |
| --- | --- |
| `Lint, typecheck, tests` | `npm run lint` (zero warnings allowed), `npm run typecheck`, and `npm test` (Vitest plus the registry audit) |
| `Build and smoke (personal)` | `npm run build:vinext` with `NEXT_PUBLIC_APP_MODE=personal`, then the Playwright tests at both viewports (390×844 and 1280×800) |
| `Build and smoke (public)` | The same with `NEXT_PUBLIC_APP_MODE=public` and `CLOUDFLARE_ENV=public` |

Branch protection on `main` requires all three checks to pass and blocks direct pushes, so every change reaches `main` through a pull request. Actions in the workflow are pinned to commit SHAs with a version comment; update the SHA and the comment together. When a Playwright run fails, the workflow uploads its report and traces as an artifact for seven days.

## Password-protect the personal deployment with Cloudflare Access

Cloudflare Access sits in front of the Worker and blocks every request until the visitor signs in with an approved email — no code changes needed in MnMapping itself.

1. In the Cloudflare dashboard, open **Zero Trust** (left sidebar, may prompt you to enable Zero Trust on the account the first time — the free plan covers a small number of users).
2. Go to **Access > Applications > Add an application**, and choose **Self-hosted**.
3. Set the application domain to the `mn-mapping` Worker's hostname (`mnmapping.eischens-brad.workers.dev`, or your custom domain if you've added one under **Domains & Routes**).
4. Add a policy, e.g. named "Owner only", action **Allow**, with an Include rule of **Emails** listing the address(es) you personally use to sign in. Save.
5. Visit the personal URL in a private/incognito window. Cloudflare should present a login page (a one-time code emailed to you, or whatever identity provider you configured) before MnMapping loads at all. Confirm an email **not** on the allow list is rejected.

The public (`public-mn-mapping`) application should have no Access application in front of it.

## Add a custom domain

The domain must already be an active zone in the same Cloudflare account.

1. Open **Workers & Pages** and select `mn-mapping`.
2. Open **Settings > Domains & Routes**.
3. Select **Add > Custom Domain**.
4. Enter a hostname such as `map.example.com` and select **Add Custom Domain**.

Cloudflare creates the DNS record and TLS certificate. A hostname with an existing CNAME record must be cleared or changed before Cloudflare can attach it as a Worker custom domain.

## Optional command-line deployment

GitHub integration is the normal deployment path. For a one-off deployment from this computer:

```bash
npx wrangler login
npm run build:vinext
npm run deploy:vinext
```

The login command opens Cloudflare authorization in a browser. The deploy command publishes the already-built `dist` artifact.
