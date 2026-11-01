import '@/styles/home.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata } from '@/lib/content';
import { getCourses, getPassages, getYachts } from '@/lib/db';
import { fleetCards, passagesRows, replaceInner } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  return pageMetadata(loadPage('home', lang as Lang), path.home);
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const lang = (await params).lang as Lang;
  const content = loadPage('home', lang);
  const [passages, yachts, courses] = await Promise.all([getPassages(), getYachts(), getCourses()]);
  let main = content.main;
  main = replaceInner(main, /<table class="tbl stack passages">[\s\S]*?<tbody>/, '</tbody>', passagesRows(lang, passages));
  main = replaceInner(main, /<section class="sec" id="fleet"[\s\S]*?<div class="hscroll"[^>]*>/, '</div>\n    </section>', fleetCards(lang, yachts));
  // Course cards → course pages (names are the official IYT names, the same in every language).
  for (const c of courses) {
    main = main.replace(new RegExp(`<a class="card" href="[^"]*">(\\s*<div class="photo">(?:(?!</a>)[\\s\\S])*?<span class="card-title">${c.name}</span>)`), `<a class="card" href="${path.courseItem(lang, c.slug)}">$1`);
  }
  return <ProtoPage content={content} main={main} />;
}
