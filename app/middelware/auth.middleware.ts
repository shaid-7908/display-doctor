import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AdminModel } from "../model/admin.model";
import { asyncHandler } from "../utils/async.hadler";
import envConfig from "../config/env.config";
import { JwtPayload } from "../types/auth.types";
import { generateAccessToken } from "../utils/generate.token";

// Extend Request interface to include admin user
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: string;
        username: string;
      };
    }
  }
}

// Verify JWT token
const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// Main authentication middleware
export const authenticateAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    req.flash("error_msg", "Please login to access this page");
    return res.redirect("/admin/login");
  }

  let decodedToken: JwtPayload | null = null;

  // Try to verify access token first
  if (accessToken) {
    decodedToken = verifyToken(accessToken);
  }

  // If access token is invalid or expired, try refresh token
  if (!decodedToken && refreshToken) {
    decodedToken = verifyToken(refreshToken);
    
    if (decodedToken) {
      // Generate new access token
      const newAccessToken = generateAccessToken({
        id: decodedToken.id,
        email: decodedToken.email,
        role: decodedToken.role,
      })

      // Set new access token in cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
    }
  }

  if (!decodedToken) {
    // Clear invalid tokens
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    req.flash("error_msg", "Session expired. Please login again");
    return res.redirect("/admin/login");
  }

  // Verify admin exists and is active
  const admin = await AdminModel.findById(decodedToken.id).select("-ad_password");
  
  if (!admin) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    req.flash("error_msg", "Admin account not found");
    return res.redirect("/admin/login");
  }

  if (!admin.is_active) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    req.flash("error_msg", "Your account has been deactivated");
    return res.redirect("/admin/login");
  }

  // Add admin info to request
  req.user = {
    id: admin._id as string,
    email: admin.ad_email,
    role: admin.ad_role,
    username: admin.ad_user_name,
  };

  next();
});

// Role-based authorization middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      req.flash("error_msg", "Authentication required");
      return res.redirect("/admin/login");
    }

    if (!roles.includes(req.admin.role)) {
      req.flash("error_msg", "You don't have permission to access this page");
      return res.redirect("/admin/dashboard");
    }

    next();
  };
};

// Optional authentication middleware (doesn't redirect)
export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return next();
  }

  let decodedToken: JwtPayload | null = null;

  if (accessToken) {
    decodedToken = verifyToken(accessToken);
  }

  if (!decodedToken && refreshToken) {
    decodedToken = verifyToken(refreshToken);
  }

  if (decodedToken) {
    const admin = await AdminModel.findById(decodedToken.id).select("-ad_password");
    
    if (admin && admin.is_active) {
      req.admin = {
        id: admin._id as string,
        email: admin.ad_email,
        role: admin.ad_role,
        username: admin.ad_user_name,
      };
    }
  }

  next();
});

// Redirect if already authenticated
export const redirectIfAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.admin) {
    return res.redirect("/admin/dashboard");
  }
  next();
}; 