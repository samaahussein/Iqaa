
import postgres from 'https://esm.sh/postgres';

const DATABASE_URL = process.env.DATABASE_URL;

export default async function handler(req: Request) {
  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL missing' }), { status: 500 });
  }

  const userId = req.headers.get('X-User-ID');
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const sql = postgres(DATABASE_URL, { ssl: 'require' });
  const method = req.method;
  const url = new URL(req.url);

  try {
    if (method === 'GET') {
      const habits = await sql`SELECT encrypted_payload, iv FROM habits WHERE user_id = ${userId}`;
      return new Response(JSON.stringify(habits), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { id, encrypted_payload, iv } = await req.json();
      await sql`
        INSERT INTO habits (id, user_id, encrypted_payload, iv)
        VALUES (${id}, ${userId}, ${encrypted_payload}, ${iv})
        ON CONFLICT (id) DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, iv = EXCLUDED.iv
      `;
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      await sql`DELETE FROM habits WHERE id = ${id} AND user_id = ${userId}`;
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (err: any) {
    console.error('Habits API Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
