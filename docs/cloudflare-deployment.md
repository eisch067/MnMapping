# Cloudflare deployment

MnMapping deploys as a full-stack Next.js application on Cloudflare Workers. It uses vinext so the location-search and GIS-proxy route handlers continue to run on the same hostname as the map. A static Cloudflare Pages export is not used because it would remove those server routes.

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
