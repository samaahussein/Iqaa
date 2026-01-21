
import { neon } from 'https://esm.sh/@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL is missing in environment variables.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const sql = neon(DATABASE_URL);
  const url = new URL(req.url);
  const method = req.method;

  try {
    // 1. Optimized Table Setup (Single Call)
    await sql(`
      DO $$ 
      BEGIN
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          auth_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS cases (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          encrypted_payload TEXT NOT NULL,
          iv TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          encrypted_payload TEXT NOT NULL,
          iv TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      END $$;
    `);

    if (method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) return new Response(JSON.stringify({ error: 'Username required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      
      const users = await sql('SELECT salt FROM users WHERE username = $1', [username]);
      const user = users[0];
      
      return new Response(JSON.stringify({
        exists: !!user,
        salt: user?.salt || null
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { username, authHash, salt, type, userId: providedId } = await req.json();

      if (type === 'register') {
        const id = providedId || crypto.randomUUID();
        const result = await sql(
          'INSERT INTO users (id, username, auth_hash, salt) VALUES ($1, $2, $3, $4) RETURNING id',
          [id, username, authHash, salt]
        );
        return new Response(JSON.stringify({ userId: result[0].id }), { headers: { 'Content-Type': 'application/json' } });
      } else {
        const users = await sql(
          'SELECT id FROM users WHERE username = $1 AND auth_hash = $2',
          [username, authHash]
        );
        const user = users[0];
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ userId: user.id }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('API_AUTH_CRASH:', err);
    return new Response(JSON.stringify({ 
      error: 'Database Connection Error', 
      message: err.message,
      code: err.code 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
