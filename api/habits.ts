
import postgres from 'https://esm.sh/postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function handler(req: Request) {
  const userId = req.headers.get('X-User-ID');
  if (!userId) return new Response('Unauthorized', { status: 401 });

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
      return new Response(JSON.stringify({ success: true }));
    }

    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      await sql`DELETE FROM habits WHERE id = ${id} AND user_id = ${userId}`;
      return new Response(JSON.stringify({ success: true }));
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
