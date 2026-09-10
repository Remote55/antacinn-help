/**
 * สร้างข้อความ "แถบสรุปความเสี่ยงประจำเดือน" ในหน้าแรก (ตามเอกสารบทที่ 4)
 *
 * ปัญหาเดิม: หัวข้อเขียนตายตัวว่า "ช่วงนี้ต้องระวังเป็นพิเศษ" ทุกเดือน
 * แต่เนื้อความบางเดือนบอกว่า "ไม่มีจุดใดอยู่ในช่วงเสี่ยงสูงเป็นพิเศษ" ผู้ใช้อ่านแล้วงง
 * ตอนนี้หัวข้อกับเนื้อความมาจากข้อมูลชุดเดียวกัน จึงไม่มีทางขัดกัน
 */

/** ชื่อเดือนภาษาไทย (index 0 = มกราคม) */
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** แสดงชื่อจุดไม่เกินเท่านี้ ที่เหลือบอกเป็นจำนวน เพื่อไม่ให้แถบยาวเกินจอมือถือ */
const MAX_NAMES = 3;

/**
 * @param points จุดเสี่ยงทั้งหมด
 * @param month เดือน 1–12
 * @returns { title, body, pointsInPeak }
 */
export function summarizeSeason(points, month) {
  const monthName = THAI_MONTHS[month - 1] || '';
  const pointsInPeak = (points || []).filter((point) => (point.peakMonths || []).includes(month));

  if (pointsInPeak.length === 0) {
    return {
      title: `ภาพรวมเดือน${monthName}`,
      body: 'เดือนนี้ไม่มีจุดใดอยู่ในช่วงเสี่ยงสูงของปี แต่ยังควรระวังตามปกติ',
      pointsInPeak,
    };
  }

  const names = pointsInPeak.slice(0, MAX_NAMES).map((p) => p.name);
  const remaining = pointsInPeak.length - names.length;
  const nameText = names.join(', ') + (remaining > 0 ? ` และอีก ${remaining} จุด` : '');

  return {
    title: `ช่วง${monthName}นี้ต้องระวังเป็นพิเศษ`,
    body: `${pointsInPeak.length} จุดอยู่ในช่วงเสี่ยงสูงของปี: ${nameText}`,
    pointsInPeak,
  };
}
