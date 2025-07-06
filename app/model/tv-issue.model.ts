import mongoose, { Schema, model } from "mongoose";
import { ITVissue } from "../types/customer.types";

// Define interface for TV issue schema statics
interface ITVIssueModel extends mongoose.Model<ITVissue> {
  findByStatus(status: string): Promise<ITVissue[]>;
  findByCustomer(customerId: string): Promise<ITVissue[]>;
  searchIssues(searchTerm: string): Promise<ITVissue[]>;
  findByCode(code: string): Promise<ITVissue | null>;
  generateIssueCode(): Promise<string>;
}

const tvIssueSchema = new Schema<ITVissue>(
  {
    issue_code: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 12 
    },
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
      enum: ["open", "in_progress", "resolved", "closed","visit_scheduled"], 
      default: "open" 
    },
    forward_status: { 
      type: String, 
      enum: ["sent", "not_sent"], 
      default: "not_sent" 
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
    visit_date: { 
      type: Date,
      default: null
    },
    visit_time_range: { 
      type: String, 
      trim: true,
      maxlength: 50,
      enum: [
        "8:00 AM - 10:00 AM",
        "10:00 AM - 12:00 PM", 
        "12:00 PM - 2:00 PM",
        "2:00 PM - 4:00 PM",
        "4:00 PM - 6:00 PM",
        "6:00 PM - 8:00 PM"
      ],
      default: null
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
tvIssueSchema.index({ issue_code: 1 });
tvIssueSchema.index({ customer_id: 1 });
tvIssueSchema.index({ issue_status: 1 });
tvIssueSchema.index({ issue_name: 1 });
tvIssueSchema.index({ created_at: 1 });

// Function to generate unique issue code
export async function generateIssueCode(): Promise<string> {
  try {
    const prefix = 'ISSUE';
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
    
    // Get the latest issue code for this year
    const latestIssue = await TVIssueModel.findOne({
      issue_code: { $regex: `^${prefix}${year}` }
    }).sort({ issue_code: -1 });
    
    let sequence = 1;
    if (latestIssue) {
      // Extract sequence number from the latest code (e.g., ISSUE24000001 -> 1)
      const lastSequence = parseInt(latestIssue.issue_code.slice(-5));
      sequence = lastSequence + 1;
    }
    
    // Format: ISSUE + YY + 5-digit sequence (e.g., ISSUE24000001, ISSUE24000002, etc.)
    const generatedCode = `${prefix}${year}${sequence.toString().padStart(5, '0')}`;
    console.log("Generated issue code:", generatedCode);
    return generatedCode;
  } catch (error) {
    console.error("Error generating issue code:", error);
    throw error;
  }
}

// Pre-save middleware to generate issue code if not provided
tvIssueSchema.pre('save', async function(next) {
  try {
    // Generate issue code if not already set
    if (!this.issue_code) {
      this.issue_code = await generateIssueCode();
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

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
      { issue_code: { $regex: searchTerm, $options: 'i' } },
      { issue_name: { $regex: searchTerm, $options: 'i' } },
      { issue_description: { $regex: searchTerm, $options: 'i' } },
      { tv_model: { $regex: searchTerm, $options: 'i' } },
      { tv_serial_number: { $regex: searchTerm, $options: 'i' } }
    ]
  }).populate('customer_id', 'customer_name customer_email customer_code');
};

// Static method to find issue by code
tvIssueSchema.statics.findByCode = function(code: string) {
  return this.findOne({ issue_code: code.toUpperCase() });
};

// Static method to generate issue code
tvIssueSchema.statics.generateIssueCode = generateIssueCode;

export const TVIssueModel = model<ITVissue, ITVIssueModel>("tv_issues", tvIssueSchema); 