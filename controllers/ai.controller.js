const aiService = require('../services/aiService');

async function getMonthlySummary(req, res, next) {
  try {
    const { month } = req.query;
    const userId = req.user.id;
    
    const summary = await aiService.generateMonthlySummary(userId, month);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

async function processTaskQuery(req, res, next) {
  try {
    const { query } = req.body;
    const userId = req.user.id;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query is required and must be a string' });
    }
    
    const result = await aiService.processTaskQuery(userId, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProductivityInsights(req, res, next) {
  try {
    const { timeRange = 'week' } = req.query;
    const userId = req.user.id;
    
    const insights = await aiService.getProductivityInsights(userId, timeRange);
    res.json(insights);
  } catch (error) {
    next(error);
  }
}

async function getTaskAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const { timeRange = 'month' } = req.query;
    
    // Calculate date range
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
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const Task = require('../models/Task');
    const tasks = await Task.find({
      userId,
      createdAt: { $gte: startDate }
    });

    // Calculate analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.timeSpentMinutes || 0), 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
    const averageTimePerTask = completedTasks > 0 ? (totalTimeSpent / completedTasks) : 0;

    // Overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    );

    // Tasks by day of week
    const tasksByDay = {};
    tasks.forEach(task => {
      const day = new Date(task.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      tasksByDay[day] = (tasksByDay[day] || 0) + 1;
    });

    res.json({
      timeRange,
      statistics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks: overdueTasks.length,
        totalTimeSpent,
        completionRate: Math.round(completionRate * 100) / 100,
        averageTimePerTask: Math.round(averageTimePerTask * 100) / 100
      },
      distribution: {
        byStatus: {
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks
        },
        byDay: tasksByDay
      },
      overdueTasks: overdueTasks.map(task => ({
        id: task._id,
        taskNumber: task.taskNumber,
        title: task.title,
        dueDate: task.dueDate,
        daysOverdue: Math.ceil((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMonthlySummary,
  processTaskQuery,
  getProductivityInsights,
  getTaskAnalytics
};
