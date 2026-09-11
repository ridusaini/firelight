let timer: ReturnType<typeof setTimeout>;
export async function copy(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch { return false; }
}
export function show(message: string, ok: boolean, background = '', foreground = '', failureMessage = "Couldn't copy that. Try selecting the value and copying it manually."): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = ok ? message : failureMessage;
  toast.style.background = ok ? background : '';
  toast.style.color = ok ? foreground : '';
  toast.classList.toggle('fail', !ok);
  toast.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('on'), ok ? 1400 : 3200);
}
export function installCopyControls(): void {
  document.documentElement.classList.add('js');
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>('[data-v]');
    if (!button?.dataset.v) return;
    const { v, c, i } = button.dataset;
    void copy(v).then(ok => show(v, ok, c, i));
  });
}
