/**
 * ตรรกะการเตือนในโหมดเดินทาง
 *
 * ออกแบบเป็น pure function โดยตั้งใจ:
 * รับสถานะเข้า -> คืนสถานะใหม่ออก ไม่เก็บ state ไว้ข้างใน
 * ทำให้ทดสอบสถานการณ์ "ขับเข้าใกล้ ขับออกห่าง วนกลับมาใหม่" ได้ครบโดยไม่ต้องใช้ GPS จริง
 *
 * ปัญหา 3 อย่างที่ไฟล์นี้แก้ (ตามเอกสารบทที่ 5.3):
 *   1. เตือนซ้ำ  -> จำ id ที่เตือนไปแล้ว ล้างเมื่อออกห่างเกิน resetM
 *   2. เปลืองแบต -> กรองด้วยกรอบสี่เหลี่ยมก่อนคำนวณ Haversine
 *   3. GPS แกว่ง -> ระยะล้าง (800 ม.) มากกว่าระยะเตือน (500 ม.) เป็นโซนกันสั่น
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { haversineMeters, isInsideBoundingBox } from './geo.js';

/**
 * ประเมินว่าตอนนี้ควรเตือนจุดไหนบ้าง
 *
 * @param userLocation ตำแหน่งผู้ใช้ { lat, lng } หรือ null ถ้ายังไม่มี
 * @param riskPoints รายการจุดเสี่ยงทั้งหมด
 * @param alertedIds Set ของ id ที่เตือนไปแล้ว (ห้ามแก้ค่าเดิม จะคืน Set ใหม่ให้)
 * @param config { triggerM, resetM, boundingBoxM }
 * @returns {
 *   newAlerts: [{ point, distanceM }]  จุดที่ต้องเตือน "เดี๋ยวนี้"
 *   alertedIds: Set                    สถานะใหม่ ให้เอาไปใช้รอบถัดไป
 *   nearbyPoints: [{ point, distanceM }] จุดที่อยู่ในระยะเฝ้าระวัง เรียงจากใกล้ไปไกล
 * }
 */
export function evaluateTripAlerts(userLocation, riskPoints, alertedIds, config) {
  if (!userLocation || !Array.isArray(riskPoints)) {
    return { newAlerts: [], alertedIds: new Set(alertedIds), nearbyPoints: [] };
  }

  const nextAlertedIds = new Set(alertedIds);
  const newAlerts = [];
  const nearbyPoints = [];

  for (const point of riskPoints) {
    // ด่านที่ 1: กรองหยาบ ๆ ด้วยกรอบสี่เหลี่ยม
    // เร็วกว่าการคำนวณ Haversine มาก ตัดจุดที่ไกลออกไปได้เกือบหมดก่อน
    if (!isInsideBoundingBox(point.coordinate, userLocation, config.boundingBoxM)) {
      // จุดที่ไกลมาก ๆ ให้ล้างสถานะเตือนไปเลย เพราะขับผ่านมานานแล้วแน่ ๆ
      nextAlertedIds.delete(point.id);
      continue;
    }

    // ด่านที่ 2: คำนวณระยะจริง
    const distanceM = haversineMeters(userLocation, point.coordinate);

    nearbyPoints.push({ point, distanceM: Math.round(distanceM) });

    if (distanceM <= config.triggerM) {
      // อยู่ในระยะเตือน — เตือนเฉพาะถ้ายังไม่เคยเตือนจุดนี้
      if (!nextAlertedIds.has(point.id)) {
        newAlerts.push({ point, distanceM: Math.round(distanceM) });
        nextAlertedIds.add(point.id);
      }
    } else if (distanceM > config.resetM) {
      // ออกห่างพอแล้ว ล้างสถานะ เพื่อให้เตือนได้อีกถ้าวนกลับมา
      nextAlertedIds.delete(point.id);
    }
    // ระยะระหว่าง triggerM กับ resetM = โซนกันสั่น ไม่ทำอะไรทั้งสิ้น
  }

  nearbyPoints.sort((a, b) => a.distanceM - b.distanceM);

  return { newAlerts, alertedIds: nextAlertedIds, nearbyPoints };
}
