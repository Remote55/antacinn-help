/**
 * ไม่ให้หน้าจอดับเองตลอดเวลาที่หน้าจอที่เรียก hook นี้ยังเปิดอยู่
 *
 * ทำไมต้องมี: ผู้ใช้วางโทรศัพท์ไว้แล้วฟังเสียงเตือนระหว่างขับขี่ ถ้าจอดับเอง
 * แอปจะหยุดติดตามตำแหน่ง (Expo Go และเว็บไม่ติดตามตำแหน่งเบื้องหลัง) การเตือนก็หยุดไปด้วย
 *
 * Android / iOS: expo-keep-awake
 * เว็บ: Screen Wake Lock ของเบราว์เซอร์ผ่าน utils/wakeLock.js
 *   (expo-keep-awake บนเว็บไม่ขอล็อกใหม่หลังสลับแอป และปล่อย error ออกมาเมื่อเบราว์เซอร์ไม่รองรับ)
 *
 * คืนค่า canKeepAwake: null = กำลังขอ, true = จอจะไม่ดับ, false = เครื่องหรือเบราว์เซอร์นี้สั่งไม่ได้
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { keepScreenAwake } from '../utils/wakeLock';

const KEEP_AWAKE_TAG = 'antacinn-trip-mode';

export function useScreenAwake() {
  const [canKeepAwake, setCanKeepAwake] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined' || typeof navigator === 'undefined') return undefined;
      return keepScreenAwake({ wakeLock: navigator.wakeLock, doc: document, onChange: setCanKeepAwake });
    }

    let isCancelled = false;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG)
      .then(() => {
        if (!isCancelled) setCanKeepAwake(true);
      })
      .catch(() => {
        if (!isCancelled) setCanKeepAwake(false);
      });

    return () => {
      isCancelled = true;
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  return { canKeepAwake };
}
