/**
 * เทสต์ของ utils/conditions.js
 *
 * ไม่ต่ออินเทอร์เน็ตจริง: แทน fetch ด้วยของปลอม
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWaves, classifyRain, conditionsNeededFor, fetchWaves, fetchRain } from '../utils/conditions.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function respondWith(body, ok = true) {
  globalThis.fetch = async (url) => {
    respondWith.lastUrl = url;
    return { ok, status: ok ? 200 : 500, json: async () => body };
  };
}

test('ระดับคลื่นตาม Douglas Sea Scale และขอบของแต่ละระดับ', () => {
  assert.equal(classifyWaves(0.12).id, 'calm');
  assert.equal(classifyWaves(0.5).id, 'slight');
  assert.equal(classifyWaves(1.25).id, 'rough');
  assert.equal(classifyWaves(2.5).id, 'danger');
  assert.equal(classifyWaves(-1), null);
  assert.equal(classifyWaves(NaN), null);
});

test('ระดับฝนตามเกณฑ์ WMO', () => {
  assert.equal(classifyRain(0).id, 'none');
  assert.equal(classifyRain(1).id, 'light');
  assert.equal(classifyRain(2.5).id, 'moderate');
  assert.equal(classifyRain(7.6).id, 'moderate');
  assert.equal(classifyRain(8).id, 'heavy');
  assert.equal(classifyRain(undefined), null);
});

test('จุดจมน้ำดูคลื่น น้ำตก (ลื่น/ตก ที่เป็นสถานที่ท่องเที่ยว) ดูฝน ถนนไม่ดึงอะไรเลย', () => {
  assert.deepEqual(conditionsNeededFor({ type: 'drowning', category: 'destination' }), { waves: true, rain: false });
  assert.deepEqual(conditionsNeededFor({ type: 'fall', category: 'destination' }), { waves: false, rain: true });
  assert.deepEqual(conditionsNeededFor({ type: 'crash', category: 'road' }), { waves: false, rain: false });
  assert.deepEqual(conditionsNeededFor(null), { waves: false, rain: false });
});

test('ดึงคลื่นสำเร็จ: ได้ความสูง เวลา และระยะถึงจุดกริดทะเลที่ใช้', async () => {
  respondWith({ latitude: 7.291664, longitude: 100.70836, current: { time: '2026-09-11T06:30', wave_height: 1.4 } });
  const waves = await fetchWaves({ lat: 7.21549, lng: 100.59581 });
  assert.equal(waves.heightM, 1.4);
  assert.equal(waves.time, '2026-09-11T06:30');
  assert.ok(Math.abs(waves.gridDistanceM - 14700) < 500, `ระยะ ${waves.gridDistanceM}`);
  assert.ok(respondWith.lastUrl.includes('latitude=7.21549'), respondWith.lastUrl);
});

test('ดึงคลื่นไม่สำเร็จ หรือไม่มีค่าคลื่น คืน null ไม่ throw', async () => {
  globalThis.fetch = async () => {
    throw new Error('ไม่มีอินเทอร์เน็ต');
  };
  assert.equal(await fetchWaves({ lat: 7.2, lng: 100.6 }), null);
  respondWith({ latitude: 7.29, longitude: 100.7, current: { time: 't', wave_height: null } });
  assert.equal(await fetchWaves({ lat: 7.2, lng: 100.6 }), null);
});

test('ฝน: ปริมาณใน 15 นาทีแปลงเป็นรายชั่วโมง', async () => {
  respondWith({ current: { time: '2026-09-11T06:30', interval: 900, precipitation: 0.5 } });
  assert.deepEqual(await fetchRain({ lat: 6.94664, lng: 100.23193 }), { mmPerHour: 2, time: '2026-09-11T06:30' });
});

test('ฝน: บริการตอบผิดพลาด คืน null', async () => {
  respondWith({}, false);
  assert.equal(await fetchRain({ lat: 6.94664, lng: 100.23193 }), null);
});
