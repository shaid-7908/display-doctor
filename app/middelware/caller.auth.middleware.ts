import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CallerModel } from "../model/caller.model";
import { asyncHandler } from "../utils/async.hadler";
import envConfig from "../config/env.config";
import { JwtPayload } from "../types/auth.types";
import { generateAccessToken } from "../utils/generate.token";

// Extend Request interface to include caller user
declare global {
  namespace Express {
    interface Request {
      caller?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
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

// Main authentication middleware for callers
export const authenticateCaller = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.callerAccessToken;
  const refreshToken = req.cookies.callerRefreshToken;

  if (!accessToken && !refreshToken) {
    req.flash("error_msg", "Please login to access this page");
    return res.redirect("/caller/login");
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
      res.cookie("callerAccessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
    }
  }

  if (!decodedToken) {
    // Clear invalid tokens
    res.clearCookie("callerAccessToken");
    res.clearCookie("callerRefreshToken");
    req.flash("error_msg", "Session expired. Please login again");
    return res.redirect("/caller/login");
  }

  // Verify caller exists and is active
  const caller = await CallerModel.findById(decodedToken.id);
  
  if (!caller) {
    res.clearCookie("callerAccessToken");
    res.clearCookie("callerRefreshToken");
    req.flash("error_msg", "Caller account not found");
    return res.redirect("/caller/login");
  }

  if (caller.status !== "active") {
    res.clearCookie("callerAccessToken");
    res.clearCookie("callerRefreshToken");
    req.flash("error_msg", "Your account has been deactivated");
    return res.redirect("/caller/login");
  }

  // Add caller info to request
  req.caller = {
    id: caller._id as string,
    email: caller.email,
    role: "caller",
    firstName: caller.firstName,
    lastName: caller.lastName,
  };

  next();
});

// Optional authentication middleware for callers (doesn't redirect)
export const optionalCallerAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.callerAccessToken;
  const refreshToken = req.cookies.callerRefreshToken;

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
    const caller = await CallerModel.findById(decodedToken.id);
    
    if (caller && caller.status === "active") {
      req.user = {
        id: caller._id as string,
        email: caller.email,
        role: "caller",
        firstName: caller.firstName,
        lastName: caller.lastName,
      };
    }
  }

  next();
});

// Redirect if already authenticated as caller
export const redirectIfCallerAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.caller ) {
    return res.redirect("/caller/dashboard");
  }
  next();
}; 