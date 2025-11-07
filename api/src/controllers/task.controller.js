import Task from "../models/Task.js";
import Team from "../models/Team.js";
import Membership from "../models/Membership.js";

// @desc    Create a new task
// @route   POST /api/teams/:teamId/tasks
// @access  Private
export const createTask = async (req, res) => {
  const { title, description, status, assignee, dueDate } = req.body;
  const { teamId } = req.params;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is a member of the team
    const membership = await Membership.findOne({
      team: teamId,
      user: req.user.id,
    });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this team" });
    }

    const task = new Task({
      team: teamId,
      title,
      description,
      status,
      assignee,
      dueDate,
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks for a team
// @route   GET /api/teams/:teamId/tasks
// @access  Private
export const getTasks = async (req, res) => {
  const { teamId } = req.params;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is a member of the team
    const membership = await Membership.findOne({
      team: teamId,
      user: req.user.id,
    });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this team" });
    }

    const tasks = await Task.find({ team: teamId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:taskId
// @access  Private
export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the user is a member of the team the task belongs to
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user.id,
    });
    if (!membership) {
      return res.status(403).json({
        message: "You are not authorized to view this task",
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:taskId
// @access  Private
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, assignee, dueDate } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the user is a member of the team the task belongs to
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user.id,
    });
    if (!membership) {
      return res.status(403).json({
        message: "You are not authorized to update this task",
      });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.assignee = assignee || task.assignee;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:taskId
// @access  Private
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the user is a member of the team the task belongs to
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user.id,
    });
    if (!membership) {
      return res.status(403).json({
        message: "You are not authorized to delete this task",
      });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ message: "Task removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
