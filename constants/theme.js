/**
 * ธีมของแอป — สี ฟอนต์ แบบตัวอักษร ระยะห่าง เงา และขนาดหน้าจอ
 *
 * แยกจาก config.js เพราะไฟล์นี้เกี่ยวกับ "หน้าตา" อย่างเดียว
 * ส่วน config.js เกี่ยวกับ "พฤติกรรม" ของระบบ
 *
 * ทุกคู่สีตัวอักษร/พื้นที่ใช้จริงผ่านเกณฑ์ความคมชัด WCAG 4.5:1 (tests/color.test.js)
 * ทุกค่าที่โค้ดเรียกใช้ต้องมีอยู่ในไฟล์นี้ (tests/theme.test.js)
 */

export const COLORS = {
  /** สีกรมท่า สีหลักของแบรนด์ (จากม็อกอัพ) */
  primary: '#1B3A5C',
  primaryDark: '#12283F',
  /** ปุ่มสีหลักตอนเอาเมาส์ชี้ (เว็บ) */
  primaryHover: '#24507C',
  /** พื้นอ่อนโทนกรมท่า: เมนูที่เลือกอยู่ ชิปที่เลือก กรอบไอคอน */
  primarySoft: '#E8EEF6',
  /** ตัวอักษรรองบนพื้นกรมท่า (ส่วนหัวของหน้าแรก) */
  onPrimaryMuted: '#C8D5E5',
  /** สีเหลืองของโลโก้ (สีเดียวกับระดับ "เฝ้าระวัง") */
  accent: '#FBC02D',

  /** พื้นหลังของหน้า */
  page: '#F3F5F8',
  /** พื้นการ์ด แผง และแถบเมนู */
  card: '#FFFFFF',
  /** พื้นการ์ดตอนเอาเมาส์ชี้หรือกด */
  cardHover: '#F7F9FC',
  border: '#E1E6ED',
  divider: '#EDF0F4',

  text: '#132033',
  textSecondary: '#46546A',
  textMuted: '#5B6778',
  white: '#FFFFFF',

  /** สีเตือน ใช้กับแถบ disclaimer และป้าย "ยังไม่ยืนยัน" */
  warningBackground: '#FEF6DC',
  warningBorder: '#F0C33C',
  /** ตัวอักษรระดับ "ระวัง" เช่น คลื่นเล็กน้อย ฝนปานกลาง (ส้มอิฐ เข้มพอให้อ่านบนพื้นขาวได้ 5.6:1) */
  caution: '#BF360C',

  danger: '#D32F2F',
  /** ตัวอักษรสีแดงบนพื้นแดงอ่อน และปุ่มสีแดงตอนเอาเมาส์ชี้ */
  dangerDark: '#B71C1C',
  dangerSoft: '#FDECEC',

  /** จุดสีฟ้าแสดงตำแหน่งผู้ใช้บนแผนที่ ใช้สีเดียวกันทั้งมือถือและเว็บ */
  userLocation: '#1E88E5',

  /** พื้นป้าย "ข้อมูลทางการ" ใช้ฟ้าอ่อนคู่กับสีหลัก ไม่ใช้สีเขียว เพราะสีเขียวสื่อว่า "ปลอดภัย" */
  verifiedBackground: '#E3F2FD',
};

/**
 * ฟอนต์ IBM Plex Sans Thai โหลดใน App.js ด้วยชื่อเหล่านี้
 * แต่ละน้ำหนักเป็นฟอนต์คนละตัว ห้ามใช้ fontWeight กับฟอนต์นี้ (Android จะกลับไปใช้ฟอนต์ระบบ)
 */
export const FONTS = {
  regular: 'IBMPlexSansThai_400Regular',
  semibold: 'IBMPlexSansThai_600SemiBold',
  bold: 'IBMPlexSansThai_700Bold',
};

/**
 * แบบตัวอักษร ใช้ด้วย ...TEXT.body ในสไตล์
 * ระยะบรรทัดเผื่อสระบนล่างและวรรณยุกต์ของภาษาไทย (อย่างน้อย 1.25 เท่าของขนาดตัวอักษร)
 */
export const TEXT = {
  /** หัวเรื่องใหญ่สุดของหน้าแรกบนคอมพิวเตอร์ */
  display: { fontFamily: FONTS.bold, fontSize: 40, lineHeight: 54 },
  h1: { fontFamily: FONTS.bold, fontSize: 26, lineHeight: 36 },
  h2: { fontFamily: FONTS.semibold, fontSize: 20, lineHeight: 30 },
  h3: { fontFamily: FONTS.semibold, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: FONTS.semibold, fontSize: 15, lineHeight: 24 },
  small: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 },
  smallStrong: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: FONTS.semibold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: FONTS.semibold, fontSize: 15, lineHeight: 22 },
  /** ใหญ่พิเศษ ใช้เฉพาะโหมดเดินทาง เพราะผู้ใช้กำลังขับรถ ต้องอ่านได้ใน 1 วินาที */
  alert: { fontFamily: FONTS.bold, fontSize: 28, lineHeight: 38 },
};

/** ระยะห่างมาตรฐาน ใช้คูณเป็นเท่า ๆ เพื่อให้เลย์เอาต์สม่ำเสมอ */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

/** เงา (boxShadow ใช้ได้ทั้งเว็บและ Expo Go ที่ใช้ New Architecture) */
export const SHADOWS = {
  /** การ์ดทั่วไป */
  card: { boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)' },
  /** การ์ดตอนเอาเมาส์ชี้ แผงลอยบนแผนที่ */
  raised: { boxShadow: '0 6px 20px rgba(16, 24, 40, 0.12)' },
  /** เส้นใต้แถบเมนู */
  nav: { boxShadow: '0 1px 3px rgba(16, 24, 40, 0.08)' },
};

/** ขนาดหน้าจอ (ใช้คู่กับ utils/layout.js) */
export const LAYOUT = {
  /** จอกว้างตั้งแต่นี้ใช้หน้าตาแบบเว็บ: แถบเมนูบน แผงข้าง แผนที่เต็มจอ */
  WIDE_BREAKPOINT: 900,
  /** เนื้อหากว้างสุดเท่านี้ จอใหญ่กว่านี้เว้นขอบสองข้าง อ่านง่ายกว่ายืดสุดจอ */
  CONTENT_MAX_WIDTH: 1200,
  PAGE_PADDING_NARROW: 16,
  PAGE_PADDING_WIDE: 32,
  /** แผงรายการด้านซ้ายของหน้าแผนที่ เส้นทาง และโหมดเดินทาง */
  SIDE_PANEL_WIDTH: 400,
  NAV_HEIGHT: 64,
};
