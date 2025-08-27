# CKS Portal Database Layer

This package contains the centralized database layer for the CKS Portal project.

## Structure

- `schema.sql` - Complete database schema (canonical source)
- `db/pool.ts` - PostgreSQL connection pool
- `migrations/` - Database schema migrations
- `seeds/` - Initial data seeds

## Usage

### Initial Setup
```bash
# Install dependencies
npm install

# Build TypeScript (if needed)
npm run build
```

### Migrations
```bash
# Run all pending migrations
npm run migration:run
```

### Seeds
```bash
# Run all seed files
npm run seed:run
```

## Migration System

- Migrations are numbered SQL files (e.g., `001_initial_schema.sql`)
- The runner tracks applied migrations in a `migrations` table
- Each migration runs in a transaction for safety

## Seed System  

- Seeds are SQL files that populate initial data
- Run seeds after schema setup to populate catalog data
- Seeds can be re-run safely (they handle conflicts)

## Files

- **schema.sql**: Complete PostgreSQL schema with tables, constraints, indexes
- **db/pool.ts**: Connection pool with environment variable support
- **migrations/run.js**: Migration runner with transaction support
- **seeds/run.js**: Seed runner for initial data

## Development Notes

- Uses CommonJS for compatibility with backend server
- TypeScript support with build to `dist/`
- Safe to run migrations/seeds multiple times
- Pool handles SSL detection for cloud providers

