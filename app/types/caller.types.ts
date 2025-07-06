import { Document } from "mongoose";

export interface ICaller extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyName?: string;
  profileImage?: string;
  status: "active" | "inactive" | "pending";
  notes?: string;
  created_at: Date;
  updated_at: Date;
  password: string;
}

export interface CreateCallerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyName?: string;
  profileImage?: string;
  status?: "active" | "inactive" | "pending";
  notes?: string;
}

export interface UpdateCallerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyName?: string;
  profileImage?: string;
  status?: "active" | "inactive" | "pending";
  notes?: string;
}

export interface CallerSearchFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive" | "pending";
  city?: string;
  state?: string;
  gender?: "male" | "female" | "other";
  dateCreated?: {
    $gte?: Date;
    $lte?: Date;
  };
} 