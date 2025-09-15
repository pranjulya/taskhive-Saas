import Team from "../models/Team.js";
import Membership from "../models/Membership.js";
import mongoose from "mongoose";

// Create a new team
export async function createTeam(req, res) {
  try {
    const team = new Team({
      name: req.body.name,
      owner: req.userId
    });
    await team.save();

    // Create ownership membership
    const membership = new Membership({
      team: team._id,
      user: req.userId,
      role: "owner"
    });
    await membership.save();

    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get team details
export async function getTeam(req, res) {
  try {
    const membership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId
    });
    if (!membership) {
      return res.status(403).json({ error: "Not a team member" });
    }

    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update team
export async function updateTeam(req, res) {
  try {
    const membership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId,
      role: { $in: ["owner", "admin"] }
    });
    if (!membership) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { $set: { name: req.body.name } },
      { new: true }
    );
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete team
export async function deleteTeam(req, res) {
  try {
    const membership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId,
      role: "owner"
    });
    if (!membership) {
      return res.status(403).json({ error: "Must be team owner" });
    }

    // Delete team and all associated memberships
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Team.findByIdAndDelete(req.params.teamId);
      await Membership.deleteMany({ team: req.params.teamId });
    });
    session.endSession();

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// List team members
export async function listTeamMembers(req, res) {
  try {
    const userMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId
    });
    if (!userMembership) {
      return res.status(403).json({ error: "Not a team member" });
    }

    const members = await Membership.find({ team: req.params.teamId })
      .populate("user", "name email");
    res.json(members);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Add team member
export async function addTeamMember(req, res) {
  try {
    const userMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId,
      role: { $in: ["owner", "admin"] }
    });
    if (!userMembership) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const membership = new Membership({
      team: req.params.teamId,
      user: req.body.userId,
      role: req.body.role || "member"
    });
    await membership.save();

    res.status(201).json(membership);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Remove team member
export async function removeTeamMember(req, res) {
  try {
    const userMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId,
      role: { $in: ["owner", "admin"] }
    });
    if (!userMembership) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const targetMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.params.userId
    });

    // Prevent removing the owner
    if (targetMembership.role === "owner") {
      return res.status(403).json({ error: "Cannot remove team owner" });
    }

    await Membership.findByIdAndDelete(targetMembership._id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update member role
export async function updateMemberRole(req, res) {
  try {
    const userMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.userId,
      role: "owner"  // Only owner can change roles
    });
    if (!userMembership) {
      return res.status(403).json({ error: "Must be team owner" });
    }

    const targetMembership = await Membership.findOneAndUpdate(
      {
        team: req.params.teamId,
        user: req.params.userId
      },
      { $set: { role: req.body.role } },
      { new: true }
    );

    if (!targetMembership) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(targetMembership);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}