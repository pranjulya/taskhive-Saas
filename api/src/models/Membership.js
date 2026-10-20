import mongoose from "mongoose";
const membershipSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "admin", "member"], default: "member" }
}, { timestamps: true });
export default mongoose.model("Membership", membershipSchema);
