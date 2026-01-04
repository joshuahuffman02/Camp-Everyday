import { Manrope, Sora } from "next/font/google";

/**
 * Keepr Brand Typography
 *
 * Sora - Headlines and display text (weights 500, 600, 700)
 * Manrope - Body text and UI elements (weights 400, 500, 600)
 *
 * These fonts are loaded via next/font for optimal performance:
 * - Automatic self-hosting (no external requests)
 * - Zero layout shift with size-adjust
 * - Subsetting for smaller file sizes
 */

export const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Combined font class names for the html element
 * Usage: <html className={fontVariables}>
 */
export const fontVariables = `${sora.variable} ${manrope.variable}`;
