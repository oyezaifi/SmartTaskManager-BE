const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validate');
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  logTime
} = require('../controllers/task.controller');

router.use(auth);

router.post('/', validateCreateTask, createTask);
router.get('/', listTasks);
router.get('/:id', getTaskById);
router.patch('/:id', validateUpdateTask, updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/time', logTime);

module.exports = router;


