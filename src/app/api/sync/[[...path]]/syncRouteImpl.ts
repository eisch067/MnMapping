import { env } from "cloudflare:workers";
import { deleteAccount, pullChanges, pushMutation, unauthorizedResponse, verifyAccessToken, type SyncEnv } from "@/lib/syncServer";

export const runtime = "edge";

export async function GET(request: Request) {
  const owner = await verifyAccessToken(request, env as unknown as SyncEnv);
  if (!owner) return unauthorizedResponse();
  if (new URL(request.url).pathname !== "/api/sync") return Response.json({ error: "Not found." }, { status: 404 });
  const params = new URL(request.url).searchParams;
  const cursor = Number(params.get("cursor") ?? 0);
  const limit = Number(params.get("limit") ?? 100);
  if (!Number.isSafeInteger(cursor) || cursor < 0 || !Number.isSafeInteger(limit)) {
    return Response.json({ error: "Invalid cursor or limit." }, { status: 400 });
  }
  return pullChanges(env.DB, owner, cursor, limit);
}

export async function POST(request: Request) {
  const owner = await verifyAccessToken(request, env as unknown as SyncEnv);
  if (!owner) return unauthorizedResponse();
  const path = new URL(request.url).pathname;
  if (path === "/api/sync/reset") return deleteAccount(env.DB, owner, new Date());
  if (path !== "/api/sync") return Response.json({ error: "Not found." }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > 512_000) {
    return Response.json({ error: "Mutation is too large." }, { status: 413 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 512_000) return Response.json({ error: "Mutation is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Expected a JSON mutation." }, { status: 400 });
  }
  return pushMutation(env.DB, owner, body as Parameters<typeof pushMutation>[2], new Date());
}
