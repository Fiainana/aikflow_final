import { defineConfig } from "@hey-api/openapi-ts";
import { existsSync } from "node:fs";

/**
 * Priorité :
 * 1. OPENAPI_URL (ex: http://localhost:8000/openapi.json)
 * 2. OPENAPI_FILE ou ./openapi.json s'il existe (versionné)
 * 3. http://localhost:8000/openapi.json
 *
 * Pour versionner : curl -o openapi.json http://localhost:8000/openapi.json
 */
const localFile = process.env.OPENAPI_FILE ?? "./openapi.json";
const input =
  process.env.OPENAPI_URL ??
  (existsSync(localFile) ? localFile : "http://localhost:8000/openapi.json");

export default defineConfig({
  input,
  output: "src/api-client",
  plugins: ["@hey-api/client-fetch"],
});
