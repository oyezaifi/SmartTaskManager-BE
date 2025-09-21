const mongoose = require('mongoose');
const Counter = require('./Counter');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
      default: 'todo'
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    taskNumber: {
      type: Number,
      unique: true,
      index: true
    }
  },
  { timestamps: true }
);

taskSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      'taskNumber',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.taskNumber = counter.seq;
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;


