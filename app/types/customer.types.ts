import { Document } from "mongoose";

export interface ICustomer extends Document {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_state: string;
    customer_zip: string;
    attended_by: string;
    attended_at: Date;
    status: string;
    notes: string;    
}

export interface ITVissue extends Document {
    customer_id: string;
    issue_name: string;
    issue_description: string;
    issue_status: string;
    tv_model: string;
    tv_serial_number: string;
    tv_size: string;
    issue_notes: string;
}
