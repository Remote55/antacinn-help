/**
 * ผู้ใช้อยู่ตรงไหนของเส้นทาง และจุดเสี่ยงถัดไปอยู่ห่างเท่าไหร่ "ตามเส้นทาง"
 *
 * เอกสารบทที่ 5.2 ยกตัวอย่างข้อความเตือนว่า "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง"
 * ระยะแบบนี้ต้องวัดตามถนนที่จะขับจริง ไม่ใช่ระยะเส้นตรง
 * เพราะถนนคดเคี้ยว จุดที่ห่างเส้นตรง 1 กม. อาจต้องขับอีก 3 กม. กว่าจะถึง
 *
 * วิธีการ: ฉายตำแหน่งลงบนแต่ละช่วงถนน เลือกช่วงที่ใกล้ที่สุด
 * แล้วบวก ระยะสะสมถึงต้นช่วง + ระยะที่เดินเข้าไปในช่วงนั้น (t × ความยาวช่วง)
 *
 * การบวก t × ความยาวช่วง สำคัญมาก ถ้าใช้แค่ระยะสะสมถึงต้นช่วงเฉย ๆ
 * จุดที่อยู่ปลายช่วงจะได้ค่าเท่ากับจุดที่อยู่ต้นช่วงเดียวกัน ซึ่งผิด
 */

import { haversineMeters, projectOnSegment } from './geo.js';

/**
 * @param routeCoordinates อาเรย์ของ { lat, lng } เรียงจากต้นทางไปปลายทาง
 * @param position { lat, lng } ตำแหน่งที่ต้องการหา
 * @returns { alongM, offRouteM }
 *   alongM = ระยะตามเส้นทางจากต้นทาง มาถึงจุดบนถนนที่ใกล้ตำแหน่งนี้ที่สุด
 *   offRouteM = ตำแหน่งนี้ห่างจากเส้นทางกี่เมตร
 *   คืน null ถ้าเส้นทางมีไม่ถึง 2 จุด หรือไม่มีตำแหน่ง
 */
export function locateOnRoute(routeCoordinates, position) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2 || !position) return null;

  let cumulativeM = 0;
  let bestOffRouteM = Infinity;
  let bestAlongM = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const start = routeCoordinates[i];
    const end = routeCoordinates[i + 1];
    const segmentLengthM = haversineMeters(start, end);
    const { distanceM, t } = projectOnSegment(position, start, end);

    // ใช้ < ไม่ใช่ <= จุดที่ตกบนรอยต่อพอดีจึงเลือกช่วงแรกที่เจอ (ได้ระยะสะสมเท่ากันทั้งสองแบบอยู่แล้ว)
    if (distanceM < bestOffRouteM) {
      bestOffRouteM = distanceM;
      bestAlongM = cumulativeM + t * segmentLengthM;
    }
    cumulativeM += segmentLengthM;
  }

  return { alongM: bestAlongM, offRouteM: bestOffRouteM };
}

/**
 * จุดเสี่ยงถัดไปที่ผู้ใช้ยังไปไม่ถึง
 * @param pointsOnRoute ผลจาก findRiskPointsAlongRoute (เรียงตามระยะสะสมแล้ว)
 * @param alongM ผู้ใช้วิ่งมาได้กี่เมตรแล้วตามเส้นทาง
 * @returns { item, remainingM } หรือ null ถ้าผ่านทุกจุดแล้ว
 */
export function nextRiskOnRoute(pointsOnRoute, alongM) {
  const next = (pointsOnRoute || []).find((item) => item.distanceAlongRouteM > alongM);
  return next ? { item: next, remainingM: next.distanceAlongRouteM - alongM } : null;
}

/**
 * สรุปสถานะบนเส้นทางสำหรับแสดงบนหน้าจอโหมดเดินทาง
 * @param offRouteThresholdM ห่างเส้นทางเกินนี้ถือว่าออกนอกเส้นทาง
 * @returns null ถ้ายังไม่มีตำแหน่ง หรือหนึ่งในสามแบบ
 *   { kind: 'next', point, remainingM, alongM }  ยังมีจุดเสี่ยงข้างหน้า
 *   { kind: 'offRoute', offRouteM }               ออกนอกเส้นทางที่วางแผนไว้
 *   { kind: 'done', alongM }                      ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว
 */
export function describeRouteStatus(routeCoordinates, pointsOnRoute, position, offRouteThresholdM) {
  const located = locateOnRoute(routeCoordinates, position);
  if (!located) return null;

  if (located.offRouteM > offRouteThresholdM) {
    return { kind: 'offRoute', offRouteM: located.offRouteM };
  }

  const next = nextRiskOnRoute(pointsOnRoute, located.alongM);
  if (!next) return { kind: 'done', alongM: located.alongM };

  return { kind: 'next', point: next.item.point, remainingM: next.remainingM, alongM: located.alongM };
}
