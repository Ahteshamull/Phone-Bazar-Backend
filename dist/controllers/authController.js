import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AccessRequestModel } from "../models/AccessRequest.js";
import { UserModel } from "../models/User.js";
import { sendAdminContactNotice, sendPasswordResetNotice } from "../services/emailService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMessage } from "../utils/apiResponse.js";
const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
function hashResetOtp(email, otp) {
    return createHash("sha256").update(`${email.toLowerCase()}:${otp}:${env.JWT_SECRET}`).digest("hex");
}
function hashPasswordResetToken(email, token) {
    return createHash("sha256").update(`${email.toLowerCase()}:${token}:${env.JWT_SECRET}`).digest("hex");
}
function createResetOtp() {
    return String(randomInt(100000, 1000000));
}
function createPasswordResetToken() {
    return randomBytes(32).toString("hex");
}
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new AppError("No admin account exists for this email", 401, "INVALID_LOGIN_EMAIL");
    }
    if (!user.passwordHash) {
        throw new AppError("Admin account password is not configured. Restart the API server to repair the default admin password.", 409, "ADMIN_PASSWORD_NOT_CONFIGURED");
    }
    if (user.role !== "admin" && user.role !== "staff") {
        throw new AppError("Only admin and staff accounts can sign in to this site", 403, "SUPPORTED_ROLE_REQUIRED");
    }
    if ((user.accessStatus ?? "active") !== "active") {
        throw new AppError("This account is disabled. Contact the administrator for access.", 403, "ACCOUNT_DISABLED");
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new AppError("Invalid password provided for this account", 401, "INVALID_LOGIN_PASSWORD");
    }
    const options = { expiresIn: env.JWT_EXPIRES_IN };
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET, options);
    res.json({ email: user.email, role: user.role, token, message: "Login successful" });
});
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
        throw new AppError("No account was found for this reset email", 404, "PASSWORD_RESET_EMAIL_NOT_FOUND");
    }
    const otp = createResetOtp();
    user.resetOtpHash = hashResetOtp(normalizedEmail, otp);
    user.resetOtpExpiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);
    user.resetOtpVerifiedAt = undefined;
    await user.save();
    await sendPasswordResetNotice(normalizedEmail, otp);
    return sendMessage(res, "A 6 digit verification code was sent to the admin email.");
});
export const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+resetOtpHash +resetOtpExpiresAt");
    if (!user) {
        throw new AppError("No account was found for this verification email", 404, "RESET_OTP_EMAIL_NOT_FOUND");
    }
    if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
        throw new AppError("No active reset verification code was found for this account", 400, "RESET_OTP_NOT_REQUESTED");
    }
    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
        user.resetOtpHash = undefined;
        user.resetOtpExpiresAt = undefined;
        await user.save();
        throw new AppError("Reset verification code has expired. Request a new code.", 410, "RESET_OTP_EXPIRED");
    }
    if (user.resetOtpHash !== hashResetOtp(normalizedEmail, otp)) {
        throw new AppError("Invalid reset verification code", 401, "RESET_OTP_INVALID");
    }
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpVerifiedAt = new Date();
    const resetToken = createPasswordResetToken();
    user.passwordResetTokenHash = hashPasswordResetToken(normalizedEmail, resetToken);
    user.passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    return res.json({
        success: true,
        message: "Reset verification code verified successfully.",
        resetToken,
    });
});
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");
    if (!user) {
        throw new AppError("No account was found for this reset email", 404, "PASSWORD_RESET_EMAIL_NOT_FOUND");
    }
    if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
        throw new AppError("No active password reset session was found", 400, "PASSWORD_RESET_TOKEN_NOT_REQUESTED");
    }
    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
        user.passwordResetTokenHash = undefined;
        user.passwordResetTokenExpiresAt = undefined;
        await user.save();
        throw new AppError("Password reset session has expired. Verify a new OTP.", 410, "PASSWORD_RESET_TOKEN_EXPIRED");
    }
    if (user.passwordResetTokenHash !== hashPasswordResetToken(normalizedEmail, resetToken)) {
        throw new AppError("Password reset session token is invalid", 401, "PASSWORD_RESET_TOKEN_INVALID");
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.resetOtpVerifiedAt = undefined;
    await user.save();
    return sendMessage(res, "Password changed successfully. You can now sign in with the new password.");
});
export const contactAdmin = asyncHandler(async (req, res) => {
    const body = req.body;
    const normalizedEmail = body.email.toLowerCase();
    const existingPending = await AccessRequestModel.findOne({ email: normalizedEmail, status: "pending" });
    if (existingPending) {
        throw new AppError("An access request for this email is already pending admin review", 409, "ACCESS_REQUEST_ALREADY_PENDING");
    }
    await AccessRequestModel.create({
        name: body.name,
        email: normalizedEmail,
        message: body.message,
        requestedRole: "admin",
    });
    await sendAdminContactNotice(body);
    return sendMessage(res, "Access request submitted successfully. The administrator has been notified.");
});
