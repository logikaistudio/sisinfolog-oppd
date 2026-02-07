
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env manually to get VITE_DATABASE_URL
// Note: This relies on the file being present and formatted simply.
const envPath = path.resolve(__dirname, '../.env');
console.log(`Reading .env from ${envPath}`);

let dbUrl = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_DATABASE_URL=(.*)/);
    if (match && match[1]) {
        dbUrl = match[1].trim();
        // Remove quotes if present
        if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
            dbUrl = dbUrl.slice(1, -1);
        }
    }
} catch (err) {
    console.error("Error reading .env file:", err);
    process.exit(1);
}

if (!dbUrl) {
    console.error("VITE_DATABASE_URL not found in .env");
    process.exit(1);
}

// Ensure SSL mode is enabled if required by Neon (usually is)
// dbUrl usually contains sslmode=require
console.log("Connecting to database...");

const sql = neon(dbUrl);

async function setup() {
    try {
        console.log("Creating/Verifying tables...");

        // 1. data_aset
        // Only creates if not exists. If exists, assumes schema is compatible.
        // We match columns used in SatgasDetail.tsx
        await sql`
            CREATE TABLE IF NOT EXISTS data_aset (
                id SERIAL PRIMARY KEY,
                kode_aset VARCHAR(100),
                no_un VARCHAR(100),
                kategori VARCHAR(100),
                sub_kategori VARCHAR(100),
                jenis VARCHAR(100),
                merk VARCHAR(100),
                no_rangka VARCHAR(100),
                no_mesin VARCHAR(100),
                satgas VARCHAR(100),
                lokasi VARCHAR(255),
                kondisi VARCHAR(50),
                pembuatan VARCHAR(20),
                operasi VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'data_aset' verified.");

        // 2. maintenance_requests (Pengajuan Perbaikan)
        // New table for repair requests
        await sql`
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id SERIAL PRIMARY KEY,
                asset_id INT NOT NULL REFERENCES data_aset(id) ON DELETE CASCADE,
                jenis_pengajuan VARCHAR(50),
                jenis_kerusakan VARCHAR(50),
                deskripsi TEXT,
                tanggal DATE,
                pelapor_nama VARCHAR(100),
                pelapor_nrp VARCHAR(50),
                menyetujui_nama VARCHAR(100),
                menyetujui_nrp VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pengajuan',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'maintenance_requests' verified.");

        // 3. users (Authentication & Role Management)
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                role VARCHAR(50) DEFAULT 'User',
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'users' verified.");

        // 4. role_permissions (Granular Access Control)
        await sql`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id SERIAL PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL,
                menu_name VARCHAR(50) NOT NULL,
                can_view BOOLEAN DEFAULT FALSE,
                can_edit BOOLEAN DEFAULT FALSE,
                can_delete BOOLEAN DEFAULT FALSE,
                can_import BOOLEAN DEFAULT FALSE,
                can_export BOOLEAN DEFAULT FALSE,
                can_print BOOLEAN DEFAULT FALSE,
                UNIQUE(role_name, menu_name)
            );
        `;
        console.log("Table 'role_permissions' verified.");

        // Initial Seed for Admin if empty
        const permCount = await sql`SELECT count(*) FROM role_permissions WHERE role_name = 'Admin'`;
        if (parseInt(permCount[0].count) === 0) {
            console.log("Seeding Admin permissions...");
            const menus = ['Dashboard', 'Satgas', 'Pustaka', 'Master Data', 'Setting', 'Pengajuan'];
            for (const menu of menus) {
                await sql`
                    INSERT INTO role_permissions (role_name, menu_name, can_view, can_edit, can_delete, can_import, can_export, can_print)
                    VALUES ('Admin', ${menu}, true, true, true, true, true, true)
                    ON CONFLICT DO NOTHING
                `;
            }
        }

        // Check if data_aset has data
        const countResult = await sql`SELECT count(*) FROM data_aset`;
        const count = parseInt(countResult[0].count);
        console.log(`Current data_aset count: ${count}`);

        if (count === 0) {
            console.log("Table is empty. Skipping seed for now (use Import feature in app).");
        }

        console.log("Database setup complete!");
        process.exit(0);
    } catch (error) {
        console.error("Database setup failed:", error);
        process.exit(1);
    }
}

setup();
