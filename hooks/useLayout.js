/**
 * ขนาดจอปัจจุบันและรูปแบบหน้าจอที่ควรใช้
 *
 * isWide = true  → หน้าตาแบบเว็บ (แถบเมนูบน แผงข้าง แผนที่เต็มจอ)
 * isWide = false → หน้าตาแบบแอปมือถือ (แถบแท็บล่าง เนื้อหาเรียงลงมา)
 * เปลี่ยนตามทันทีเมื่อผู้ใช้ย่อขยายหน้าต่างเบราว์เซอร์หรือหมุนแท็บเล็ต (สูตรอยู่ใน utils/layout.js)
 */

import { useWindowDimensions } from 'react-native';
import { isWideLayout, pagePadding, contentWidth } from '../utils/layout';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isWide: isWideLayout(width),
    padding: pagePadding(width),
    contentWidth: contentWidth(width),
  };
}
