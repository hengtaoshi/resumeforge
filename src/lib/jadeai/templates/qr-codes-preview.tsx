// JadeAI QrCodesPreview component for template rendering

import { useEffect, useState } from 'react';
import type { QrCodeItem } from './resume-types';

interface QrCodesPreviewProps {
  items: QrCodeItem[];
}

function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try {
    const raw = str.startsWith('http') ? str : `https://${str}`;
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname;
    return host === 'localhost' || /\.\w{2,}$/.test(host) || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  } catch {
    return false;
  }
}

function generateQrSvgFallback(text: string, size: number): Promise<string> {
  const dots = 21;
  const cellSize = size / dots;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    <rect x="0" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="#000000"/>
    <rect x="${cellSize}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#ffffff"/>
    <rect x="${size - cellSize * 7}" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="#000000"/>
    <rect x="${size - cellSize * 6}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#ffffff"/>
    <rect x="0" y="${size - cellSize * 7}" width="${cellSize * 7}" height="${cellSize * 7}" fill="#000000"/>
    <rect x="${cellSize}" y="${size - cellSize * 6}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#ffffff"/>
    <text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" font-size="8" fill="#666">QR</text>
  </svg>`;
  return Promise.resolve(svg);
}

export function QrCodesPreview({ items }: QrCodesPreviewProps) {
  const filtered = items.filter((q) => isValidUrl(q.url));
  const [svgs, setSvgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (filtered.length === 0) {
      setSvgs({});
      return;
    }
    let cancelled = false;
    (async () => {
      const results: Record<string, string> = {};
      for (const qr of filtered) {
        try {
          results[qr.id] = await generateQrSvgFallback(qr.url, 80);
        } catch {
          // skip
        }
      }
      if (!cancelled) setSvgs(results);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtered)]);

  if (filtered.length === 0) return null;
  const hasAnySvg = filtered.some((qr) => svgs[qr.id]);
  if (!hasAnySvg) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 24px', paddingTop: '4px' }}>
      {filtered.map((qr) => {
        const svg = svgs[qr.id];
        if (!svg) return null;
        return (
          <div key={qr.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: 96 }}>
            <div style={{ width: 80, height: 80 }} dangerouslySetInnerHTML={{ __html: svg }} />
            {qr.label && (
              <span style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-all', maxWidth: 96 }}>{qr.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
