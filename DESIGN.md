# BIDI DLH Design System

## Identity & Mode
- Mode: **Operate** (government environmental licensing, field inspection, complaints, and document archive portal).
- Light-first palette on clean white surfaces (`#ffffff`) with subtle slate separation (`#f8fafc`).

## Color Tokens (`src/app/globals.css`)
- Primary ink & dark controls: `--color-primary: #0f172a` (`slate-900`)
- Secondary / Brand accent (DLH): `--color-secondary: #0d9488` (`teal-600`), container `#ccfbf1` (`teal-100`), paired with `emerald-600` (`#059669`) for positive/completed states.
- Surface hierarchy: `--color-surface: #ffffff`, `--color-slate-50: #f8fafc`, `--color-gray-50: #f9fafb`, `--color-outline-variant: #cbd5e1`.
- Semantic status colors:
  - Success / Taat: `emerald`
  - Warning / Diproses / Kurang Taat: `amber`
  - Error / Tidak Taat / Ditolak: `rose` (`--color-error: #ef4444`)
  - Info / Dikembalikan / Perizinan pin: `blue`
  - Pengaduan map pin distinction only: `purple` (`#a855f7`)

## Typography & Accessibility
- UI body font: `Arial, Helvetica, sans-serif` (and `Arial Nova Cond` / `BookmanOldStyle` inside `.bap-docx-viewer` for Word BAP print parity).
- Keyboard focus: global `:focus-visible` outline (`2px solid #0d9488`, `2px` offset).
- Interactive tap targets: minimum `44x44px` (`w-11 h-11`) for icon controls.
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables non-essential motion.
