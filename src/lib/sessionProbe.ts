export type SessionStatus = "signed-in" | "sign-in-required" | "unknown";

export function classifySessionProbe(result: Response | null): SessionStatus {
  if (!result) return "unknown";
  if (result.type === "opaqueredirect") return "sign-in-required";
  if (result.status >= 200 && result.status < 300) return "signed-in";
  if (result.status === 401 || result.status === 403) return "sign-in-required";
  return "unknown";
}

export async function probeSession(): Promise<SessionStatus> {
  try {
    const response = await fetch("/api/session", { redirect: "manual", cache: "no-store" });
    return classifySessionProbe(response);
  } catch {
    return "unknown";
  }
}
