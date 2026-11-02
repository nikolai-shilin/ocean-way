import { revalidateTag } from 'next/cache';
import { db, TAGS_FOR } from '@/lib/db';

/** Create a booking. The database function create_booking() checks the input again, prices the booking from the
 *  catalogue and locks the date; this route only does early checks and turns errors into readable messages. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  item: 'course' | 'passage'; option: string; returnOption?: string | null; cabin: string; people: number;
  plan: string; method: string; firstName: string; lastName: string; email: string; phone: string;
  telegram?: string; country?: string; experience?: string; newsletter?: boolean; lang?: string;
};

const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  let b: Body;
  try { b = await req.json(); } catch { return bad('Invalid request'); }
  if (!['course', 'passage'].includes(b.item) || !b.option) return bad('Choose a date first');
  if (!b.firstName?.trim() || !b.lastName?.trim() || !EMAIL.test(b.email || '') || (b.phone || '').replace(/\D/g, '').length < 7) return bad('Please check your details');

  const c = db();
  if (!c) return bad('Bookings are not open yet: the database is not connected.', 503);

  const { data, error } = await c.rpc('create_booking', {
    p_item_type: b.item, p_option_id: b.option, p_return_id: b.item === 'passage' ? b.returnOption ?? null : null,
    p_cabin: b.cabin, p_people: Number(b.people), p_plan: b.plan, p_method: b.method,
    p_first_name: b.firstName, p_last_name: b.lastName, p_email: b.email, p_phone: b.phone,
    p_telegram: b.telegram ?? null, p_country: b.country ?? null, p_experience: b.experience ?? null,
    p_newsletter: !!b.newsletter, p_lang: b.lang ?? 'en',
  });
  if (error) {
    if (error.message.startsWith('full:')) return bad('Sorry, those places were just taken. Please choose another date.', 409);
    if (error.message.startsWith('invalid:')) return bad('Please check your booking: ' + error.message.slice(9), 400);
    console.error('create_booking failed', error);
    return bad('Booking failed, please try again or write to us in Telegram', 500);
  }
  const row = Array.isArray(data) ? data[0] : data;
  // Places left changed: dates and passages render fresh on their next visit.
  for (const tag of TAGS_FOR.bookings) revalidateTag(tag, { expire: 0 });
  return Response.json({ ref: row.ref, amountTotal: row.amount_total, amountNow: row.amount_now });
}
