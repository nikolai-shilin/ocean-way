import '@/styles/course.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata, t } from '@/lib/content';
import { getCourseDates } from '@/lib/db';
import { courseRows, day, eur, replaceInner } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/bareboat-skipper'>) {
  const { lang } = await params;
  return pageMetadata(loadPage('course-bareboat-skipper', lang as Lang), path.course);
}

export default async function CoursePage({ params }: PageProps<'/[lang]/courses/bareboat-skipper'>) {
  const lang = (await params).lang as Lang;
  const content = loadPage('course-bareboat-skipper', lang);
  const dates = await getCourseDates('bareboat-skipper');
  let main = replaceInner(content.main, /<table class="tbl hide-m3">[\s\S]*?<tbody>/, '</tbody>', courseRows(lang, dates));
  // Booking card: next date with places, its price and a direct booking link.
  const next = dates.find((d) => d.places_left > 0);
  if (next) {
    main = main.replace(/(<div class="price-row"><b>)[^<]*(<\/b>)/, `$1${eur(next.price_eur)}$2`);
    main = main.replace(/(<a class="pill pill-primary pill-wide" href=")[^"]*("[^>]*>)[^<]*(<\/a>)/,
      `$1${path.booking(lang)}?item=bareboat&date=${next.key}$2${t(lang, `Book ${day('en', next.starts_on)}`)}$3`);
  }
  return <ProtoPage section="courses" content={content} main={main} />;
}
