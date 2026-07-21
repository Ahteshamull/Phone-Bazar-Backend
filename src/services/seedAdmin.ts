import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";

export async function seedDefaultAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 12);
  const existing = await UserModel.findOne({ email: env.DEFAULT_ADMIN_EMAIL });
  if (existing) {
    let changed = false;
    if (!existing.passwordHash) {
      existing.passwordHash = passwordHash;
      existing.name = existing.name || env.DEFAULT_ADMIN_NAME;
      existing.role = existing.role || "admin";
      changed = true;
      console.log(`Default admin password repaired: ${env.DEFAULT_ADMIN_EMAIL}`);
    }
    if (existing.accessStatus !== "active") {
      existing.accessStatus = "active";
      changed = true;
    }
    if (changed) {
      await existing.save();
    }
    return;
  }

  await UserModel.create({
    email: env.DEFAULT_ADMIN_EMAIL,
    name: env.DEFAULT_ADMIN_NAME,
    passwordHash,
    role: "admin",
    accessStatus: "active",
  });
  console.log(`Default admin created: ${env.DEFAULT_ADMIN_EMAIL}`);
}
