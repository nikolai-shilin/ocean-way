import '@/styles/theory.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata } from '@/lib/content';
import { path, type Lang } from '@/lib/site';

export async function generateMetadata({ params }: PageProps<'/[lang]/theory'>) {
  const { lang } = await params;
  return pageMetadata(loadPage('theory', lang as Lang), path.theory);
}

export default async function TheoryHub({ params }: PageProps<'/[lang]/theory'>) {
  const lang = (await params).lang as Lang;
  return <ProtoPage section="theory" content={loadPage('theory', lang)} />;
}
