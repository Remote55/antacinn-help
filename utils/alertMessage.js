/**
 * ประโยคที่แอปพูดออกเสียงในโหมดเดินทาง
 *
 * เอกสารวัตถุประสงค์ข้อ 4 และบทที่ 3 กำหนดว่าผู้ใช้ต้อง "รับทราบการแจ้งเตือนได้โดยไม่ต้องมองหน้าจอ"
 * เพราะผู้ใช้กำลังขับรถหรือขี่มอเตอร์ไซค์ ประโยคจึงต้องสั้นพอให้ฟังจบก่อนถึงจุด
 * (ที่ 60 กม./ชม. วิ่ง 500 เมตรใช้เวลา 30 วินาที)
 */

import { HAZARD_TYPES } from '../constants/config.js';

/**
 * ปัดระยะให้พูดง่ายและไม่ดูแม่นเกินจริง
 * GPS มือถือคลาดได้ 10–20 เมตร (เอกสารบทที่ 5.3) การพูดว่า "อีก 437 เมตร" จึงให้ความรู้สึกแม่นเกินจริง
 *   ต่ำกว่า 1 กม. ปัดเป็นหลักร้อยเมตร ขั้นต่ำ 100 เมตร
 *   ตั้งแต่ 1 กม. บอกเป็นกิโลเมตร ทศนิยมหนึ่งตำแหน่ง
 */
export function speakableDistance(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM < 0) return 'ใกล้ ๆ นี้';

  if (distanceM < 1000) {
    const rounded = Math.max(100, Math.round(distanceM / 100) * 100);
    if (rounded < 1000) return `${rounded} เมตร`;
  }

  const km = (distanceM / 1000).toFixed(1).replace(/\.0$/, '');
  return `${km} กิโลเมตร`;
}

/**
 * ท่อนแรกของคำแนะนำ
 * ภาษาไทยเว้นวรรคระหว่างประโยค ท่อนแรกจึงเป็นประโยคหลักพอดี ท่อนหลังมักเป็นเหตุผลประกอบ
 */
function firstClause(text) {
  return String(text || '').trim().split(/\s+/)[0] || '';
}

/** คำเตือนทั่วไปตามประเภทอันตราย ใช้เมื่อจุดนั้นยังไม่มีคำแนะนำของตัวเอง */
function fallbackAdvice(type) {
  const hazard = HAZARD_TYPES.find((t) => t.id === type);
  return hazard ? hazard.spokenAdvice : 'โปรดระมัดระวัง';
}

/**
 * เตือนเมื่อเข้าใกล้จุดเสี่ยง (ระยะเส้นตรง)
 * ตัวอย่าง: "ระวัง! อีกประมาณ 300 เมตร หาดชลาทัศน์ ระดับเสี่ยง ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด"
 */
export function buildAlertMessage(point, distanceM) {
  const level = point.riskLevel ? `ระดับ${point.riskLevel.label}` : '';
  const advice = firstClause((point.advice || [])[0]) || fallbackAdvice(point.type);
  return ['ระวัง!', `อีกประมาณ ${speakableDistance(distanceM)}`, point.name, level, advice]
    .filter(Boolean)
    .join(' ');
}

/**
 * บอกล่วงหน้าว่าจุดเสี่ยงถัดไปบนเส้นทางคืออะไร อยู่ห่างกี่กิโลเมตรตามถนน (เอกสารบทที่ 5.2)
 * ตัวอย่าง: "จุดเสี่ยงถัดไป สะพานติณสูลานนท์ อีก 4.2 กิโลเมตร ข้างหน้า"
 */
export function buildHeadsUpMessage(point, remainingM) {
  return `จุดเสี่ยงถัดไป ${point.name} อีก ${speakableDistance(remainingM)} ข้างหน้า`;
}
