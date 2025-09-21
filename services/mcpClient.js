// services/mcpClient.js
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio');

class MCPClientService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    try {
      // Spawn the MCP server process
      const serverProcess = spawn('node', ['./mcp/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Create transport and client
      this.transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
      });

      this.client = new Client(
        {
          name: "smart-task-client",
          version: "1.0.0"
        },
        {
          capabilities: {
            resources: {},
            tools: {},
            prompts: {}
          }
        }
      );

      // Connect to the server
      await this.client.connect(this.transport);
      this.connected = true;
      
      console.log('MCP Client connected successfully');

      // Handle server process errors
      serverProcess.stderr.on('data', (data) => {
        console.error('MCP Server error:', data.toString());
      });

      serverProcess.on('close', (code) => {
        console.log(`MCP Server process exited with code ${code}`);
        this.connected = false;
      });

    } catch (error) {
      console.error('Failed to connect MCP client:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }

  async callTool(name, args) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client.callTool(name, args);
      return result;
    } catch (error) {
      console.error(`MCP tool call failed: ${name}`, error);
      throw error;
    }
  }

  async listTools() {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client.listTools();
      return result;
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      throw error;
    }
  }

  async getResources(uri) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client.readResource(uri);
      return result;
    } catch (error) {
      console.error(`Failed to get MCP resource: ${uri}`, error);
      throw error;
    }
  }
}

// Singleton instance
const mcpClient = new MCPClientService();

module.exports = mcpClient;