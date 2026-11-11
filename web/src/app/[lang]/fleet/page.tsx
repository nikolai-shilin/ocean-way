import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import Cover from '@/components/Cover';
import { BoatCard } from '@/components/Cards';
import { t } from '@/lib/content';
import { getYachts } from '@/lib/db';
import { isSailingSeason, periodDates, seasonName } from '@/lib/fleet';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { boatModel, boatTitle, eur, mixShots } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/fleet'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Our fleet'), description: t(lang, 'Monohulls and catamarans at Ece Saray Marina, Fethiye: cabins, photos, deck plans and 2027 weekly charter prices for every boat.'), pathFor: path.fleet });
}

/** Filter chips: hull type and cabin count; a card shows when it matches both. */
const FILTER_JS = `
const bar = document.querySelector('.fl-bar');
if (bar) {
  const count = bar.querySelector('.fl-count'), cards = [...document.querySelectorAll('.ow-grid .card[data-kind]')];
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.tag'); if (!b) return;
    bar.querySelectorAll('.tag[data-group="' + b.dataset.group + '"]').forEach((x) => { x.classList.toggle('tag-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    const kind = bar.querySelector('.tag-on[data-group=kind]').dataset.v, cab = bar.querySelector('.tag-on[data-group=cabins]').dataset.v;
    let n = 0;
    cards.forEach((c) => { const ok = (kind === 'all' || c.dataset.kind === kind) && (cab === 'all' || c.dataset.cabins === cab); c.hidden = !ok; n += ok; });
    count.textContent = count.dataset[n === 1 ? 'one' : 'many'].replace('{n}', n);
  });
}`;

export default async function Fleet({ params }: PageProps<'/[lang]/fleet'>) {
  const lang = (await params).lang as Lang;
  const yachts = await getYachts(lang);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Fleet'), path.fleet(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'ItemList', name: t(lang, 'Our fleet'),
    itemListElement: yachts.map((y, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.boat(lang, y.slug), name: [y.name, y.model].filter(Boolean).join(', ') })),
  }] };
  const mono = yachts.filter((y) => y.kind === 'monohull').length, cats = yachts.length - mono;
  const cabins = [...new Set(yachts.map((y) => y.cabins))].sort((a, b) => a - b);
  const periods = yachts.find((y) => y.prices.length)?.prices ?? [];
  const range = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? (Math.min(...v) === Math.max(...v) ? eur(v[0]) : `${eur(Math.min(...v))}–${eur(Math.max(...v))}`) : ''; };
  const tag = (group: string, v: string, label: string, n: number, on = false) => (
    <button key={group + v} className={`tag${on ? ' tag-on' : ''}`} type="button" data-group={group} data-v={v} aria-pressed={on}>{label}<span className="tag-count">{n}</span></button>
  );
  const one = t(lang, '1 boat'), many = t(lang, '{n} boats');
  return (
    <Shell lang={lang} section="fleet" pathFor={path.fleet} jsonld={ld} scripts={[FILTER_JS]}>
      <Cover lang={lang} top={<Crumbs lang={lang} items={crumbs} />}
        title={t(lang, '{n} yachts in Fethiye', { n: yachts.length })}
        lead={t(lang, 'Monohulls and catamarans at Ece Saray Marina in Fethiye. Our courses sail on them; between courses you can charter one for a week, bareboat with a licence or with one of our skippers.')}
        // Newest boats first (photos at sea), skipping the card photos below.
        shots={mixShots([...yachts].sort((a, b) => b.year - a.year).map((y) => y.gallery), yachts.map((y) => y.photo_id), 10)}
        after={<div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-pin" /></svg>{t(lang, 'Ece Saray Marina, Fethiye')}</span>
          {mono ? <span className="fact"><svg className="i"><use href="#ow-monohull" /></svg>{t(lang, '{n} monohulls', { n: mono })}</span> : null}
          {cats ? <span className="fact"><svg className="i"><use href="#ow-catamaran" /></svg>{t(lang, '{n} catamarans', { n: cats })}</span> : null}
          <span className="fact"><svg className="i"><use href="#ow-calendar" /></svg>{t(lang, 'Saturday to Saturday')}</span>
        </div>} />

      <div className="fl-bar">
        <div className="tags" role="group" aria-label={t(lang, 'Filter boats')}>
          {tag('kind', 'all', t(lang, 'All boats'), yachts.length, true)}
          {mono && cats ? <>{tag('kind', 'monohull', t(lang, 'Monohulls'), mono)}{tag('kind', 'catamaran', t(lang, 'Catamarans'), cats)}</> : null}
          <span className="fl-sep" aria-hidden="true" />
          {tag('cabins', 'all', t(lang, 'Any cabins'), yachts.length, true)}
          {cabins.map((c) => tag('cabins', String(c), t(lang, '{n} cabins', { n: c }), yachts.filter((y) => y.cabins === c).length))}
        </div>
        <span className="fl-count" aria-live="polite" data-one={one} data-many={many}>{many.replace('{n}', String(yachts.length))}</span>
      </div>
      <div className="ow-grid">{yachts.map((y) => <BoatCard key={y.slug} lang={lang} y={y} />)}</div>

      {periods.length ? (
        <section className="fl-sec" id="prices">
          <span className="kicker">{t(lang, 'Season {year}', { year: periods[0].starts_on.slice(0, 4) })}</span>
          <h2 className="h2">{t(lang, 'Weekly prices by season')}</h2>
          <p>{t(lang, 'The charter fee for the boat for one week, Saturday to Saturday. Each boat’s lowest price between April and October is in blue.')}</p>
          <div className="tbl-wrap fl-season-wrap" tabIndex={0}>
            <table className="tbl fl-season">
              <thead><tr><th>{t(lang, 'Boat')}</th>{periods.map((p) => <th key={p.starts_on}>{seasonName(lang, p)}<span>{periodDates(lang, p)}</span></th>)}</tr></thead>
              <tbody>{yachts.filter((y) => y.prices.length).map((y) => (
                <tr key={y.slug}>
                  <td><a href={path.boat(lang, y.slug)}><b>{boatTitle(y)}</b></a><span>{[boatModel(y), y.year].filter(Boolean).join(', ')}</span></td>
                  {y.prices.map((p) => <td key={p.starts_on} className={isSailingSeason(p) && p.week_eur === y.charter_from_eur ? 'lo' : undefined}>{eur(p.week_eur)}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="fl-sec" id="base">
        <span className="kicker">{t(lang, 'Every charter')}</span>
        <h2 className="h2">{t(lang, 'What you pay at the base')}</h2>
        <div className="fl-terms">
          <div className="band"><h3><svg className="i"><use href="#ow-charter" /></svg>{t(lang, 'Service pack')}</h3><span className="big">{range(yachts.map((y) => y.service_pack_eur))}</span>
            <p>{t(lang, 'Once per booking: transit log for Türkiye, final cleaning, bed linen and towels. €150 more if you sail to Greece. On catamarans the dinghy outboard is included.')}</p></div>
          <div className="band"><h3><svg className="i"><use href="#ow-lock" /></svg>{t(lang, 'Security deposit')}</h3><span className="big">{range(yachts.map((y) => y.deposit_eur))}</span>
            <p>{t(lang, 'Held at check-in and returned at check-out if the boat comes back as you took her.')}</p></div>
          <div className="band"><h3><svg className="i"><use href="#ow-clock" /></svg>{t(lang, 'Check-in and out')}</h3><span className="big">{t(lang, 'Saturday')}</span>
            <p>{t(lang, 'Board from 17:00, return the following Saturday by 09:00. A skipper costs €200 a day plus food, a cook €150 a day.')}</p></div>
        </div>
      </section>
    </Shell>
  );
}
