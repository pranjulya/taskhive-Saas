import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ["student", "teacher"], default: "student" },
  passwordHash: String
}, { timestamps: true });

userSchema.methods.setPassword = async function (pwd) {
  this.passwordHash = await bcrypt.hash(pwd, 10);
};

userSchema.methods.validatePassword = async function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

export default mongoose.model("User", userSchema);
