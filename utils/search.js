/**
 * ค้นหาจุดเสี่ยงจากคำที่ผู้ใช้พิมพ์ แล้วเรียงตามความเกี่ยวข้อง
 *
 * ปัญหาที่ไฟล์นี้แก้:
 * ค้นคำว่า "หาด" (ชายหาด) แล้วเดิมได้ทุกจุดในอำเภอหาดใหญ่ติดมาด้วย
 * เพราะคำว่า "หาดใหญ่" มีคำว่า "หาด" อยู่ ผลที่ได้เป็นชายหาดแค่ 3 จาก 9 รายการ และไม่เรียงลำดับ
 *
 * วิธีแก้: ให้คะแนนความเกี่ยวข้องเป็นขั้น แล้วเรียงจากมากไปน้อย
 *   4 = ชื่อขึ้นต้นด้วยคำค้น        เช่น "หาด" → "หาดสมิหลา..."
 *   3 = ชื่อมีคำค้นอยู่ข้างใน       เช่น "หาด" → "...เลี่ยงเมืองหาดใหญ่"
 *   2 = ตรงกับประเภทอันตราย        เช่น "จมน้ำ" → ทุกจุดประเภทจมน้ำ
 *   1 = ตรงกับชื่ออำเภออย่างเดียว   เช่น "หาด" → จุดในอำเภอหาดใหญ่
 * ถ้าคะแนนเท่ากัน จุดที่อันตรายกว่าขึ้นก่อน
 */

import { HAZARD_TYPES } from '../constants/config.js';

/**
 * ทำให้ข้อความพร้อมเทียบ: ตัดช่องว่างทุกตัวออก และทำตัวอักษรอังกฤษเป็นตัวเล็ก
 * ตัดช่องว่างเพราะภาษาไทยเว้นวรรคไม่แน่นอน "หาด สมิหลา" กับ "หาดสมิหลา" ต้องหาเจอเหมือนกัน
 */
export function normalizeText(text) {
  return String(text || '').replace(/\s+/g, '').toLowerCase();
}

function relevance(point, query) {
  const name = normalizeText(point.name);
  if (name.startsWith(query)) return 4;
  if (name.includes(query)) return 3;

  const hazard = HAZARD_TYPES.find((t) => t.id === point.type);
  if (hazard && normalizeText(hazard.label).includes(query)) return 2;

  if (normalizeText(point.district).includes(query)) return 1;
  return 0;
}

/**
 * @param points จุดเสี่ยงที่มี riskScore แล้ว (จาก useRiskPoints)
 * @param query คำที่ผู้ใช้พิมพ์
 * @returns จุดที่ตรง เรียงตามความเกี่ยวข้อง ถ้าไม่ได้พิมพ์อะไรคืนอาเรย์ว่าง
 */
export function searchPoints(points, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || !Array.isArray(points)) return [];

  return points
    .map((point) => ({ point, score: relevance(point, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.point.riskScore || 0) - (a.point.riskScore || 0))
    .map((item) => item.point);
}
