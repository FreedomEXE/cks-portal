#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../apps/backend/.env") });

class PostgreSQLServer {
  private server: Server;
  private client: Client | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "postgres-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async getClient(): Promise<Client> {
    if (!this.client) {
      const connectionString = process.env.DATABASE_URL ||
        'postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db';

      this.client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
      await this.client.connect();
    }
    return this.client;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "query",
          description: "Execute a PostgreSQL query",
          inputSchema: {
            type: "object",
            properties: {
              sql: {
                type: "string",
                description: "SQL query to execute",
              },
            },
            required: ["sql"],
          },
        },
        {
          name: "schema",
          description: "Get database schema information",
          inputSchema: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "Optional table name to get detailed schema for",
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "query") {
        try {
          const client = await this.getClient();
          const result = await client.query(args.sql as string);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    rows: result.rows,
                    rowCount: result.rowCount,
                    fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID }))
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
      }

      if (name === "schema") {
        try {
          const client = await this.getClient();
          let query: string;
          let params: any[] = [];

          if (args.table_name) {
            query = `
              SELECT
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
              FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = $1
              ORDER BY ordinal_position
            `;
            params = [args.table_name];
          } else {
            query = `
              SELECT
                table_name,
                table_type
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name
            `;
          }

          const result = await client.query(query, params);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.rows, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PostgreSQL MCP Server running on stdio");
  }
}

const server = new PostgreSQLServer();
server.run().catch(console.error);