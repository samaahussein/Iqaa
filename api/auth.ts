
import postgres from 'https://esm.sh/postgres';

const DATABASE_URL = process.env.DATABASE_URL;

export default async function handler(req: Request) {
  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL environment variable is missing.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const sql = postgres(DATABASE_URL, { ssl: 'require' });
  const url = new URL(req.url);
  const method = req.method;

  try {
    // 1. Ensure Tables Exist (Auto-Initialization)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        auth_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    if (method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) return new Response(JSON.stringify({ error: 'Username required' }), { status: 400 });
      
      const [user] = await sql`SELECT salt FROM users WHERE username = ${username}`;
      return new Response(JSON.stringify({
        exists: !!user,
        salt: user?.salt || null
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { username, authHash, salt, type } = await req.json();

      if (type === 'register') {
        const [newUser] = await sql`
          INSERT INTO users (username, auth_hash, salt)
          VALUES (${username}, ${authHash}, ${salt})
          RETURNING id
        `;
        return new Response(JSON.stringify({ userId: newUser.id }), { headers: { 'Content-Type': 'application/json' } });
      } else {
        const [user] = await sql`
          SELECT id FROM users WHERE username = ${username} AND auth_hash = ${authHash}
        `;
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
  } finally {
    // Ensure we don't leak connections in some environments
    // await sql.end(); 
  }
}
