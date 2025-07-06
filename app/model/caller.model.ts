import mongoose, { Schema, model } from "mongoose";
import { ICaller } from "../types/caller.types";

const callerSchema = new Schema<ICaller>(
  {
    firstName: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 50 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 50 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: { 
      type: String, 
      required: true,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: { 
      type: Date,
      validate: {
        validator: function(value: Date) {
          if (!value) return true; // Optional field
          return value <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    gender: { 
      type: String, 
      enum: ["male", "female", "other"],
      lowercase: true
    },
    address: { 
      type: String, 
      trim: true,
      maxlength: 200 
    },
    city: { 
      type: String, 
      trim: true,
      maxlength: 50 
    },
    state: { 
      type: String, 
      trim: true,
      maxlength: 50 
    },
    zipCode: { 
      type: String, 
      trim: true,
      maxlength: 20 
    },
    emergencyContact: { 
      type: String, 
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    emergencyName: { 
      type: String, 
      trim: true,
      maxlength: 100 
    },
    profileImage: { 
      type: String,
      trim: true
    },
    status: { 
      type: String, 
      enum: ["active", "inactive", "pending"], 
      default: "active" 
    },
    notes: { 
      type: String, 
      trim: true,
      maxlength: 1000 
    },
  },
  {
    timestamps: { 
      createdAt: 'created_at', 
      updatedAt: 'updated_at' 
    },
  }
);

// Create compound index for efficient searching
callerSchema.index({ firstName: 1, lastName: 1 });
callerSchema.index({ email: 1 });
callerSchema.index({ phone: 1 });
callerSchema.index({ status: 1 });
callerSchema.index({ city: 1, state: 1 });

// Virtual for full name
callerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
callerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtuals are included in JSON output
callerSchema.set('toJSON', { virtuals: true });
callerSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate data
callerSchema.pre('save', function(next) {
  // Ensure phone number has country code if not already present
  if (this.phone && !this.phone.startsWith('+')) {
    this.phone = '+' + this.phone;
  }
  
  // Ensure emergency contact has country code if not already present
  if (this.emergencyContact && !this.emergencyContact.startsWith('+')) {
    this.emergencyContact = '+' + this.emergencyContact;
  }
  
  next();
});

// Static method to find callers by status
callerSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

// Static method to search callers
callerSchema.statics.searchCallers = function(searchTerm: string) {
  return this.find({
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { city: { $regex: searchTerm, $options: 'i' } },
      { state: { $regex: searchTerm, $options: 'i' } }
    ]
  });
};

export const CallerModel = model<ICaller>("callers", callerSchema); 