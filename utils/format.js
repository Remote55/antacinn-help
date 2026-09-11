/**
 * แปลงตัวเลขดิบให้เป็นข้อความภาษาไทยที่ผู้ใช้อ่านเข้าใจ
 *
 * เหตุผลที่แยกเป็นไฟล์ต่างหาก: การจัดรูปแบบเป็นเรื่องที่ต้องใช้ซ้ำหลายหน้าจอ
 * ถ้าเขียนกระจายในแต่ละหน้า จะเกิดกรณีที่หน้าหนึ่งเขียน "4.2 กม."
 * แต่อีกหน้าเขียน "4200 เมตร" ทำให้แอปดูไม่เป็นระบบเดียวกัน
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { SEVERITY_LABELS } from '../constants/config.js';

/**
 * ระยะทาง: ต่ำกว่า 1 กม. บอกเป็นเมตร ตั้งแต่ 1 กม. ขึ้นไปบอกเป็นกิโลเมตร
 *
 * เหตุผล: "244 ม." เข้าใจง่ายกว่า "0.2 กม." สำหรับระยะใกล้
 * แต่ "28.4 กม." เข้าใจง่ายกว่า "28394 ม." สำหรับระยะไกล
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
}

/** ระยะเวลา: วินาที -> "31 นาที" หรือ "1 ชม. 30 นาที" */
export function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} นาที`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ชม.`;
  }
  return `${hours} ชม. ${minutes} นาที`;
}

/** ลำดับความรุนแรงจากมากไปน้อย ใช้เรียงข้อความสรุป */
const SEVERITY_ORDER = ['fatal', 'serious', 'minor'];

/**
 * สรุปสถิติเหตุการณ์เป็นบรรทัดเดียว
 * เช่น "บาดเจ็บสาหัส 2 · บาดเจ็บเล็กน้อย 3"
 *
 * รวมเหตุการณ์ประเภทเดียวกันจากหลายปีเข้าด้วยกัน
 * เพราะผู้ใช้อยากเห็นภาพรวมก่อน ส่วนรายละเอียดแยกปีอยู่ในตารางด้านล่าง
 */
export function summarizeIncidents(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return 'ยังไม่มีข้อมูลสถิติ';
  }

  const totals = {};
  for (const incident of incidents) {
    if (!SEVERITY_LABELS[incident.severity]) continue;
    totals[incident.severity] = (totals[incident.severity] || 0) + incident.count;
  }

  const parts = SEVERITY_ORDER
    .filter((severity) => totals[severity] > 0)
    .map((severity) => `${SEVERITY_LABELS[severity]} ${totals[severity]}`);

  if (parts.length === 0) return 'ยังไม่มีข้อมูลสถิติ';

  return parts.join(' · ');
}

/**
 * ช่วงเวลาที่เสี่ยง เช่น [17, 18, 19] → "17:00-20:00"
 * ชั่วโมง 19 หมายถึงช่วง 19:00–20:00 เวลาสิ้นสุดจึงเป็นชั่วโมงสุดท้าย + 1
 * รองรับช่วงข้ามเที่ยงคืน [23, 0, 1] → "23:00-02:00" และหลายช่วง [8, 17, 18] → "08:00-09:00, 17:00-19:00"
 */
export function describeHours(peakHours) {
  const hours = [...new Set(Array.isArray(peakHours) ? peakHours : [])]
    .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
    .sort((a, b) => a - b);
  if (hours.length === 0) return 'ยังไม่ระบุ';
  if (hours.length === 24) return 'ตลอดทั้งวัน';

  // แบ่งเป็นช่วงต่อเนื่อง
  const runs = [];
  for (const hour of hours) {
    const currentRun = runs[runs.length - 1];
    if (currentRun && hour === currentRun[currentRun.length - 1] + 1) currentRun.push(hour);
    else runs.push([hour]);
  }

  // ช่วงที่ลงท้าย 23 กับช่วงที่เริ่ม 0 คือช่วงเดียวกันที่ข้ามเที่ยงคืน
  const lastRun = runs[runs.length - 1];
  if (runs.length > 1 && runs[0][0] === 0 && lastRun[lastRun.length - 1] === 23) {
    lastRun.push(...runs.shift());
  }

  const clock = (hour) => `${String(hour % 24).padStart(2, '0')}:00`;
  return runs.map((run) => `${clock(run[0])}-${clock(run[run.length - 1] + 1)}`).join(', ');
}
