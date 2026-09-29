export const runtime = "edge";

const unavailable = (request: Request) => Response.json({
  error: "Not found.",
  path: new URL(request.url).pathname,
}, { status: 404 });
export const GET = unavailable;
export const POST = unavailable;
