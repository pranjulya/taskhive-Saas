import mongoose from "mongoose";
const membershipSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["owner", "admin", "member"], default: "member" }
}, { timestamps: true });

// A user can hold only one membership per team. (If an existing deployment
// already contains duplicates, they must be removed before this index can
// build successfully.)
membershipSchema.index({ team: 1, user: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
