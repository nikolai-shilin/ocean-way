import '@/styles/theory.css';
import HtmlPage from '@/components/HtmlPage';
import { hubPage } from '@/lib/articles';
import { pageMetadata } from '@/lib/content';
import { path, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/theory'>) {
  const { lang } = await params;
  return pageMetadata(await hubPage(lang as Lang), path.theory);
}

export default async function TheoryHub({ params }: PageProps<'/[lang]/theory'>) {
  const lang = (await params).lang as Lang;
  return <HtmlPage section="theory" pathFor={path.theory} content={await hubPage(lang)} />;
}
