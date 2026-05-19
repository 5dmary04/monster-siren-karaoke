/**
 * Module-level singleton — state survives component mounts/unmounts and mode switches.
 * Import anywhere; all callers share the same reactive objects.
 */
import { ref, reactive, computed, watch } from 'vue'

// ── Theme definitions ────────────────────────────────────────────────────────
// variants[0] = light background, variants[1] = dark background.
// Light variant is always the dark one with base ↔ border swapped.

export const THEMES = [
  {
    name: 'Amiya',
    variants: [
      { base: '#ffffff', sweep: '#00b4d8', border: '#05054d' },
      { base: '#05054d', sweep: '#4ddaea', border: '#ffffff' },
    ],
  },
  {
    name: 'Theresa',
    variants: [
      { base: '#ededed', sweep: '#ffb8c2', border: '#d04e68' },
      { base: '#d04e68', sweep: '#ffb8c2', border: '#ededed' },
    ],
  },
  {
    name: 'Priestess',
    variants: [
      { base: '#f1d6ff', sweep: '#5500bb', border: '#160146' },
      { base: '#160146', sweep: '#813ee5', border: '#f1d6ff' },
    ],
  },
  {
    name: "Kal'tist",
    variants: [
      { base: '#f9fff5', sweep: '#04d76a', border: '#083f1d' },
      { base: '#083f1d', sweep: '#04d76a', border: '#f9fff5' },
    ],
  },
]

// ── Persistent state ─────────────────────────────────────────────────────────

export const themeIdx        = ref(0)
export const variantOverride = ref(null)   // null=auto, 0=light, 1=dark
export const detectedVariant = ref(1)      // updated by cover-art analysis; default dark
export const fontSize        = ref(2.6)
export const stroke          = ref(5)

export const activeVariant = computed(() => variantOverride.value ?? detectedVariant.value)

// Live color triplet — modified in place by custom pickers or theme switches
export const style = reactive({ ...THEMES[0].variants[1] })

// Custom theme colors — seeded when user switches to Custom
export const customColors = reactive({ base: '#ffffff', sweep: '#4a9eff', border: '#000000' })

export function setTheme(idx) {
  themeIdx.value = idx
  if (idx === THEMES.length) {
    Object.assign(customColors, { base: style.base, sweep: style.sweep, border: style.border })
    Object.assign(style, customColors)
  } else {
    Object.assign(style, THEMES[idx].variants[activeVariant.value])
  }
}

// Sync named-theme colors when variant changes (Custom is unaffected)
watch([themeIdx, activeVariant], ([ti, vi]) => {
  if (ti < THEMES.length) Object.assign(style, THEMES[ti].variants[vi])
})

// Keep customColors in sync when pickers edit style directly
watch([() => style.base, () => style.sweep, () => style.border], ([b, s, bo]) => {
  if (themeIdx.value === THEMES.length) Object.assign(customColors, { base: b, sweep: s, border: bo })
})

// ── Cover-art brightness analysis ────────────────────────────────────────────

export async function analyzeBrightness(url) {
  if (!url) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 16
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, 16, 16)
  const data = ctx.getImageData(0, 0, 16, 16).data
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  // Threshold 160: background is displayed at ~80% brightness, so the effective
  // luminance is higher than the raw pixel value — raise the cutoff accordingly.
  detectedVariant.value = (total / (data.length / 4)) > 160 ? 0 : 1
}

// ── CSS vars object (bind to any element with :style) ────────────────────────

export const karaokeStyleVars = computed(() => ({
  '--k-base':      style.base,
  '--k-sweep':     style.sweep,
  '--k-border':    style.border,
  '--k-stroke':    `${stroke.value}px`,
  '--k-font-size': `${fontSize.value}rem`,
}))
