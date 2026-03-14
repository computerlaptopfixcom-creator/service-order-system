import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// Singleton Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["error"], // only log errors in production
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Password Hashing ───
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN = 64;
const SALT_LEN = 16;

export function hashPasswordSecure(password: string): string {
    const salt = crypto.randomBytes(SALT_LEN).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPasswordSecure(password: string, stored: string): boolean {
    try {
        if (stored.includes(":")) {
            const [salt, hash] = stored.split(":");
            const attempt = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, "sha512").toString("hex");
            return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(hash, "hex"));
        }
        const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
        return legacyHash === stored;
    } catch (e) {
        console.error("Password verification error:", e);
        return false;
    }
}
