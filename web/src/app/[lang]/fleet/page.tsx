import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { BoatCard } from '@/components/Cards';
import { t } from '@/lib/content';
import { getYachts } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/fleet'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Our fleet'), description: t(lang, 'The yachts Ocean Way sails and teaches on in Greece, Croatia and Türkiye: models, cabins, home ports and charter prices.'), pathFor: path.fleet });
}

export default async function Fleet({ params }: PageProps<'/[lang]/fleet'>) {
  const lang = (await params).lang as Lang;
  const yachts = await getYachts();
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Fleet'), path.fleet(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'ItemList', name: t(lang, 'Our fleet'),
    itemListElement: yachts.map((y, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.boat(lang, y.slug), name: y.model })),
  }] };
  return (
    <Shell lang={lang} section="fleet" pathFor={path.fleet} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} current={t(lang, 'Our fleet')} />
        <h1 className="display">{t(lang, 'The boats we sail and teach on')}</h1>
        <p className="lead">{t(lang, 'Every course and passage runs on our own yachts, looked after by our own team between trips. When a boat is not out with students, you can charter it, bareboat or with a skipper.')}</p>
      </section>
      <div className="ow-grid">{yachts.map((y) => <BoatCard key={y.slug} lang={lang} y={y} />)}</div>
    </Shell>
  );
}
