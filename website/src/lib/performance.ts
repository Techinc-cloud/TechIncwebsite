/**
 * Device capability checks shared by boot, scrolling and the 3D engine. Cheap on
 * purpose: they run before three.js is downloaded, and they decide whether it
 * is downloaded at all.
 */

type Device = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

/**
 * How much of the 3D scene a device gets.
 *
 *   full      desktop-class: shadows, post chain, every animated layer
 *   balanced  phones, tablets, mid laptops: no post chain, small static shadow
 *   lite      very low-end hardware: no shadows, no post chain, reduced scene,
 *             reduced render resolution, 30fps cap
 *   static    no 3D at all — a pre-rendered poster of the same scene
 *
 * The old rule was a single yes/no that turned 3D off for every touch device and
 * every machine with four cores or fewer, which on today's hardware is most of
 * them. Weak devices now get a lighter version of the same scene, and the
 * frame-rate watchdog in the engine steps them down further if that is still too
 * much. Only devices that genuinely cannot run it fall through to the poster.
 */
export type QualityTier = 'full' | 'balanced' | 'lite' | 'static'

export function qualityTier(): QualityTier {
  const nav = navigator as Device
  const mem = nav.deviceMemory
  const cores = nav.hardwareConcurrency
  const conn = nav.connection

  // Explicit user preferences always win.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  if (conn?.saveData === true) return 'static'
  // Downloading a three.js bundle over a 2g link is the opposite of a favour.
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return 'static'

  // Below this there is not enough memory to hold a WebGL scene alongside the
  // page without the browser killing the tab.
  if (mem !== undefined && mem <= 0.5) return 'static'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const veryWeak = (mem !== undefined && mem <= 2) || (cores !== undefined && cores <= 2)
  if (veryWeak) return 'lite'

  const weak = (mem !== undefined && mem <= 4) || (cores !== undefined && cores <= 4)
  if (coarse || weak) return 'balanced'

  return 'full'
}

/**
 * Whether to keep native scrolling instead of the smooth-scroll layer. This is
 * about input handling, not 3D, so it stays broader than `qualityTier`: touch
 * devices already have native momentum and Lenis only adds a permanent ticker.
 */
export function prefersLightweightExperience(): boolean {
  const nav = navigator as Device
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
    nav.connection?.saveData === true
  )
}
