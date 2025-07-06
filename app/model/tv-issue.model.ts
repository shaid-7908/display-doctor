import mongoose, { Schema, model } from "mongoose";
import { ITVissue } from "../types/customer.types";

const tvIssueSchema = new Schema<ITVissue>(
  {
    customer_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'customers',
      required: true
    },
    issue_name: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 100 
    },
    issue_description: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 500 
    },
    issue_status: { 
      type: String, 
      enum: ["open", "in_progress", "resolved", "closed"], 
      default: "open" 
    },
    tv_model: { 
      type: String, 
      trim: true,
      maxlength: 100 
    },
    tv_serial_number: { 
      type: String, 
      trim: true,
      maxlength: 50 
    },
    tv_size: { 
      type: String, 
      trim: true,
      maxlength: 20 
    },
    issue_notes: { 
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
tvIssueSchema.index({ customer_id: 1 });
tvIssueSchema.index({ issue_status: 1 });
tvIssueSchema.index({ issue_name: 1 });
tvIssueSchema.index({ created_at: 1 });

// Virtual for formatted status
tvIssueSchema.virtual('statusDisplay').get(function() {
  return this.issue_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Ensure virtuals are included in JSON output
tvIssueSchema.set('toJSON', { virtuals: true });
tvIssueSchema.set('toObject', { virtuals: true });

// Static method to find issues by status
tvIssueSchema.statics.findByStatus = function(status: string) {
  return this.find({ issue_status: status });
};

// Static method to find issues by customer
tvIssueSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customer_id: customerId });
};

// Static method to search issues
tvIssueSchema.statics.searchIssues = function(searchTerm: string) {
  return this.find({
    $or: [
      { issue_name: { $regex: searchTerm, $options: 'i' } },
      { issue_description: { $regex: searchTerm, $options: 'i' } },
      { tv_model: { $regex: searchTerm, $options: 'i' } },
      { tv_serial_number: { $regex: searchTerm, $options: 'i' } }
    ]
  }).populate('customer_id', 'customer_name customer_email');
};

export const TVIssueModel = model<ITVissue>("tv_issues", tvIssueSchema); 