import { t } from '@/lib/content';
import type { Faq as FaqItem, Skill, Step, Stop } from '@/lib/db';
import { skillIcon } from '@/lib/icons';
import type { Lang } from '@/lib/site';

/** Building blocks of the course and passage pages: ticked lists, a day-by-day programme, the stops of a route.
 *  Text comes in the page language from the database (localize in db.ts); only stop names and labels go through t(). */
export function List({ items, icon = 'ow-check', cols = false }: { items: string[]; icon?: string; cols?: boolean }) {
  return <ul className={cols ? 'ow-list ow-cols' : 'ow-list'}>{items.map((x, i) => <li key={i}><svg className="i"><use href={`#${icon}`} /></svg><span>{x}</span></li>)}</ul>;
}

export function Program({ steps }: { steps: Step[] }) {
  return <ol className="ow-prog">{steps.map((s, i) => <li key={i}><b>{s.title}</b><p>{s.text}</p></li>)}</ol>;
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
            {s.note ? <p>{s.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Grouped skills, the same blocks as "What you'll learn" on the Bareboat Skipper page (home.css .mods). */
export function Skills({ skills, en = skills }: { skills: Skill[]; en?: Skill[] }) {
  return (
    <div className="mods">
      {skills.map((g, i) => (
        <div className="mod" key={i}>
          <span className="ico-c"><svg className="i"><use href={`#${skillIcon(en[i]?.title ?? g.title, g.icon)}`} /></svg></span>
          <h3>{g.title}</h3>
          <ul>{g.items.map((x, j) => <li key={j}>{x}</li>)}</ul>
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
          <summary><span className="faq-q">{x.q}</span><svg className="i"><use href="#ow-chevron" /></svg></summary>
          <p className="faq-a">{x.a}</p>
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

/** FAQPage structured data for the same questions (already in the page language). */
export const faqLd = (items: FaqItem[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
});
