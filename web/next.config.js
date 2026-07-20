/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Pin the file-tracing root to this app to avoid picking up unrelated
  // lockfiles higher up the filesystem.
  outputFileTracingRoot: import.meta.dirname,
};

export default config;
