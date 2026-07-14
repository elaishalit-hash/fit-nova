"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type FormState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 100;

export async function signupAction(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 })) {
    return { error: "Too many signup attempts. Please try again in a few minutes." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (name.length > NAME_MAX) {
    return { error: `Name must be ${NAME_MAX} characters or fewer.` };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (role !== "SONGWRITER" && role !== "ARTIST") {
    return { error: "Choose whether you're a songwriter or an artist." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      ...(role === "SONGWRITER"
        ? { songwriterProfile: { create: { displayName: name } } }
        : { artistProfile: { create: { displayName: name } } }),
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/terms/accept",
  });

  return {};
}

export async function loginAction(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const ip = await getClientIp();
  const ipOk = checkRateLimit(`login-ip:${ip}`, { windowMs: 15 * 60 * 1000, max: 20 });
  const emailOk = checkRateLimit(`login-email:${email}`, {
    windowMs: 15 * 60 * 1000,
    max: 6,
  });
  if (!ipOk || !emailOk) {
    return { error: "Too many login attempts. Please try again in a few minutes." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  return {};
}
