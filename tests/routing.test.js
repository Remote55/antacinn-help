/**
 * เทสต์ของ utils/routing.js
 *
 * ไม่ต่ออินเทอร์เน็ตจริง: แทน fetch ด้วยของปลอม เพื่อจำลองทั้งตอน OSRM ตอบปกติและตอนล่ม
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getRouteWithFallback } from '../utils/routing.js';

const realFetch = globalThis.fetch;
const realWarn = console.warn;

afterEach(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
});

const origin = { lat: 7.0086, lng: 100.498, name: 'ม.อ.หาดใหญ่' };
const destination = { lat: 7.21549, lng: 100.59581, name: 'หาดสมิหลา' };

/** ทำให้ fetch ล้มเหลวเหมือนไม่มีอินเทอร์เน็ต และปิดข้อความเตือนไม่ให้รกผลเทสต์ */
function simulateOffline() {
  globalThis.fetch = async () => {
    throw new Error('ไม่มีอินเทอร์เน็ต');
  };
  console.warn = () => {};
}

test('OSRM ตอบปกติ: ได้เส้นทางจริง และสลับ [lng, lat] เป็น { lat, lng }', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{ distance: 28400, duration: 1860, geometry: { coordinates: [[100.498, 7.0086], [100.59581, 7.21549]] } }],
      }),
    };
  };

  const result = await getRouteWithFallback({ origin, destination });

  assert.equal(result.source, 'osrm');
  assert.deepEqual(result.coordinates, [{ lat: 7.0086, lng: 100.498 }, { lat: 7.21549, lng: 100.59581 }]);
  assert.equal(result.distanceM, 28400);
  // OSRM ต้องการลำดับ lng,lat
  assert.ok(requestedUrl.includes('100.498,7.0086;100.59581,7.21549'), requestedUrl);
});

test('ไม่มีอินเทอร์เน็ต และมีเส้นทางสำรอง: ใช้เส้นทางสำรองที่เก็บในเครื่อง', async () => {
  simulateOffline();
  const fallbackCoordinates = [origin, { lat: 7.1, lng: 100.55 }, destination];
  const result = await getRouteWithFallback({ origin, destination, fallbackCoordinates });
  assert.equal(result.source, 'offline');
  assert.equal(result.coordinates, fallbackCoordinates);
  assert.equal(result.distanceM, null);
});

test('ไม่มีอินเทอร์เน็ต และไม่มีเส้นทางสำรอง: ได้เส้นตรง และบอกชัดว่าเป็นเส้นตรง', async () => {
  simulateOffline();
  const result = await getRouteWithFallback({ origin, destination });
  assert.equal(result.source, 'straight');
  assert.deepEqual(result.coordinates, [{ lat: 7.0086, lng: 100.498 }, { lat: 7.21549, lng: 100.59581 }]);
});

test('OSRM ตอบว่าหาเส้นทางไม่ได้ ก็ใช้เส้นทางสำรองเหมือนกัน ไม่พัง', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ code: 'NoRoute', routes: [] }) });
  console.warn = () => {};
  const result = await getRouteWithFallback({ origin, destination, fallbackCoordinates: [origin, destination] });
  assert.equal(result.source, 'offline');
});
