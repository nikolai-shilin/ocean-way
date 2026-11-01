import Script from 'next/script';
import type { PageContent } from '@/lib/content';
import { SITE } from '@/lib/site';
import { addMobileMenu, fixNav, langLinks, splitFaq, type Section } from '@/lib/chrome';
import { t } from '@/lib/content';
import FooterNav from './FooterNav';

/** Renders one extracted prototype page: icon sprite, header, main, footer, page scripts and JSON-LD.
 *  `main` and `scripts` can be passed in already modified (live data, booking hooks). */
export default function ProtoPage({ content, main, scripts, before, section = null }: { content: PageContent; main?: string; scripts?: string[]; before?: string; section?: Section }) {
  const header = addMobileMenu(fixNav(content.header, content.lang, section), t(content.lang, 'Menu'));
  const html = header + '<main>' + splitFaq(fixNav(main ?? content.main, content.lang)) + '</main>';
  const ld = content.jsonld.map((j) => j.replace(/(\{\{SITE\}\}[^"]*?)\/"/g, '$1"').replaceAll('{{SITE}}', SITE));
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: content.sprite }} />
      <div className="wrap" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="wrap">
        <FooterNav lang={content.lang} langLinks={langLinks(header)} />
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
