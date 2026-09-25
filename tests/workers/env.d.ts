// Bindings declared in vitest.config.ts for the Workers test project.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}
