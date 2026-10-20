import Team from "../models/Team.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
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

// List the teams the current user belongs to
export async function listMyTeams(req, res) {
  try {
    const memberships = await Membership.find({ user: req.userId }).select("team");
    const teamIds = memberships.map((m) => m.team);
    const teams = await Team.find({ _id: { $in: teamIds } }).sort({ createdAt: 1 });
    res.json(teams);
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

    // Delete the team's data in dependency order: tasks and memberships
    // first, the team itself last. This deliberately does not use a
    // transaction: the previous version opened a session but never bound
    // its deletes to it ({ session } was never passed), so nothing was
    // actually atomic — and the transaction commit also errored on
    // standalone MongoDB deployments, after the deletes had already run.
    // Sequential deletes in this order degrade safely: if one fails, the
    // owner still has access and can retry the delete.
    await Task.deleteMany({ team: req.params.teamId });
    await Membership.deleteMany({ team: req.params.teamId });
    await Team.findByIdAndDelete(req.params.teamId);

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

    // The owner role is never granted through this endpoint: ownership is
    // created with the team, and letting an admin mint a new owner would
    // be a privilege escalation (a second owner can delete the team,
    // change roles, and remove members).
    const role = req.body.role || "member";
    if (role === "owner") {
      return res.status(403).json({ error: "The owner role cannot be assigned" });
    }
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // The target must be a real user; otherwise the membership points at
    // nobody and pollutes member lists.
    const target = await User.findById(req.body.userId);
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const membership = new Membership({
      team: req.params.teamId,
      user: req.body.userId,
      role
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

    // Roles here only ever move between "admin" and "member". "owner" is
    // rejected (this endpoint is not an ownership transfer), and any other
    // string is rejected up front: previously the value went straight
    // into findOneAndUpdate, which does not run schema validators by
    // default, so arbitrary roles like "superuser" were persisted and
    // silently broke the role checks everywhere else.
    const role = req.body.role;
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin' or 'member'" });
    }

    const targetMembership = await Membership.findOne({
      team: req.params.teamId,
      user: req.params.userId
    });
    if (!targetMembership) {
      return res.status(404).json({ error: "Member not found" });
    }

    // A team must never be left without an owner: demoting the only owner
    // would make role changes and team deletion impossible forever.
    if (targetMembership.role === "owner") {
      const ownerCount = await Membership.countDocuments({
        team: req.params.teamId,
        role: "owner"
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: "Cannot demote the team's only owner" });
      }
    }

    // save() always runs schema validators (findOneAndUpdate did not).
    targetMembership.role = role;
    const updated = await targetMembership.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}