'use client';

import QRCode from 'qrcode';
import { CHECKLIST_PUBLIC_URL, getQrLogoGeometry } from './checklist-perizinan';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadLogoImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function generateChecklistQrWithLogo(
  targetUrl: string = CHECKLIST_PUBLIC_URL,
  canvasSize: number = 600
): Promise<string> {
  const size = canvasSize % 2 === 0 ? canvasSize : canvasSize + 1;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, targetUrl, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const ctx = canvas.getContext('2d');
  if (ctx) {
    try {
      const logoImg = await loadLogoImage('/BIDIDLH.png');
      const geom = getQrLogoGeometry(size);

      drawRoundedRect(ctx, geom.padX, geom.padX, geom.padSize, geom.padRadius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f766e';
      ctx.stroke();

      ctx.drawImage(logoImg, geom.logoX, geom.logoX, geom.logoSize, geom.logoSize);
    } catch {
      // Keep clean high-contrast QR code if logo image cannot be drawn
    }
  }

  return canvas.toDataURL('image/png');
}

export function downloadQrPng(dataUrl: string, filename = 'QR_Checklist_Perizinan_BIDI_DLH.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
