
import postgres from 'https://esm.sh/postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const method = req.method;

  try {
    if (method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) return new Response('Username required', { status: 400 });
      
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
        if (!user) return new Response('Unauthorized', { status: 401 });
        return new Response(JSON.stringify({ userId: user.id }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
