import { t } from '@/lib/content';
import { responsiveImages } from '@/lib/images';
import { coverFigures, coverShots } from '@/lib/render';
import type { Shot } from '@/lib/db';
import type { Lang } from '@/lib/site';

/** Text on white strips (cover.css .st), the React twin of stripHtml in render.ts. */
function Strip({ text }: { text: string }) {
  return (
    <span className="st">
      <span className="st-bg" aria-hidden="true"><span className="hl">{text}</span></span>
      <span className="st-fg"><span className="hl">{text}</span></span>
    </span>
  );
}

/** The top of a list or detail page: breadcrumbs (and a level chip), headline and lead on white strips over a
 *  sideways row of photos. On phones the lead moves under the photos. `after` (facts) follows the block.
 *  Same markup as coverHtml in render.ts, which the prototype home page uses. */
export default function Cover({ lang, top, title, lead, shots, after }: {
  lang: Lang; top: React.ReactNode; title: string; lead: string; shots: Shot[]; after?: React.ReactNode;
}) {
  const figs = responsiveImages(coverFigures(coverShots(shots)), { priorityFirst: true });
  return (
    <>
      <section className="cover" data-row>
        <div className="cv-text">
          {top}
          <h1 className="cv-title"><Strip text={title} /></h1>
          <p className="cv-lead"><Strip text={lead} /></p>
        </div>
        <div className="cv-row" tabIndex={0} aria-label={t(lang, 'Photo gallery')} dangerouslySetInnerHTML={{ __html: figs }} />
        <div className="cv-nav">
          <button className="round" type="button" data-dir="-1" aria-label={t(lang, 'Previous photos')}><svg className="i" style={{ transform: 'scaleX(-1)' }}><use href="#ow-arrow" /></svg></button>
          <button className="round" type="button" data-dir="1" aria-label={t(lang, 'Next photos')}><svg className="i"><use href="#ow-arrow" /></svg></button>
        </div>
      </section>
      <p className="cv-lead-m">{lead}</p>
      {after}
    </>
  );
}
