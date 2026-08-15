import { defineConfig } from "@hey-api/openapi-ts";

/**
 * Codegen depuis un fichier versionné (recommandé) ou l'URL live du backend.
 *
 * 1. Exporter le schéma backend :
 *    curl -o openapi.json http://localhost:8000/openapi.json
 * 2. Committer openapi.json
 * 3. npm run codegen
 */
export default defineConfig({
  input:
    process.env.OPENAPI_URL ??
    (process.env.OPENAPI_FILE
      ? process.env.OPENAPI_FILE
      : "./openapi.json"),
  output: "src/api-client",
  plugins: ["@hey-api/client-fetch"],
});
