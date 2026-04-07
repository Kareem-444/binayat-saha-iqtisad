import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://neondb_owner:npg_8leKfw5IRAkr@ep-plain-morning-anzmgl80-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying schema to Neon DB statement by statement...');
    
    // Split by semicolons, but loosely (handling basic SQL)
    const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await pool.query(statements[i]);
      } catch (err) {
        // 42P07 = duplicate_table or duplicate_index
        // 42710 = duplicate_object
        if (err.code === '42P07' || err.code === '42710') {
          // ignore already exists
        } else {
          console.warn(`Error on statement ${i}:\n${statements[i]}\n-> ${err.message}`);
        }
      }
    }
    console.log('Schema applied successfully.');
    
    // Check tables again to verify
    const r = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
    console.log('Existing tables in Neon DB after update:');
    r.rows.forEach(row => console.log('  -', row.tablename));

  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await pool.end();
  }
}

main();
