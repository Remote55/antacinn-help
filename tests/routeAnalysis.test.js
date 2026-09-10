/**
 * เทสต์ของ utils/routeAnalysis.js
 *
 * โจทย์สำคัญที่สุด: จุดเสี่ยงต้องเรียงตาม "ลำดับที่ผู้ใช้จะขับผ่านจริง"
 * ไม่ใช่เรียงตาม "ระยะห่างจากเส้นทาง" (ตามเอกสารบทที่ 5.2)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findRiskPointsAlongRoute,
  calculateRouteLength,
  calculateRouteRiskScore,
} from '../utils/routeAnalysis.js';

/** เส้นทางทดสอบ: วิ่งตรงขึ้นเหนือจาก lat 7.00 ถึง 7.04 ที่ lng 100.5 */
const straightRoute = [
  { lat: 7.00, lng: 100.5 },
  { lat: 7.01, lng: 100.5 },
  { lat: 7.02, lng: 100.5 },
  { lat: 7.03, lng: 100.5 },
  { lat: 7.04, lng: 100.5 },
];

function makePoint(id, lat, lng) {
  return { id, name: id, coordinate: { lat, lng }, incidents: [], peakMonths: [], peakHours: [] };
}

test('calculateRouteLength: เส้นทางทดสอบยาวประมาณ 4.4 กม.', () => {
  const length = calculateRouteLength(straightRoute);
  assert.ok(Math.abs(length - 4432) < 100, `ได้ ${length} คาดว่าประมาณ 4432`);
});

test('calculateRouteLength: เส้นทางที่มีจุดเดียว ยาว 0', () => {
  assert.equal(calculateRouteLength([{ lat: 7, lng: 100.5 }]), 0);
});

test('calculateRouteLength: เส้นทางว่าง ยาว 0', () => {
  assert.equal(calculateRouteLength([]), 0);
});

test('เลือกเฉพาะจุดที่อยู่ใกล้เส้นทางไม่เกินเกณฑ์', () => {
  const points = [
    makePoint('near', 7.02, 100.5),      // อยู่บนเส้นพอดี
    makePoint('far', 7.02, 100.8),       // ห่างประมาณ 33 กม.
  ];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);
  assert.equal(result.length, 1);
  assert.equal(result[0].point.id, 'near');
});

test('เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่ตามระยะห่างจากเส้นทาง', () => {
  const points = [
    // จุดนี้อยู่ท้ายเส้นทาง แต่ใกล้เส้นมากที่สุด (ห่าง 0 เมตร)
    makePoint('last-but-closest', 7.038, 100.5),
    // จุดนี้อยู่ต้นเส้นทาง แต่ห่างจากเส้น 200 เมตร
    makePoint('first-but-farther', 7.005, 100.5018),
  ];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  assert.equal(result.length, 2);
  // ถ้าเรียงผิด (เรียงตามระยะห่าง) จุด last-but-closest จะมาก่อน ซึ่งผิด
  assert.equal(result[0].point.id, 'first-but-farther', 'จุดต้นทางต้องมาก่อน');
  assert.equal(result[1].point.id, 'last-but-closest', 'จุดปลายทางต้องมาทีหลัง');
});

test('คืนระยะทางสะสมจากจุดเริ่มต้น เพื่อใช้บอกว่า "อีกกี่กิโลเมตรข้างหน้า"', () => {
  const points = [makePoint('middle', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  // จุดนี้อยู่ที่พิกัด 7.02 = ผ่านมาแล้ว 2 segment = 2 x 1112 = ประมาณ 2,224 เมตร
  assert.ok(
    Math.abs(result[0].distanceAlongRouteM - 2224) < 60,
    `ได้ ${result[0].distanceAlongRouteM} คาดว่าประมาณ 2224`
  );
});

test('จุดที่อยู่กลาง segment ต้องได้ระยะสะสมที่ละเอียดกว่าระดับ segment', () => {
  // จุดนี้อยู่กึ่งกลางของ segment แรก (7.00 -> 7.01) = ประมาณ 556 เมตร
  //
  // เทสต์นี้มีไว้จับบั๊กเฉพาะ: ถ้าโค้ดใช้แค่ "ระยะสะสมถึงต้น segment"
  // จุดนี้จะได้ค่า 0 ซึ่งผิด เพราะจริง ๆ ผู้ใช้ต้องขับไปครึ่ง segment ก่อนถึงจุดนี้
  const points = [makePoint('half-way-in', 7.005, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  assert.ok(
    Math.abs(result[0].distanceAlongRouteM - 556) < 60,
    `ได้ ${result[0].distanceAlongRouteM} คาดว่าประมาณ 556`
  );
});

test('คืนระยะห่างจากเส้นทางด้วย', () => {
  const points = [makePoint('on-line', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);
  assert.ok(result[0].distanceFromRouteM < 5, 'จุดที่อยู่บนเส้นต้องห่างเกือบ 0');
});

test('เส้นทางว่าง ต้องคืนอาเรย์ว่าง ไม่พัง', () => {
  assert.deepEqual(findRiskPointsAlongRoute([], [makePoint('a', 7, 100.5)], 300), []);
});

test('ไม่มีจุดเสี่ยงเลย ต้องคืนอาเรย์ว่าง', () => {
  assert.deepEqual(findRiskPointsAlongRoute(straightRoute, [], 300), []);
});

test('จุดเดียวกันต้องไม่ถูกนับซ้ำ แม้จะใกล้หลาย segment', () => {
  const points = [makePoint('corner', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 5000);
  assert.equal(result.length, 1, 'ต้องปรากฏแค่ครั้งเดียว');
});

/** ช่วยสร้างข้อมูลรูปแบบเดียวกับที่ findRiskPointsAlongRoute คืนออกมา */
function makeScored(scores) {
  return scores.map((riskScore, index) => ({
    point: { id: 'p' + index, riskScore },
    distanceFromRouteM: 0,
    distanceAlongRouteM: index * 100,
  }));
}

test('calculateRouteRiskScore: เส้นทางที่ไม่มีจุดเสี่ยงเลย ได้ 0', () => {
  assert.equal(calculateRouteRiskScore([]), 0);
});

test('calculateRouteRiskScore: มีจุดเดียว ได้คะแนนเท่ากับจุดนั้น', () => {
  // 0.6 x 50 + 0.4 x 50 = 50
  assert.equal(calculateRouteRiskScore(makeScored([50])), 50);
});

test('calculateRouteRiskScore: จุดอันตรายมาก 1 จุด ต้องดันคะแนนรวมให้สูง', () => {
  // max = 100, avg = 53.33 -> 0.6 x 100 + 0.4 x 53.33 = 81.3 -> 81
  // ถ้าใช้ค่าเฉลี่ยอย่างเดียวจะได้แค่ 53 ซึ่งทำให้ผู้ใช้ประมาท
  assert.equal(calculateRouteRiskScore(makeScored([100, 40, 20])), 81);
});

test('calculateRouteRiskScore: ไม่ทะลุ 100 และไม่ติดลบ', () => {
  const score = calculateRouteRiskScore(makeScored([100, 100, 100]));
  assert.ok(score <= 100 && score >= 0, `คะแนนต้องอยู่ในช่วง 0-100 แต่ได้ ${score}`);
});

test('จุดเลยปลายทางไปเกินเกณฑ์ ต้องไม่ถูกนับ ถ้าไม่ได้ขอรัศมีปลายทาง', () => {
  // จุดนี้อยู่เลยปลายเส้นทาง (lat 7.04) ไปทางเหนือ 0.0035 องศา ประมาณ 389 เมตร
  const points = [makePoint('waterfall', 7.0435, 100.5)];
  assert.equal(findRiskPointsAlongRoute(straightRoute, points, 300).length, 0);
});

test('destinationRadiusM: จุดใกล้ปลายทางต้องถูกนับ แม้ห่างถนนเกินเกณฑ์', () => {
  // สถานการณ์จริง: น้ำตกโตนงาช้างอยู่ห่างจุดสุดท้ายที่รถเข้าถึง 375 เมตร
  // ถ้าไม่มีกฎนี้ เส้นทางไปน้ำตกจะไม่แสดงอันตรายของตัวน้ำตกเลย
  const points = [makePoint('waterfall', 7.0435, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300, { destinationRadiusM: 500 });
  assert.equal(result.length, 1);
  // อยู่ปลายทาง ระยะสะสมจึงเท่ากับความยาวเส้นทางทั้งเส้น (ประมาณ 4,448 ม.)
  assert.ok(Math.abs(result[0].distanceAlongRouteM - 4448) < 60, `ได้ ${result[0].distanceAlongRouteM}`);
  assert.ok(Math.abs(result[0].distanceFromRouteM - 389) < 30, `ได้ ${result[0].distanceFromRouteM}`);
});
