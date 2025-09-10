import mongoose from "mongoose";
const membershipSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["owner", "admin", "member"], default: "member" }
}, { timestamps: true });
export default mongoose.model("Membership", membershipSchema);
