/**
 * คำนวณเลย์เอาต์ตามความกว้างจอ
 *
 * จอกว้าง (คอมพิวเตอร์ แท็บเล็ตแนวนอน) ใช้หน้าตาแบบเว็บ จอแคบใช้หน้าตาแบบแอปมือถือ
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react (hooks/useLayout.js เป็นตัวเรียกใช้)
 */

import { LAYOUT } from '../constants/theme.js';

/** ใช้หน้าตาแบบเว็บ (แถบเมนูบน แผงข้าง) หรือไม่ */
export function isWideLayout(windowWidth) {
  return windowWidth >= LAYOUT.WIDE_BREAKPOINT;
}

/** ขอบซ้ายขวาของเนื้อหา */
export function pagePadding(windowWidth) {
  return isWideLayout(windowWidth) ? LAYOUT.PAGE_PADDING_WIDE : LAYOUT.PAGE_PADDING_NARROW;
}

/** ความกว้างที่เนื้อหาใช้ได้จริง หลังหักขอบ และไม่เกินความกว้างสูงสุด */
export function contentWidth(windowWidth) {
  return Math.min(windowWidth, LAYOUT.CONTENT_MAX_WIDTH) - 2 * pagePadding(windowWidth);
}

/**
 * จำนวนคอลัมน์ของตารางการ์ด: ใส่ได้มากที่สุดเท่าที่การ์ดยังกว้างอย่างน้อย minItemWidth
 * อย่างน้อย 1 คอลัมน์เสมอ และไม่เกิน maxColumns
 */
export function gridColumns(availableWidth, minItemWidth, maxColumns, gap = 16) {
  const fit = Math.floor((availableWidth + gap) / (minItemWidth + gap));
  return Math.max(1, Math.min(maxColumns, fit));
}

/** ความกว้างของการ์ดแต่ละใบ เมื่อเรียง columns คอลัมน์ มีช่องว่าง gap ระหว่างกัน */
export function gridItemWidth(availableWidth, columns, gap = 16) {
  return (availableWidth - gap * (columns - 1)) / columns;
}
