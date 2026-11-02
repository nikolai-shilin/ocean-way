import Script from 'next/script';
import type { PageContent } from '@/lib/content';
import { SITE, type Lang } from '@/lib/site';
import { fixNav, langLinks, siteHeader, splitFaq, sprite, type Section } from '@/lib/chrome';
import { responsiveImages } from '@/lib/images';
import FooterNav from './FooterNav';

/** Renders a page whose main content is HTML (extracted prototype pages, theory articles) inside the site's icon
 *  sprite, header and footer, with its scripts and JSON-LD. `main` and `scripts` can be passed in already modified
 *  (live data, booking hooks). `pathFor` gives this page's address in each language, for the language switcher. */
export default function ProtoPage({ content, main, scripts, before, section = null, pathFor }: { content: PageContent; main?: string; scripts?: string[]; before?: string; section?: Section; pathFor: (l: Lang) => string }) {
  const header = siteHeader(content.lang, section, pathFor);
  const html = header + '<main>' + responsiveImages(splitFaq(fixNav(main ?? content.main, content.lang)), { priorityFirst: true }) + '</main>';
  const ld = content.jsonld.map((j) => j.replace(/(\{\{SITE\}\}[^"]*?)\/"/g, '$1"').replaceAll('{{SITE}}', SITE));
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: sprite() }} />
      <div className="wrap" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="wrap">
        <FooterNav lang={content.lang} langLinks={langLinks(content.lang, pathFor)} />
      </div>
      {content.tail ? <div dangerouslySetInnerHTML={{ __html: content.tail }} /> : null}
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: j }} />
      ))}
      {before ? <Script id="page-data" strategy="beforeInteractive">{before}</Script> : null}
      {(scripts ?? content.scripts).map((s, i) => (
        <Script key={i} id={`page-script-${i}`} strategy="afterInteractive">{s}</Script>
      ))}
    </>
  );
}
