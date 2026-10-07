import { fileURLToPath } from "node:url";

/* This example lives inside a workspace; tell Next.js where the workspace root is. */
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
};

export default nextConfig;
