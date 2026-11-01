import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { loadPage, t } from '@/lib/content';
import { getPassages, passageSlug } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { passagesMap, passagesRows } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]/passages'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Training passages 2027'), description: t(lang, 'One-way training passages along the Turkish coast and to Northern Cyprus in 2027: dates, routes, places left and prices. Build sea miles for Yachtmaster with an instructor aboard.'), pathFor: path.passages });
}

/** Hovering a row highlights its leg on the map (same behaviour as the home page). */
const MAP_JS = `(() => {
  const maps = [...document.querySelectorAll('.pm')];
  const rows = [...document.querySelectorAll('.tbl.passages tr[data-leg]')];
  const show = (leg, row) => { maps.forEach((svg) => { svg.classList.toggle('has-on', !!leg); svg.querySelectorAll('.pm-leg').forEach((g) => g.classList.toggle('on', g.dataset.leg === leg)); }); rows.forEach((r) => r.classList.toggle('on', r === row)); };
  rows.forEach((r) => { r.addEventListener('mouseenter', () => show(r.dataset.leg, r)); r.addEventListener('mouseleave', () => show(null)); });
})();`;

export default async function Passages({ params }: PageProps<'/[lang]/passages'>) {
  const lang = (await params).lang as Lang;
  const passages = await getPassages();
  const home = loadPage('home', lang).main;
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Passages'), path.passages(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'ItemList', name: t(lang, 'Training passages 2027'),
    itemListElement: passages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.passage(lang, passageSlug(p)), name: t(lang, `${p.from_port} → ${p.to_port}`) })),
  }] };
  const head = [t(lang, 'Dates'), t(lang, 'Route'), t(lang, 'Waters'), t(lang, 'Nights'), t(lang, 'Places')];
  return (
    <Shell lang={lang} section="passages" pathFor={path.passages} jsonld={ld} scripts={[MAP_JS]}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <span className="kicker">{t(lang, 'Skipper practicum · 2027')}</span>
        <h1 className="display">{t(lang, 'Training passages along the Turkish coast')}</h1>
        <p className="lead">{t(lang, 'One-way passages between ports in Turkey and Northern Cyprus, Saturday to Saturday, with an instructor on board. You plan the legs, stand watches and log the sea miles you need for Yachtmaster. Four places on each boat.')}</p>
      </section>
      <div className="sec" style={{ marginTop: 40 }} dangerouslySetInnerHTML={{ __html: passagesMap(home) }} />
      <div className="tbl-wrap" style={{ marginTop: 32 }}>
        <table className="tbl stack passages">
          <thead><tr><th>{head[0]}</th><th>{head[1]}</th><th className="hl">{head[2]}</th><th className="num">{head[3]}</th><th className="num">{head[4]}</th><th><span className="sr-only">{t(lang, 'Book')}</span></th></tr></thead>
          <tbody dangerouslySetInnerHTML={{ __html: passagesRows(lang, passages) }} />
        </table>
      </div>
      <p className="disclaimer">{t(lang, 'Most passages pair up: out one week, back the next, so you can join for one leg or both.')}</p>
    </Shell>
  );
}
