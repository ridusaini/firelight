const header = document.querySelector<HTMLElement>('[data-reveal-brand-after]');
const target = header?.dataset.revealBrandAfter ? document.getElementById(header.dataset.revealBrandAfter) : null;

if (header && target && 'IntersectionObserver' in window) {
  const update = () => {
    header.dataset.brandVisible = String(target.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom);
  };
  let observer: IntersectionObserver;
  const observe = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(update, { rootMargin: `-${header.getBoundingClientRect().height}px 0px 0px 0px`, threshold: 0 });
    observer.observe(target);
    update();
  };
  observe();
  if ('ResizeObserver' in window) new ResizeObserver(observe).observe(header);
  window.addEventListener('pageshow', update);
}
