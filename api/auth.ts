
import { neon } from 'https://esm.sh/@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

async function initDatabase(sql: any) {
  try {
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        auth_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await sql(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await sql(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error("DB_INIT_FAILED:", e);
    throw e;
  }
}

export default async function handler(req: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: 'DB_URL_MISSING' }), { status: 500 });
  }

  const sql = neon(DATABASE_URL);
  const url = new URL(req.url);
  const method = req.method;

  try {
    // Try to init, but don't let it hang forever
    await Promise.race([
      initDatabase(sql),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000))
    ]);

    if (method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) return new Response(JSON.stringify({ error: 'Username missing' }), { status: 400 });
      const users = await sql('SELECT salt FROM users WHERE username = $1', [username]);
      return new Response(JSON.stringify({ exists: !!users[0], salt: users[0]?.salt || null }));
    }

    if (method === 'POST') {
      const { username, authHash, salt, type, userId: providedId } = await req.json();
      if (type === 'register') {
        const id = providedId || crypto.randomUUID();
        await sql('INSERT INTO users (id, username, auth_hash, salt) VALUES ($1, $2, $3, $4)', [id, username, authHash, salt]);
        return new Response(JSON.stringify({ userId: id }));
      } else {
        const users = await sql('SELECT id FROM users WHERE username = $1 AND auth_hash = $2', [username, authHash]);
        if (!users[0]) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        return new Response(JSON.stringify({ userId: users[0].id }));
      }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('API_CRASH:', err.message);
    return new Response(JSON.stringify({ error: 'DATABASE_ERROR', message: err.message }), { status: 500 });
  }
}
