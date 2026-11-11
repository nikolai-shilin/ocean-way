import { t } from '@/lib/content';
import { english, type Course, type Yacht } from '@/lib/db';
import { scopeIcon } from '@/lib/icons';
import { photoProps } from '@/lib/images';
import { photo } from '@/lib/meta';
import { boatModel, boatPrice, boatSpec, boatTitle, boatUse, eur } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

export function CourseCard({ lang, c }: { lang: Lang; c: Course }) {
  return (
    <a className="card" href={path.courseItem(lang, c.slug)}>
      <div className="photo"><div className="clip"><img {...photoProps(photo(c.photo_id), 'card', { lazy: true })} alt={c.photo_alt} suppressHydrationWarning /></div></div>
      <div className="card-body">
        <span className="lvl">{c.level}</span>
        <span className="card-title">{c.name}</span>
        <span className="card-meta">{c.summary}</span>
        <span className="card-price"><b>{eur(c.price_from_eur)}</b> {c.price_unit}</span>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-clock" /></svg>{c.duration}</span>
          <span className="fact"><svg className="i"><use href={`#${scopeIcon(english(c).scope)}`} /></svg>{c.scope}</span>
        </div>
      </div>
    </a>
  );
}


export function BoatCard({ lang, y }: { lang: Lang; y: Yacht }) {
  const [icon, use] = boatUse(lang, y);
  const model = boatModel(y);
  return (
    <a className="card" href={path.boat(lang, y.slug)} data-kind={y.kind} data-cabins={y.cabins}>
      <div className="photo"><div className="clip"><img {...photoProps(photo(y.photo_id), 'card', { lazy: true })} alt={y.photo_alt} suppressHydrationWarning /></div></div>
      <div className="card-body">
        <span className="card-title">{boatTitle(y)}{model ? <span className="card-model">{model}</span> : null}</span>
        <span className="card-meta">{boatSpec(lang, y)}</span>
        <span className="card-price">{boatPrice(lang, y.charter_from_eur)}</span>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-pin" /></svg>{t(lang, y.base)}</span>
          <span className="fact"><svg className="i"><use href={`#${icon}`} /></svg>{use}</span>
        </div>
      </div>
    </a>
  );
}
