import { prisma, hashPasswordSecure, verifyPasswordSecure } from "./core";

export async function getStoredPasswordHash(): Promise<string | null> {
    try {
        const settings = await prisma.settings.findUnique({ where: { id: 1 } });
        return settings?.adminPassword || null;
    } catch {
        return null;
    }
}

export async function savePassword(newPassword: string): Promise<void> {
    const hash = hashPasswordSecure(newPassword);
    const now = new Date();

    await prisma.settings.upsert({
        where: { id: 1 },
        update: { adminPassword: hash, passwordUpdatedAt: now },
        create: { id: 1, adminPassword: hash, passwordUpdatedAt: now }
    });
}

export async function verifyStoredPassword(password: string): Promise<boolean> {
    const storedHash = await getStoredPasswordHash();
    if (!storedHash) {
        const envPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();
        if (password.trim() === envPassword) {
            // Auto-migrate: save with secure hash on first successful login
            try {
                await savePassword(password.trim());
            } catch (e) {
                console.error("Failed to auto-save password hash (DB may not be ready):", e);
            }
            return true;
        }
        return false;
    }

    const isValid = verifyPasswordSecure(password, storedHash);

    // Auto-upgrade legacy SHA-256 hash to PBKDF2 on successful login
    if (isValid && !storedHash.includes(":")) {
        try {
            await savePassword(password);
        } catch (e) {
            console.error("Failed to auto-upgrade password hash:", e);
        }
    }

    return isValid;
}
