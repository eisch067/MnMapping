import app from "vinext/server/fetch-handler";
import { purgeExpired, type SyncEnv } from "@/lib/syncServer";

interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
}

const worker = {
  fetch(request: Request, env: SyncEnv, context: WorkerContext) {
    return app.fetch(request, env, context);
  },
  async scheduled(_controller: unknown, env: SyncEnv, context: WorkerContext) {
    context.waitUntil(purgeExpired(env.DB, new Date()));
  },
};

export default worker;
