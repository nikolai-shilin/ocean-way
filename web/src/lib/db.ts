import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Lang } from './site';

/** Live data from Supabase. The app only needs the project URL and the publishable (public) key: the catalogue is
 *  readable by anyone, places left and bookings go through database functions that decide prices and lock dates.
 *  The database is the only source of the catalogue: pages cannot render without it. */
export type CourseDate = { id: string; key: string; course_slug: string; starts_on: string; ends_on: string; area: string; boat: string; meeting_point: string; price_eur: number; places_total: number; places_left: number; yacht_slug?: string | null };
export type Passage = { id: string; key: string; starts_on: string; ends_on: string; from_port: string; to_port: string; leg: string; waters: string; price_eur: number; places_total: number; places_left: number; return_id: string | null };
export type Yacht = { id: string; slug: string; sort: number; name: string | null; model: string; year: number; length_m: number; beam_m: number | null; draft_m: number | null;
  cabins: number; berths: number; extra_berths: number; skipper_cabin: boolean; heads: number | null; engines: number; engine_hp: number | null;
  base: string; marina: string | null; kind: 'monohull' | 'catamaran'; used_for: string; charter_from_eur: number; photo_id: string; photo_alt: string; description: string;
  max_guests: number | null; water_l: number | null; fuel_l: number | null; highlights: string[]; gallery: Shot[]; layout_photo_id: string | null;
  service_pack_eur: number | null; deposit_eur: number | null; discount_pct: number; extras: Extra[]; prices: YachtPrice[]; translations?: Translations };
/** Something you can add at the base: a skipper, a one-way drop, a SUP. Paid there, in cash. */
export type Extra = { name: string; note: string; price_eur: number; unit: 'day' | 'week' | 'booking' | 'trip' };
/** The charter fee for one week in a season (NauSYS list price). */
export type YachtPrice = { starts_on: string; ends_on: string; week_eur: number };
export type Course = { id: string; slug: string; sort: number; name: string; level: string; duration: string; scope: string; price_from_eur: number; price_unit: string; photo_id: string; photo_alt: string; summary: string; description: string; learn: string[]; requirements: string[]; certificate: string; theory: string[]; about: string[]; program: Step[]; bring: string[]; included?: string[]; not_included?: string[]; after?: Step[]; gallery?: Shot[]; skills?: Skill[]; route?: Stop[]; route_nm?: number | null; faq?: Faq[]; map?: RouteMap | null; translations?: Translations };
export type Shot = { photo_id: string; shape: 'l' | 'p'; caption: string };
export type Skill = { icon: string; title: string; items: string[] };
export type Step = { title: string; text: string };
export type Faq = { q: string; a: string };
export type Instructor = { slug: string; sort: number; name: string; role: 'Lead instructor' | 'Instructor' | 'Skipper'; photo_id: string; photo_alt: string; qualification: string; seasons: number | null; languages: string[]; bio: string; courses: string[]; legs: string[]; sample: boolean; translations?: Translations };
/** Text of a row in other languages, same field names as the English columns (see the translations columns). */
export type Translations = Partial<Record<Lang, Record<string, unknown>>>;
/** Route map drawn by prototypes/_build/build_leg_maps.py: desktop and phone SVG, distance in miles. */
export type RouteMap = { d: string; m: string; nm: number };
export type Stop = { name: string; lon: number | null; lat: number | null; note: string };
export type PassageLeg = { leg: string; summary: string; about: string[]; stops: Stop[]; distance_nm: number; program: Step[]; requirements: string[]; bring: string[]; gallery?: Shot[]; faq?: Faq[]; map?: RouteMap | null; translations?: Translations };

const EN = Symbol('en');
/** The English version of a localized row (the row itself in English). */
export const english = <T extends object>(row: T): T => (row as T & { [EN]?: T })[EN] ?? row;

/** A row's text in the page language. translations[lang] replaces strings and lists of strings, and merges lists of
 *  objects (program, faq, gallery, stops…) item by item, so photo ids, icons and coordinates stay from the English row.
 *  Anything missing stays English. The English row is kept for english(): code that picks icons by text needs it. */
export function localize<T extends { translations?: Translations }>(row: T, lang: Lang): T {
  const tr = lang === 'en' ? undefined : row.translations?.[lang];
  if (!tr) return row;
  const out: Record<string, unknown> = { ...row, [EN]: row };
  for (const [k, v] of Object.entries(tr)) {
    const base = out[k];
    out[k] = Array.isArray(v) && Array.isArray(base) && base.some((x) => x && typeof x === 'object')
      ? base.map((x, i) => ({ ...(x as object), ...((v[i] as object) ?? {}) }))
      : v;
  }
  return out as T;
}

/** Cache tag of a database read: the table in the address (/rest/v1/courses → "courses"), or the table a live
 *  function reads (rpc/passages_live → "passages"). /api/revalidate clears tags when the database changes. */
const RPC_TAG: Record<string, string> = { course_dates_live: 'course_dates', passages_live: 'passages' };
export function tagFor(url: string): string | null {
  const m = /\/rest\/v1\/(?:rpc\/)?([a-z_]+)/.exec(url);
  return m ? RPC_TAG[m[1]] ?? m[1] : null;
}
/** Which cache tags a change to a table clears. Article lists embed their translations; bookings change places left. */
export const TAGS_FOR: Record<string, string[]> = {
  courses: ['courses'], course_dates: ['course_dates'], passage_legs: ['passage_legs'], passages: ['passages'],
  yachts: ['yachts'], yacht_prices: ['yachts'], instructors: ['instructors'], theory_topics: ['theory_topics'],
  articles: ['articles', 'article_translations'], article_translations: ['articles', 'article_translations'],
  bookings: ['course_dates', 'passages'],
};
const tagged: typeof fetch = (input, init) => {
  const tag = tagFor(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  return fetch(input, tag ? { ...init, next: { ...init?.next, tags: ['db', tag] } } : init);
};

let client: SupabaseClient | null | undefined;
export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false }, global: { fetch: tagged } }) : null;
  return client;
}
/** The client for catalogue reads; a clear error instead of an empty site when the variables are missing. */
export function live(): SupabaseClient {
  const c = db();
  if (!c) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (web/.env.local, or `vercel env pull`): the catalogue lives in the database.');
  return c;
}

export async function getCourseDates(slug: string): Promise<CourseDate[]> {
  const { data, error } = await live().rpc('course_dates_live', { p_slug: slug });
  if (error) throw error;
  return data as CourseDate[];
}

export async function getPassages(): Promise<Passage[]> {
  const { data, error } = await live().rpc('passages_live');
  if (error) throw error;
  return data as Passage[];
}

export async function getYachts(lang: Lang = 'en'): Promise<Yacht[]> {
  // Prices come in the same read (one request, tagged "yachts"); the public key only sees published boats.
  const { data, error } = await live().from('yachts').select('*, prices:yacht_prices(starts_on, ends_on, week_eur)').order('sort');
  if (error) throw error;
  return (data as Yacht[]).map((y) => localize({ ...y, prices: [...(y.prices ?? [])].sort((a, b) => a.starts_on.localeCompare(b.starts_on)) }, lang));
}

// Every course column except map (large; fetched per page with getRouteMap).
const COURSE_COLUMNS = 'id, slug, sort, name, level, duration, scope, price_from_eur, price_unit, photo_id, photo_alt, summary, description, learn, requirements, certificate, theory, about, program, bring, included, not_included, after, gallery, skills, route, route_nm, faq, translations';

export async function getCourses(lang: Lang = 'en'): Promise<Course[]> {
  const { data, error } = await live().from('courses').select(COURSE_COLUMNS).order('sort');
  if (error) throw error;
  return (data as Course[]).map((x) => localize(x, lang));
}

export async function getLegs(lang: Lang = 'en'): Promise<Record<string, PassageLeg>> {
  const { data, error } = await live().from('passage_legs').select('leg, summary, about, stops, distance_nm, program, requirements, bring, gallery, faq, translations');
  if (error) throw error;
  return Object.fromEntries((data as PassageLeg[]).map((r) => [r.leg, localize(r, lang)]));
}

/** The route map of one course or passage route, or null when it has none. */
export async function getRouteMap(table: 'courses' | 'passage_legs', key: string): Promise<RouteMap | null> {
  const { data, error } = await live().from(table).select('map').eq(table === 'courses' ? 'slug' : 'leg', key).maybeSingle();
  if (error) throw error;
  return (data?.map as RouteMap | null) ?? null;
}

/** Instructors (courses) and skippers (passages), in display order. */
export async function getInstructors(lang: Lang = 'en'): Promise<Instructor[]> {
  const { data, error } = await live().from('instructors').select('slug, sort, name, role, photo_id, photo_alt, qualification, seasons, languages, bio, courses, legs, sample, translations').order('sort');
  if (error) throw error;
  return (data as Instructor[]).map((x) => localize(x, lang));
}

/** Stops in the order this passage sails them (legs are stored from the first port in the key to the second). */
export function stopsFor(leg: PassageLeg, p: { from_port: string }): Stop[] {
  return leg.stops[0]?.name === p.from_port ? leg.stops : [...leg.stops].reverse();
}

/** URL slug of a passage: "kusadasi-istanbul-2027-06-12". */
const translit = (s: string) => s.toLowerCase().replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const passageSlug = (p: { from_port: string; to_port: string; starts_on: string }) => `${translit(p.from_port)}-${translit(p.to_port)}-${p.starts_on}`;
