Server TypeScript conversion

What changed
- Added TypeScript versions of `utils`, `db`, and route modules: `utils/*.ts`, `db/*.ts`, `routes/*.ts`.
- Added `server/tsconfig.json` and updated `src/index.ts` to mount the new routers.

How to build
1. From the `server` folder run `npm install` (devDependencies required).
2. Run `npm run build` to compile to `server/build`.

Notes
- Original `.js` files were left in place to avoid disrupting other tooling; once you're happy, you can delete or rename them.
- I used permissive typings (any/req:any) for request handlers to minimize behavioral changes; we can tighten types next.
