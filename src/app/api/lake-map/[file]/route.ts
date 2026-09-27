import type { NextRequest } from "next/server";
import { isPersonalMode } from "@/config/appMode";
import { streamLakeMap } from "@/lib/dnr/lakeMap";

// DNR data awaits DNR confirmation before any public release, so only the personal build
// has this route.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  if (!isPersonalMode) return Response.json({ error: "Not found." }, { status: 404 });
  const { file } = await params;
  return streamLakeMap(file);
}
