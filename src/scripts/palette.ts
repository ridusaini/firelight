import { copy, show, installCopyControls } from './clipboard';
import { cssVariable, paletteValues, variantCss } from '../lib/colour';
installCopyControls();
document.querySelectorAll<HTMLButtonElement>('[data-copy-variant]').forEach(button => {
  button.addEventListener('click', async () => {
    const name = button.dataset.copyVariant!;
    const styles = getComputedStyle(document.documentElement);
    const text = variantCss(name, paletteValues(name, styles));
    const ok = text !== null && await copy(text);
    show(name.charAt(0).toUpperCase()+name.slice(1)+' CSS copied', ok,
      styles.getPropertyValue(cssVariable(name,'bg2')), styles.getPropertyValue(cssVariable(name,'fg0')),
      "Couldn't copy this palette. You can download firelight.css at the top of the page.");
  });
});
