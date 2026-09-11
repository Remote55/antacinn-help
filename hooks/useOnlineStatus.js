/**
 * ตอนนี้ต่ออินเทอร์เน็ตอยู่ไหม (ใช้บอกผู้ใช้ว่าอะไรยังใช้ได้ตอนออฟไลน์)
 *
 * เว็บ: ฟังเหตุการณ์ online / offline ของเบราว์เซอร์
 * Android / iOS: คืน true เสมอ เพราะต้องติดตั้งไลบรารีเพิ่มถึงจะรู้สถานะเครือข่าย
 *   แอปมือถือจัดการกรณีเน็ตหลุดในแต่ละส่วนอยู่แล้ว (เส้นทางสำรองออฟไลน์ ซ่อนการ์ดสภาพอากาศ)
 *
 * navigator.onLine เป็น false แปลว่าออฟไลน์แน่นอน ส่วน true แค่แปลว่ามีเครือข่าย (อาจยังออกเน็ตไม่ได้)
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

function readOnlineStatus() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(readOnlineStatus);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const update = () => setIsOnline(readOnlineStatus());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return isOnline;
}
