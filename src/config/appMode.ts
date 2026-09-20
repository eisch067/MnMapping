// Two deployments are built from this same codebase, distinguished only by the
// NEXT_PUBLIC_APP_MODE build-time env var (set per Cloudflare Worker environment):
//
// - "public" (default, including when the var is unset): the compliant, shareable
//   version from the 2026-09 licensing audit (docs/licensing/RISK-REGISTER.md) —
//   unlicensed vendor imagery is linked out rather than embedded, and parcel
//   owner/mailing-address/tax fields are redacted for the counties listed in H2.
//   Defaulting to "public" means a missing or misconfigured env var fails safe.
// - "personal": the pre-audit, fully-featured configuration (all vendor imagery
//   embedded live, full parcel attribute fields, Esri 3D terrain) for the
//   operator's own password-gated use only. Never the default.
export const APP_MODE: "public" | "personal" = process.env.NEXT_PUBLIC_APP_MODE === "personal" ? "personal" : "public";

export const isPersonalMode = APP_MODE === "personal";
