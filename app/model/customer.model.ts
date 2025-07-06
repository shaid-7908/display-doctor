import mongoose, { Schema, model } from "mongoose";
import { ICustomer } from "../types/customer.types";

const customerSchema = new Schema<ICustomer>(
  {
    customer_name: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 100 
    },
    customer_email: { 
      type: String, 
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      default: null
    },
    customer_phone: { 
      type: String, 
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
      default: null
    },
    customer_address: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200 
    },
    customer_city: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 50 
    },
    customer_state: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 50 
    },
    customer_zip: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 20 
    },
    attended_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'callers',
      required: true
    },
    attended_at: { 
      type: Date,
      required: true,
      default: Date.now
    },
    status: { 
      type: String, 
      enum: ["active", "inactive", "pending", "resolved"], 
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

// Create indexes for efficient querying
customerSchema.index({ customer_name: 1 });
customerSchema.index({ customer_email: 1 });
customerSchema.index({ customer_phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ customer_city: 1, customer_state: 1 });
customerSchema.index({ attended_by: 1 });
customerSchema.index({ attended_at: 1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.customer_address,
    this.customer_city,
    this.customer_state,
    this.customer_zip
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for formatted phone number
customerSchema.virtual('formattedPhone').get(function() {
  if (!this.customer_phone) return '';
  
  // Remove all non-digit characters
  const cleaned = this.customer_phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return this.customer_phone;
});

// Ensure virtuals are included in JSON output
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate data
customerSchema.pre('save', function(next) {
  // Ensure phone number has country code if not already present
  if (this.customer_phone && !this.customer_phone.startsWith('+')) {
    // Add +1 for US numbers if not present
    if (this.customer_phone.replace(/\D/g, '').length === 10) {
      this.customer_phone = '+1' + this.customer_phone;
    }
  }
  
  // Capitalize city and state
  if (this.customer_city) {
    this.customer_city = this.customer_city.charAt(0).toUpperCase() + this.customer_city.slice(1).toLowerCase();
  }
  
  if (this.customer_state) {
    this.customer_state = this.customer_state.toUpperCase();
  }
  
  next();
});

// Static method to find customers by status
customerSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

// Static method to search customers
customerSchema.statics.searchCustomers = function(searchTerm: string) {
  return this.find({
    $or: [
      { customer_name: { $regex: searchTerm, $options: 'i' } },
      { customer_email: { $regex: searchTerm, $options: 'i' } },
      { customer_phone: { $regex: searchTerm, $options: 'i' } },
      { customer_city: { $regex: searchTerm, $options: 'i' } },
      { customer_state: { $regex: searchTerm, $options: 'i' } }
    ]
  }).populate('attended_by', 'firstName lastName email');
};

// Static method to find customers by attendant
customerSchema.statics.findByAttendant = function(attendant: string) {
  return this.find({ attended_by: attendant }).populate('attended_by', 'firstName lastName email');
};

// Static method to get customers by date range
customerSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    attended_at: {
      $gte: startDate,
      $lte: endDate
    }
  });
};


export const CustomerModel = model<ICustomer>("customers", customerSchema);
