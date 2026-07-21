import { isValidObjectId } from "mongoose";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";
function serializeUser(user) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        accessStatus: user.accessStatus ?? "active",
        createdAt: user.createdAt ? user.createdAt.toISOString() : "",
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : "",
    };
}
export const listManagedUsers = asyncHandler(async (_req, res) => {
    const users = await UserModel.find()
        .sort({ role: 1, createdAt: -1 })
        .select("name email role accessStatus createdAt updatedAt")
        .lean();
    return sendSuccess(res, "Managed users loaded successfully.", users.map(serializeUser));
});
export const deleteManagedUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
        throw new AppError("User id is invalid", 400, "USER_ID_INVALID");
    }
    if (!req.user?.userId) {
        throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
    }
    if (id === req.user.userId) {
        throw new AppError("You cannot delete your own admin account", 409, "SELF_DELETE_BLOCKED");
    }
    const user = await UserModel.findById(id).select("role email name");
    if (!user) {
        throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
    }
    if (user.role !== "staff") {
        throw new AppError("Only staff accounts can be deleted from User Management", 403, "STAFF_DELETE_ONLY");
    }
    await UserModel.deleteOne({ _id: id });
    return sendMessage(res, `Staff account ${user.email} deleted successfully. This account can no longer log in.`);
});
