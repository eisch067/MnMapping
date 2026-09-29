import * as publicSync from "../publicSyncRoute";

type SyncHandlers = typeof import("./syncRouteImpl");
const personalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";

export const runtime = "edge";
export const GET: SyncHandlers["GET"] = async (request) => {
  if (!personalBuild) return publicSync.GET(request);
  const handlers = await import("./syncRouteImpl");
  return handlers.GET(request);
};
export const POST: SyncHandlers["POST"] = async (request) => {
  if (!personalBuild) return publicSync.POST(request);
  const handlers = await import("./syncRouteImpl");
  return handlers.POST(request);
};
