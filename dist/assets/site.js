export const normalize = value => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
export function matchesTeacher(person, query, category) {
  return normalize(person.search).includes(normalize(query)) && (category === 'all' || person.categories.split(' ').includes(category));
}
export function whatsappUrl(name, grade, comment = '') {
  const message = `Здравствуйте! Меня зовут ${name.trim()}. Интересует поступление: ${grade}.${comment.trim() ? `\n${comment.trim()}` : ''}`;
  return `https://wa.me/971506136091?text=${encodeURIComponent(message)}`;
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

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'}); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }
}
