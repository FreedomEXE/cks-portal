# Setting up PostgreSQL Full Access MCP

## 1. Install the MCP Server

```bash
npm install -g @syahiidkamil/mcp-postgres-full-access
```

Or using npx (no installation needed):
```bash
npx @syahiidkamil/mcp-postgres-full-access
```

## 2. Configure Claude Desktop

Add this to your Claude Desktop configuration file:

### Windows:
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

### Mac:
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "postgres-full": {
      "command": "npx",
      "args": [
        "@syahiidkamil/mcp-postgres-full-access"
      ],
      "env": {
        "DATABASE_URL": "postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db?sslmode=require"
      }
    }
  }
}
```

Note: Added `?sslmode=require` to the connection string for Render's SSL requirement.

## 3. Restart Claude Desktop

After adding the configuration, completely restart Claude Desktop for the changes to take effect.

## 4. Verify Connection

Once restarted, I should be able to use new PostgreSQL tools to query your database directly!

## Security Note

The MCP uses an "Allow once" approval system, so you'll need to approve each database modification I attempt to make. This keeps you in control while giving me the visibility I need.