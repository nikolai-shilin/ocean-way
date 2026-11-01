import '@/styles/theory.css';
import { notFound } from 'next/navigation';
import ProtoPage from '@/components/ProtoPage';
import { index, loadPage, pageMetadata } from '@/lib/content';
import { path, type Lang } from '@/lib/site';

export function generateStaticParams() {
  return index.slugs.map((slug) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/[lang]/theory/[slug]'>) {
  const { lang, slug } = await params;
  return pageMetadata(loadPage(`theory-${slug}`, lang as Lang), (l) => path.article(l, slug));
}

export default async function Article({ params }: PageProps<'/[lang]/theory/[slug]'>) {
  const { lang, slug } = await params;
  if (!index.slugs.includes(slug)) notFound();
  return <ProtoPage section="theory" content={loadPage(`theory-${slug}`, lang as Lang)} />;
}
