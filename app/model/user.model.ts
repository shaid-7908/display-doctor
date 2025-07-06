import mongoose, { Schema, model } from "mongoose";
import { UserDocument } from "../types/user.types";

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    password: { type: String, required: true },
    refreshToken: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<UserDocument>("User", userSchema);

