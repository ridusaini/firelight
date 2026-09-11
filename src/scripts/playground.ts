import { installCopyControls } from './clipboard';
import { cssVariable, paletteValues, contrastRatio, copyInk } from '../lib/colour';
installCopyControls();
  const playground=document.querySelector<HTMLElement>("#playground")!;
  const variantButtons=document.querySelectorAll<HTMLElement>("[data-demo-variant]");
  const accentButtons=document.querySelectorAll<HTMLElement>("[data-demo-accent]");
  const accentName=document.querySelector<HTMLElement>("#accent-name")!;
  const previewVariant=playground ? playground.querySelector<HTMLElement>("[data-preview-variant]")! : null;
  const previewAccent=playground ? playground.querySelector<HTMLElement>("[data-preview-accent]")! : null;

  variantButtons.forEach(function(button){
    button.addEventListener("click",function(){
      const variant=button.dataset.demoVariant!;
      playground.dataset.fl=variant;
      if(previewVariant) previewVariant.textContent=variant;
      playground.querySelectorAll<HTMLElement>("[data-preview-css-token]").forEach(function(token){
        token.textContent=cssVariable(variant,token.dataset.previewCssToken!);
      });
      variantButtons.forEach(function(candidate){
        candidate.setAttribute("aria-pressed",candidate===button ? "true" : "false");
      });
    });
  });

  accentButtons.forEach(function(button){
    button.addEventListener("click",function(){
      const accent=button.dataset.demoAccent!;
      playground.style.setProperty("--demo-accent","var(--site-"+accent+")");
      if(accentName) accentName.textContent=button.getAttribute("aria-label") ?? "";
      if(previewAccent) previewAccent.textContent=accent;
      accentButtons.forEach(function(candidate){
        candidate.setAttribute("aria-pressed",candidate===button ? "true" : "false");
      });
    });
  });

  const comparison=document.querySelector<HTMLElement>("#compare")!;
  const comparisonBackground=document.querySelector<HTMLSelectElement>("#comparison-background")!;
  const comparisonForeground=document.querySelector<HTMLSelectElement>("#comparison-foreground")!;
  const comparisonOpacity=document.querySelector<HTMLInputElement>("#comparison-opacity")!;
  const comparisonOpacityValue=document.querySelector<HTMLElement>("#comparison-opacity-value")!;
  const comparisonTextInput=document.querySelector<HTMLInputElement>("#comparison-text")!;
  const comparisonModeButtons=document.querySelectorAll<HTMLElement>("button[data-comparison-mode]");
  const comparisonCards=document.querySelectorAll<HTMLElement>("[data-comparison-variant]");

  function updateComparison(){
    const backgroundToken=comparisonBackground.value;
    const foregroundToken=comparisonForeground.value;
    const mode=comparison.dataset.comparisonMode;
    const sampleText=comparisonTextInput.value;
    const opacity=Number(comparisonOpacity.value)/100;
    const opacityLabel=comparisonOpacity.value+"%";
    const styles=getComputedStyle(document.documentElement);
    comparison.style.setProperty("--comparison-opacity",String(opacity));
    comparisonOpacityValue.textContent=opacityLabel;
    comparisonOpacity.setAttribute("aria-valuetext",opacityLabel);
    comparisonCards.forEach(function(card){
      const variant=card.dataset.comparisonVariant!;
      const variantLabel=card.querySelector<HTMLElement>("strong")!.textContent;
      const values=paletteValues(variant,styles);
      if(!values || !values[backgroundToken] || !values[foregroundToken]) return;

      const backgroundValue=values[backgroundToken];
      const foregroundValue=values[foregroundToken];
      const backgroundButton=card.querySelector<HTMLElement>("[data-comparison-background-value]")!;
      const foregroundButton=card.querySelector<HTMLElement>("[data-comparison-foreground-value]")!;
      const preview=card.querySelector<HTMLElement>("[data-comparison-preview]")!;
      card.style.setProperty("--comparison-background","var("+cssVariable(variant,backgroundToken)+")");
      card.style.setProperty("--comparison-foreground","var("+cssVariable(variant,foregroundToken)+")");
      card.querySelector<HTMLElement>("[data-comparison-background-token]")!.textContent=backgroundToken;
      card.querySelector<HTMLElement>("[data-comparison-foreground-token]")!.textContent=foregroundToken;
      card.querySelector<HTMLElement>("[data-comparison-text]")!.textContent=sampleText;
      card.querySelector<HTMLElement>("[data-comparison-contrast]")!.textContent=
        contrastRatio(backgroundValue,foregroundValue,opacity).toFixed(2)+":1";
      backgroundButton.dataset.v=backgroundValue;
      backgroundButton.dataset.c=backgroundValue;
      backgroundButton.dataset.i=copyInk(backgroundValue);
      backgroundButton.querySelector<HTMLElement>("span")!.textContent=backgroundValue;
      backgroundButton.setAttribute("aria-label","Copy "+variantLabel+" "+backgroundToken+" as hex");
      foregroundButton.dataset.v=foregroundValue;
      foregroundButton.dataset.c=foregroundValue;
      foregroundButton.dataset.i=copyInk(foregroundValue);
      foregroundButton.querySelector<HTMLElement>("span")!.textContent=foregroundValue;
      foregroundButton.setAttribute("aria-label","Copy "+variantLabel+" "+foregroundToken+" as hex");
      preview.setAttribute("aria-label",mode==="text" ?
        variantLabel+" "+foregroundToken+" text, "+foregroundValue+" at "+opacityLabel+" opacity, on "+backgroundToken+", "+
          backgroundValue+": "+(sampleText || "empty") :
        variantLabel+" "+backgroundToken+", "+backgroundValue+", and "+foregroundToken+", "+foregroundValue+" at "+opacityLabel+" opacity");
    });
  }

  if(comparison && comparisonBackground && comparisonForeground && comparisonTextInput && comparisonOpacity && comparisonOpacityValue){
    comparisonBackground.addEventListener("change",updateComparison);
    comparisonForeground.addEventListener("change",updateComparison);
    comparisonTextInput.addEventListener("input",updateComparison);
    comparisonOpacity.addEventListener("input",updateComparison);
    comparisonModeButtons.forEach(function(button){
      button.addEventListener("click",function(){
        const mode=button.dataset.comparisonMode;
        comparison.dataset.comparisonMode=mode;
        comparisonTextInput.disabled=mode!=="text";
        comparisonModeButtons.forEach(function(candidate){
          candidate.setAttribute("aria-pressed",candidate===button ? "true" : "false");
        });
        updateComparison();
        if(mode==="text") comparisonTextInput.focus();
      });
    });
    updateComparison();
  }
