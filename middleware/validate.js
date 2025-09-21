function validationError(res, details) {
  return res.status(400).json({ message: 'Validation failed', details });
}

function isEmail(value) {
  return typeof value === 'string' && /.+@.+\..+/.test(value);
}

function isISODate(value) {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function validateRegister(req, res, next) {
  const { email, password } = req.body || {};
  const details = {};
  if (!isEmail(email)) details.email = 'Valid email is required';
  if (typeof password !== 'string' || password.length < 6) details.password = 'Password must be at least 6 characters';
  if (Object.keys(details).length) return validationError(res, details);
  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const details = {};
  if (!isEmail(email)) details.email = 'Valid email is required';
  if (typeof password !== 'string' || password.length < 1) details.password = 'Password is required';
  if (Object.keys(details).length) return validationError(res, details);
  return next();
}

const allowedStatuses = ['todo', 'in_progress', 'completed'];

function validateCreateTask(req, res, next) {
  const { title, description, dueDate, status } = req.body || {};
  const details = {};
  if (typeof title !== 'string' || title.trim().length === 0) details.title = 'Title is required';
  if (description !== undefined && typeof description !== 'string') details.description = 'Description must be a string';
  if (dueDate !== undefined && !isISODate(dueDate)) details.dueDate = 'dueDate must be a valid date string';
  if (status !== undefined && !allowedStatuses.includes(status)) details.status = 'status must be one of todo, in_progress, completed';
  if (Object.keys(details).length) return validationError(res, details);
  return next();
}

function validateUpdateTask(req, res, next) {
  const { title, description, dueDate, status } = req.body || {};
  const details = {};
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) details.title = 'title must be a non-empty string';
  if (description !== undefined && typeof description !== 'string') details.description = 'description must be a string';
  if (dueDate !== undefined && !isISODate(dueDate)) details.dueDate = 'dueDate must be a valid date string';
  if (status !== undefined && !allowedStatuses.includes(status)) details.status = 'status must be one of todo, in_progress, completed';
  if (Object.keys(details).length) return validationError(res, details);
  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTask,
  validateUpdateTask
};


