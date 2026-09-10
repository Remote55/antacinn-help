/**
 * สถานที่ท่องเที่ยวยอดนิยม: สรุปจุดเสี่ยงรอบสถานที่ และค้นหาสถานที่
 *
 * เอกสารบทที่ 4 กำหนดให้หน้าแรกมี "การ์ดสถานที่ยอดนิยม"
 * การ์ดแต่ละใบบอกว่ารอบสถานที่นั้นมีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 * ผู้ใช้จะได้รู้ก่อนไปว่าที่นั่นต้องระวังแค่ไหน
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { normalizeText } from './search.js';

/**
 * @param place สถานที่จาก data/places.json ต้องมี coordinate
 * @param points จุดเสี่ยงที่มี riskScore และ riskLevel แล้ว (จาก useRiskPoints)
 * @param radiusM รัศมีที่นับ หน่วยเมตร
 * @returns {
 *   count    จำนวนจุดเสี่ยงในรัศมี
 *   highest  จุดที่คะแนนความเสี่ยงสูงที่สุด ถ้าเท่ากันเอาจุดที่ใกล้กว่า / null ถ้าไม่มีจุดในรัศมี
 *   nearby   [{ point, distanceM }] เรียงจากใกล้ไปไกล
 * }
 */
export function summarizeRisksNearPlace(place, points, radiusM) {
  const nearby = (points || [])
    .map((point) => ({ point, distanceM: haversineMeters(place.coordinate, point.coordinate) }))
    .filter((item) => item.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);

  // วนจากใกล้ไปไกล และแทนที่เฉพาะเมื่อคะแนน "มากกว่า" จุดที่ใกล้กว่าจึงชนะเมื่อคะแนนเท่ากัน
  let highest = null;
  for (const item of nearby) {
    if (!highest || (item.point.riskScore || 0) > (highest.riskScore || 0)) highest = item.point;
  }

  return { count: nearby.length, highest, nearby };
}

/**
 * ให้คะแนนความเกี่ยวข้อง
 *   3 = ชื่อขึ้นต้นด้วยคำค้น   2 = ชื่อมีคำค้นอยู่ข้างใน   1 = ตรงกับอำเภออย่างเดียว
 */
function placeRelevance(place, query) {
  const name = normalizeText(place.name);
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 2;
  if (normalizeText(place.district).includes(query)) return 1;
  return 0;
}

/**
 * ค้นสถานที่จากชื่อหรืออำเภอ เรียงตามความเกี่ยวข้อง คะแนนเท่ากันคงลำดับเดิมของไฟล์ข้อมูล
 * @returns สถานที่ที่ตรง ถ้าไม่ได้พิมพ์อะไรคืนอาเรย์ว่าง
 */
export function searchPlaces(places, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || !Array.isArray(places)) return [];

  return places
    .map((place, index) => ({ place, index, score: placeRelevance(place, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.place);
}
