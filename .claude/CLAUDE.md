# Claude Configuration — CKS Portal

> **IMPORTANT:** Also read `.claude/AGENTS.md` before doing any work. It contains design standards, engineering quality bar, craft standard, and file header requirements that apply to all agents including Claude.

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

**Note:** All scripts automatically add a random greeting at the start (e.g., "Hello Freedom", "Hey Freedom", etc.).

## Voice Response Protocol

**CRITICAL: Use voice notification on EVERY response to the user!**

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/notify-response.ps1" -Message "Your response summary"
```

### When to Use:
- **EVERY TIME** you respond to the user (MANDATORY)
- **BEFORE starting any task** — acknowledge what you're about to do
- **DURING long tasks** — provide progress updates on important milestones
- **AFTER completing work** — summarize what was done
- Before and after executing tasks
- After reading files or analyzing code
- After answering questions
- When encountering errors or issues
- When providing status updates
- When discovering important findings in code

### Voice Timing:
- **Acknowledgement first** — speak before you begin working, not just after
- **Mid-task updates** — if a task takes multiple steps, voice important progress
- **Completion summary** — use `notify-complete-modern.ps1` for major completions

### Message Content:
- Brief summary of your response (1-2 sentences)
- Use "Freedom" when addressing the user
- Can be conversational and engaging

**IMPORTANT:** This is MANDATORY for all user interactions, not optional. DO NOT set a timeout — let the voice command complete naturally.

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

## Component Reuse Policy

**ALWAYS reuse existing components. NEVER create new wrapper components or "shared" components when existing ones already handle the job.**

- Before creating any new component, check what already exists in `@cks/ui`, `@cks/domain-widgets`, and `apps/frontend/src/components/`
- Use `Button`, `DataTable`, `TabSection`, `PageWrapper`, `TabContainer`, `NavigationTab` etc. from `@cks/ui`
- Inline forms with standard HTML elements (input, textarea, select) + existing Button components — don't create form wrapper components
- If you need a pattern used in multiple places, keep it inline rather than creating a "shared" component unless it's genuinely complex (50+ lines of logic)
- Avoid "slop" — unnecessary abstraction layers, wrappers, or utility components that add no real value

## Other Important Notes

### Testing Commands
- Run lint: `pnpm lint` (if available)
- Run typecheck: `pnpm typecheck` (if available)
- Run tests: `pnpm test` or `npm test`

### Development Servers
- Backend: `PORT=4000 pnpm dev:backend`
- Frontend: Check package.json for specific commands

Remember: Being surgical and specific with process management prevents accidental self-termination!

## Documentation Protocol

- **Extensive documentation is MANDATORY** for anything we build that would require it. If docs don't already exist for a system/feature and they should, create them proactively.
- On every major git push, create or update a changelog entry in `docs/` summarizing what changed and why.
- Keep docs organized by domain in the `docs/` folder.