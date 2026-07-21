import { Router } from "express";
import { deleteManagedUser, listManagedUsers } from "../controllers/adminUserController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { userIdParamSchema } from "../schemas/authSchemas.js";

export const adminUserRoutes = Router();

adminUserRoutes.use(requireAuth, requireAdmin);
adminUserRoutes.get("/", listManagedUsers);
adminUserRoutes.delete("/:id", validate(userIdParamSchema), deleteManagedUser);
