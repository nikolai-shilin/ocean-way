import { index, loadPage, t } from '@/lib/content';
import { getCourses, getYachts } from '@/lib/db';
import { path, type Lang } from '@/lib/site';

const POPULAR = ['right-of-way', 'med-mooring', 'anchoring', 'weather', 'navigation-lights'];

/** Site map in the footer: every course, the passages, every boat, popular theory, company links; languages in a row below. */
export default async function FooterNav({ lang, langLinks }: { lang: Lang; langLinks: [string, string, boolean][] }) {
  const [courses, yachts] = await Promise.all([getCourses(lang), getYachts(lang)]);
  const articles = POPULAR.filter((s) => index.slugs.includes(s)).map((s) => [s, loadPage(`theory-${s}`, lang).title.replace(/ · Ocean Way$/, '')]);
  return (
    <nav className="fnav" aria-label={t(lang, 'Site map')}>
      <div>
        <h2><a href={path.courses(lang)}>{t(lang, 'Courses')}</a></h2>
        <ul>{courses.map((c) => <li key={c.slug}><a href={path.courseItem(lang, c.slug)}>{c.name}</a></li>)}</ul>
      </div>
      <div>
        <h2><a href={path.passages(lang)}>{t(lang, 'Passages')}</a></h2>
        <ul>
          <li><a href={path.passages(lang)}>{t(lang, 'All passages')}</a></li>
          <li><a href={`${path.booking(lang)}?item=passage`}>{t(lang, 'Book a training passage')}</a></li>
        </ul>
        <h2 style={{ marginTop: 22 }}><a href={path.fleet(lang)}>{t(lang, 'Fleet')}</a></h2>
        <ul>{yachts.map((y) => <li key={y.slug}><a href={path.boat(lang, y.slug)}>{y.model}</a></li>)}</ul>
      </div>
      <div>
        <h2><a href={path.theory(lang)}>{t(lang, 'Theory')}</a></h2>
        <ul>
          {articles.map(([s, title]) => <li key={s}><a href={path.article(lang, s)}>{title}</a></li>)}
          <li><a href={path.theory(lang)}>{t(lang, 'All theory')}</a></li>
        </ul>
      </div>
      <div>
        <h2>Ocean Way</h2>
        <ul>
          <li><a href={path.prices(lang)}>{t(lang, 'Prices')}</a></li>
          <li><a href={path.instructors(lang)}>{t(lang, 'Instructors')}</a></li>
          <li><a href="#">{t(lang, 'About')}</a></li>
          <li><a href="#">Telegram</a></li>
          <li><a href="#">YouTube</a></li>
          <li><a href="#">Instagram</a></li>
          <li><a href="#">{t(lang, 'Privacy')}</a></li>
        </ul>
      </div>
      <div className="fnav-langs">
        {langLinks.map(([l, href, current]) => <a key={l} href={href} hrefLang={l} lang={l} aria-current={current ? 'true' : undefined}>{l.toUpperCase()}</a>)}
      </div>
    </nav>
  );
}
