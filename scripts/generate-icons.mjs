import sharp from 'sharp'
import { mkdirSync } from 'fs'

const SIZES = [16, 24, 32, 48, 64, 96, 128, 256]

// ── SVG icon: document + wand/sparkle (AI resume enhancement) ──
function svgIcon(size) {
  const pad = Math.round(size * 0.08)
  const inner = size - pad * 2
  const r = Math.round(size * 0.2)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#14b8a6"/>
    <stop offset="60%" stop-color="#0d9488"/>
    <stop offset="100%" stop-color="#0f766e"/>
  </linearGradient>
</defs>
<!-- Background -->
<rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" fill="url(#bg)"/>
<!-- Document -->
<g transform="translate(${Math.round(size * 0.25)}, ${Math.round(size * 0.2)}) scale(${size / 256})">
  <path d="M32 32h112l80 80v136a16 16 0 01-16 16H48a16 16 0 01-16-16V48a16 16 0 0116-16z" fill="#fff"/>
  <path d="M144 32v80h80" fill="none" stroke="#0d9488" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
  <!-- Text lines -->
  <rect x="56" y="148" width="120" height="10" rx="5" fill="#0d9488" opacity="0.25"/>
  <rect x="56" y="172" width="100" height="10" rx="5" fill="#0d9488" opacity="0.2"/>
  <rect x="56" y="196" width="112" height="10" rx="5" fill="#0d9488" opacity="0.15"/>
</g>
<!-- Sparkle ✦ -->
<g transform="translate(${Math.round(size * 0.68)}, ${Math.round(size * 0.26)}) scale(${size / 256})">
  <path d="M0-24c4 10 14 20 24 24-10 4-20 14-24 24-4-10-14-20-24-24 10-4 20-14 24-24z" fill="#fcd34d" opacity="0.9"/>
</g>
</svg>`
}

async function generate() {
  mkdirSync('build', { recursive: true })

  // Generate each PNG size
  for (const size of SIZES) {
    const svg = svgIcon(size)
    await sharp(Buffer.from(svg)).png().toFile(`build/icon-${size}.png`)
    console.log(`  ✓ build/icon-${size}.png`)
  }

  // Primary 256×256 (electron-builder uses this to generate .ico automatically)
  const svg256 = svgIcon(256)
  await sharp(Buffer.from(svg256)).png().toFile('build/icon.png')
  console.log('  ✓ build/icon.png')

  // Favicon for HTML
  const svg32 = svgIcon(32)
  await sharp(Buffer.from(svg32)).png().toFile('public/favicon.png')
  console.log('  ✓ public/favicon.png')

  console.log('\nDone!')
}

generate().catch(err => { console.error(err); process.exit(1) })
