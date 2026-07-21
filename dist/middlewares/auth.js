import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
export const requireAuth = async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
        return next(new AppError("Authorization token is required", 401, "AUTH_TOKEN_MISSING"));
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        const user = await UserModel.findById(payload.userId).select("email role accessStatus").lean();
        if (!user) {
            return next(new AppError("Authenticated account no longer exists", 401, "AUTH_USER_NOT_FOUND"));
        }
        if (user.role !== "admin" && user.role !== "staff") {
            return next(new AppError("Only admin and staff accounts can access this site", 403, "SUPPORTED_ROLE_REQUIRED"));
        }
        if ((user.accessStatus ?? "active") !== "active") {
            return next(new AppError("This account is disabled. Contact the administrator for access.", 403, "ACCOUNT_DISABLED"));
        }
        req.user = { userId: String(user._id), email: user.email, role: user.role };
        return next();
    }
    catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError("Authorization token is invalid or expired", 401, "AUTH_TOKEN_INVALID"));
    }
};
export const requireAdmin = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError("Authenticated admin context is required", 401, "AUTH_CONTEXT_MISSING"));
    }
    if (req.user.role !== "admin") {
        return next(new AppError("Only admin users can access this resource", 403, "ADMIN_ROLE_REQUIRED"));
    }
    return next();
};
