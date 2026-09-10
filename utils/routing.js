/**
 * ดึงเส้นทางจริงบนถนน จากบริการ OSRM
 *
 * ทำไมถึงเลือก OSRM: ใช้ฟรี ไม่ต้องสมัคร ไม่ต้องใช้ API key ไม่ต้องผูกบัตรเครดิต
 * ต่างจาก Google Directions API ที่ต้องเปิดบัญชีเรียกเก็บเงิน
 * (ตรวจสอบแล้วเมื่อ 2026-09-05: ม.อ.หาดใหญ่ -> หาดสมิหลา = 28.4 กม. / 31 นาที / 471 พิกัด)
 *
 * ข้อควรระวัง: router.project-osrm.org เป็นเซิร์ฟเวอร์สาธิต ไม่รับประกันความพร้อมใช้งาน
 * ดังนั้นต้องมีเส้นทางสำรองในเครื่องเสมอ เผื่อล่มหรือผู้ใช้ไม่มีอินเทอร์เน็ต
 *
 * ไฟล์นี้ไม่ import react — เรียกใช้จาก hook หรือ screen ก็ได้
 */

import { OSRM } from '../constants/config.js';

/** ผลลัพธ์ที่ทุกฟังก์ชันในไฟล์นี้คืนออกมา จะมีรูปแบบเดียวกันเสมอ */
function makeRouteResult(coordinates, distanceM, durationS, sourceLabel) {
  return { coordinates, distanceM, durationS, source: sourceLabel };
}

/**
 * เรียก OSRM เพื่อขอเส้นทางจริงบนถนน
 *
 * OSRM ใช้ลำดับ lng,lat (ตรงข้ามกับที่เราคุ้นเคย) จึงต้องสลับตอนส่งและตอนรับ
 *
 * @throws Error ถ้าเครือข่ายล้ม หมดเวลา หรือ OSRM หาเส้นทางไม่ได้
 */
export async function fetchRouteFromOsrm(origin, destination) {
  // OSRM ต้องการรูปแบบ lng,lat;lng,lat
  const coordinatePair = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM.BASE_URL}/${coordinatePair}?overview=full&geometries=geojson`;

  // AbortController ใช้ตัดการเชื่อมต่อถ้าเกินเวลาที่กำหนด
  // ถ้าไม่มีตัวนี้ ผู้ใช้อาจต้องรอค้างเป็นนาทีเมื่อเน็ตช้า
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM.TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`OSRM ตอบกลับด้วยสถานะ ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM หาเส้นทางไม่ได้ (code: ${data.code})`);
    }

    const route = data.routes[0];

    // แปลงกลับจาก [lng, lat] เป็น { lat, lng } ที่แอปเราใช้
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

    return makeRouteResult(coordinates, route.distance, route.duration, 'osrm');
  } finally {
    // ต้องล้าง timer เสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว
    clearTimeout(timeoutId);
  }
}

/**
 * ขอเส้นทาง โดยพยายามใช้ OSRM ก่อน ถ้าไม่ได้ค่อยใช้ของสำรอง
 *
 * นี่คือฟังก์ชันที่หน้าจอควรเรียกใช้ ไม่ใช่ fetchRouteFromOsrm โดยตรง
 * เพราะฟังก์ชันนี้รับประกันว่าจะได้เส้นทางเสมอ ไม่มีทาง throw
 *
 * @param routeRequest { origin, destination, fallbackCoordinates? }
 *   ได้จาก data/presetRoutes.json โดยตรง หรือจาก buildRouteRequest ใน utils/routeRequest.js
 * @returns { coordinates, distanceM, durationS, source }
 *   source = 'osrm'     เส้นทางจริงบนถนน จากอินเทอร์เน็ต
 *          | 'offline'  เส้นทางสำรองที่เก็บไว้ในเครื่อง (ถนนจริงแบบลดรายละเอียด)
 *          | 'straight' เส้นตรงระหว่างต้นทางกับปลายทาง ไม่ใช่ถนนจริง
 *                       ใช้เมื่อไม่มีอินเทอร์เน็ตและเส้นทางนี้ไม่มีข้อมูลสำรอง
 */
export async function getRouteWithFallback(routeRequest) {
  const { origin, destination, fallbackCoordinates } = routeRequest;

  try {
    return await fetchRouteFromOsrm(origin, destination);
  } catch (error) {
    // ไม่ throw ต่อ เพราะแอปต้องใช้งานได้แม้ไม่มีอินเทอร์เน็ต (ตามเอกสารบทที่ 6.2)
    console.warn('ดึงเส้นทางจาก OSRM ไม่สำเร็จ ใช้เส้นทางสำรองแทน:', error.message);

    // ของสำรองไม่มีข้อมูลระยะทาง/เวลาจริง ส่ง null ไปให้หน้าจอตัดสินใจว่าจะซ่อนหรือแสดงอะไร
    if (Array.isArray(fallbackCoordinates) && fallbackCoordinates.length >= 2) {
      return makeRouteResult(fallbackCoordinates, null, null, 'offline');
    }

    const straightLine = [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ];
    return makeRouteResult(straightLine, null, null, 'straight');
  }
}
