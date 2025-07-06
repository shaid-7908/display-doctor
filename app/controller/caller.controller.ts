import { asyncHandler } from "../utils/async.hadler";
import { Request, Response } from "express";
import { CallerModel } from "../model/caller.model";
import { CustomerModel } from "../model/customer.model";
import { TVIssueModel } from "../model/tv-issue.model";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/generate.token";

class CallerController {
  // Render caller login form
  renderCallerLogin = asyncHandler(async (req: Request, res: Response) => {
    res.render("caller/login", {
      title: "Caller Login"
    });
  });

  // Caller login
  callerLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find caller by email
    const caller = await CallerModel.findOne({ email });

    if (!caller) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/caller/login");
    }

    // Check if caller is active
    if (caller.status !== "active") {
      req.flash("error_msg", "Your account has been deactivated. Please contact support.");
      return res.redirect("/caller/login");
    }

    // For now, we'll use a simple password check
    // In a real system, you'd store hashed passwords in the caller model
    // For demo purposes, we'll use the email as password
    const isPasswordValid = await bcrypt.compare(password, caller.password);
    if (!isPasswordValid) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/caller/login");
    }

    const accessToken = generateAccessToken({
      id: caller._id as string,
      email: caller.email,
      role: "caller",
    });
    const refreshToken = generateRefreshToken({
      id: caller._id as string,
      email: caller.email,
      role: "caller",
    });

    res.cookie("callerAccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    });
    res.cookie("callerRefreshToken", refreshToken, {  
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.flash("success_msg", `Welcome back, ${caller.firstName}!`);
    res.redirect("/caller/dashboard");
  });

  // Caller logout
  callerLogout = asyncHandler(async (req: Request, res: Response) => {
    // Clear JWT cookies
    res.clearCookie("callerAccessToken");
    res.clearCookie("callerRefreshToken");
    
    req.flash("success_msg", "Logged out successfully");
    res.redirect("/caller/login");
  });

  // Render caller dashboard
  renderCallerDashboard = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    
    // Get caller's customers
    const customers = await CustomerModel.find({ attended_by: callerId })
      .sort({ attended_at: -1 })
      .limit(10);

    // Get statistics
    const totalCustomers = await CustomerModel.countDocuments({ attended_by: callerId });
    const activeCustomers = await CustomerModel.countDocuments({ 
      attended_by: callerId, 
      status: "active" 
    });
    const resolvedCustomers = await CustomerModel.countDocuments({ 
      attended_by: callerId, 
      status: "resolved" 
    });
    const pendingCustomers = await CustomerModel.countDocuments({ 
      attended_by: callerId, 
      status: "pending" 
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await CustomerModel.find({
      attended_by: callerId,
      attended_at: { $gte: sevenDaysAgo }
    }).sort({ attended_at: -1 });

    res.render("caller/dashboard", {
      title: "Caller Dashboard",
      caller: req.user,
      customers,
      stats: {
        totalCustomers,
        activeCustomers,
        resolvedCustomers,
        pendingCustomers
      },
      recentActivity
    });
  });

  // Render caller profile
  renderCallerProfile = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const caller = await CallerModel.findById(callerId);

    if (!caller) {
      req.flash("error_msg", "Caller not found");
      return res.redirect("/caller/dashboard");
    }

    res.render("caller/profile", {
      title: "My Profile",
      caller
    });
  });

  // Update caller profile
  updateCallerProfile = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyName
    } = req.body;

    // Handle profile image upload
    let profileImage = "";
    if (req.file) {
      profileImage = req.file.filename;
    }

    const updateData: any = {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyName
    };

    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    await CallerModel.findByIdAndUpdate(callerId, updateData);

    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/caller/profile");
  });

  // Render caller's customers list
  renderCallerCustomers = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const customers = await CustomerModel.find({ attended_by: callerId })
      .sort({ attended_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('attended_by', 'firstName lastName');

    const totalCustomers = await CustomerModel.countDocuments({ attended_by: callerId });
    const totalPages = Math.ceil(totalCustomers / limit);

    res.render("caller/customers", {
      title: "My Customers",
      caller: req.user,
      customers,
      pagination: {
        page,
        totalPages,
        totalCustomers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  });

  // Render create customer form
  renderCreateCustomerForm = asyncHandler(async (req: Request, res: Response) => {
    res.render("caller/create-customer", {
      title: "Create Customer",
      caller: req.caller,
    });
  });

  // Create customer
  createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_zip,
      status,
      notes,
    } = req.body;

    // Check if email already exists (only if email is provided)
    if (customer_email) {
      const existingCustomer = await CustomerModel.findOne({ customer_email });
      if (existingCustomer) {
        req.flash("error_msg", "A customer with this email already exists");
        return res.redirect("/caller/create-customer");
      }
    }

    // Create customer data
    const customerData = {
      customer_name,
      customer_email: customer_email || undefined,
      customer_phone: customer_phone || undefined,
      customer_address,
      customer_city,
      customer_state,
      customer_zip,
      attended_by: callerId,
      attended_at: new Date(),
      status: status || "active",
      notes: notes || undefined,
    };
    console.log(customerData);

    // Create the customer
    const customer = await CustomerModel.create(customerData);

    req.flash("success_msg", `Customer "${customer.customer_name}" created successfully!`);
    res.redirect("/caller/customers");
  });

  // Render create issue form
  renderCreateIssueForm = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    
    // Get caller's customers for dropdown
    const customers = await CustomerModel.find({ attended_by: callerId })
      .sort({ customer_name: 1 });

    res.render("caller/create-issue", {
      title: "Create TV Issue",
      caller: req.caller,
      customers
    });
  });

  // Create TV issue
  createIssue = asyncHandler(async (req: Request, res: Response) => {
    const {
      customer_id,
      issue_name,
      issue_description,
      issue_status,
      tv_model,
      tv_serial_number,
      tv_size,
      issue_notes,
    } = req.body;

    // Verify customer belongs to this caller
    const callerId = req.caller?.id;
    const customer = await CustomerModel.findOne({ 
      _id: customer_id, 
      attended_by: callerId 
    });

    if (!customer) {
      req.flash("error_msg", "Customer not found or not assigned to you");
      return res.redirect("/caller/create-issue");
    }

    // Create issue data
    const issueData = {
      customer_id,
      issue_name,
      issue_description,
      issue_status: issue_status || "open",
      tv_model: tv_model || undefined,
      tv_serial_number: tv_serial_number || undefined,
      tv_size: tv_size || undefined,
      issue_notes: issue_notes || undefined,
    };

    // Create the issue
    const issue = await TVIssueModel.create(issueData);

    req.flash("success_msg", `TV issue "${issue.issue_name}" created successfully for ${customer.customer_name}!`);
    res.redirect("/caller/issues");
  });
}

export default new CallerController();
