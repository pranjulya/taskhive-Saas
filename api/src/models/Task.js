import mongoose from "mongoose";
const taskSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  title: { type: String, required: true, trim: true },
  description: String,
  status: { type: String, enum: ["todo","doing","done"], default: "todo" },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dueDate: Date
}, { timestamps: true });
export default mongoose.model("Task", taskSchema);
