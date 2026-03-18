import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma, verifyPasswordSecure } from "./storage/core";

const AUTH_COOKIE = "str_admin_session";
const SECRET = process.env.AUTH_SECRET || "str-default-secret";

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  displayName: string;
  mustChangePassword: boolean;
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

/**
 * Verify username + password against the User table.
 * Falls back to legacy Settings.adminPassword for migration.
 */
export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<SessionPayload | null> {
  // Try User table first
  const user = await prisma.user.findUnique({ where: { username } });

  if (user && user.isActive) {
    const valid = verifyPasswordSecure(password, user.passwordHash);
    if (valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return {
        userId: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        mustChangePassword: user.mustChangePassword,
      };
    }
    return null;
  }

  // Legacy fallback: if no users exist, check Settings.adminPassword
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const storedHash = settings?.adminPassword;

    let legacyValid = false;
    if (storedHash) {
      legacyValid = verifyPasswordSecure(password, storedHash);
    } else {
      const envPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();
      legacyValid = password.trim() === envPassword;
    }

    if (legacyValid && (username === "admin" || username === "")) {
      // Auto-create the first admin user from legacy password
      const { hashPasswordSecure } = await import("./storage/core");
      const newUser = await prisma.user.create({
        data: {
          username: "admin",
          displayName: "Administrador",
          passwordHash: hashPasswordSecure(password),
          role: "admin",
          mustChangePassword: true,
          lastLoginAt: new Date(),
        },
      });
      return {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        displayName: newUser.displayName,
        mustChangePassword: true,
      };
    }
  }

  return null;
}

/**
 * Create a session token encoding user info.
 * Format: base64(payload)-timestamp-random.hmac
 */
export function createSessionToken(payload: SessionPayload): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString("hex");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const raw = `${payloadB64}.${timestamp}-${random}`;
  return `${raw}.${hmac(raw)}`;
}

/**
 * Validate and decode a session token.
 */
export function validateSessionToken(token: string): SessionPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [payloadB64, timestampRandom, hash] = parts;
  const raw = `${payloadB64}.${timestampRandom}`;

  if (hmac(raw) !== hash) return null;

  // Check expiration (24 hours)
  const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  try {
    const timestamp = parseInt(timestampRandom.split("-")[0], 10);
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE_MS)
      return null;
  } catch {
    return null;
  }

  // Decode payload
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromCookies(): SessionPayload | null {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(AUTH_COOKIE);
    if (!session?.value) return null;
    return validateSessionToken(session.value);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSessionFromCookies() !== null;
}

export function getCurrentUser(): SessionPayload | null {
  return getSessionFromCookies();
}

// Role-based permission check
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"], // everything
  tecnico: [
    "orders.read", "orders.create", "orders.update", "orders.status",
    "orders.diagnosis", "parts.read", "services.read",
    "appointments.read", "appointments.create", "appointments.update",
    "knowledge.read", "knowledge.create",
    "customers.read",
  ],
  recepcion: [
    "orders.read", "orders.create", "orders.update",
    "payments.create", "payments.read",
    "parts.read", "services.read",
    "appointments.read", "appointments.create", "appointments.update",
    "customers.read",
    "reports.read",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export { AUTH_COOKIE };
