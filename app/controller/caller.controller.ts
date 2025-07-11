import { asyncHandler } from "../utils/async.hadler";
import { Request, Response } from "express";
import { CallerModel } from "../model/caller.model";
import { CustomerModel } from "../model/customer.model";
import { TVIssueModel, TVIssueStatusHistoryModel } from "../model/tv-issue.model";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generate.token";
import { Parser } from "json2csv";

class CallerController {
  // Render caller login form
  renderCallerLogin = asyncHandler(async (req: Request, res: Response) => {
    res.render("caller/login", {
      title: "Caller Login",
    });
  });

  // Caller login
  callerLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find caller by email
    const caller = await CallerModel.findOne({ email });
    console.log(caller, "caller");
    if (!caller) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/caller/login");
    }

    // Check if caller is active
    if (caller.status !== "active") {
      req.flash(
        "error_msg",
        "Your account has been deactivated. Please contact support."
      );
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
      secure: false,
      //secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    });
    res.cookie("callerRefreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      //secure: process.env.NODE_ENV === "production",
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
    const totalCustomers = await CustomerModel.countDocuments({
      attended_by: callerId,
    });
    const activeCustomers = await CustomerModel.countDocuments({
      attended_by: callerId,
      status: "active",
    });
    const resolvedCustomers = await CustomerModel.countDocuments({
      attended_by: callerId,
      status: "resolved",
    });
    const pendingCustomers = await CustomerModel.countDocuments({
      attended_by: callerId,
      status: "pending",
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await CustomerModel.find({
      attended_by: callerId,
      attended_at: { $gte: sevenDaysAgo },
    }).sort({ attended_at: -1 });

    res.render("caller/dashboard", {
      title: "Caller Dashboard",
      caller: req.caller,
      customers,
      stats: {
        totalCustomers,
        activeCustomers,
        resolvedCustomers,
        pendingCustomers,
      },
      recentActivity,
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
      caller,
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
      emergencyName,
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
      emergencyName,
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
      .populate("attended_by", "firstName lastName");

    const totalCustomers = await CustomerModel.countDocuments({
      attended_by: callerId,
    });
    const totalPages = Math.ceil(totalCustomers / limit);

    res.render("caller/customers", {
      title: "My Customers",
      caller: req.caller,
      customers,
      pagination: {
        page,
        totalPages,
        totalCustomers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  });

  // Render create customer form
  renderCreateCustomerForm = asyncHandler(
    async (req: Request, res: Response) => {
      res.render("caller/create-customer", {
        title: "Create Customer",
        caller: req.caller,
      });
    }
  );

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

    try {
      // Generate customer code first
      const customerCode = await CustomerModel.generateCustomerCode();

      // Create customer data with generated customer code
      const customerData = {
        customer_code: customerCode,
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

      // Create the customer with the generated code
      const customer = await CustomerModel.create(customerData);

      req.flash(
        "success_msg",
        `Customer "${customer.customer_name}" (${customer.customer_code}) created successfully!`
      );
      res.redirect("/caller/create-issue/" + customer._id);
    } catch (error) {
      console.error("Error creating customer:", error);
      req.flash("error_msg", "Failed to create customer. Please try again.");
      res.redirect("/caller/create-customer");
    }
  });

  // Render create issue form
  renderCreateIssueForm = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const customerId = req.params.customerId;

    // Get the specific customer
    const customer = await CustomerModel.findOne({
      _id: customerId,
      attended_by: callerId,
    });

    if (!customer) {
      req.flash("error_msg", "Customer not found or not assigned to you");
      return res.redirect("/caller/customers");
    }

    console.log(customer);
    res.render("caller/create-issue", {
      title: "Create TV Issue",
      caller: req.caller,
      customer: customer,
    });
  });

  // Create TV issue
  createIssue = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.customerId;
    const {
      customer_id,
      issue_name,
      issue_description,
      issue_status,
      tv_model,
      tv_serial_number,
      tv_size,
      issue_notes,
      visit_date,
      visit_time_range,
    } = req.body;

    // Use customer_id from form or fallback to URL parameter
    const finalCustomerId = customer_id || customerId;
    if (issue_status === "visit_scheduled") {
      if (!visit_date || !visit_time_range) {
        req.flash("error_msg", "Visit date and time range are required");
        return res.redirect("/caller/create-issue/" + finalCustomerId);
      } else {
        const upadeCustomer = await CustomerModel.findByIdAndUpdate(
          finalCustomerId,
          {
            status: "pending",
          }
        );
      }
    }
    // Verify customer belongs to this caller
    const callerId = req.caller?.id;
    const customer = await CustomerModel.findOne({
      _id: finalCustomerId,
      attended_by: callerId,
    });

    if (!customer) {
      req.flash("error_msg", "Customer not found or not assigned to you");
      return res.redirect("/caller/customers");
    }

    try {
      // Generate issue code first
      const issueCode = await TVIssueModel.generateIssueCode();

      // Create issue data with generated issue code
      const issueData = {
        issue_code: issueCode,
        customer_id: finalCustomerId,
        issue_name,
        issue_description,
        issue_status: issue_status || "open",
        tv_model: tv_model || undefined,
        tv_serial_number: tv_serial_number || undefined,
        tv_size: tv_size || undefined,
        issue_notes: issue_notes || undefined,
        visit_date: visit_date ? new Date(visit_date) : undefined,
        visit_time_range: visit_time_range || undefined,
      };

      // Create the issue with the generated code
      const issue = await TVIssueModel.create(issueData);

      req.flash(
        "success_msg",
        `TV issue "${issue.issue_name}" (${issue.issue_code}) created successfully for ${customer.customer_name}!`
      );
      res.redirect("/caller/issues");
    } catch (error) {
      console.error("Error creating issue:", error);
      req.flash("error_msg", "Failed to create TV issue. Please try again.");
      res.redirect("/caller/create-issue/" + finalCustomerId);
    }
  });

  // Render caller's issues list
  renderCallerIssues = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { status, fromDate, toDate, export: exportFlag } = req.query;

    const callerCustomers = await CustomerModel.find({
      attended_by: callerId,
    }).select("_id");
    const customerIds = callerCustomers.map((c) => c._id);

    if (customerIds.length === 0) {
      const paginationData = {
        page,
        totalPages: 0,
        totalIssues: 0,
        hasNext: false,
        hasPrev: false,
      };

      if (req.xhr || exportFlag === "html") {
        return res.render("partials/issueTable", {
          issues: [],
          pagination: paginationData,
        });
      }

      return res.render("caller/issues", {
        title: "TV Issues",
        caller: req.caller,
        issues: [],
        pagination: paginationData,
        filters: { status, fromDate, toDate },
      });
    }

    const matchStage: any = { customer_id: { $in: customerIds } };

    if (status) matchStage.issue_status = status;
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate as string) : null;
      const to = toDate
        ? new Date(new Date(toDate as string).setHours(23, 59, 59, 999))
        : null;

      matchStage.created_at = {};

      // If only fromDate given, treat it as a single-day filter
      if (from && !toDate) {
        const endOfDay = new Date(from);
        endOfDay.setHours(23, 59, 59, 999);
        matchStage.created_at.$gte = from;
        matchStage.created_at.$lte = endOfDay;
      }

      // If both dates are given, treat it as a range
      if (from && toDate) {
        matchStage.created_at.$gte = from;
        matchStage.created_at.$lte = to;
      }
    }
    

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer_info",
        },
      },
      { $unwind: "$customer_info" },
      { $sort: { created_at: -1 } },
    ];

    const countPipeline = [...pipeline, { $count: "total" }];
    const totalAgg = await TVIssueModel.aggregate(countPipeline);
    const totalIssues = totalAgg[0]?.total || 0;
    const totalPages = Math.ceil(totalIssues / limit);

    if (!exportFlag) pipeline.push({ $skip: skip }, { $limit: limit });
    const issues = await TVIssueModel.aggregate(pipeline);

    // CSV Export
    if (exportFlag === "csv") {
      const { Parser } = require("json2csv");
      const csvData = issues.map((issue) => ({
        IssueCode: issue.issue_code,
        IssueName: issue.issue_name,
        Description: issue.issue_description,
        Status: issue.issue_status,
        CreatedAt: issue.created_at.toISOString(),
        CustomerName: issue.customer_info?.customer_name || "",
        CustomerCode: issue.customer_info?.customer_code || "",
        CustomerPhone: issue.customer_info?.customer_phone || "",
        CustomerAddress: `${issue.customer_info?.customer_city || ""}, ${
          issue.customer_info?.customer_state || ""
        }`,
        TVModel: issue.tv_model || "",
        SerialNo: issue.tv_serial_number || "",
        Size: issue.tv_size || "",
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=tv-issues.csv"
      );
      return res.send(csv);
    }

    const paginationData = {
      page,
      totalPages,
      totalIssues,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    // ✅ If AJAX request, return partial HTML
    if (req.xhr || exportFlag === "html") {
      return res.render("partials/issueTable", {
        issues,
        pagination: paginationData,
      });
    }

    // Else return full page
    res.render("caller/issues", {
      title: "TV Issues",
      caller: req.caller,
      issues,
      pagination: paginationData,
      filters: { status, fromDate, toDate },
    });
  });

  // Render detailed customer view with issues
  renderCustomerDetails = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const customerId = req.params.customerId;

    // Get customer with verification that it belongs to this caller
    const customer = await CustomerModel.findOne({
      _id: customerId,
      attended_by: callerId,
    });

    if (!customer) {
      req.flash("error_msg", "Customer not found or not assigned to you");
      return res.redirect("/caller/customers");
    }

    // Get all TV issues for this customer
    const issues = await TVIssueModel.find({ customer_id: customerId }).sort({
      created_at: -1,
    });

    // Get statistics
    const totalIssues = issues.length;
    const openIssues = issues.filter(
      (issue) => issue.issue_status === "open"
    ).length;
    const resolvedIssues = issues.filter(
      (issue) => issue.issue_status === "resolved"
    ).length;
    const inProgressIssues = issues.filter(
      (issue) => issue.issue_status === "in_progress"
    ).length;

    res.render("caller/customer-details", {
      title: `Customer: ${customer.customer_name}`,
      caller: req.caller,
      customer,
      issues,
      stats: {
        totalIssues,
        openIssues,
        resolvedIssues,
        inProgressIssues,
      },
    });
  });

  // Send email for TV issue
  sendIssueEmail = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.caller?.id;
    const issueId = req.params.issueId;
    console.log("here");

    // Get issue with customer information
    const issue = await TVIssueModel.findById(issueId).populate(
      "customer_id",
      "customer_name customer_email customer_phone customer_address customer_city customer_state customer_zip"
    );

    if (!issue) {
      console.log("also here");
      req.flash("error_msg", "Issue not found");
      return res.redirect("/caller/issues");
    }

    // Verify the customer belongs to this caller
    const customer = await CustomerModel.findOne({
      _id: issue.customer_id._id,
      attended_by: callerId,
    });

    if (!customer) {
      req.flash(
        "error_msg",
        "You are not authorized to send emails for this issue"
      );
      return res.redirect("/caller/issues");
    }

    // Check if customer has email
    // if (!customer.customer_email) {
    //   req.flash("error_msg", "Customer does not have an email address");
    //   return res.redirect("/caller/issues");
    // }

    try {
      console.log("try");
      // Prepare email content
      const emailSubject = `TV Issue Update - ${issue.issue_code}`;

      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #0a3d62 0%, #0d5b94 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="margin: 0; color: white;">TV Issue Update</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Issue Code: ${
              issue.issue_code
            }</p>
          </div>
          
          <div style="background: white; padding: 20px; margin-top: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #0a3d62; margin-top: 0;">Issue Details:</h4>
              <p><strong>Issue:</strong> ${issue.issue_name}</p>
              <p><strong>Description:</strong> ${issue.issue_description}</p>
              <p><strong>Status:</strong> <span style="color: #0d5b94; font-weight: bold;">${
                issue.issue_status.charAt(0).toUpperCase() +
                issue.issue_status.slice(1).replace("_", " ")
              }</span></p>
            </div>
      `;

      // Add TV information if available
      if (issue.tv_model || issue.tv_serial_number || issue.tv_size) {
        emailContent += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #0a3d62; margin-top: 0;">TV Information:</h4>
        `;

        if (issue.tv_model) {
          emailContent += `<p><strong>Model:</strong> ${issue.tv_model}</p>`;
        }
        if (issue.tv_serial_number) {
          emailContent += `<p><strong>Serial Number:</strong> </p>`;
        }
        if (issue.tv_size) {
          emailContent += `<p><strong>Size:</strong> ${issue.tv_size}"</p>`;
        }

        emailContent += `</div>`;
      }

      // Add visit information if scheduled
      if (issue.visit_date) {
        emailContent += `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h4 style="color: #0a3d62; margin-top: 0;">📅 Visit Scheduled:</h4>
              <p><strong>Date:</strong> ${new Date(
                issue.visit_date
              ).toLocaleDateString()}</p>
        `;

        if (issue.visit_time_range) {
          emailContent += `<p><strong>Time:</strong> ${issue.visit_time_range}</p>`;
        }

        emailContent += `
              <p style="margin-top: 15px; font-size: 14px; color: #666;">
                Please ensure technician is available at the scheduled time.
              </p>
            </div>
        `;
      }

      emailContent += `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #0a3d62; margin-top: 0;">📞 Contact Information:</h4>
              <p><strong>Customer Name:</strong>${customer.customer_name}</P>
              <p><strong>Address:</strong> ${customer.customer_address}</p>
              <p><strong>Location:</strong> ${customer.customer_city}, ${
        customer.customer_state
      } ${customer.customer_zip}</p>
              ${
                customer.customer_phone
                  ? `<p><strong>Phone:</strong> ${customer.customer_phone}</p>`
                  : ""
              }
            </div>
            
            <p>We appreciate your patience and will keep you updated on the progress of your issue.</p>
            
            <p>Best regards,<br>
            <strong>TV Service Team</strong></p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Issue Code: ${issue.issue_code} | Customer: ${
        customer.customer_code
      }</p>
          </div>
        </div>
      `;

      // Send email using the mail utility
      const { sendEmail } = await import("../utils/mail.utils");
      await sendEmail({
        to: "rahulmodanl45@gmail.com",
        subject: emailSubject,
        html: emailContent,
      });

      // Update issue forward status
      await TVIssueModel.findByIdAndUpdate(issueId, {
        forward_status: "sent",
      });

      req.flash(
        "success_msg",
        `Email sent successfully to ${customer.customer_name} (${customer.customer_email})`
      );
      res.redirect("/caller/issues");
    } catch (error) {
      console.error("Error sending email:", error);
      req.flash("error_msg", "Failed to send email. Please try again.");
      res.redirect("/caller/issues");
    }
  });

  renderEditIssue = asyncHandler(async (req, res) => {
    const issue_id = req.params.issueid;
    const issueDetails = await TVIssueModel.findOne({ _id: issue_id });

    console.log(issueDetails);
    if (!issueDetails) {
      res.render("no issue found");
    }
    const customer = await CustomerModel.findOne({
      _id: issueDetails?.customer_id,
    });
    if (!customer) {
      res.render("no customer found");
    }
    res.render("caller/edit-issue", {
      issue: issueDetails,
      customer: customer,
    });
  });

  editIssue = asyncHandler(async (req, res) => {
    const issue_id = req.params.issueid;
    const {
      customer_id,
      issue_name,
      issue_status,
      issue_description,
      tv_model,
      tv_serial_number,
      tv_size,
      issue_notes,
      visit_date,
      visit_time_range,
    } = req.body;

    const updatedData = {
      customer_id,
      issue_name,
      issue_status,
      issue_description,
      tv_model,
      tv_serial_number,
      tv_size,
      issue_notes,
      visit_date: visit_date ? new Date(visit_date) : null,
      visit_time_range,
    };
    const updatedIssue = await TVIssueModel.findByIdAndUpdate(
      issue_id,
      updatedData,
      { new: true }
    );

    if (!updatedIssue) {
      req.flash("error", "Issue not found.");
      return res.redirect("/caller/issues");
    }
    req.flash("success", "Issue updated successfully.");
    res.redirect(`/caller/issue-details/${issue_id}`);
  });

  renderIssueDetails = asyncHandler(async (req, res) => {
    const issue_id = req.params.issueid;
    const issueDetails = await TVIssueModel.findOne({ _id: issue_id });
    if (!issueDetails) {
      req.flash("error", "Issue not found");
      res.redirect("/caller/dashboard");
    }
    const customer = await CustomerModel.findOne({
      _id: issueDetails?.customer_id,
    });
    res.render("caller/issue-details", {
      issue: issueDetails,
      customer: customer,
    });
  });
  upadteIssueStatus = asyncHandler(async (req,res)=>{
    console.log(req.body)
     const {issue_id,new_status,comment,visit_date,visit_time_range}= req.body
     const caller_id = req.caller?.id
     const issueFound = await TVIssueModel.findOne({_id:issue_id})
     if(!issueFound){
      req.flash('error_msg','Issue not found')
      res.redirect('/caller/issues')
     }
     const prevStatusValue = issueFound?.issue_status
     const prev_visit_date = issueFound?.visit_date 
     const current_visit_date = visit_date ? new Date(visit_date) : prev_visit_date
     const udateIssueSTatus = await TVIssueModel.findByIdAndUpdate(
       issue_id,
       {
         issue_status: new_status,
         visit_date: current_visit_date,
         visit_time_range: visit_time_range || undefined,
       },
       { new: true }
     );
     console.log(udateIssueSTatus)
     const issueHistory = await TVIssueStatusHistoryModel.create({
      issue_id:issue_id,
      changed_by:caller_id,
      previous_status:prevStatusValue,
      new_status:new_status,
      comment:comment,
      changed_at:new Date(),
      prev_visit_date:prev_visit_date,
      current_visit_date:current_visit_date
     })
     req.flash("success_msg",`Issue status changed for Issue code :${issueFound?.issue_code}`)
     res.redirect('/caller/issues')

  })

  getIssueHistory = asyncHandler(async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    
    try {
      // Get the issue details
      const issue = await TVIssueModel.findById(issueId);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }

      // Get the status history for this issue
      const history = await TVIssueStatusHistoryModel.find({ issue_id: issueId })
        .populate('changed_by', 'firstName lastName email')
        .sort({ changed_at: -1 });

      // Return the data as JSON for AJAX request
      return res.json({
        issue: {
          issue_code: issue.issue_code,
          issue_name: issue.issue_name,
          current_status: issue.issue_status
        },
        history: history
      });
    } catch (error) {
      console.error("Error fetching issue history:", error);
      return res.status(500).json({ error: "Failed to fetch issue history" });
    }
  });
}

export default new CallerController();
