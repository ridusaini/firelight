interface Coordinates {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  oklch: { l: number; c: number; h: number };
}

export function colorFormats(color: Coordinates) {
  const { rgb, hsl, oklch } = color;
  return [
    ['hex', color.hex],
    ['rgb', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ['hsl', `hsl(${Math.round(hsl.h) % 360}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`],
    ['oklch', `oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${(Math.round(oklch.h * 10) / 10) % 360})`]
  ] as const;
}
