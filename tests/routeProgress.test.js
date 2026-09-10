/**
 * เทสต์ของ utils/routeProgress.js
 *
 * โจทย์ (เอกสารบทที่ 5.2): บอกผู้ใช้ว่า "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง"
 * ระยะนี้ต้องวัดตามถนน ไม่ใช่เส้นตรง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locateOnRoute, nextRiskOnRoute, describeRouteStatus } from '../utils/routeProgress.js';

/** เส้นทางทดสอบ: วิ่งตรงขึ้นเหนือจาก lat 7.00 ถึง 7.04 ที่ lng 100.5 ช่วงละประมาณ 1,112 ม. */
const straightRoute = [
  { lat: 7.0, lng: 100.5 },
  { lat: 7.01, lng: 100.5 },
  { lat: 7.02, lng: 100.5 },
  { lat: 7.03, lng: 100.5 },
  { lat: 7.04, lng: 100.5 },
];

/** จุดเสี่ยงบนเส้นทางในรูปแบบเดียวกับที่ findRiskPointsAlongRoute คืนมา */
const onRoute = [
  { point: { id: 'a', name: 'จุด ก' }, distanceAlongRouteM: 500 },
  { point: { id: 'b', name: 'จุด ข' }, distanceAlongRouteM: 4200 },
];

test('locateOnRoute: จุดบนเส้นทางพอดี ห่างเส้นทาง 0 และระยะสะสมถูกต้อง', () => {
  const result = locateOnRoute(straightRoute, { lat: 7.02, lng: 100.5 });
  assert.ok(result.offRouteM < 1, `ห่างเส้นทาง ${result.offRouteM}`);
  assert.ok(Math.abs(result.alongM - 2224) < 30, `ระยะสะสม ${result.alongM}`);
});

test('locateOnRoute: จุดข้างทาง บอกทั้งระยะห่างและตำแหน่งตามเส้นทาง', () => {
  // 0.005 องศาลองจิจูดที่ละติจูด 7 ประมาณ 552 ม. และอยู่กลางช่วงที่สอง (1.5 ช่วง = 1,668 ม.)
  const result = locateOnRoute(straightRoute, { lat: 7.015, lng: 100.505 });
  assert.ok(Math.abs(result.offRouteM - 552) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
  assert.ok(Math.abs(result.alongM - 1668) < 30, `ระยะสะสม ${result.alongM}`);
});

test('locateOnRoute: ก่อนถึงต้นทาง ระยะสะสมเป็น 0', () => {
  const result = locateOnRoute(straightRoute, { lat: 6.99, lng: 100.5 });
  assert.equal(result.alongM, 0);
  assert.ok(Math.abs(result.offRouteM - 1112) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
});

test('locateOnRoute: เลยปลายทาง ระยะสะสมเท่าความยาวทั้งเส้น', () => {
  const result = locateOnRoute(straightRoute, { lat: 7.05, lng: 100.5 });
  assert.ok(Math.abs(result.alongM - 4448) < 40, `ระยะสะสม ${result.alongM}`);
  assert.ok(Math.abs(result.offRouteM - 1112) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
});

test('locateOnRoute: ข้อมูลไม่พอ คืน null ไม่พัง', () => {
  assert.equal(locateOnRoute([{ lat: 7.0, lng: 100.5 }], { lat: 7.0, lng: 100.5 }), null);
  assert.equal(locateOnRoute(straightRoute, null), null);
});

test('nextRiskOnRoute: ได้จุดถัดไปพร้อมระยะที่เหลือตามเส้นทาง', () => {
  const next = nextRiskOnRoute(onRoute, 0);
  assert.equal(next.item.point.id, 'a');
  assert.equal(next.remainingM, 500);
});

test('nextRiskOnRoute: ผ่านจุดแรกแล้ว ได้จุดที่สอง', () => {
  const next = nextRiskOnRoute(onRoute, 600);
  assert.equal(next.item.point.id, 'b');
  assert.equal(next.remainingM, 3600);
});

test('nextRiskOnRoute: อยู่ตรงจุดพอดี นับว่าผ่านแล้ว', () => {
  assert.equal(nextRiskOnRoute(onRoute, 500).item.point.id, 'b');
});

test('nextRiskOnRoute: ผ่านครบทุกจุด หรือไม่มีจุดเลย คืน null', () => {
  assert.equal(nextRiskOnRoute(onRoute, 5000), null);
  assert.equal(nextRiskOnRoute([], 0), null);
});

test('describeRouteStatus: อยู่บนเส้นทาง บอกจุดถัดไปและระยะตามเส้นทาง', () => {
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.0, lng: 100.5 }, 300);
  assert.equal(status.kind, 'next');
  assert.equal(status.point.id, 'a');
  assert.ok(Math.abs(status.remainingM - 500) < 5, `เหลือ ${status.remainingM}`);
});

test('describeRouteStatus: ออกนอกเส้นทางเกินเกณฑ์ บอกว่าออกนอกเส้นทาง', () => {
  // 0.01 องศาลองจิจูด ประมาณ 1,104 ม. เกินเกณฑ์ 300 ม.
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.02, lng: 100.51 }, 300);
  assert.equal(status.kind, 'offRoute');
  assert.ok(Math.abs(status.offRouteM - 1104) < 30, `ห่าง ${status.offRouteM}`);
});

test('describeRouteStatus: ผ่านทุกจุดแล้ว', () => {
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.04, lng: 100.5 }, 300);
  assert.equal(status.kind, 'done');
});

test('describeRouteStatus: ยังไม่มีตำแหน่ง คืน null', () => {
  assert.equal(describeRouteStatus(straightRoute, onRoute, null, 300), null);
});
