
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Read .env
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
    console.error(err);
    process.exit(1);
}

if (!dbUrl) process.exit(1);

const sql = neon(dbUrl);

async function reset() {
    try {
        console.log("Resetting password for 'admin'...");
        await sql`
            UPDATE users 
            SET password = 'password123' 
            WHERE email = 'admin'
        `;
        console.log("Password updated successfully to 'password123'");
        process.exit(0);
    } catch (error) {
        console.error("Update failed:", error);
        process.exit(1);
    }
}

reset();
