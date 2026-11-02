
const root = document.documentElement;
document.getElementById('themeBtn').addEventListener('click', () => {
  if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night';
});
const q = new URLSearchParams(location.search);
if (q.get('theme') === 'night') root.dataset.theme = 'night';
document.querySelectorAll('[data-row]').forEach((row) => {
  const g = row.querySelector('.gallery, .hscroll'); if (!g) return;
  const btns = [...row.querySelectorAll('.round[data-dir]')]; if (btns.length < 2) return;
  const sync = () => { btns[0].disabled = g.scrollLeft <= 4; btns[1].disabled = g.scrollLeft + g.clientWidth >= g.scrollWidth - 4; };
  btns.forEach((b) => b.addEventListener('click', () => g.scrollBy({ left: Number(b.dataset.dir) * g.clientWidth * 0.7, behavior: 'smooth' })));
  g.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
});


(() => {
  const maps = [...document.querySelectorAll('.pm')];
  const rows = [...document.querySelectorAll('.tbl.passages tr[data-leg]')];
  const show = (leg, row) => {
    maps.forEach((svg) => {
      svg.classList.toggle('has-on', !!leg);
      svg.querySelectorAll('.pm-leg').forEach((g) => g.classList.toggle('on', g.dataset.leg === leg));
    });
    rows.forEach((r) => r.classList.toggle('on', r === row));
  };
  rows.forEach((r) => {
    r.addEventListener('mouseenter', () => show(r.dataset.leg, r));
    r.addEventListener('mouseleave', () => show(null));
  });
  const p = q.get('leg'); if (p) show(p, rows.find((r) => r.dataset.leg === p));
})();
