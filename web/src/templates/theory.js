
const root = document.documentElement;
document.getElementById('themeBtn').addEventListener('click', () => { if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night'; });
if (new URLSearchParams(location.search).get('theme') === 'night') root.dataset.theme = 'night';
(() => {
  const links = [...document.querySelectorAll('.art-side .toc-list a')]; if (!links.length) return;
  const secs = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a, i) => a.classList.toggle('on', secs[i] === e.target)); }), { rootMargin: '-20% 0px -70% 0px' });
  secs.forEach((s) => s && io.observe(s));
})();
