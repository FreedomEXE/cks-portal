/**
 * File: src/openapi.ts
 *
 * Descriptio:
 *   CLI utility to generate the OpenAPI spec (Swagger JSON) for the CKS API.
 * Functionality:
 *   Configures swagger-jsdoc with glob patterns for source + route TypeScript files and emits the JSON spec to stdout.
 * Importance:
 *   Enables documentation surfacing (e.g., swagger-ui) and client generation pipelines.
 * Conections:
 *   Invoked during build/docs tasks; consumed by swagger-ui-express integration in the HTTP server.
 * Notes:
 *   Keep apis globs in sync with folder reorganizations; run via `node dist/src/openapi.js > openapi.json`.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'CKS API', version: '1.0.0' }
  },
  apis: ['src/**/*.ts', 'routes/**/*.ts']
};

const spec = swaggerJsdoc(options);
process.stdout.write(JSON.stringify(spec, null, 2));
