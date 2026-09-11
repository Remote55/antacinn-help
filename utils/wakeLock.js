/**
 * สั่งไม่ให้หน้าจอดับบนเว็บ ด้วย Screen Wake Lock API ของเบราว์เซอร์
 *
 * ปัญหาที่ต้องจัดการเอง (expo-keep-awake บนเว็บไม่ได้จัดการให้):
 *   1. เบราว์เซอร์ปล่อยล็อกเองทุกครั้งที่หน้าเว็บถูกซ่อน (สลับแอป กดปิดจอ เปลี่ยนแท็บ) และไม่ขอคืนให้
 *      → ขอใหม่เมื่อหน้าเว็บกลับมาแสดง
 *   2. บางเบราว์เซอร์ไม่มี API นี้ หรือปฏิเสธคำขอ (เช่น โหมดประหยัดแบตเตอรี่)
 *      → บอกผ่าน onChange(false) ให้หน้าจอแนะนำผู้ใช้ ไม่โยน error
 *   3. ผู้ใช้ออกจากหน้าจอขณะคำขอยังไม่เสร็จ
 *      → ล็อกที่ได้มาทีหลังต้องปล่อยทันที ไม่อย่างนั้นจอจะไม่ดับตลอดไป
 *
 * รับ wakeLock และ doc เป็นพารามิเตอร์แทนการใช้ navigator กับ document ตรงๆ
 * เพื่อทดสอบด้วยของปลอมใน Node ได้ (tests/wakeLock.test.js)
 *
 * @param {object} options
 * @param {{ request(type: 'screen'): Promise<{ released: boolean, release(): Promise<void> }> } | undefined} options.wakeLock
 *   navigator.wakeLock (undefined ถ้าเบราว์เซอร์ไม่รองรับ)
 * @param {{ visibilityState: string, addEventListener: Function, removeEventListener: Function }} options.doc
 *   document ของหน้าเว็บ
 * @param {(canKeepAwake: boolean) => void} options.onChange เรียกเมื่อรู้ผลว่าสั่งได้หรือไม่
 * @returns {() => void} ฟังก์ชันหยุด: ปล่อยล็อกและเลิกฟังเหตุการณ์
 */
export function keepScreenAwake({ wakeLock, doc, onChange }) {
  if (!wakeLock || typeof wakeLock.request !== 'function') {
    onChange(false);
    return () => {};
  }

  let sentinel = null;
  let isRequesting = false;
  let isStopped = false;

  async function acquire() {
    const isHeld = sentinel !== null && !sentinel.released;
    // ขอได้เฉพาะตอนหน้าเว็บแสดงอยู่ ถ้าขอตอนซ่อน เบราว์เซอร์ปฏิเสธแน่นอน
    if (isStopped || isRequesting || isHeld || doc.visibilityState !== 'visible') return;

    isRequesting = true;
    try {
      const lock = await wakeLock.request('screen');
      if (isStopped) {
        releaseQuietly(lock);
        return;
      }
      sentinel = lock;
      onChange(true);
    } catch (error) {
      if (!isStopped) onChange(false);
    } finally {
      isRequesting = false;
    }
  }

  function handleVisibilityChange() {
    if (doc.visibilityState === 'visible') acquire();
  }

  doc.addEventListener('visibilitychange', handleVisibilityChange);
  acquire();

  return function stop() {
    isStopped = true;
    doc.removeEventListener('visibilitychange', handleVisibilityChange);
    if (sentinel) releaseQuietly(sentinel);
    sentinel = null;
  };
}

/** ปล่อยล็อกโดยไม่สนผล (release() อาจ reject ถ้าเบราว์เซอร์ปล่อยไปก่อนแล้ว) */
function releaseQuietly(sentinel) {
  Promise.resolve()
    .then(() => sentinel.release())
    .catch(() => {});
}
