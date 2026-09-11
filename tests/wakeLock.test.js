/**
 * เทสต์ของ utils/wakeLock.js
 *
 * โจทย์: ระหว่างโหมดเดินทาง หน้าจอต้องไม่ดับเอง (จอดับแล้วแอปหยุดติดตามตำแหน่ง การเตือนก็หยุด)
 * บนเว็บใช้ Screen Wake Lock ของเบราว์เซอร์ ซึ่งปล่อยล็อกเองทุกครั้งที่หน้าเว็บถูกซ่อน
 *
 * ใช้ของปลอมแทน navigator.wakeLock และ document จึงรันได้ใน Node โดยไม่ต้องมีเบราว์เซอร์
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepScreenAwake } from '../utils/wakeLock.js';

/** document ปลอม: เปลี่ยนสถานะการแสดงผลแล้วยิง visibilitychange ได้ */
function createFakeDocument(visibilityState = 'visible') {
  const listeners = new Set();
  return {
    visibilityState,
    addEventListener(type, listener) {
      if (type === 'visibilitychange') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'visibilitychange') listeners.delete(listener);
    },
    setVisibility(state) {
      this.visibilityState = state;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

/** navigator.wakeLock ปลอม: นับจำนวนครั้งที่ขอ และสั่งให้ขอไม่สำเร็จได้ */
function createFakeWakeLock({ rejectWith = null } = {}) {
  const sentinels = [];
  return {
    sentinels,
    async request(type) {
      assert.equal(type, 'screen');
      if (rejectWith) throw rejectWith;
      const sentinel = {
        released: false,
        async release() {
          sentinel.released = true;
        },
      };
      sentinels.push(sentinel);
      return sentinel;
    },
  };
}

/** รอให้ promise ที่ค้างอยู่ทำงานจนจบ */
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('เบราว์เซอร์ไม่มี Wake Lock: บอกว่าสั่งไม่ได้ และเรียก stop ได้โดยไม่พัง', () => {
  const changes = [];
  const stop = keepScreenAwake({ wakeLock: undefined, doc: createFakeDocument(), onChange: (v) => changes.push(v) });
  assert.deepEqual(changes, [false]);
  stop();
});

test('หน้าเว็บแสดงอยู่: ขอล็อกทันทีและบอกว่าสั่งได้', async () => {
  const wakeLock = createFakeWakeLock();
  const changes = [];
  keepScreenAwake({ wakeLock, doc: createFakeDocument(), onChange: (v) => changes.push(v) });
  await settle();
  assert.equal(wakeLock.sentinels.length, 1);
  assert.deepEqual(changes, [true]);
});

test('หน้าเว็บถูกซ่อนอยู่: ยังไม่ขอ (เบราว์เซอร์ปฏิเสธแน่นอน) รอจนหน้าเว็บกลับมาแสดง', async () => {
  const wakeLock = createFakeWakeLock();
  const doc = createFakeDocument('hidden');
  keepScreenAwake({ wakeLock, doc, onChange: () => {} });
  await settle();
  assert.equal(wakeLock.sentinels.length, 0);

  doc.setVisibility('visible');
  await settle();
  assert.equal(wakeLock.sentinels.length, 1);
});

test('สลับแอปแล้วกลับมา: ขอล็อกใหม่ เพราะเบราว์เซอร์ปล่อยล็อกเดิมไปแล้ว', async () => {
  const wakeLock = createFakeWakeLock();
  const doc = createFakeDocument();
  keepScreenAwake({ wakeLock, doc, onChange: () => {} });
  await settle();

  // เบราว์เซอร์ปล่อยล็อกเองเมื่อหน้าเว็บถูกซ่อน
  wakeLock.sentinels[0].released = true;
  doc.setVisibility('hidden');
  doc.setVisibility('visible');
  await settle();

  assert.equal(wakeLock.sentinels.length, 2);
  assert.equal(wakeLock.sentinels[1].released, false);
});

test('ยังถือล็อกอยู่หรือกำลังขออยู่: ไม่ขอซ้ำ', async () => {
  const wakeLock = createFakeWakeLock();
  const doc = createFakeDocument();
  keepScreenAwake({ wakeLock, doc, onChange: () => {} });
  // ยิง visibilitychange ขณะคำขอแรกยังไม่เสร็จ
  doc.setVisibility('visible');
  await settle();
  // ยิงอีกครั้งตอนถือล็อกอยู่
  doc.setVisibility('visible');
  await settle();
  assert.equal(wakeLock.sentinels.length, 1);
});

test('เบราว์เซอร์ปฏิเสธ (เช่น โหมดประหยัดแบต): บอกว่าสั่งไม่ได้ ไม่โยน error ออกไป', async () => {
  const error = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
  const changes = [];
  keepScreenAwake({
    wakeLock: createFakeWakeLock({ rejectWith: error }),
    doc: createFakeDocument(),
    onChange: (v) => changes.push(v),
  });
  await settle();
  assert.deepEqual(changes, [false]);
});

test('ออกจากหน้าจอ: ปล่อยล็อก และเลิกฟัง visibilitychange', async () => {
  const wakeLock = createFakeWakeLock();
  const doc = createFakeDocument();
  const stop = keepScreenAwake({ wakeLock, doc, onChange: () => {} });
  await settle();

  stop();
  await settle();
  assert.equal(wakeLock.sentinels[0].released, true);
  assert.equal(doc.listenerCount(), 0);

  doc.setVisibility('visible');
  await settle();
  assert.equal(wakeLock.sentinels.length, 1);
});

test('ออกจากหน้าจอขณะคำขอยังไม่เสร็จ: ล็อกที่ได้มาทีหลังถูกปล่อยทันที ไม่ค้างให้จอไม่ดับตลอดไป', async () => {
  const wakeLock = createFakeWakeLock();
  const changes = [];
  const stop = keepScreenAwake({ wakeLock, doc: createFakeDocument(), onChange: (v) => changes.push(v) });
  stop();
  await settle();

  assert.equal(wakeLock.sentinels.length, 1);
  assert.equal(wakeLock.sentinels[0].released, true);
  // หน้าจอปิดไปแล้ว ไม่ต้องแจ้งสถานะ (กัน setState หลัง unmount)
  assert.deepEqual(changes, []);
});
