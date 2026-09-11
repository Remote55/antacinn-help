/**
 * แปลงข้อมูลอุบัติเหตุดิบของกระทรวงคมนาคม ให้อยู่ในรูปแบบเดียวกันทุกปี
 *
 * แหล่งข้อมูล: datagov.mot.go.th ชุด "อุบัติเหตุบนโครงข่ายถนนของกระทรวงคมนาคม" (roadaccident)
 *
 * ปัญหาที่ไฟล์นี้แก้: แต่ละปีเก็บวันที่และเวลาคนละรูปแบบ (ตรวจเมื่อ 2026-09-11)
 *   ปี 2563–2565  วันที่ "2020-01-01T00:00:00"           เวลา "17:40"
 *   ปี 2566       วันที่ "1/2/2023" (เดือน/วัน/ปี ค.ศ.)   เวลา "17:40"
 *   ปี 2567       วันที่ 45292 (ลำดับวันแบบ Excel)        เวลา 0.736 (สัดส่วนของวัน)
 *   ปี 2568       วันที่ 45658 (ลำดับวันแบบ Excel)        เวลา "17:40"
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

/** วันที่ 0 ของลำดับวันแบบ Excel (Excel นับ 29 ก.พ. 1900 ที่ไม่มีจริงด้วย จึงเริ่มที่ 30 ธ.ค. 1899) */
const EXCEL_DAY_ZERO_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ปีที่วันกับเดือนในข้อมูลต้นทางสลับกัน ใช้นับจำนวนเหตุได้ แต่ใช้หาเดือนที่เสี่ยงไม่ได้
 * ปี 2565: 29 จาก 40 เหตุการณ์ตกวันที่ 1 หรือ 2 ของเดือน และหลายเหตุ "เกิด" หลังวันที่รายงาน
 */
export const YEARS_WITH_SWAPPED_DAY_MONTH = [2565];

/** ชื่อมูลเหตุที่เขียนต่างกันแต่หมายถึงเรื่องเดียวกัน (หลังตัดช่องว่างรอบ / แล้ว) */
const CAUSE_ALIASES = {
  'ขับรถเร็วเกินอัตราที่กำหนด': 'ขับรถเร็วเกินอัตรากำหนด',
  'มีการตัดหน้าระยะกระชั้นชิด': 'คน/รถ/สัตว์ตัดหน้ากระชั้นชิด',
  'ยางรถยนต์ชำรุด': 'ยางเสื่อมสภาพ/ยางแตก',
  'ถนนลื่น (เนื่องจากสภาพอากาศ)': 'ถนนลื่น',
  'ขับรถไม่ชำนาญ/ไม่เป็น': 'ไม่คุ้นเคยเส้นทาง/ขับรถไม่ชำนาญ',
  'ใช้โทรศัพท์ขณะขับรถ': 'ใช้โทรศัพท์เคลื่อนที่ขณะขับรถ',
};

function validDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * @returns { year, month, day } ปี ค.ศ. หรือ null ถ้าแปลงไม่ได้
 */
export function parseMotDate(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const monthFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (monthFirst) return validDate(Number(monthFirst[3]), Number(monthFirst[1]), Number(monthFirst[2]));

  // ลำดับวันแบบ Excel ต้องเป็นตัวเลขห้าหลัก (ปี 1927–2173) กันตัวเลขอื่นที่บังเอิญเป็นตัวเลขล้วน
  if (/^\d{5}(\.\d+)?$/.test(text)) {
    const date = new Date(EXCEL_DAY_ZERO_MS + Math.floor(Number(text)) * DAY_MS);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  return null;
}

/**
 * @returns ชั่วโมง 0–23 ที่เกิดเหตุ หรือ null ถ้าแปลงไม่ได้
 */
export function parseMotTime(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();

  const clock = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (clock) {
    const hour = Number(clock[1]);
    return hour <= 23 ? hour : null;
  }

  // สัดส่วนของวันแบบ Excel: 0.5 = 12:00 น.
  // บวกค่าเล็กมากก่อนปัดลง เพราะทศนิยมที่ถูกตัดมา เช่น 0.041666666 (01:00) คูณ 24 ได้ 0.99999998
  if (/^(0?\.\d+|0)$/.test(text)) {
    return Math.floor(Number(text) * 24 + 1e-6);
  }

  return null;
}

/** รวมชื่อมูลเหตุที่เขียนต่างกันให้เป็นชื่อเดียว */
export function normalizeCause(value) {
  const text = String(value || '').trim().replace(/\s*\/\s*/g, '/');
  return CAUSE_ALIASES[text] || text;
}

function toPeopleCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

/**
 * แปลงหนึ่งแถวจาก API ของกระทรวงคมนาคม
 * @param raw แถวดิบ (ชื่อฟิลด์ภาษาไทยตามต้นทาง)
 * @param yearBE ปี พ.ศ. ของไฟล์ที่แถวนี้มา
 * @returns เหตุการณ์ในรูปแบบที่ใช้ต่อได้ หรือ null ถ้าไม่มีพิกัด
 */
export function normalizeMotRecord(raw, yearBE) {
  const lat = Number(raw.LATITUDE);
  const lng = Number(raw.LONGITUDE);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;

  const date = parseMotDate(raw['วันที่เกิดเหตุ']);
  // เดือนใช้ได้เมื่อปีในวันที่ตรงกับปีของไฟล์ และไม่ใช่ปีที่รู้ว่าวันกับเดือนสลับกัน
  const isMonthReliable =
    date !== null && date.year + 543 === yearBE && !YEARS_WITH_SWAPPED_DAY_MONTH.includes(yearBE);
  const isKmMissing = raw.KM === null || raw.KM === undefined || raw.KM === '';

  return {
    yearBE,
    month: isMonthReliable ? date.month : null,
    hour: parseMotTime(raw['เวลา']),
    lat,
    lng,
    fatal: toPeopleCount(raw['ผู้เสียชีวิต']),
    serious: toPeopleCount(raw['ผู้บาดเจ็บสาหัส']),
    minor: toPeopleCount(raw['ผู้บาดเจ็บเล็กน้อย']),
    route: String(raw['รหัสสายทาง'] || '').trim(),
    km: isKmMissing || !Number.isFinite(Number(raw.KM)) ? null : Number(raw.KM),
    cause: normalizeCause(raw['มูลเหตุสันนิษฐาน']),
    isRaining: String(raw['สภาพอากาศ'] || '').trim() === 'ฝนตก',
  };
}
