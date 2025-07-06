import mongoose, { Schema, model } from "mongoose";
import { IAdmin } from "../types/admin.types";

const adminSchema = new Schema<IAdmin>(
  {
    ad_user_name: { type: String, required: true, unique: true },
    ad_password: { type: String, required: true },
    ad_phone: { type: String, required: true },
    ad_email: { type: String, required: true, unique: true },
    ad_profile_picture: { type: String },
    ad_role: { 
      type: String, 
      enum: ["super_admin", "admin"], 
      default: "admin" 
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const AdminModel = model<IAdmin>("Admin", adminSchema);
