/**
 * สร้าง "คำขอเส้นทาง" จากต้นทางและปลายทางที่ผู้ใช้เลือก
 *
 * คำขอเส้นทางคือของที่ส่งให้ getRouteWithFallback ใน utils/routing.js
 * รูปแบบ: { id, label, origin, destination, fallbackCoordinates? }
 *
 * ถ้าต้นทางปลายทางที่เลือกตรงกับเส้นทางแนะนำเส้นใดเส้นหนึ่ง (ห่างไม่เกิน 300 ม.)
 * จะแนบเส้นทางสำรองออฟไลน์ของเส้นนั้นไปด้วย ผู้ใช้ที่ไม่มีอินเทอร์เน็ตจึงยังเห็นเส้นทางบนถนนจริง
 * เลือกกลับทิศ (เช่น หาดสมิหลา → ม.อ.) ก็ใช้เส้นทางสำรองเส้นเดิมแบบกลับลำดับได้
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { DISTANCE } from '../constants/config.js';

/** ชื่อที่แสดงเมื่อใช้ตำแหน่งปัจจุบันเป็นต้นทาง */
export const MY_LOCATION_NAME = 'ตำแหน่งของฉัน';

/** แปลงสถานที่จาก data/places.json เป็นต้นทางหรือปลายทาง */
export function placeToEndpoint(place) {
  return { name: place.name, lat: place.coordinate.lat, lng: place.coordinate.lng, emoji: place.emoji };
}

/** แปลงตำแหน่งจาก GPS เป็นต้นทาง (ไม่เก็บค่าอื่นของ GPS เช่น ความแม่นยำ) */
export function myLocationToEndpoint(coordinate) {
  return { name: MY_LOCATION_NAME, lat: coordinate.lat, lng: coordinate.lng, emoji: '📍', isMyLocation: true };
}

function isNear(a, b) {
  return haversineMeters(a, b) <= DISTANCE.PRESET_MATCH_RADIUS;
}

/**
 * @param origin { name, lat, lng }
 * @param destination { name, lat, lng }
 * @param presetRoutes รายการจาก data/presetRoutes.json
 * @returns { request, problem }
 *   request = คำขอเส้นทาง หรือ null ถ้าสร้างไม่ได้
 *   problem = ข้อความภาษาไทยบอกผู้ใช้ว่าทำไมสร้างไม่ได้ หรือ null ถ้าสร้างได้
 */
export function buildRouteRequest(origin, destination, presetRoutes = []) {
  if (!origin || !destination) {
    return { request: null, problem: 'เลือกต้นทางและปลายทางให้ครบก่อน' };
  }
  if (haversineMeters(origin, destination) <= DISTANCE.SAME_PLACE) {
    return { request: null, problem: 'ต้นทางกับปลายทางเป็นที่เดียวกัน กรุณาเลือกปลายทางใหม่' };
  }

  const label = `${origin.name} → ${destination.name}`;

  for (const preset of presetRoutes) {
    if (isNear(origin, preset.origin) && isNear(destination, preset.destination)) {
      const request = { id: preset.id, label, origin, destination, fallbackCoordinates: preset.fallbackCoordinates };
      return { request, problem: null };
    }
    if (isNear(origin, preset.destination) && isNear(destination, preset.origin)) {
      // [...] ก่อน reverse เพราะ reverse แก้อาเรย์เดิม ถ้าไม่คัดลอกจะทำให้เส้นทางแนะนำกลับทิศไปด้วย
      const fallbackCoordinates = [...preset.fallbackCoordinates].reverse();
      const request = { id: `${preset.id}-reverse`, label, origin, destination, fallbackCoordinates };
      return { request, problem: null };
    }
  }

  return { request: { id: 'custom', label, origin, destination }, problem: null };
}
