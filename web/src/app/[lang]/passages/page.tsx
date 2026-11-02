import '@/styles/home.css';
import '@/styles/app.css';
import '@/styles/passages.css';
import Shell from '@/components/Shell';
import { loadPage, t } from '@/lib/content';
import { getLegs, getPassages, passageSlug } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { PASSAGES_JS, passageFilter, passageList } from '@/lib/passages';
import { mixShots, passagesMap } from '@/lib/render';
import Cover from '@/components/Cover';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]/passages'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Training passages 2027'), description: t(lang, 'One-way training passages along the Turkish coast and to Northern Cyprus in 2027: dates, routes, places left and prices. Build sea miles for Yachtmaster with an instructor aboard.'), pathFor: path.passages });
}

export default async function Passages({ params }: PageProps<'/[lang]/passages'>) {
  const lang = (await params).lang as Lang;
  const [passages, legs] = await Promise.all([getPassages(), getLegs(lang)]);
  const home = loadPage('home', lang).main;
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Passages'), path.passages(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'ItemList', name: t(lang, 'Training passages 2027'),
    itemListElement: passages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.passage(lang, passageSlug(p)), name: t(lang, `${p.from_port} → ${p.to_port}`) })),
  }] };
  return (
    <Shell lang={lang} section="passages" pathFor={path.passages} jsonld={ld} scripts={[PASSAGES_JS]}>
      <Cover lang={lang} top={<Crumbs lang={lang} items={crumbs} current={t(lang, 'Skipper practicum · 2027')} />}
        title={t(lang, 'Training passages along the Turkish coast')}
        lead={t(lang, 'One-way passages between ports in Turkey and Northern Cyprus, Saturday to Saturday, with an instructor on board. You plan the legs, stand watches and log the sea miles you need for Yachtmaster. Four places on each boat.')}
        shots={mixShots(Object.values(legs).map((l) => l.gallery))} />
      <div className="pp-filter" role="group" aria-label={t(lang, 'Filter by route')} dangerouslySetInnerHTML={{ __html: passageFilter(lang, passages) }} />
      <p className="pp-live sr-only" aria-live="polite" data-text={t(lang, 'Passages shown: {n}')} />
      <div className="pp-layout">
        <aside className="pp-map" aria-label={t(lang, 'Map of the passages')} dangerouslySetInnerHTML={{ __html: passagesMap(home) }} />
        <div className="pp-months" dangerouslySetInnerHTML={{ __html: passageList(lang, passages, legs) }} />
      </div>
      <p className="disclaimer" style={{ marginTop: 24 }}>{t(lang, 'Most passages pair up: out one week, back the next, so you can join for one leg or both.')}</p>
    </Shell>
  );
}
