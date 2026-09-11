/**
 * ความคมชัดของสีตัวอักษรเทียบกับพื้น ตามสูตร WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * ใช้ในเทสต์ตรวจว่าทุกคู่สีในแอปอ่านออก (tests/color.test.js)
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

/** แปลง "#RRGGBB" หรือ "#RGB" เป็น [r, g, b] ช่วง 0-255 */
function parseHex(hex) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex));
  if (!match) throw new Error(`รหัสสีต้องเป็นรูปแบบ #RRGGBB หรือ #RGB แต่ได้ "${hex}"`);
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1];
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16));
}

/** ความสว่างสัมพัทธ์ 0 (ดำ) ถึง 1 (ขาว) — ตาคนไวต่อสีเขียวที่สุด จึงให้น้ำหนักเขียวมากสุด */
function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * อัตราส่วนความคมชัด 1 (มองไม่เห็น) ถึง 21 (ดำบนขาว)
 * WCAG ระดับ AA: ตัวอักษรขนาดปกติต้องได้อย่างน้อย 4.5
 */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
