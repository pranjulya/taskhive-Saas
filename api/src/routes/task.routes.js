import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";

const router = Router();

// Routes for tasks within a team
router.route("/teams/:teamId/tasks").post(auth, createTask).get(auth, getTasks);

// Routes for a single task
router
  .route("/tasks/:taskId")
  .get(auth, getTaskById)
  .put(auth, updateTask)
  .delete(auth, deleteTask);

export default router;
