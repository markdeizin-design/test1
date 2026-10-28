export const normalize = value => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
export function matchesTeacher(person, query, category) {
  return normalize(person.search).includes(normalize(query)) && (category === 'all' || person.categories.split(' ').includes(category));
}
export function whatsappUrl(name, grade, comment = '') {
  const message = `Здравствуйте! Меня зовут ${name.trim()}. Интересует поступление: ${grade}.${comment.trim() ? `\n${comment.trim()}` : ''}`;
  return `https://wa.me/971506136091?text=${encodeURIComponent(message)}`;
}

export function scrollProgress(offset, distance) {
  return Math.min(1, Math.max(0, offset / Math.max(1, distance)));
}
export function scrollMotion(scrollY, fadeDistance, sectionTop, sectionHeight, viewportHeight) {
  return {
    opacity: 1 - scrollProgress(scrollY, fadeDistance),
    flagOffset: (scrollProgress(scrollY + viewportHeight - sectionTop, sectionHeight + viewportHeight) - .5) * 40
  };
}

if (typeof document !== 'undefined') {
  const menu = document.querySelector('[data-menu]');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    menu?.setAttribute('aria-expanded', 'false');
    navigation?.classList.remove('is-open');
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  if (menu) window.matchMedia('(max-width: 960px)').addEventListener('change', closeMenu);

  const search = document.querySelector('#teacher-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const teachers = [...document.querySelectorAll('[data-teacher]')];
  let category = 'all';
  function filterTeachers() {
    let count = 0;
    for (const card of teachers) {
      card.hidden = !matchesTeacher(card.dataset, search?.value || '', category);
      if (!card.hidden) count++;
    }
    document.querySelectorAll('[data-team-group]').forEach(group => { group.hidden = !group.querySelector('[data-teacher]:not([hidden])'); });
    document.querySelector('#search-count').textContent = `Найдено сотрудников: ${count}`;
    document.querySelector('#no-results').hidden = count !== 0;
  }
  search?.addEventListener('input', filterTeachers);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterTeachers();
  }));
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    search.value = ''; category = 'all';
    filters.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
    filterTeachers(); search.focus();
  });

  document.querySelector('#inquiry-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.parentName;
    name.setCustomValidity(name.value.trim() ? '' : 'Введите имя родителя.');
    if (!form.reportValidity()) return;
    window.location.assign(whatsappUrl(name.value, form.elements.grade.value, form.elements.comment.value));
  });
  document.querySelector('#parent-name')?.addEventListener('input', event => event.target.setCustomValidity(''));

  const dialog = document.querySelector('#gallery-dialog');
  const photos = [...document.querySelectorAll('[data-photo]')];
  let currentPhoto = 0;
  function displayPhoto(index) {
    currentPhoto = (index + photos.length) % photos.length;
    const photo = photos[currentPhoto];
    const image = dialog.querySelector('img');
    image.src = photo.dataset.photo; image.alt = photo.dataset.caption;
    dialog.querySelector('#photo-caption').textContent = photo.dataset.caption;
    dialog.querySelector('[data-photo-count]').textContent = `${currentPhoto + 1} / ${photos.length}`;
    dialog.querySelector('[data-photo-source]').href = photo.dataset.source;
  }
  photos.forEach((photo, index) => photo.addEventListener('click', () => { displayPhoto(index); dialog.showModal(); }));
  dialog?.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector('[data-prev]')?.addEventListener('click', () => displayPhoto(currentPhoto - 1));
  dialog?.querySelector('[data-next]')?.addEventListener('click', () => displayPhoto(currentPhoto + 1));
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); displayPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1)); }
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const brand = document.querySelector('[data-brand-fade]');
  const community = document.querySelector('[data-community]');
  const flags = [...document.querySelectorAll('[data-flag]')];
  if (brand || community) {
    let frame = 0, previousTime = 0, smoothScroll = window.scrollY;
    let fadeDistance = 1, communityTop = 0, communityHeight = 1;
    function readLayout() {
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      fadeDistance = brand ? Math.max(1, brand.parentElement.getBoundingClientRect().top + window.scrollY + brand.offsetHeight - headerHeight) : 1;
      communityTop = community ? community.getBoundingClientRect().top + window.scrollY : 0;
      communityHeight = community?.offsetHeight || 1;
    }
    function draw(time) {
      frame = 0;
      if (reducedMotion.matches) return;
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 16;
      previousTime = time;
      smoothScroll += (window.scrollY - smoothScroll) * (1 - Math.exp(-elapsed / 240));
      const state = scrollMotion(window.scrollY, fadeDistance, communityTop, communityHeight, window.innerHeight);
      if (brand) {
        brand.style.opacity = state.opacity;
        brand.style.transform = `translateY(${-18 * (1 - state.opacity)}px)`;
      }
      if (window.scrollY + window.innerHeight > communityTop && window.scrollY < communityTop + communityHeight) {
        const drift = scrollMotion(smoothScroll, fadeDistance, communityTop, communityHeight, window.innerHeight).flagOffset;
        flags.forEach(flag => flag.style.setProperty('--flag-drift', `${drift * Number(flag.dataset.speed)}px`));
      }
      if (Math.abs(window.scrollY - smoothScroll) > .1) frame = requestAnimationFrame(draw);
      else previousTime = 0;
    }
    function schedule() { if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(draw); }
    function resetMotion() {
      cancelAnimationFrame(frame); frame = 0; previousTime = 0; smoothScroll = window.scrollY;
      brand?.style.removeProperty('opacity'); brand?.style.removeProperty('transform');
      flags.forEach(flag => flag.style.removeProperty('--flag-drift'));
      if (reducedMotion.matches) document.getAnimations().forEach(animation => animation.cancel());
      readLayout(); schedule();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { readLayout(); schedule(); }, { passive: true });
    window.addEventListener('load', () => { readLayout(); schedule(); }, { once: true });
    document.fonts.ready.then(() => { readLayout(); schedule(); });
    reducedMotion.addEventListener('change', resetMotion);
    readLayout(); schedule();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reducedMotion.matches) {
        const index = [...entry.target.parentElement.children].indexOf(entry.target);
        entry.target.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:(index % 4) * 55,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'});
      }
      observer.unobserve(entry.target);
    }), { threshold: 0.08 });
    document.querySelectorAll('[data-reveal],.section-heading,.teacher-card,.document-row').forEach(element => observer.observe(element));
  }
}
