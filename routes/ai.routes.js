const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');

// All AI routes require authentication
router.use(auth);

// Monthly summary endpoint
router.get('/summary/monthly', aiController.getMonthlySummary);

// Chat interface for task queries
router.post('/chat/query', aiController.processTaskQuery);

// Productivity insights
router.get('/insights/productivity', aiController.getProductivityInsights);

// Task analytics
router.get('/analytics/tasks', aiController.getTaskAnalytics);

module.exports = router;
