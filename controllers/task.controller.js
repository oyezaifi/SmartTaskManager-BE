const Task = require('../models/Task');

const User = require('../models/User');

async function createTask(req, res, next) {
  try {
    const { title, description, dueDate, status } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    // Enforce free tier cap (10 tasks)
    const user = await User.findById(req.user.id).select('role');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'free') {
      const count = await Task.countDocuments({ userId: req.user.id });
      if (count >= 10) {
        return res.status(403).json({ message: 'Free plan limit reached (10 tasks). Upgrade to add more.' });
      }
    }
    const task = await Task.create({
      userId: req.user.id,
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'todo'
    });
    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = { userId: req.user.id };
    if (status) {
      filter.status = status;
    }
    
    // Validate sortBy parameter to prevent injection
    const allowedSortFields = ['createdAt', 'dueDate', 'timeSpentMinutes', 'title', 'status'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    const sort = { [validSortBy]: order === 'asc' ? 1 : -1 };
    const tasks = await Task.find(filter).sort(sort);
    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const idParam = req.params.id;
    let query;
    if (/^\d+$/.test(idParam)) {
      query = { taskNumber: Number(idParam), userId: req.user.id };
    } else {
      query = { _id: idParam, userId: req.user.id };
    }
    const task = await Task.findOne(query);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { title, description, dueDate, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updates.status = status;

    const idParam = req.params.id;
    const filter = /^\d+$/.test(idParam)
      ? { taskNumber: Number(idParam), userId: req.user.id }
      : { _id: idParam, userId: req.user.id };
    const task = await Task.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const idParam = req.params.id;
    const filter = /^\d+$/.test(idParam)
      ? { taskNumber: Number(idParam), userId: req.user.id }
      : { _id: idParam, userId: req.user.id };
    const task = await Task.findOneAndDelete(filter);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function logTime(req, res, next) {
  try {
    const { minutes } = req.body || {};
    if (typeof minutes !== 'number' || minutes <= 0) {
      return res.status(400).json({ message: 'minutes must be a positive number' });
    }
    const idParam = req.params.id;
    const filter = /^\d+$/.test(idParam)
      ? { taskNumber: Number(idParam), userId: req.user.id }
      : { _id: idParam, userId: req.user.id };
    const task = await Task.findOneAndUpdate(
      filter,
      { $inc: { timeSpentMinutes: minutes } },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  logTime
};


