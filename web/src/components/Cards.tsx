import { t } from '@/lib/content';
import type { Course, Yacht } from '@/lib/db';
import { scopeIcon, usedForIcon } from '@/lib/icons';
import { photoProps } from '@/lib/images';
import { photo } from '@/lib/meta';
import { boatPrice, boatSpec, eur } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

export function CourseCard({ lang, c }: { lang: Lang; c: Course }) {
  return (
    <a className="card" href={path.courseItem(lang, c.slug)}>
      <div className="photo"><div className="clip"><img {...photoProps(photo(c.photo_id), 'card', { lazy: true })} alt={t(lang, c.photo_alt)} suppressHydrationWarning /></div></div>
      <div className="card-body">
        <span className="lvl">{t(lang, c.level)}</span>
        <span className="card-title">{c.name}</span>
        <span className="card-meta">{t(lang, c.summary)}</span>
        <span className="card-price"><b>{eur(c.price_from_eur)}</b> {t(lang, c.price_unit)}</span>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-clock" /></svg>{t(lang, c.duration)}</span>
          <span className="fact"><svg className="i"><use href={`#${scopeIcon(c.scope)}`} /></svg>{t(lang, c.scope)}</span>
        </div>
      </div>
    </a>
  );
}


export function BoatCard({ lang, y }: { lang: Lang; y: Yacht }) {
  return (
    <a className="card" href={path.boat(lang, y.slug)}>
      <div className="photo"><div className="clip"><img {...photoProps(photo(y.photo_id), 'card', { lazy: true })} alt={t(lang, y.photo_alt)} suppressHydrationWarning /></div></div>
      <div className="card-body">
        <span className="card-title">{y.model}</span>
        <span className="card-meta">{boatSpec(lang, y)}</span>
        <span className="card-price">{boatPrice(lang, y.charter_from_eur)}</span>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-pin" /></svg>{t(lang, y.base)}</span>
          <span className="fact"><svg className="i"><use href={`#${usedForIcon(y.used_for)}`} /></svg>{t(lang, y.used_for)}</span>
        </div>
      </div>
    </a>
  );
}
