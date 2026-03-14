import AdmZip from "adm-zip";
import { getOrders, getSettings, getParts, getServices, getCategories } from "./storage";

export async function createBackupZip(): Promise<Buffer> {
    const zip = new AdmZip();

    try {
        const [orders, settings, parts, services, categories] = await Promise.all([
            getOrders(),
            getSettings(),
            getParts(),
            getServices(),
            getCategories()
        ]);

        zip.addFile("orders.json", Buffer.from(JSON.stringify(orders, null, 2)));
        zip.addFile("settings.json", Buffer.from(JSON.stringify(settings, null, 2)));
        zip.addFile("parts.json", Buffer.from(JSON.stringify(parts, null, 2)));
        zip.addFile("services.json", Buffer.from(JSON.stringify(services, null, 2)));
        zip.addFile("categories.json", Buffer.from(JSON.stringify(categories, null, 2)));

        // Metadata
        const metadata = {
            date: new Date().toISOString(),
            version: "2.0",
            type: "full_backup"
        };
        zip.addFile("metadata.json", Buffer.from(JSON.stringify(metadata, null, 2)));

    } catch (e) {
        console.error("Error creating backup zip:", e);
        throw e;
    }

    return zip.toBuffer();
}
