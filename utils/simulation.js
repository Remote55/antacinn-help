/**
 * คณิตศาสตร์ของโหมดจำลองการเดินทาง
 *
 * ทำไมต้องมีโหมดจำลอง:
 * เอกสารบทที่ 7.3 เขียนไว้ว่าต้องเตรียมวิดีโอสำรองสำหรับนำเสนอ เพราะทดสอบโหมดเดินทางต้องขับรถจริง
 * โหมดจำลองให้คนขับเสมือนวิ่งตามเส้นทางจริง แล้วใช้ตรรกะเตือนชุดเดียวกับ GPS จริงทุกอย่าง
 * จึงสาธิตในห้องเรียนได้ และทดสอบฟีเจอร์เตือนได้โดยไม่ต้องออกไปขับรถ
 */

import { haversineMeters } from './geo.js';

/**
 * ตำแหน่งบนเส้นทาง เมื่อวิ่งมาได้ระยะหนึ่ง
 * @returns { lat, lng } ถ้าระยะติดลบได้จุดเริ่ม ถ้าเกินความยาวเส้นทางได้จุดสุดท้าย
 *          คืน null ถ้าไม่มีเส้นทาง
 */
export function positionAtDistance(routeCoordinates, distanceM) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) return null;

  const first = routeCoordinates[0];
  // !(distanceM > 0) ครอบคลุมทั้งค่าติดลบ ศูนย์ และค่าที่ไม่ใช่ตัวเลข
  if (routeCoordinates.length === 1 || !(distanceM > 0)) return { lat: first.lat, lng: first.lng };

  let remainingM = distanceM;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const start = routeCoordinates[i];
    const end = routeCoordinates[i + 1];
    const segmentLengthM = haversineMeters(start, end);

    if (remainingM <= segmentLengthM) {
      // อยู่ในช่วงนี้ หาตำแหน่งตามสัดส่วนของระยะที่เหลือ
      // ช่วงถนนสั้นระดับไม่กี่ร้อยเมตร การเฉลี่ยพิกัดตรง ๆ คลาดน้อยมาก
      const t = segmentLengthM === 0 ? 0 : remainingM / segmentLengthM;
      return {
        lat: start.lat + t * (end.lat - start.lat),
        lng: start.lng + t * (end.lng - start.lng),
      };
    }
    remainingM -= segmentLengthM;
  }

  const last = routeCoordinates[routeCoordinates.length - 1];
  return { lat: last.lat, lng: last.lng };
}

/**
 * ระยะที่วิ่งได้ในหนึ่งจังหวะของการจำลอง
 * @param speedKmh ความเร็วรถสมมติ (กม./ชม.)
 * @param speedUp ตัวเร่งเวลา เช่น 10 = เร็วกว่าเวลาจริง 10 เท่า
 * @param tickMs ความยาวหนึ่งจังหวะ (มิลลิวินาที)
 */
export function metersPerTick(speedKmh, speedUp, tickMs) {
  return (speedKmh / 3.6) * speedUp * (tickMs / 1000);
}
