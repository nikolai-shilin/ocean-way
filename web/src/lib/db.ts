import fs from 'node:fs';
import nodePath from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Live data from Supabase. The app only needs the project URL and the publishable (public) key: the catalogue is
 *  readable by anyone, places left and bookings go through database functions that decide prices and lock dates.
 *  Without those variables (local dev before the database exists) it falls back to content/seed.json. */
export type CourseDate = { id: string; key: string; course_slug: string; starts_on: string; ends_on: string; area: string; boat: string; meeting_point: string; price_eur: number; places_total: number; places_left: number };
export type Passage = { id: string; key: string; starts_on: string; ends_on: string; from_port: string; to_port: string; leg: string; waters: string; price_eur: number; places_total: number; places_left: number; return_id: string | null };
export type Yacht = { id: string; slug: string; sort: number; model: string; year: number; length_m: number; beam_m: number | null; draft_m: number | null; cabins: number; berths: number; heads: number | null; engine_hp: number | null; base: string; used_for: string; charter_from_eur: number; photo_id: string; photo_alt: string; description: string };
export type Course = { id: string; slug: string; sort: number; name: string; level: string; duration: string; scope: string; price_from_eur: number; price_unit: string; photo_id: string; photo_alt: string; summary: string; description: string; learn: string[]; requirements: string[]; certificate: string; theory: string[]; about: string[]; program: Step[]; bring: string[] };
export type Step = { title: string; text: string };
export type Stop = { name: string; lon: number | null; lat: number | null; note: string };
export type PassageLeg = { leg: string; summary: string; about: string[]; stops: Stop[]; distance_nm: number; program: Step[]; requirements: string[]; bring: string[] };

let client: SupabaseClient | null | undefined;
export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

type Seed = { course_dates: (Omit<CourseDate, 'id' | 'places_left'> & { places_taken: number })[]; passages: (Omit<Passage, 'id' | 'places_left' | 'return_id'> & { return_key: string | null })[]; yachts: Omit<Yacht, 'id'>[] };
const seed = (): Seed => JSON.parse(fs.readFileSync(nodePath.join(process.cwd(), 'content', 'seed.json'), 'utf8'));

export async function getCourseDates(slug: string): Promise<CourseDate[]> {
  const c = db();
  if (!c) return seed().course_dates.filter((d) => d.course_slug === slug).map((d) => ({ ...d, id: `seed-${d.key}`, places_left: d.places_total - d.places_taken }));
  const { data, error } = await c.rpc('course_dates_live', { p_slug: slug });
  if (error) throw error;
  return data as CourseDate[];
}

export async function getPassages(): Promise<Passage[]> {
  const c = db();
  if (!c) {
    const s = seed().passages;
    return s.map((p) => ({ ...p, id: `seed-${p.key}`, places_left: p.places_total, return_id: p.return_key ? `seed-${p.return_key}` : null }));
  }
  const { data, error } = await c.rpc('passages_live');
  if (error) throw error;
  return data as Passage[];
}

type Catalog = { courses: Omit<Course, 'id'>[]; legs: Record<string, string>; passage_legs: PassageLeg[]; boats: Record<string, Omit<Yacht, 'id' | 'slug' | 'sort' | 'year' | 'length_m' | 'cabins' | 'berths' | 'base' | 'used_for' | 'charter_from_eur' | 'photo_id' | 'photo_alt'> & { model: string }> };
export const catalog = (): Catalog => JSON.parse(fs.readFileSync(nodePath.join(process.cwd(), 'content', 'catalog.json'), 'utf8'));

export async function getYachts(): Promise<Yacht[]> {
  const c = db();
  if (!c) {
    const boats = catalog().boats;
    return seed().yachts.map((y, i) => {
      const slug = Object.keys(boats).find((k) => boats[k].model === y.model) ?? `boat-${i}`;
      const b = boats[slug];
      return { ...y, ...b, id: `seed-${i}`, slug } as Yacht;
    });
  }
  const { data, error } = await c.from('yachts').select('*').order('sort');
  if (error) throw error;
  return data as Yacht[];
}

export async function getCourses(): Promise<Course[]> {
  const c = db();
  if (!c) return catalog().courses.map((x, i) => ({ ...x, id: `seed-course-${i}` }));
  const { data, error } = await c.from('courses').select('*').order('sort');
  if (error) throw error;
  return data as Course[];
}

export async function getLegs(): Promise<Record<string, PassageLeg>> {
  const c = db();
  let rows: PassageLeg[];
  if (!c) rows = catalog().passage_legs;
  else {
    const { data, error } = await c.from('passage_legs').select('leg, summary, about, stops, distance_nm, program, requirements, bring');
    if (error) throw error;
    rows = data as PassageLeg[];
  }
  return Object.fromEntries(rows.map((r) => [r.leg, r]));
}

/** Stops in the order this passage sails them (legs are stored from the first port in the key to the second). */
export function stopsFor(leg: PassageLeg, p: { from_port: string }): Stop[] {
  return leg.stops[0]?.name === p.from_port ? leg.stops : [...leg.stops].reverse();
}

/** URL slug of a passage: "kusadasi-istanbul-2027-06-12". */
const translit = (s: string) => s.toLowerCase().replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const passageSlug = (p: { from_port: string; to_port: string; starts_on: string }) => `${translit(p.from_port)}-${translit(p.to_port)}-${p.starts_on}`;
