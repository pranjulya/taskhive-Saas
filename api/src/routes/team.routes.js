import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateMemberRole
} from "../controllers/team.controller.js";

const router = Router();

// Team CRUD routes
router.post("/", auth, createTeam);
router.get("/:teamId", auth, getTeam);
router.put("/:teamId", auth, updateTeam);
router.delete("/:teamId", auth, deleteTeam);

// Team member management routes
router.get("/:teamId/members", auth, listTeamMembers);
router.post("/:teamId/members", auth, addTeamMember);
router.delete("/:teamId/members/:userId", auth, removeTeamMember);
router.put("/:teamId/members/:userId/role", auth, updateMemberRole);

export default router;