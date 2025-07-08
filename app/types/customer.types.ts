import { Document, Types } from "mongoose";

export interface ICustomer extends Document {
    customer_code: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_state: string;
    customer_zip: string;
    attended_by: Types.ObjectId; // Reference to callers collection
    attended_at: Date;
    status: string;
    notes: string;    
}

export interface ITVissue extends Document {
    issue_code: string;
    customer_id: Types.ObjectId;
    issue_name: string;
    issue_description: string;
    issue_status: string;
    tv_model: string;
    tv_serial_number: string;
    tv_size: string;
    issue_notes: string;
    visit_date: Date;
    visit_time_range: string;
    forward_status: string;
}

export interface ITVIssueStatusHistory {
  issue_id: Types.ObjectId; // Reference to TV issue
  changed_by?: Types.ObjectId; // Caller or Admin who made the change
  previous_status: string;
  new_status: string;
  changed_at?: Date;
  comment?: string; // Optional reason or notes
}
  