/**
 * เทสต์ของ utils/mapMarkers.js
 *
 * โจทย์: หมุดทุกหน้าจอ (แผนที่ วางแผนเส้นทาง โหมดเดินทาง) ต้องหน้าตาเหมือนกัน
 * และหมุดของข้อมูลทางการต้องแยกออกจากหมุดที่ยังไม่ยืนยันได้ด้วยตา
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointToMarker } from '../utils/mapMarkers.js';

const point = {
  id: 'hy-mot-414-km3-6',
  name: 'ถนนลพบุรีราเมศวร์ กม. 3.6',
  coordinate: { lat: 7.1, lng: 100.5 },
  riskLevel: { color: '#F57C00' },
  verified: true,
};

test('แปลงจุดเสี่ยงเป็นหมุด: ตำแหน่ง สีตามระดับความเสี่ยง และชื่อ', () => {
  assert.deepEqual(pointToMarker(point), {
    id: 'hy-mot-414-km3-6',
    lat: 7.1,
    lng: 100.5,
    color: '#F57C00',
    label: 'ถนนลพบุรีราเมศวร์ กม. 3.6',
    verified: true,
  });
});

test('จุดที่ยังไม่ยืนยัน หรือไม่มีฟิลด์ verified ไม่ได้ขอบแบบข้อมูลทางการ', () => {
  assert.equal(pointToMarker({ ...point, verified: false }).verified, false);
  assert.equal(pointToMarker({ ...point, verified: undefined }).verified, false);
});
