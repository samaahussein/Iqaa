
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
      const cases = await sql`SELECT encrypted_payload, iv FROM cases WHERE user_id = ${userId} ORDER BY timestamp DESC`;
      return new Response(JSON.stringify(cases), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { id, encrypted_payload, iv, timestamp } = await req.json();
      await sql`
        INSERT INTO cases (id, user_id, encrypted_payload, iv, timestamp)
        VALUES (${id}, ${userId}, ${encrypted_payload}, ${iv}, ${timestamp})
        ON CONFLICT (id) DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, iv = EXCLUDED.iv
      `;
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      await sql`DELETE FROM cases WHERE id = ${id} AND user_id = ${userId}`;
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response('Method not allowed', { status: 405 });
  } catch (err: any) {
    console.error('Cases API Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
