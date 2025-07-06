import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.log(message)
  if (req.headers.accept?.includes("text/html")) {
    console.log("View render error:", err.message);
    req.flash("error_msg", message);
    console.log('bk')
    const referer = req.headers.referer || "/login";
    return res.redirect(referer);
  }

  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "production" ? undefined : err,
  });
};
