
import { neon } from 'https://esm.sh/@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return new Response(JSON.stringify({ error: 'DATABASE_URL missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const userId = req.headers.get('X-User-ID');
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const sql = neon(DATABASE_URL);
  const method = req.method;
  const url = new URL(req.url);

  try {
    if (method === 'GET') {
      const cases = await sql(
        'SELECT encrypted_payload, iv FROM cases WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
      );
      return new Response(JSON.stringify(cases), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const { id, encrypted_payload, iv, timestamp } = await req.json();
      await sql(`
        INSERT INTO cases (id, user_id, encrypted_payload, iv, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, iv = EXCLUDED.iv
      `, [id, userId, encrypted_payload, iv, timestamp]);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      await sql('DELETE FROM cases WHERE id = $1 AND user_id = $2', [id, userId]);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('API_CASES_CRASH:', err);
    return new Response(JSON.stringify({ error: 'DB Error', details: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
