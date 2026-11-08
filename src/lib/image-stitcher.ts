import sharp from 'sharp';

/**
 * Menggabungkan beberapa gambar tanda tangan / paraf base64 secara horizontal menjadi satu gambar.
 * Digunakan terutama untuk menampilkan paraf seluruh anggota Tim Pengawas dan seluruh Saksi
 * secara berjajar rapi pada footer dokumen Word (.docx) & pratinjau web.
 */
export async function combineParafImages(
  base64List: (string | null | undefined)[],
  targetHeight: number = 45,
  gap: number = 10
): Promise<string> {
  if (!base64List || !Array.isArray(base64List)) return '';

  const validBuffers: Buffer[] = [];
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;

  for (const item of base64List) {
    if (!item || typeof item !== 'string' || !base64Regex.test(item)) continue;
    try {
      const rawData = item.replace(base64Regex, '');
      const buf = Buffer.from(rawData, 'base64');
      if (buf.length > 0) {
        // Cek apakah gambar memiliki piksel non-transparan
        const stats = await sharp(buf).stats();
        if (stats.channels[3] && stats.channels[3].max === 0) {
          // Lewati jika seluruh piksel 100% transparan
          continue;
        }
        validBuffers.push(buf);
      }
    } catch {
      // Abaikan data korup
    }
  }

  if (validBuffers.length === 0) return '';
  if (validBuffers.length === 1) {
    return `data:image/png;base64,${validBuffers[0].toString('base64')}`;
  }

  const resizedImages: { buffer: Buffer; width: number }[] = [];
  let totalWidth = 0;

  for (const buf of validBuffers) {
    try {
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) continue;

      let trimmedBuf = buf;
      try {
        trimmedBuf = await sharp(buf).trim().toBuffer();
      } catch {
        trimmedBuf = buf;
      }

      const trimmedMeta = await sharp(trimmedBuf).metadata();
      const tWidth = trimmedMeta.width || meta.width;
      const tHeight = trimmedMeta.height || meta.height;

      const scale = targetHeight / tHeight;
      const width = Math.max(10, Math.round(tWidth * scale));

      const resizedBuf = await sharp(trimmedBuf)
        .resize(width, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      resizedImages.push({ buffer: resizedBuf, width });
      totalWidth += width;
    } catch (e) {
      console.warn('Gagal memproses salah satu paraf:', e);
    }
  }

  if (resizedImages.length === 0) return '';
  if (resizedImages.length === 1) {
    return `data:image/png;base64,${resizedImages[0].buffer.toString('base64')}`;
  }

  const canvasWidth = totalWidth + (resizedImages.length - 1) * gap;
  const canvasHeight = targetHeight;

  const compositeList = [];
  let currentX = 0;

  for (let i = 0; i < resizedImages.length; i++) {
    compositeList.push({
      input: resizedImages[i].buffer,
      left: currentX,
      top: 0
    });
    currentX += resizedImages[i].width + gap;
  }

  const stitched = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(compositeList)
    .png()
    .toBuffer();

  return `data:image/png;base64,${stitched.toString('base64')}`;
}
