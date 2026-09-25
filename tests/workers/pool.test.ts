import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Workers test pool", () => {
  it("runs tests inside the Workers runtime", () => {
    expect(navigator.userAgent).toBe("Cloudflare-Workers");
  });

  // D1 state is shared by every test in a file, so tests must not assume empty tables.
  it("provides a D1 database", async () => {
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS smoke (id INTEGER PRIMARY KEY, value TEXT NOT NULL)",
    );

    const { meta } = await env.DB.prepare("INSERT INTO smoke (value) VALUES (?)").bind("ok").run();
    const row = await env.DB.prepare("SELECT value FROM smoke WHERE id = ?")
      .bind(meta.last_row_id)
      .first<{ value: string }>();

    expect(row?.value).toBe("ok");
  });
});
