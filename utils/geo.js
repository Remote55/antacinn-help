/**
 * ฟังก์ชันคำนวณระยะทางทางภูมิศาสตร์
 *
 * ไฟล์นี้เป็น "คณิตศาสตร์บริสุทธิ์" — ห้าม import react หรือ react-native เด็ดขาด
 * เพราะต้องรันทดสอบด้วย Node ล้วน ๆ ได้ และเรียกใช้ได้จากทุกที่ในแอป
 *
 * รูปแบบพิกัดที่ใช้ทั้งไฟล์: { lat: number, lng: number }
 */

import { SERVICE_AREA } from '../constants/config.js';

/** รัศมีของโลกเป็นเมตร (ตามเอกสารบทที่ 5.1) */
const EARTH_RADIUS_M = 6371000;

/** แปลงองศาเป็นเรเดียน */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** บีบค่าให้อยู่ในช่วง [min, max] */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * ระยะทางระหว่างสองพิกัดบนผิวโลก ด้วยสูตร Haversine
 *
 * ใช้สูตรนี้แทนสูตรระยะทางแบบระนาบ เพราะโลกโค้ง
 * ถ้าใช้สูตรระนาบตรง ๆ ระยะทางระดับหลายสิบกิโลเมตรจะคลาดเคลื่อนมาก
 *
 *   a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
 *   c = 2 · atan2(√a, √(1−a))
 *   d = R · c
 *
 * @returns ระยะทางหน่วยเมตร
 */
export function haversineMeters(from, to) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * ฉายจุดลงบน "ส่วนของเส้นตรง" แล้วคืนทั้งระยะทางและตำแหน่งบนเส้น
 *
 * วิธีการ: ฉายจุดลงบนเส้น แล้วบีบค่าพารามิเตอร์ t ให้อยู่ในช่วง [0, 1]
 *
 * การบีบค่า t คือหัวใจของฟังก์ชันนี้ — ถ้าไม่บีบ จุดที่ฉายได้อาจหลุดออกไป
 * นอกปลายทั้งสองข้างของเส้น ทำให้ได้ระยะที่สั้นเกินจริง
 * เช่น จุดที่อยู่เลยปลายเส้นไป 10 กม. อาจถูกคำนวณว่าอยู่ห่างแค่ 100 เมตร
 *
 * ทำไมต้องคืนค่า t ออกมาด้วย ไม่ใช่แค่ระยะทาง:
 * routeAnalysis.js ต้องรู้ว่าจุดนั้นอยู่ตรงไหน "ระหว่าง" ต้นกับปลาย segment
 * เพื่อคำนวณระยะทางสะสมได้แม่นยำ ถ้ารู้แค่ว่าเกาะ segment ไหน
 * จุดที่อยู่ปลาย segment กับจุดที่อยู่ต้น segment จะได้ระยะสะสมเท่ากัน ซึ่งผิด
 *
 * หมายเหตุ: ในระยะสั้น ๆ ระดับไม่กี่กิโลเมตร เราถือว่าองศาละติจูด/ลองจิจูด
 * เป็นระนาบได้ (ชดเชยด้วย cos(lat) สำหรับลองจิจูด) เพื่อหาค่า t
 * แต่ตอนวัดระยะจริงยังใช้ Haversine เพื่อความแม่นยำ
 *
 * @returns { distanceM, t } โดย t = 0 คือต้นเส้น, t = 1 คือปลายเส้น
 */
export function projectOnSegment(point, segmentStart, segmentEnd) {
  // ชดเชยความจริงที่ว่า 1 องศาลองจิจูดสั้นลงเมื่อเข้าใกล้ขั้วโลก
  const latitudeScale = Math.cos(toRadians(segmentStart.lat));

  const startToEndX = (segmentEnd.lng - segmentStart.lng) * latitudeScale;
  const startToEndY = segmentEnd.lat - segmentStart.lat;

  const startToPointX = (point.lng - segmentStart.lng) * latitudeScale;
  const startToPointY = point.lat - segmentStart.lat;

  const segmentLengthSquared = startToEndX * startToEndX + startToEndY * startToEndY;

  // กรณีเส้นยาวเป็นศูนย์ (จุดเริ่มกับจุดจบเป็นจุดเดียวกัน) ต้องกันการหารด้วยศูนย์
  if (segmentLengthSquared === 0) {
    return { distanceM: haversineMeters(point, segmentStart), t: 0 };
  }

  const dotProduct = startToPointX * startToEndX + startToPointY * startToEndY;

  // t = ตำแหน่งบนเส้น: 0 = ต้นเส้น, 1 = ปลายเส้น
  // การบีบให้อยู่ใน [0,1] ทำให้จุดที่ฉายไม่หลุดออกนอกปลายเส้น
  const t = clamp(dotProduct / segmentLengthSquared, 0, 1);

  const projected = {
    lat: segmentStart.lat + t * startToEndY,
    lng: segmentStart.lng + (t * startToEndX) / latitudeScale,
  };

  return { distanceM: haversineMeters(point, projected), t };
}

/**
 * ระยะทางที่สั้นที่สุดจากจุดหนึ่ง ไปยัง "ส่วนของเส้นตรง"
 *
 * เป็นตัวห่อบาง ๆ ของ projectOnSegment สำหรับที่ที่ต้องการแค่ระยะทาง
 * ไม่ต้องสนใจว่าจุดฉายอยู่ตรงไหนของเส้น
 *
 * @returns ระยะทางหน่วยเมตร
 */
export function distanceToSegmentMeters(point, segmentStart, segmentEnd) {
  return projectOnSegment(point, segmentStart, segmentEnd).distanceM;
}

/**
 * เช็คหยาบ ๆ ว่าจุดอยู่ในกรอบสี่เหลี่ยมรอบจุดศูนย์กลางหรือไม่
 *
 * ใช้เป็นตัวกรองด่านแรกก่อนคำนวณ Haversine จริง (ตามเอกสารบทที่ 5.3)
 * เพราะการเทียบ +/- ธรรมดา เร็วกว่าการคำนวณ sin/cos/atan2 หลายเท่า
 * ถ้ามีจุดเสี่ยง 500 จุด แต่กรองเหลือ 10 จุดก่อน จะประหยัดการคำนวณไปมาก
 *
 * @param radiusMeters รัศมีโดยประมาณของกรอบ หน่วยเมตร
 */
export function isInsideBoundingBox(point, center, radiusMeters) {
  // 1 องศาละติจูด ประมาณ 111,320 เมตร เสมอ ไม่ว่าจะอยู่ที่ไหนบนโลก
  const latitudeDelta = radiusMeters / 111320;
  // 1 องศาลองจิจูด สั้นลงตาม cos(ละติจูด)
  const longitudeDelta = radiusMeters / (111320 * Math.cos(toRadians(center.lat)));

  return (
    Math.abs(point.lat - center.lat) <= latitudeDelta &&
    Math.abs(point.lng - center.lng) <= longitudeDelta
  );
}

/**
 * พิกัดอยู่ในพื้นที่ให้บริการของแอปหรือไม่
 *
 * แอปมีข้อมูลจุดเสี่ยงเฉพาะหาดใหญ่–สงขลา ตำแหน่งนอกกรอบนี้วางแผนเส้นทางไปก็ไม่ได้ประโยชน์
 * คืน false ถ้าไม่มีพิกัด หรือพิกัดไม่ใช่ตัวเลข (เช่น พิมพ์ผิดในไฟล์ข้อมูล)
 */
export function isInServiceArea(coordinate, area = SERVICE_AREA) {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.lat) &&
      Number.isFinite(coordinate.lng) &&
      coordinate.lat >= area.minLat &&
      coordinate.lat <= area.maxLat &&
      coordinate.lng >= area.minLng &&
      coordinate.lng <= area.maxLng
  );
}
