// mcp/server.js
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class TaskMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "smart-task-server",
        version: "1.0.0",
        description: "MCP server for Smart Task Management with AI capabilities"
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {}
        }
      }
    );

    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: "analyze_tasks",
            description: "Analyze user tasks and provide insights",
            inputSchema: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                  description: "User ID to analyze tasks for"
                },
                timeRange: {
                  type: "string",
                  enum: ["week", "month", "year"],
                  description: "Time range for analysis"
                },
                query: {
                  type: "string",
                  description: "Specific query about tasks"
                }
              },
              required: ["userId"]
            }
          },
          {
            name: "generate_summary",
            description: "Generate monthly summary of tasks",
            inputSchema: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                  description: "User ID to generate summary for"
                },
                month: {
                  type: "string",
                  description: "Month in YYYY-MM format (optional)"
                }
              },
              required: ["userId"]
            }
          },
          {
            name: "get_productivity_insights",
            description: "Get productivity insights and trends",
            inputSchema: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                  description: "User ID to get insights for"
                },
                timeRange: {
                  type: "string",
                  enum: ["week", "month", "year"],
                  description: "Time range for insights"
                }
              },
              required: ["userId"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_tasks":
          return await this.analyzeTasks(args);
        case "generate_summary":
          return await this.generateSummary(args);
        case "get_productivity_insights":
          return await this.getProductivityInsights(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available resources
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: [
          {
            uri: "task://current-user-tasks",
            name: "Current User Tasks",
            description: "Access to current user's task data",
            mimeType: "application/json"
          }
        ]
      };
    });

    // Handle resource requests
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      if (uri === "task://current-user-tasks") {
        // This would typically fetch from your database
        // For now, return a sample structure
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              message: "Task data would be fetched from database based on user context"
            })
          }]
        };
      }
      
      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  async analyzeTasks(args) {
    const { userId, timeRange = 'week', query } = args;
    
    try {
      // Here you would fetch tasks from your database
      // For now, we'll simulate the analysis
      const prompt = `
        Analyze user tasks for insights. 
        User ID: ${userId}
        Time Range: ${timeRange}
        ${query ? `Specific Query: ${query}` : ''}
        
        Provide detailed analysis including:
        - Productivity patterns
        - Time allocation
        - Completion rates
        - Recommendations for improvement
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: [{
          type: "text",
          text: response.text()
        }]
      };
    } catch (error) {
      throw new Error(`Failed to analyze tasks: ${error.message}`);
    }
  }

  async generateSummary(args) {
    const { userId, month } = args;
    
    try {
      const prompt = `
        Generate a comprehensive monthly summary for user ${userId}
        ${month ? `for month: ${month}` : 'for the current month'}
        
        Include:
        - Overall productivity assessment
        - Key achievements
        - Areas for improvement
        - Detailed insights on task completion patterns
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: [{
          type: "text",
          text: response.text()
        }]
      };
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  async getProductivityInsights(args) {
    const { userId, timeRange = 'week' } = args;
    
    try {
      const prompt = `
        Generate productivity insights for user ${userId} over ${timeRange}.
        
        Focus on:
        - Trends and patterns
        - Peak productivity times
        - Task completion efficiency
        - Recommendations for optimization
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: [{
          type: "text",
          text: response.text()
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get productivity insights: ${error.message}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP Server started successfully");
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new TaskMCPServer();
  server.start().catch(console.error);
}

module.exports = TaskMCPServer;