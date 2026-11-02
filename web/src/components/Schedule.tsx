import { t } from '@/lib/content';
import type { Course, CourseDate } from '@/lib/db';
import { dates as dateRange } from '@/lib/passages';
import { courseLength, places } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

/** The year schedule on /courses: one row per course, twelve month columns as wide as their number of days,
 *  and each start date drawn as a bar where it falls in the year (styles .sch-* in app.css).
 *  A bar opens the course page at its dates; hover or focus shows the dates and places left. */

const LOCALE: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
const utc = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const DAY = 864e5;

/** The year to show: the one holding the next start date (or the latest year with dates, if all are past). */
export function scheduleYear(rows: CourseDate[], today = new Date().toISOString().slice(0, 10)) {
  const next = rows.filter((d) => d.ends_on >= today).sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];
  const last = [...rows].sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0];
  return Number((next ?? last)?.starts_on.slice(0, 4)) || new Date().getUTCFullYear();
}

export function Schedule({ lang, year, courses, dates }: { lang: Lang; year: number; courses: Course[]; dates: CourseDate[] }) {
  const start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - start) / DAY;
  const months = Array.from({ length: 12 }, (_, m) => ({
    days: (Date.UTC(year, m + 1, 1) - Date.UTC(year, m, 1)) / DAY,
    name: new Intl.DateTimeFormat(LOCALE[lang], { month: 'short', timeZone: 'UTC' }).format(Date.UTC(year, m, 15)).replace('.', ''),
  }));
  const cols = { gridTemplateColumns: months.map((m) => `${m.days}fr`).join(' ') };
  const inYear = dates.filter((d) => d.starts_on.startsWith(String(year)));
  const pct = (n: number) => `${((n / days) * 100).toFixed(3)}%`;
  return (
    <div className="sch" role="region" aria-label={t(lang, 'Course schedule {year}', { year })} tabIndex={0}>
      <div className="sch-in">
        <div className="sch-head">
          <span className="sch-corner" />
          <div className="sch-months" style={cols} aria-hidden="true">{months.map((m) => <span key={m.name}>{m.name}</span>)}</div>
        </div>
        {courses.map((c) => {
          const own = inYear.filter((d) => d.course_slug === c.slug).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
          return (
            <div className="sch-row" key={c.slug}>
              <a className="sch-name" href={path.courseItem(lang, c.slug)}>
                <b>{c.name.replace(/^IYT /, '')}</b>
                <span>{own.length ? t(lang, own.length === 1 ? '1 date' : `${own.length} dates`) : t(lang, 'Dates on request')}</span>
              </a>
              <div className="sch-track" style={cols}>
                {months.map((m) => <span key={m.name} aria-hidden="true" />)}
                {own.map((d) => {
                  const from = (utc(d.starts_on) - start) / DAY;
                  const len = (utc(d.ends_on) - utc(d.starts_on)) / DAY + 1;
                  const pl = places(lang, d.places_left, d.places_total);
                  const when = dateRange(lang, d.starts_on, d.ends_on);
                  const tip = `${when} · ${courseLength(lang, d)} · ${pl.text}`;
                  return (
                    <a key={d.id} className={`sch-bar${len === 1 ? ' is-day' : ''}${d.places_left <= 0 ? ' is-full' : ''}${from < days * 0.15 ? ' tip-r' : from > days * 0.75 ? ' tip-l' : ''}`}
                      style={{ left: pct(from), width: pct(len) }} href={`${path.courseItem(lang, c.slug)}#dates`}
                      aria-label={`${c.name}: ${tip}`} data-tip={tip} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
