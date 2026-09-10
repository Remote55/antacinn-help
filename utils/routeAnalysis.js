/**
 * วิเคราะห์ว่าเส้นทางที่ผู้ใช้จะไป มีจุดเสี่ยงอะไรบ้าง และอยู่ตรงไหนของเส้นทาง
 *
 * ปัญหาที่ยากที่สุดของไฟล์นี้ (ตามเอกสารบทที่ 5.2):
 * จุดเสี่ยงที่ "อยู่ใกล้เส้นทางมากที่สุด" อาจเป็นจุดที่ "อยู่ท้ายสุดของการเดินทาง"
 * ถ้าเรียงตามระยะห่างจากเส้นทาง ผู้ใช้จะเห็นลำดับที่สับสน
 *
 * วิธีแก้: จำว่าจุดเสี่ยงแต่ละจุดเกาะอยู่กับ segment ลำดับที่เท่าไหร่
 * แล้วบวกระยะทางสะสมตั้งแต่จุดเริ่มต้นมาถึง segment นั้น
 * ค่านี้คือ "ระยะทางการเดินทางจริง" ใช้ทั้งเรียงลำดับและแสดงผล "อีก 4.2 กม.ข้างหน้า"
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { haversineMeters, projectOnSegment, clamp } from './geo.js';

/**
 * ความยาวรวมของเส้นทาง หน่วยเมตร
 */
export function calculateRouteLength(routeCoordinates) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    total += haversineMeters(routeCoordinates[i], routeCoordinates[i + 1]);
  }
  return total;
}

/**
 * หาจุดเสี่ยงที่อยู่ใกล้เส้นทาง แล้วเรียงตามลำดับที่จะขับผ่านจริง
 *
 * @param routeCoordinates อาเรย์ของ { lat, lng } เรียงจากต้นทางไปปลายทาง
 * @param riskPoints อาเรย์ของจุดเสี่ยง แต่ละจุดมีฟิลด์ coordinate
 * @param thresholdMeters ห่างจากเส้นทางไม่เกินเท่านี้ถือว่าอยู่บนเส้นทาง
 * @param options.destinationRadiusM (ไม่บังคับ) นับจุดที่อยู่ในรัศมีนี้จากปลายทางด้วย
 * @returns อาเรย์ของ { point, distanceFromRouteM, distanceAlongRouteM } เรียงตามระยะทางสะสม
 */
export function findRiskPointsAlongRoute(routeCoordinates, riskPoints, thresholdMeters, options = {}) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return [];
  if (!Array.isArray(riskPoints) || riskPoints.length === 0) return [];

  // รัศมีรอบปลายทาง: จุดเสี่ยงที่อยู่ในรัศมีนี้จากจุดสุดท้ายของเส้นทาง นับว่าอยู่บนเส้นทางด้วย
  // จำเป็นเพราะสถานที่ท่องเที่ยวหลายแห่งรถเข้าไม่ถึงตัวจุดพอดี
  // เช่น น้ำตกโตนงาช้างอยู่ห่างลานจอดรถ 375 เมตร เกินเกณฑ์ปกติ 300 เมตร
  const { destinationRadiusM = 0 } = options;
  const destination = routeCoordinates[routeCoordinates.length - 1];

  // คำนวณความยาวและระยะทางสะสมของแต่ละ segment ไว้ล่วงหน้า
  // cumulativeDistances[i] = ระยะทางจากต้นทาง มาถึง routeCoordinates[i]
  const segmentLengths = [];
  const cumulativeDistances = [0];
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentLength = haversineMeters(routeCoordinates[i], routeCoordinates[i + 1]);
    segmentLengths.push(segmentLength);
    cumulativeDistances.push(cumulativeDistances[i] + segmentLength);
  }

  const matches = [];

  for (const point of riskPoints) {
    let closestDistance = Infinity;
    let closestSegmentIndex = -1;
    let closestT = 0;

    // หาว่าจุดนี้ใกล้ segment ไหนมากที่สุด และเกาะอยู่ตรงไหนของ segment นั้น
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const projection = projectOnSegment(
        point.coordinate,
        routeCoordinates[i],
        routeCoordinates[i + 1]
      );
      if (projection.distanceM < closestDistance) {
        closestDistance = projection.distanceM;
        closestSegmentIndex = i;
        closestT = projection.t;
      }
    }

    // ไกลเกินเกณฑ์ = ไม่ถือว่าอยู่บนเส้นทางนี้ ยกเว้นอยู่ใกล้ปลายทาง
    const isNearRoute = closestDistance <= thresholdMeters;
    const isNearDestination =
      destinationRadiusM > 0 && haversineMeters(point.coordinate, destination) <= destinationRadiusM;
    if (!isNearRoute && !isNearDestination) continue;

    // ระยะทางสะสมถึงต้น segment บวกด้วยระยะที่เดินเข้าไปใน segment นั้น (t x ความยาว segment)
    //
    // การบวก t x ความยาว สำคัญมาก ถ้าใช้แค่ระยะสะสมถึงต้น segment เฉย ๆ
    // จุดที่อยู่ปลาย segment จะได้ค่าเท่ากับจุดที่อยู่ต้น segment เดียวกัน ซึ่งผิด
    // และจุดที่ตกอยู่บนรอยต่อพอดีจะได้ค่าต่างกันไปเลย ขึ้นกับว่าลูปเจอ segment ไหนก่อน
    const distanceAlongRoute =
      cumulativeDistances[closestSegmentIndex] + closestT * segmentLengths[closestSegmentIndex];

    matches.push({
      point,
      distanceFromRouteM: Math.round(closestDistance),
      // ค่านี้ใช้ทั้งเรียงลำดับ และใช้บอกผู้ใช้ว่า "อีกกี่กิโลเมตรข้างหน้า"
      distanceAlongRouteM: Math.round(distanceAlongRoute),
    });
  }

  // เรียงตามลำดับที่จะขับผ่าน ไม่ใช่ตามความใกล้
  return matches.sort((a, b) => a.distanceAlongRouteM - b.distanceAlongRouteM);
}

/**
 * คะแนนความเสี่ยงรวมของทั้งเส้นทาง 0-100
 * (ตามที่เอกสารบทที่ 4 ระบุว่าหน้าวางแผนเส้นทางต้องแสดง "คะแนนความปลอดภัยรวมของเส้นทาง")
 *
 * สูตร: 60% ของคะแนนจุดที่แย่ที่สุด + 40% ของคะแนนเฉลี่ย
 *
 * ทำไมต้องผสมสองอย่าง ไม่ใช้อย่างใดอย่างหนึ่ง:
 *   - ถ้าใช้ค่าเฉลี่ยอย่างเดียว เส้นทางที่มีจุดอันตรายมาก 1 จุด
 *     ปนกับจุดเฝ้าระวังอีก 9 จุด จะได้คะแนนต่ำ ทั้งที่จริงอันตราย
 *   - ถ้าใช้ค่าสูงสุดอย่างเดียว เส้นทางที่มีจุดเสี่ยง 1 จุด
 *     จะดูอันตรายเท่ากับเส้นทางที่มีจุดเสี่ยงแบบเดียวกัน 15 จุด ซึ่งก็ไม่จริง
 *
 * @param pointsOnRoute ผลลัพธ์จาก findRiskPointsAlongRoute
 * @returns จำนวนเต็ม 0-100
 */
export function calculateRouteRiskScore(pointsOnRoute) {
  if (!Array.isArray(pointsOnRoute) || pointsOnRoute.length === 0) return 0;

  const scores = pointsOnRoute.map((item) => item.point.riskScore || 0);

  const highest = Math.max(...scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(clamp(0.6 * highest + 0.4 * average, 0, 100));
}
