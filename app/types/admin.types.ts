import { Document } from "mongoose";

export interface IAdmin extends Document {
  ad_user_name: string;
  ad_password: string;
  ad_phone: string;
  ad_email: string;
  ad_profile_picture?: string;
  ad_role: "super_admin" | "admin";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAdminRequest {
  ad_user_name: string;
  ad_email: string;
  ad_password: string;
  ad_phone: string;
  ad_role?: "super_admin" | "admin";
  ad_profile_picture?: string;
}

export interface UpdateAdminRequest {
  ad_user_name?: string;
  ad_email?: string;
  ad_password?: string;
  ad_phone?: string;
  ad_role?: "super_admin" | "admin";
  ad_profile_picture?: string;
  is_active?: boolean;
}
