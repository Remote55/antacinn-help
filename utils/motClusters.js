/**
 * รวมอุบัติเหตุที่เกิดใกล้กันเป็น "จุดรวมเหตุ"
 *
 * วิธีการ: เรียงเหตุการณ์จากรุนแรงมากไปน้อย หยิบเหตุที่รุนแรงที่สุดที่ยังไม่มีกลุ่มเป็นแกน
 * แล้วดึงทุกเหตุที่ยังไม่มีกลุ่มในรัศมีรอบแกนเข้ามาเป็นกลุ่มเดียวกัน ทำซ้ำจนครบทุกเหตุ
 * เลือกวิธีนี้เพราะอธิบายได้ในประโยคเดียว ได้ผลเหมือนเดิมทุกครั้งที่รัน
 * และแกนของกลุ่มคือที่ที่เคยเกิดเหตุร้ายแรงจริง
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { SEVERITY_WEIGHTS } from '../constants/config.js';

/** น้ำหนักความรุนแรงของเหตุการณ์หรือของผลรวม ใช้น้ำหนักเดียวกับสูตรคะแนน */
export function incidentWeight({ fatal, serious, minor }) {
  return fatal * SEVERITY_WEIGHTS.fatal + serious * SEVERITY_WEIGHTS.serious + minor * SEVERITY_WEIGHTS.minor;
}

/**
 * ตัวแทนของกลุ่ม = เหตุการณ์ที่ห่างจากเหตุอื่นในกลุ่มรวมกันน้อยที่สุด
 * ใช้แทนค่าเฉลี่ยพิกัด เพราะค่าเฉลี่ยของเหตุบนทางโค้งอาจตกนอกถนน ส่วนตัวแทนเป็นจุดเกิดเหตุจริงเสมอ
 */
export function medoid(members) {
  let best = members[0];
  let bestTotalM = Infinity;
  for (const candidate of members) {
    const totalM = members.reduce((sum, other) => sum + haversineMeters(candidate, other), 0);
    if (totalM < bestTotalM) {
      bestTotalM = totalM;
      best = candidate;
    }
  }
  return best;
}

/**
 * สรุปกลุ่ม
 * @returns { center, representative, members, fatal, serious, minor, weight, years }
 *   representative = เหตุการณ์ตัวแทน (ใช้ต่อ เช่น สายทางและหลักกิโลเมตรของจุดนี้)
 */
export function summarizeCluster(members) {
  const representative = medoid(members);
  const totals = members.reduce(
    (sum, item) => ({
      fatal: sum.fatal + item.fatal,
      serious: sum.serious + item.serious,
      minor: sum.minor + item.minor,
    }),
    { fatal: 0, serious: 0, minor: 0 }
  );

  return {
    center: { lat: representative.lat, lng: representative.lng },
    representative,
    members,
    ...totals,
    weight: incidentWeight(totals),
    years: [...new Set(members.map((item) => item.yearBE))].sort((a, b) => a - b),
  };
}

/**
 * @param incidents เหตุการณ์จาก normalizeMotRecord
 * @param radiusM รัศมีรอบแกนของกลุ่ม หน่วยเมตร
 * @returns กลุ่มเรียงจากน้ำหนักมากไปน้อย
 */
export function clusterIncidents(incidents, radiusM) {
  const bySeverity = [...(incidents || [])].sort((a, b) => incidentWeight(b) - incidentWeight(a));
  const grouped = new Set();
  const clusters = [];

  for (const seed of bySeverity) {
    if (grouped.has(seed)) continue;
    const members = bySeverity.filter((item) => !grouped.has(item) && haversineMeters(seed, item) <= radiusM);
    members.forEach((item) => grouped.add(item));
    clusters.push(summarizeCluster(members));
  }

  return clusters.sort((a, b) => b.weight - a.weight || b.members.length - a.members.length);
}
