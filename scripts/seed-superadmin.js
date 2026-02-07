
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

let dbUrl = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_DATABASE_URL=(.*)/);
    if (match && match[1]) {
        dbUrl = match[1].trim();
        if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
            dbUrl = dbUrl.slice(1, -1);
        }
    }
} catch (err) {
    console.error("Error reading .env:", err);
    process.exit(1);
}

if (!dbUrl) {
    console.error("VITE_DATABASE_URL not found");
    process.exit(1);
}

const sql = neon(dbUrl);

async function seed() {
    try {
        console.log("Seeding Superadmin user...");

        // Insert Superadmin if not exists
        // Email: 'admin'
        // Password: 'admin'
        await sql`
            INSERT INTO users (name, email, password, role)
            VALUES ('Superadmin', 'admin', 'admin', 'Superadmin')
            ON CONFLICT (email) DO NOTHING
        `;
        console.log("Superadmin user check complete. Login: admin / admin");

        // Grant Full Permissions
        const menus = ['Dashboard', 'Satgas', 'Pengajuan', 'Pustaka', 'Master Data', 'Setting'];
        console.log("Granting full permissions...");

        for (const menu of menus) {
            await sql`
                INSERT INTO role_permissions (role_name, menu_name, can_view, can_edit, can_delete, can_import, can_export, can_print)
                VALUES ('Superadmin', ${menu}, true, true, true, true, true, true)
                ON CONFLICT (role_name, menu_name) DO UPDATE 
                SET can_view=true, can_edit=true, can_delete=true, can_import=true, can_export=true, can_print=true
            `;
        }
        console.log("Permissions granted.");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
}

seed();
