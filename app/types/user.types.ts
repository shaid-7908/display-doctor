import { Document } from "mongoose";

// MongoDB User Schema interface
export interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string;
  dateOfBirth: Date;
  password: string;
  refreshToken: string;
  googleId?: string;
  role: "user" | "admin" | string;
  isVerified: boolean;
}

// JWT Payload (used for signing JWT tokens)


// Data to send back to frontend after login/registration (safe fields)
export interface PublicUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
}

// OTP document used for storing verification codes
export interface OtpDocument extends Document {
  userId: string;
  emailOtp: string;
  createdAt?: Date;
}
