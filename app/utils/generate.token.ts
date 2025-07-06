import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth.types";
import envConfig from "../config/env.config";

export const generateAccessToken = (user: JwtPayload) => {
  return jwt.sign(
    { email: user.email, id: user.id, role: user.role },
    envConfig.JWT_SECRET,
    {
      expiresIn: "5m",
    }
  );
};

export const generateRefreshToken = (user: JwtPayload) => {
  return jwt.sign(
    { email: user.email, id: user.id, role: user.role },
    envConfig.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};
