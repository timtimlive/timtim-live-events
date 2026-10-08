#!/usr/bin/env node
/*
 * timtim-mcp — run the TimTim.Live MCP server over stdio, for assistants that
 * start local servers (Claude Desktop, Cursor, VS Code…).
 *
 *   TIMTIM_API_KEY=tt_test_…  timtim-mcp      your key (leave it out for sample events)
 *   TIMTIM_API_BASE_URL=…                     another API address (testing)
 *
 * Nothing is printed to stdout except MCP messages; notes go to stderr.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./index.js";

const apiKey = process.env.TIMTIM_API_KEY?.trim() || undefined;
const baseUrl = process.env.TIMTIM_API_BASE_URL?.trim() || undefined;

const server = createServer({ apiKey, baseUrl });
await server.connect(new StdioServerTransport());
console.error(`timtim-mcp: ready (${apiKey ? "your key" : "sample events — set TIMTIM_API_KEY for real ones"}).`);
