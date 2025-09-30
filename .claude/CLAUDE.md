# Claude Configuration Instructions

## CRITICAL: Process Management Safety

**NEVER kill processes broadly - this can terminate your own connection!**

### Safe Process Termination Guidelines:

1. **NEVER use broad kill commands:**
   - ❌ AVOID: `pkill node`, `killall node`, `taskkill /IM node.exe /F`
   - ❌ AVOID: `pkill -f`, `killall -9`
   - ✅ USE: Kill by specific PID after identifying the exact process

2. **Always identify processes before killing:**
   ```bash
   # Windows: Find specific process
   netstat -ano | findstr :PORT_NUMBER
   # Then kill by PID
   taskkill /PID [specific_pid] /F

   # Unix/Mac: Find specific process
   lsof -ti:PORT_NUMBER
   # Then kill by PID
   kill [specific_pid]
   ```

3. **Port-specific killing (safer):**
   - Windows: `for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F`
   - Unix: `lsof -ti:3000 | xargs kill`

4. **Background process management:**
   - Use `run_in_background: true` when starting processes
   - Use `KillShell` with specific shell IDs
   - Track your process IDs when starting them

5. **Before killing any process:**
   - Check what processes are running
   - Identify the specific PID of the target process
   - Only kill that specific PID
   - Never use wildcard or broad pattern matching for process names

## Database Connection (Render/PostgreSQL)

**IMPORTANT: When connecting to Render databases, SSL is REQUIRED!**

### Direct Database Queries:
```javascript
// Always include SSL configuration for Render databases
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Render
  }
});
```

### Quick Database Check Script:
- Use: `cd apps/backend && node scripts/check-inventory-tables.js`
- Or create similar scripts with SSL enabled connection

### Note on MCP Postgres Tool:
- The mcp__postgres__query tool may not work with Render due to SSL requirements
- Use Node.js scripts with pg client instead for reliable database access

## Other Important Notes

### Testing Commands
- Run lint: `pnpm lint` (if available)
- Run typecheck: `pnpm typecheck` (if available)
- Run tests: `pnpm test` or `npm test`

### Development Servers
- Backend: `PORT=4000 pnpm dev:backend`
- Frontend: Check package.json for specific commands

Remember: Being surgical and specific with process management prevents accidental self-termination!