import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(4),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const verifyResetOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    resetToken: z.string().min(32),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  }),
});

export const contactAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    email: z.string().email(),
    message: z.string().trim().max(1000).optional().default(""),
  }),
});

export const accessRequestDecisionSchema = z.object({
  body: z.object({
    action: z.enum(["approve", "reject"]),
    role: z.enum(["admin", "staff"]).optional().default("admin"),
    note: z.string().trim().max(500).optional().default(""),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});
