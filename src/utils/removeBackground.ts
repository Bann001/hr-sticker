const TOLERANCE = 60;

export function removeBackground(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;

      // Sample the background from the four corner pixels
      const corners = [
        { r: d[0], g: d[1], b: d[2] },
        { r: d[(c.width - 1) * 4], g: d[(c.width - 1) * 4 + 1], b: d[(c.width - 1) * 4 + 2] },
        { r: d[(c.height - 1) * c.width * 4], g: d[(c.height - 1) * c.width * 4 + 1], b: d[(c.height - 1) * c.width * 4 + 2] },
        { r: d[(c.height - 1) * c.width * 4 + (c.width - 1) * 4], g: d[(c.height - 1) * c.width * 4 + (c.width - 1) * 4 + 1], b: d[(c.height - 1) * c.width * 4 + (c.width - 1) * 4 + 2] },
      ];

      // Use the most common corner color as background
      const bgR = Math.round(corners.reduce((s, p) => s + p.r, 0) / corners.length);
      const bgG = Math.round(corners.reduce((s, p) => s + p.g, 0) / corners.length);
      const bgB = Math.round(corners.reduce((s, p) => s + p.b, 0) / corners.length);

      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - bgR;
        const dg = d[i + 1] - bgG;
        const db = d[i + 2] - bgB;
        if (dr * dr + dg * dg + db * db < TOLERANCE * TOLERANCE) {
          d[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
