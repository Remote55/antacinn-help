/**
 * เทสต์ของ utils/routeRequest.js
 *
 * โจทย์ (เอกสารตาราง 3.1): ผู้ใช้ "เลือกต้นทางปลายทาง" เอง
 * ถ้าบังเอิญตรงกับเส้นทางแนะนำ ต้องได้เส้นทางสำรองออฟไลน์ของเส้นนั้นด้วย
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRouteRequest,
  placeToEndpoint,
  myLocationToEndpoint,
  MY_LOCATION_NAME,
} from '../utils/routeRequest.js';

const presets = [
  {
    id: 'psu-to-samila',
    label: 'ม.อ.หาดใหญ่ → หาดสมิหลา',
    origin: { lat: 7.0086, lng: 100.498, name: 'ม.อ.หาดใหญ่' },
    destination: { lat: 7.21549, lng: 100.59581, name: 'หาดสมิหลา' },
    fallbackCoordinates: [
      { lat: 7.0086, lng: 100.498 },
      { lat: 7.1, lng: 100.55 },
      { lat: 7.21549, lng: 100.59581 },
    ],
  },
];

const psuPlace = { name: 'ม.อ.หาดใหญ่', lat: 7.00966, lng: 100.49596 }; // ห่างต้นทางของเส้นแนะนำ ≈ 254 ม.
const samila = { name: 'หาดสมิหลา (รูปปั้นนางเงือก)', lat: 7.21549, lng: 100.59581 };
const kimyong = { name: 'ตลาดกิมหยง', lat: 7.00844, lng: 100.46999 };

test('เลือกไม่ครบ บอกให้เลือกให้ครบ', () => {
  const result = buildRouteRequest(null, samila, presets);
  assert.equal(result.request, null);
  assert.match(result.problem, /ให้ครบ/);
});

test('ต้นทางกับปลายทางเป็นที่เดียวกัน สร้างเส้นทางไม่ได้', () => {
  const result = buildRouteRequest(samila, { ...samila, name: 'ที่เดิม' }, presets);
  assert.equal(result.request, null);
  assert.match(result.problem, /ที่เดียวกัน/);
});

test('ตรงกับเส้นทางแนะนำ (ห่างไม่เกิน 300 ม.) ได้เส้นทางสำรองออฟไลน์ของเส้นนั้น', () => {
  const { request, problem } = buildRouteRequest(psuPlace, samila, presets);
  assert.equal(problem, null);
  assert.equal(request.id, 'psu-to-samila');
  assert.deepEqual(request.fallbackCoordinates, presets[0].fallbackCoordinates);
});

test('ชื่อเส้นทางใช้ชื่อที่ผู้ใช้เลือก และหาเส้นทางจากพิกัดที่ผู้ใช้เลือก', () => {
  const { request } = buildRouteRequest(psuPlace, samila, presets);
  assert.equal(request.label, 'ม.อ.หาดใหญ่ → หาดสมิหลา (รูปปั้นนางเงือก)');
  assert.equal(request.origin, psuPlace);
  assert.equal(request.destination, samila);
});

test('เลือกกลับทิศ ใช้เส้นทางสำรองเส้นเดิมแบบกลับลำดับ โดยไม่แก้ของเดิม', () => {
  const { request } = buildRouteRequest(samila, psuPlace, presets);
  assert.equal(request.id, 'psu-to-samila-reverse');
  assert.deepEqual(request.fallbackCoordinates, [...presets[0].fallbackCoordinates].reverse());
  assert.deepEqual(presets[0].fallbackCoordinates[0], { lat: 7.0086, lng: 100.498 });
});

test('ไม่ตรงกับเส้นทางแนะนำ ได้คำขอแบบเลือกเองที่ไม่มีเส้นทางสำรอง', () => {
  const { request } = buildRouteRequest(kimyong, samila, presets);
  assert.equal(request.id, 'custom');
  assert.equal(request.fallbackCoordinates, undefined);
});

test('ห่างเกิน 300 ม. ไม่นับว่าตรงกับเส้นทางแนะนำ', () => {
  // 0.0036 องศาละติจูด ≈ 400 ม. จากต้นทางของเส้นแนะนำ
  const tooFar = { name: 'ไกลเกินไป', lat: 7.0086 + 0.0036, lng: 100.498 };
  assert.equal(buildRouteRequest(tooFar, samila, presets).request.id, 'custom');
});

test('แปลงสถานที่และตำแหน่ง GPS เป็นต้นทางปลายทาง', () => {
  assert.deepEqual(
    placeToEndpoint({ name: 'ก', emoji: '🏖️', coordinate: { lat: 7.1, lng: 100.5 } }),
    { name: 'ก', lat: 7.1, lng: 100.5, emoji: '🏖️' }
  );
  const me = myLocationToEndpoint({ lat: 7.0, lng: 100.4, accuracy: 12 });
  assert.equal(me.name, MY_LOCATION_NAME);
  assert.equal(me.isMyLocation, true);
  assert.equal(me.accuracy, undefined);
});
