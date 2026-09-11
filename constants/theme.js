/**
 * ธีมของแอป — สี ระยะห่าง ขนาดตัวอักษร
 *
 * แยกจาก config.js เพราะไฟล์นี้เกี่ยวกับ "หน้าตา" อย่างเดียว
 * ส่วน config.js เกี่ยวกับ "พฤติกรรม" ของระบบ
 */

export const COLORS = {
  /** สีกรมท่า ใช้เป็นสีหลักของแบรนด์ (จากม็อกอัพ) */
  primary: '#1B3A5C',
  primaryDark: '#12283F',

  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#E1E5EA',

  text: '#1A1A1A',
  textMuted: '#6B7280',

  /** สีเตือน ใช้กับแถบ disclaimer และป้าย "ยังไม่ยืนยัน" */
  warningBackground: '#FEF6DC',
  warningBorder: '#F0C33C',
  /** ตัวอักษรระดับ "ระวัง" เช่น คลื่นเล็กน้อย ฝนปานกลาง (ส้มอิฐ เข้มพอให้อ่านบนพื้นขาวได้ 5.6:1) */
  caution: '#BF360C',

  danger: '#D32F2F',
  white: '#FFFFFF',

  /** จุดสีฟ้าแสดงตำแหน่งผู้ใช้บนแผนที่ ใช้สีเดียวกันทั้งมือถือและเว็บ */
  userLocation: '#1E88E5',

  /** พื้นป้าย "ข้อมูลทางการ" ใช้ฟ้าอ่อนคู่กับสีหลัก ไม่ใช้สีเขียว เพราะสีเขียวสื่อว่า "ปลอดภัย" */
  verifiedBackground: '#E3F2FD',
};

/** ระยะห่างมาตรฐาน ใช้คูณเป็นเท่า ๆ เพื่อให้เลย์เอาต์สม่ำเสมอ */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZES = {
  small: 13,
  body: 15,
  subtitle: 17,
  title: 20,
  heading: 24,
  /** ใหญ่พิเศษ ใช้เฉพาะโหมดเดินทาง เพราะผู้ใช้กำลังขับรถ ต้องอ่านได้ใน 1 วินาที */
  alert: 28,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};
