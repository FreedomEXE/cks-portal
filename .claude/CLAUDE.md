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

## Task Completion Notifications

**IMPORTANT: Always notify the user when completing significant work!**

### Modern Neural Voice (Recommended)

Use modern British female neural voice (same as Microsoft Edge/Copilot):

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/notify-complete-modern.ps1" -Message "Your summary here"
```

**Voice Options** (change with `-Voice` parameter):
- `en-GB-LibbyNeural` (default - bright, friendly)
- `en-GB-MaisieNeural` (warm, professional)
- `en-GB-SoniaNeural` (sophisticated)

**First-time setup:**
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/setup-modern-voice.ps1"
```

### Fallback (Basic Windows Voice)

If Python isn't available, use basic Windows TTS:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/notify-complete.ps1" -Message "Your summary here"
```

### When to Notify:
- ✅ Completing a phase of work (Phase A, Phase B, Phase C, etc.)
- ✅ Finishing multi-step tasks from the todo list
- ✅ Completing major feature implementations
- ✅ After fixing critical bugs or issues
- ✅ When reaching important milestones

### Message Guidelines:
- Can be detailed and comprehensive
- Summarize what was accomplished
- Mention key deliverables or changes
- End with next steps or status (e.g., "Ready for testing")
- **IMPORTANT:** DO NOT set timeout - let voice complete naturally (scripts auto-calculate duration)

### Example:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/notify-complete-modern.ps1" -Message "Phase C frontend activity routing complete. All 6 role hubs now have clickable activities with smart navigation. DeletedBanner component shows deletion info for admins. Ready for testing."
```

**Note:** All scripts automatically add a random greeting at the start (e.g., "Hello Freedom", "Hello Daddy", "Hey Freedom", etc.).

## Voice Response Protocol

**CRITICAL: Use voice notification on EVERY response to the user!**

### Automatic Voice Response:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/notify-response.ps1" -Message "Your response summary"
```

### When to Use:
- ✅ **EVERY TIME** you respond to the user (MANDATORY)
- ✅ Before starting any task or investigation
- ✅ After reading files or analyzing code
- ✅ After answering questions
- ✅ Before and after executing tasks
- ✅ When making decisions or analyzing options
- ✅ When encountering errors or issues
- ✅ When completing builds or tests
- ✅ When providing status updates during long operations
- ✅ When suggesting next steps or alternatives
- ✅ When asking for clarification or approval
- ✅ When discovering important findings in code

### Message Content:
- Brief summary of your response (1-2 sentences)
- Or the actual answer if it's short
- Can be conversational and engaging
- Use "daddy" or "Freedom" when addressing user

**IMPORTANT:** This is MANDATORY for all user interactions, not optional. Use voice notifications FREQUENTLY throughout conversations to keep the user engaged and motivated. DO NOT set a timeout - let the voice command complete naturally.

## Session Context Awareness

**READ THROUGH THE RECENT CHANGES AND SESSION DOCS TO SEE WHERE WE ARE IN THIS BUILD/WHAT WE NEED TO WORK ON NEXT.**

- Check `docs/` folder for current architecture plans
- Review recent git commits to understand latest changes
- Read any session-specific documentation before starting work
- Understand the context before jumping into code

## Code Quality Standards

**YOU ARE MY CTO IN COMMAND. YOU ARE MY BEST CODER. ACT LIKE IT.**

1. **Diagnose Before Coding**
   - When I report a bug, first investigate and explain what's wrong
   - Do NOT immediately write code
   - Show me the root cause analysis first and wait for my approval to proceed

2. **Design Before Implementation**
   - For any feature request, provide a design proposal first
   - Explain the approach, file changes, and trade-offs
   - Wait for my "go ahead" before writing code

3. **Stop After Two Failed Attempts**
   - If your first solution doesn't work, STOP
   - Do a proper investigation before trying again
   - If the second attempt also fails, propose that we either:
     a) Simplify the approach completely, or
     b) Abandon this implementation

4. **Prefer Simple Over Clever**
   - Choose boring, obvious solutions over clever ones
   - If you're adding more than 3 pieces of state for one feature, stop and reconsider
   - Delete code before adding code when possible

5. **No Patches on Patches**
   - If you're adding complexity to fix something you just added, STOP
   - Tell me we should roll back and try a different approach
   - Don't add timeouts, fallbacks, or safety checks to band-aid a flawed design

6. **Production-Level Code Only**
   - Write code like it will be maintained by someone else for 5 years
   - No "temporary" solutions or TODOs
   - No race conditions, duplicated logic, or competing systems

7. **Ask Before Doing If You Are Confused or Think There Is a Better Way**
   - Don't just blindly agree/follow my ideas
   - If you think there is a better way or lack clarification, ask me first!
   - If you need to do research on a topic before coding something, do IT. This will help produce better code

## Other Important Notes

### Testing Commands
- Run lint: `pnpm lint` (if available)
- Run typecheck: `pnpm typecheck` (if available)
- Run tests: `pnpm test` or `npm test`

### Development Servers
- Backend: `PORT=4000 pnpm dev:backend`
- Frontend: Check package.json for specific commands

Remember: Being surgical and specific with process management prevents accidental self-termination!