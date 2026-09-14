import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypeScript,
  { ignores: [".next/**", ".vinext/**", "dist/**", "public/cesium/**", "next-env.d.ts"] },
];

export default config;
