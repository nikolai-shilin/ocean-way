import { t } from '@/lib/content';
import type { Faq as FaqItem, Skill, Step, Stop } from '@/lib/db';
import type { Lang } from '@/lib/site';

/** Building blocks of the course and passage pages: ticked lists, a day-by-day programme, the stops of a route. */
export function List({ lang, items, icon = 'i-check', cols = false }: { lang: Lang; items: string[]; icon?: string; cols?: boolean }) {
  return <ul className={cols ? 'ow-list ow-cols' : 'ow-list'}>{items.map((x, i) => <li key={i}><svg className="i"><use href={`#${icon}`} /></svg><span>{t(lang, x)}</span></li>)}</ul>;
}

export function Program({ lang, steps }: { lang: Lang; steps: Step[] }) {
  return <ol className="ow-prog">{steps.map((s, i) => <li key={i}><b>{t(lang, s.title)}</b><p>{t(lang, s.text)}</p></li>)}</ol>;
}

export function Stops({ lang, stops }: { lang: Lang; stops: Stop[] }) {
  return (
    <ol className="ow-stops">
      {stops.map((s, i) => {
        const end = i === 0 || i === stops.length - 1;
        const cls = s.lon === null ? 'sea' : end ? 'end' : undefined;
        return (
          <li key={i} className={cls}>
            <b>{t(lang, s.name)}</b>{end ? <span className="ow-end">{t(lang, i === 0 ? 'Departure' : 'Arrival')}</span> : null}
            {s.note ? <p>{t(lang, s.note)}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Grouped skills, the same blocks as "What you'll learn" on the Bareboat Skipper page (home.css .mods). */
export function Skills({ lang, skills }: { lang: Lang; skills: Skill[] }) {
  return (
    <div className="mods">
      {skills.map((g, i) => (
        <div className="mod" key={i}>
          <span className="ico-c"><svg className="i"><use href={`#${g.icon}`} /></svg></span>
          <h3>{t(lang, g.title)}</h3>
          <ul>{g.items.map((x, j) => <li key={j}>{t(lang, x)}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/** "Asked before booking": the same two-column list of questions as the Bareboat Skipper page (first one open). */
export function Faq({ lang, items }: { lang: Lang; items: FaqItem[] }) {
  const half = Math.ceil(items.length / 2);
  const col = (xs: FaqItem[], from: number) => (
    <div className="faq-col">
      {xs.map((x, i) => (
        <details className="faq-item" key={from + i} open={from + i === 0}>
          <summary><span className="faq-q">{t(lang, x.q)}</span><svg className="i"><use href="#i-chev" /></svg></summary>
          <p className="faq-a">{t(lang, x.a)}</p>
        </details>
      ))}
    </div>
  );
  return (
    <section className="sec" id="faq" style={{ marginTop: 96 }}>
      <div className="sec-head"><span className="kicker">{t(lang, 'Questions')}</span><h2 className="h2">{t(lang, 'Asked before booking')}</h2></div>
      <div className="faq-grid">{col(items.slice(0, half), 0)}{col(items.slice(half), half)}</div>
    </section>
  );
}

/** FAQPage structured data for the same questions, in the page language. */
export const faqLd = (lang: Lang, items: FaqItem[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((x) => ({ '@type': 'Question', name: t(lang, x.q), acceptedAnswer: { '@type': 'Answer', text: t(lang, x.a) } })),
});
