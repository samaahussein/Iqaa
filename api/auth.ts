
import { neon } from 'https://esm.sh/@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL environment variable is missing.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const sql = neon(DATABASE_URL);
  const url = new URL(req.url);
  const method = req.method;

  try {
    // 1. Ensure Tables Exist (Auto-Initialization)
    // We run these as separate commands because the HTTP driver prefers single statements
    await sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        auth_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await sql(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await sql(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) return new Response(JSON.stringify({ error: 'Username required' }), { status: 400 });
      
      const users = await sql('SELECT salt FROM users WHERE username = $1', [username]);
      const user = users[0];
      
      return new Response(JSON.stringify({
        exists: !!user,
        salt: user?.salt || null
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { username, authHash, salt, type } = await req.json();

      if (type === 'register') {
        const result = await sql(
          'INSERT INTO users (username, auth_hash, salt) VALUES ($1, $2, $3) RETURNING id',
          [username, authHash, salt]
        );
        return new Response(JSON.stringify({ userId: result[0].id }), { headers: { 'Content-Type': 'application/json' } });
      } else {
        const users = await sql(
          'SELECT id FROM users WHERE username = $1 AND auth_hash = $2',
          [username, authHash]
        );
        const user = users[0];
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        return new Response(JSON.stringify({ userId: user.id }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    return new Response('Method not allowed', { status: 405 });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: err.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
