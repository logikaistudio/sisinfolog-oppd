import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.VITE_DATABASE_URL);

// Fungsi untuk mengeksekusi query SQL dengan aman
export async function query(queryString: string, params: any[] = []) {
    try {
        // Neon driver update requires tagged template literal syntax
        // We recreate calls like sql`SELECT * ...` manually

        // @ts-ignore - The database driver acts as both a function and a tagged template
        // If params are empty, we can just pass the string array with one element
        if (params.length === 0) {
            return await sql([queryString] as any);
        }

        // For parameterized queries, we need to pass the string parts and values
        // However, recreating tagged template logic dynamically is tricky with this specific library restriction
        // Let's try to use the simplified calling convention if supported, or fall back to constructing the template object

        // Per error message: "For a conventional function call... use sql.query(...)"
        // Let's try accessing the .query property if it exists on the function object
        if (typeof (sql as any).query === 'function') {
            return await (sql as any).query(queryString, params);
        }

        // Fallback: If .query doesn't exist, we might be on a version that STRICTLY enforces tagged templates.
        // In that case, we can't easily wrap it in a generic 'query(str, params)' function without 
        // simulating the TemplateStringsArray.

        // Simulation of Tagged Template: sql(strings, ...values)
        // Note: This relies on implementation details of how the driver checks for template strings
        // Usually it checks Array.isArray(arg0) && arg0.raw

        // For now, let's trust the error message suggesting sql.query exists or trying the cast
        return await (sql as any)(queryString, params);
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
}

export default sql;
