import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { TAGS_FOR } from '@/lib/db';

/** Called by the database (private.revalidate_site(), a trigger on every content table) after a change, so edits
 *  show on the site within seconds instead of at the next timer. Body: {"table": "courses"}; header:
 *  Authorization: Bearer <REVALIDATE_SECRET>. Pages that read the table render fresh on their next visit. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: 'REVALIDATE_SECRET is not set' }, { status: 503 });
  const given = Buffer.from(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
  const want = Buffer.from(secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let table: unknown;
  try { ({ table } = await req.json()); } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }
  const tags = typeof table === 'string' ? TAGS_FOR[table] : undefined;
  if (!tags) return Response.json({ error: `Unknown table: ${String(table)}` }, { status: 400 });
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
