// services/aiService.js - Enhanced version with direct Google Gemini integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generateMonthlySummary(userId, month = null) {
    try {
      return await this.generateMonthlySummaryDirect(userId, month);
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      throw new Error('Failed to generate monthly summary');
    }
  }

  async generateMonthlySummaryDirect(userId, month = null) {
    // Calculate date range for the specified month
    const now = new Date();
    const targetMonth = month ? new Date(month) : new Date(now.getFullYear(), now.getMonth(), 1); // Use current month instead of previous
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

    // Fetch tasks from the specified month
    let tasks = await Task.find({
      userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ createdAt: 1 });

    // If no tasks found for the specific month, get recent tasks (last 30 days)
    if (tasks.length === 0) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      tasks = await Task.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: 1 });
    }

    if (tasks.length === 0) {
      return {
        summary: "No tasks found. Start creating tasks to get AI-generated insights about your productivity!",
        insights: ["Create your first task to begin tracking your productivity"],
        recommendations: ["Add some tasks to your task manager to get started"],
        achievements: [],
        statistics: {
          totalTasks: 0,
          completedTasks: 0,
          totalTimeSpent: 0,
          completionRate: 0
        }
      };
    }

    // Calculate statistics
    const statistics = this.calculateTaskStatistics(tasks, targetMonth);

    // Prepare task data for AI analysis
    const taskData = tasks.map(task => ({
      id: task._id,
      taskNumber: task.taskNumber,
      title: task.title,
      description: task.description,
      status: task.status,
      timeSpentMinutes: task.timeSpentMinutes || 0,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    const prompt = `
      You are an AI assistant helping a user analyze their task management data for the month of ${targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.

      User's Task Data:
      ${JSON.stringify(taskData, null, 2)}

      Statistics:
      - Total Tasks: ${statistics.totalTasks}
      - Completed Tasks: ${statistics.completedTasks}
      - Completion Rate: ${statistics.completionRate}%
      - Total Time Spent: ${statistics.totalTimeSpent} minutes

      Please generate a comprehensive monthly summary including:
      1. Overall productivity assessment
      2. Key achievements and accomplishments
      3. Areas for improvement
      4. Insights on task completion patterns
      5. Recommendations for next month

      Format your response as a JSON object with this exact structure:
      {
        "summary": "Your comprehensive monthly summary paragraph",
        "insights": ["insight1", "insight2", "insight3"],
        "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
        "achievements": ["achievement1", "achievement2", "achievement3"]
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Try to parse JSON response, fallback to plain text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // If JSON parsing fails, create a structured response from the text
      parsedResponse = {
        summary: aiResponse,
        insights: ["Review your task completion patterns", "Focus on time management", "Set realistic goals"],
        recommendations: ["Break down large tasks into smaller ones", "Set specific deadlines", "Track your progress regularly"],
        achievements: ["Completed tasks this month", "Maintained task tracking", "Showed commitment to productivity"]
      };
    }

    // Add statistics to the response
    parsedResponse.statistics = statistics;
    return parsedResponse;
  }

  async getProductivityInsights(userId, timeRange = 'week') {
    try {
      return await this.getProductivityInsightsDirect(userId, timeRange);
    } catch (error) {
      console.error('Error getting productivity insights:', error);
      throw new Error('Failed to get productivity insights');
    }
  }

  async getProductivityInsightsDirect(userId, timeRange = 'week') {
    let startDate;
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const tasks = await Task.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    if (tasks.length === 0) {
      return {
        insights: ["No tasks found for the selected time period."],
        trends: {},
        recommendations: ["Start creating tasks to track your productivity!"]
      };
    }

    const prompt = `
      Analyze the following task data for productivity insights over the last ${timeRange}:

      Task Data:
      ${JSON.stringify(tasks.map(task => ({
        title: task.title,
        status: task.status,
        timeSpentMinutes: task.timeSpentMinutes || 0,
        createdAt: task.createdAt,
        dueDate: task.dueDate
      })), null, 2)}

      Provide insights on:
      1. Productivity patterns and trends
      2. Time management efficiency
      3. Task completion patterns
      4. Areas for improvement

      Respond in a conversational, helpful tone. Format your response with clear sections and bullet points. Use line breaks to separate different insights. Structure it like this:

      **Productivity Patterns:**
      • Insight 1
      • Insight 2

      **Time Management:**
      • Insight 1
      • Insight 2

      **Recommendations:**
      • Recommendation 1
      • Recommendation 2
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Return the AI response directly as formatted text
    return {
      insights: [aiResponse],
      trends: {},
      recommendations: []
    };
  }

  calculateTaskStatistics(tasks, targetMonth) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.timeSpentMinutes || 0), 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    return {
      totalTasks,
      completedTasks,
      totalTimeSpent,
      completionRate: parseFloat(completionRate),
      month: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }

  async calculateMonthlyStatistics(userId, month = null) {
    const now = new Date();
    const targetMonth = month ? new Date(month) : new Date(now.getFullYear(), now.getMonth(), 1); // Use current month
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

    let tasks = await Task.find({
      userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // If no tasks found for the specific month, get recent tasks (last 30 days)
    if (tasks.length === 0) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      tasks = await Task.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });
    }

    return this.calculateTaskStatistics(tasks, targetMonth);
  }

  async processTaskQuery(userId, query) {
    try {
      // Get user's tasks for context
      const tasks = await Task.find({ userId }).sort({ createdAt: -1 }).limit(50);
      
      if (tasks.length === 0) {
        return {
          response: "I don't see any tasks in your account yet. Start by creating some tasks to get insights about your productivity!",
          relevantTasks: null,
          statistics: null
        };
      }

      // Prepare task data for AI analysis
      const taskData = tasks.map(task => ({
        id: task._id,
        taskNumber: task.taskNumber,
        title: task.title,
        description: task.description,
        status: task.status,
        timeSpentMinutes: task.timeSpentMinutes || 0,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));

      const prompt = `
        You are an AI assistant helping a user analyze their task management data. 
        Answer the following question based on their task data: "${query}"

        User's Task Data:
        ${JSON.stringify(taskData, null, 2)}

        Instructions:
        1. Analyze the task data to answer the user's question
        2. Provide specific, data-driven insights
        3. If the question asks for specific tasks, include relevant task details
        4. Be helpful and actionable in your response
        5. If you need to calculate time periods, use the current date as reference: ${new Date().toISOString()}
        6. Respond in a conversational, friendly tone
        7. Include specific numbers and data when relevant
        8. Do NOT return JSON format - just provide a natural text response

        Provide a clear, helpful answer to the user's question.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Return the AI response directly as text
      return {
        response: aiResponse,
        relevantTasks: null,
        statistics: null
      };
    } catch (error) {
      console.error('Error processing task query:', error);
      throw new Error('Failed to process task query');
    }
  }
}

module.exports = new AIService();
   