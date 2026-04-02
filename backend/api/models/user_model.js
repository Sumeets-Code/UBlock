import mongoose from "mongoose";

const userLoginSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['viewer', 'investigator', 'admin'], default: 'investigator' },
    department: { type: String, required: true },
    badgeNumber: { type: String, required: true },
    profilePhoto: {
      data: Buffer, // The actual image data
      contentType: String, // e.g. 'image/jpeg'
    },
    contact: { type: String },
  },
  { timestamps: true },
);

const User = mongoose.model("userLogins", userLoginSchema);

export default User;
