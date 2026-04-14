"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToColor = stringToColor;
exports.stringToRGBA = stringToRGBA;
/**
 * Generates a deterministic HSL color based on a string.
 * This ensures the same tag or document always has the same color.
 * Uses a curated palette of premium brand colors.
 */
function stringToColor(str, isDark = true) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Curated premium hues: 
    // 199 (Cyan), 220 (Blue), 250 (Indigo), 280 (Purple), 330 (Rose), 30 (Amber), 160 (Emerald)
    const premiumHues = [199, 220, 250, 280, 330, 30, 160, 200, 240, 260, 340, 45, 175];
    const hue = premiumHues[Math.abs(hash % premiumHues.length)];
    // Saturation: High for brand feel (70-90%)
    // Lightness: Adaptive (60% for dark bg, 45% for light bg)
    const saturation = 75 + (Math.abs(hash % 15));
    const lightness = isDark ? 65 : 45;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
/**
 * Returns a semi-transparent version of the deterministic color.
 */
function stringToRGBA(str, opacity = 0.1, isDark = true) {
    const color = stringToColor(str, isDark);
    // Convert "hsl(h, s%, l%)" to "hsla(h, s%, l%, a)"
    return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
}
