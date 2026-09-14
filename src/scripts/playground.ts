/* Switching variant or accent only sets data-fl / --demo-accent; CSS re-points
   every colour from there. Only the labels naming the current choice, and the
   CSS variable names quoted in the code samples, are updated by hand. */

import { installCopyControls } from './clipboard';
import { contrastRatio, copyInk, cssVariable, paletteValues, tokenLabel } from '../lib/colour';

installCopyControls();

const pressOnly = (buttons: Iterable<Element>, active: Element): void => {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button === active));
};

/* --- Preview switcher ---------------------------------------------------- */

const playground = document.querySelector<HTMLElement>('#playground');

if (playground) {
  const variantButtons = document.querySelectorAll<HTMLElement>('[data-demo-variant]');
  const accentButtons = document.querySelectorAll<HTMLElement>('[data-demo-accent]');
  const accentName = document.querySelector<HTMLElement>('#accent-name');
  const previewVariant = playground.querySelector<HTMLElement>('[data-preview-variant]');
  const previewAccent = playground.querySelector<HTMLElement>('[data-preview-accent]');

  for (const button of variantButtons) {
    button.addEventListener('click', () => {
      const variant = button.dataset.demoVariant!;
      playground.dataset.fl = variant;
      if (previewVariant) previewVariant.textContent = variant;
      for (const token of playground.querySelectorAll<HTMLElement>('[data-preview-css-token]')) {
        token.textContent = cssVariable(variant, token.dataset.previewCssToken!);
      }
      pressOnly(variantButtons, button);
    });
  }

  for (const button of accentButtons) {
    button.addEventListener('click', () => {
      const accent = button.dataset.demoAccent!;
      playground.style.setProperty('--demo-accent', 'var(--site-' + accent + ')');
      if (accentName) accentName.textContent = tokenLabel(accent);
      if (previewAccent) previewAccent.textContent = accent;
      pressOnly(accentButtons, button);
    });
  }
}

/* --- Comparison grid ----------------------------------------------------- */

const comparison = document.querySelector<HTMLElement>('#compare');
const backgroundSelect = document.querySelector<HTMLSelectElement>('#comparison-background');
const foregroundSelect = document.querySelector<HTMLSelectElement>('#comparison-foreground');
const opacityInput = document.querySelector<HTMLInputElement>('#comparison-opacity');
const opacityValue = document.querySelector<HTMLElement>('#comparison-opacity-value');
const textInput = document.querySelector<HTMLInputElement>('#comparison-text');

if (comparison && backgroundSelect && foregroundSelect && opacityInput && opacityValue && textInput) {
  const modeButtons = document.querySelectorAll<HTMLElement>('button[data-comparison-mode]');
  const cards = document.querySelectorAll<HTMLElement>('[data-comparison-variant]');

  const setValueButton = (button: HTMLElement, value: string, label: string): void => {
    button.dataset.v = value;
    button.dataset.c = value;
    button.dataset.i = copyInk(value);
    button.querySelector<HTMLElement>('span')!.textContent = value;
    button.setAttribute('aria-label', 'Copy ' + label + ' as hex');
  };

  const update = (): void => {
    const backgroundToken = backgroundSelect.value;
    const foregroundToken = foregroundSelect.value;
    const mode = comparison.dataset.comparisonMode;
    const sampleText = textInput.value;
    const opacity = Number(opacityInput.value) / 100;
    const opacityLabel = opacityInput.value + '%';
    const styles = getComputedStyle(document.documentElement);

    comparison.style.setProperty('--comparison-opacity', String(opacity));
    opacityValue.textContent = opacityLabel;
    opacityInput.setAttribute('aria-valuetext', opacityLabel);

    for (const card of cards) {
      const variant = card.dataset.comparisonVariant!;
      const variantLabel = card.querySelector<HTMLElement>('strong')!.textContent ?? '';
      const values = paletteValues(variant, styles);
      if (!values?.[backgroundToken] || !values[foregroundToken]) continue;

      const backgroundValue = values[backgroundToken];
      const foregroundValue = values[foregroundToken];

      card.style.setProperty('--comparison-background', 'var(' + cssVariable(variant, backgroundToken) + ')');
      card.style.setProperty('--comparison-foreground', 'var(' + cssVariable(variant, foregroundToken) + ')');

      card.querySelector<HTMLElement>('[data-comparison-background-token]')!.textContent = backgroundToken;
      card.querySelector<HTMLElement>('[data-comparison-foreground-token]')!.textContent = foregroundToken;
      card.querySelector<HTMLElement>('[data-comparison-text]')!.textContent = sampleText;
      card.querySelector<HTMLElement>('[data-comparison-contrast]')!.textContent =
        contrastRatio(backgroundValue, foregroundValue, opacity).toFixed(2) + ':1';

      setValueButton(card.querySelector<HTMLElement>('[data-comparison-background-value]')!, backgroundValue, variantLabel + ' ' + backgroundToken);
      setValueButton(card.querySelector<HTMLElement>('[data-comparison-foreground-value]')!, foregroundValue, variantLabel + ' ' + foregroundToken);

      card.querySelector<HTMLElement>('[data-comparison-preview]')!.setAttribute('aria-label', mode === 'text'
        ? variantLabel + ' ' + foregroundToken + ' text, ' + foregroundValue + ' at ' + opacityLabel + ' opacity, on ' + backgroundToken + ', ' + backgroundValue + ': ' + (sampleText || 'empty')
        : variantLabel + ' ' + backgroundToken + ', ' + backgroundValue + ', and ' + foregroundToken + ', ' + foregroundValue + ' at ' + opacityLabel + ' opacity');
    }
  };

  backgroundSelect.addEventListener('change', update);
  foregroundSelect.addEventListener('change', update);
  textInput.addEventListener('input', update);
  opacityInput.addEventListener('input', update);

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      const mode = button.dataset.comparisonMode;
      comparison.dataset.comparisonMode = mode;
      textInput.disabled = mode !== 'text';
      pressOnly(modeButtons, button);
      update();
      if (mode === 'text') textInput.focus();
    });
  }

  update();
}
