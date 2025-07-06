import { asyncHandler } from "../utils/async.hadler";
import { Request, Response } from "express";
import { AdminModel } from "../model/admin.model";
import { CallerModel } from "../model/caller.model";
import { hashPassword } from "../utils/hash.password";
import STATUS_CODES from "../utils/status.codes";
import bcrypt from "bcrypt";
import { generateAccessToken ,generateRefreshToken } from "../utils/generate.token";
import { sendCallerRegistrationEmail } from "../utils/mail.utils";

class AdminController {
  // Render admin creation form
  renderCreateAdminForm = asyncHandler(async (req: Request, res: Response) => {
    res.render("admin/create-admin", {
      title: "Create Admin",
      admin: null,
    });
  });

  // Create new admin
  createAdmin = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body)
    const {
      ad_user_name,
      ad_email,
      ad_password,
      ad_phone,
      ad_role = "super_admin",
      ad_profile_picture,
    } = req.body;

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({
      $or: [{ ad_email }, { ad_user_name }],
    });

    if (existingAdmin) {
      req.flash("error_msg", "Admin with this email or username already exists");
      return res.redirect("/admin/create");
    }

    // Hash password
    const hashedPassword = await hashPassword(ad_password);

    // Create new admin
    const newAdmin = await AdminModel.create({
      ad_user_name,
      ad_email,
      ad_password: hashedPassword,
      ad_phone,
      ad_role,
      ad_profile_picture,
      is_active: true,
    });

    req.flash("success_msg", "Admin created successfully!");
    res.redirect("/admin/list");
  });

  // Render admin list
  renderAdminList = asyncHandler(async (req: Request, res: Response) => {
    const admins = await AdminModel.find({}).select("-ad_password").sort({ created_at: -1 });
    
    res.render("admin/admin-list", {
      title: "Admin List",
      admin: req.user,
      admins,
    });
  });
  renderCreateCallerForm = asyncHandler(async (req: Request, res: Response) => {
    res.render("admin/create-caller", {
      title: "Create Caller",
      admin: req.user,
    });
  });
  createCaller = asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyName,
      status,
      notes,
    } = req.body;

    // Check if email already exists
    const existingCaller = await CallerModel.findOne({ email });
    if (existingCaller) {
      req.flash("error_msg", "A caller with this email already exists");
      return res.redirect("/admin/create-caller");
    }

    // Handle profile image upload
    let profileImage = "";
    if (req.file) {
      profileImage = req.file.filename;
    }

    // Generate username and password
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);

    // Create caller data
    const callerData = {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyName,
      profileImage,
      status: status || "active",
      notes,
    };

    // Create the caller
    const caller = await CallerModel.create(callerData);

    // Send registration email with credentials
    const emailSent = await sendCallerRegistrationEmail(
      caller.email,
      `${caller.firstName} ${caller.lastName}`,
      username,
      password
    );

    if (emailSent) {
      req.flash("success_msg", `Caller created successfully! Registration email sent to ${caller.email}`);
    } else {
      req.flash("warning_msg", `Caller created successfully, but failed to send registration email to ${caller.email}`);
    }

    res.redirect("/admin/callers");
  })

  // Render caller list
  renderCallerList = asyncHandler(async (req: Request, res: Response) => {
    const callers = await CallerModel.find({}).sort({ created_at: -1 });
    
    res.render("admin/caller-list", {
      title: "Caller List",
      admin: req.user,
      callers,
    });
  });

  // Render admin edit form
  renderEditAdminForm = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const admin = await AdminModel.findById(id).select("-ad_password");

    if (!admin) {
      req.flash("error_msg", "Admin not found");
      return res.redirect("/admin/list");
    }

    res.render("admin/edit-admin", {
      title: "Edit Admin",
      admin,
    });
  });

  renderAdminLogin = asyncHandler(async (req: Request, res: Response) => {
    res.render("admin/login", {
      title: "Admin Login"
    });
  });

  // Admin login
  adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const { ad_user_name, ad_password, rememberMe } = req.body;

    // Find admin by username
    const admin = await AdminModel.findOne({ ad_user_name });

    if (!admin) {
      req.flash("error_msg", "Invalid username or password");
      return res.redirect("/admin/login");
    }

    // Check if admin is active
    if (!admin.is_active) {
      req.flash("error_msg", "Your account has been deactivated. Please contact support.");
      return res.redirect("/admin/login");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(ad_password, admin.ad_password);

    if (!isPasswordValid) {
      req.flash("error_msg", "Invalid username or password");
      return res.redirect("/admin/login");
    }
    const accessToken = generateAccessToken({
      id: admin._id as string,
      email: admin.ad_email,
      role: admin.ad_role,
    });
    const refreshToken = generateRefreshToken({
      id: admin._id as string,
      email: admin.ad_email,
      role: admin.ad_role,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {  
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    req.flash("success_msg", `Welcome back, ${admin.ad_user_name}!`);
    res.redirect("/admin");
  });

  // Admin logout
  adminLogout = asyncHandler(async (req: Request, res: Response) => {
    // Clear JWT cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    
    req.flash("success_msg", "Logged out successfully");
    res.redirect("/admin/login");
  });

  // Update admin
  updateAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      ad_user_name,
      ad_email,
      ad_phone,
      ad_role,
      ad_profile_picture,
      is_active,
    } = req.body;

    const admin = await AdminModel.findById(id);
    if (!admin) {
      req.flash("error_msg", "Admin not found");
      return res.redirect("/admin/list");
    }

    // Check if email or username already exists for other admins
    const existingAdmin = await AdminModel.findOne({
      $and: [
        { _id: { $ne: id } },
        { $or: [{ ad_email }, { ad_user_name }] },
      ],
    });

    if (existingAdmin) {
      req.flash("error_msg", "Email or username already exists");
      return res.redirect(`/admin/edit/${id}`);
    }

    // Update admin
    await AdminModel.findByIdAndUpdate(id, {
      ad_user_name,
      ad_email,
      ad_phone,
      ad_role,
      ad_profile_picture,
      is_active: is_active === "true",
    });

    req.flash("success_msg", "Admin updated successfully!");
    res.redirect("/admin/list");
  });

  // Delete admin
  deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const admin = await AdminModel.findById(id);
    if (!admin) {
      req.flash("error_msg", "Admin not found");
      return res.redirect("/admin/list");
    }

    await AdminModel.findByIdAndDelete(id);
    req.flash("delete_msg", "Admin deleted successfully!");
    res.redirect("/admin/list");
  });

  // Render admin dashboard
  renderDashboard = asyncHandler(async (req: Request, res: Response) => {
    const totalAdmins = await AdminModel.countDocuments();
    const activeAdmins = await AdminModel.countDocuments({ is_active: true });
    const inactiveAdmins = await AdminModel.countDocuments({ is_active: false });
    
    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      admin: req.user,
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
      },
    });
  });

  // Toggle admin status
  toggleAdminStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const admin = await AdminModel.findById(id);
    if (!admin) {
      req.flash("error_msg", "Admin not found");
      return res.redirect("/admin/list");
    }

    admin.is_active = !admin.is_active;
    await admin.save();

    const statusMessage = admin.is_active ? "activated" : "deactivated";
    req.flash("success_msg", `Admin ${statusMessage} successfully!`);
    res.redirect("/admin/list");
  });
}

export default new AdminController();