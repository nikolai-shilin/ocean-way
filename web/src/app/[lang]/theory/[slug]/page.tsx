import '@/styles/theory.css';
import { notFound } from 'next/navigation';
import ProtoPage from '@/components/ProtoPage';
import { articlePage, getArticles } from '@/lib/articles';
import { pageMetadata } from '@/lib/content';
import { path, type Lang } from '@/lib/site';

export const revalidate = 300;
export async function generateStaticParams() {
  return (await getArticles('en')).map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/[lang]/theory/[slug]'>) {
  const { lang, slug } = await params;
  const page = await articlePage(lang as Lang, slug);
  return page ? pageMetadata(page, (l) => path.article(l, slug)) : {};
}

export default async function Article({ params }: PageProps<'/[lang]/theory/[slug]'>) {
  const { lang, slug } = await params;
  const page = await articlePage(lang as Lang, slug);
  if (!page) notFound();
  return <ProtoPage section="theory" pathFor={(l) => path.article(l, slug)} content={page} />;
}
