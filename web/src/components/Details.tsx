import { t } from '@/lib/content';
import type { Step, Stop } from '@/lib/db';
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
