/* ============================================================
   NAV SCROLL BEHAVIOR
   ============================================================ */
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
const toggle = document.querySelector('.nav__mobile-toggle');
const mobileMenu = document.querySelector('.nav__mobile-menu');
if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(4.5px, 4.5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(4.5px, -4.5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================================================
   FILTER TABS
   ============================================================ */
const filterTabs = document.querySelectorAll('.filter-tab');
const rows = document.querySelectorAll('.project-row');
if (filterTabs.length && rows.length) {
  filterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabs.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const f = btn.dataset.filter;
      rows.forEach(row => {
        const match = f === 'all' || row.dataset.category === f;
        row.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ============================================================
   ACTIVE NAV LINK (detail pages)
   ============================================================ */
const currentPath = window.location.pathname;
document.querySelectorAll('.nav__link').forEach(link => {
  if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
    link.style.color = 'var(--text)';
  }
});
