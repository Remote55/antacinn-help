/**
 * เตือนด้วยเสียงพูดภาษาไทยและการสั่น
 *
 * ทำไมต้องมี: เอกสารวัตถุประสงค์ข้อ 4 กำหนดให้ผู้ใช้ "รับทราบการแจ้งเตือนได้โดยไม่จำเป็นต้องมองหน้าจอ"
 * ผู้ใช้กำลังขับขี่ การเตือนด้วยภาพอย่างเดียวไม่ปลอดภัย
 *
 * บนมือถือใช้เสียงอ่านของระบบ (Android และ iOS มีเสียงภาษาไทยในตัว)
 * บนเว็บใช้ Web Speech API ซึ่งมีเสียงไทยหรือไม่ขึ้นกับเครื่อง จึงต้องตรวจก่อนแล้วบอกผู้ใช้
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Speech from 'expo-speech';

/** จังหวะสั่น: สั่น 0.4 วินาที เว้น 0.2 สั่นอีก 0.4 ต่างจากการแจ้งเตือนทั่วไปของมือถือ */
const VIBRATION_PATTERN = [0, 400, 200, 400];

/** ความเร็วการพูด ช้ากว่าปกตินิดหน่อยให้ฟังทันขณะขับรถ (1 = ปกติ) */
const SPEECH_RATE = 0.95;

/**
 * สั่นได้ไหม
 * บนเว็บ Chrome ไม่ยอมให้สั่นจนกว่าผู้ใช้จะแตะหน้าเว็บอย่างน้อยหนึ่งครั้ง
 * ถ้าเรียกก่อนหน้านั้น Chrome จะบันทึก error ไว้ใน console (เจอตอนทดสอบอัตโนมัติที่ไม่มีการแตะจริง)
 * ปกติผู้ใช้แตะปุ่มเริ่มเดินทางมาแล้ว จึงสั่นได้ตามปกติ
 */
function canVibrate() {
  if (Platform.OS !== 'web') return true;
  const activation = typeof navigator !== 'undefined' ? navigator.userActivation : null;
  return !activation || activation.hasBeenActive;
}

/** ตรวจว่าเครื่องนี้มีเสียงภาษาไทยไหม */
async function detectThaiVoice() {
  let voices = await Speech.getAvailableVoicesAsync();

  // บนเว็บ รายการเสียงโหลดแบบ async ครั้งแรกอาจได้อาเรย์ว่าง ต้องรอเหตุการณ์ voiceschanged ก่อน
  if (voices.length === 0 && Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    await new Promise((resolve) => {
      window.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
      setTimeout(resolve, 2000);
    });
    voices = await Speech.getAvailableVoicesAsync();
  }

  return voices.some((voice) => /^th/i.test(voice.language || ''));
}

export function useVoiceAlerts() {
  const [isMuted, setIsMuted] = useState(false);
  // null = ยังตรวจไม่เสร็จ
  const [hasThaiVoice, setHasThaiVoice] = useState(null);
  // เก็บสถานะปิดเสียงใน ref ด้วย ให้ announce อ่านค่าล่าสุดได้โดยไม่ต้องสร้างฟังก์ชันใหม่
  const isMutedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    detectThaiVoice()
      .then((found) => {
        if (!isCancelled) setHasThaiVoice(found);
      })
      .catch(() => {
        if (!isCancelled) setHasThaiVoice(false);
      });

    return () => {
      isCancelled = true;
      // ออกจากหน้าจอแล้วต้องหยุดพูด ไม่งั้นเสียงเตือนค้างต่อทั้งที่ออกจากโหมดเดินทางแล้ว
      Speech.stop();
    };
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next) Speech.stop();
  }, []);

  /**
   * พูดเตือน
   * @param options.interrupt
   *   true  = ตัดประโยคที่กำลังพูดแล้วพูดทันที พร้อมสั่น (ใช้กับการเตือนเข้าใกล้จุดเสี่ยง)
   *   false = ต่อคิวหลังประโยคที่กำลังพูด ไม่สั่น (ใช้กับการบอกจุดถัดไปล่วงหน้า)
   *   กฎนี้ทำให้การเตือนเข้าใกล้ไม่มีวันถูกตัดกลางประโยคโดยการบอกล่วงหน้า
   */
  const announce = useCallback((text, { interrupt = false } = {}) => {
    if (interrupt && canVibrate()) {
      try {
        Vibration.vibrate(VIBRATION_PATTERN);
      } catch (error) {
        // บางเบราว์เซอร์ไม่รองรับการสั่น ไม่เป็นไร ยังมีเสียงและภาพ
      }
    }
    if (isMutedRef.current) return;
    if (interrupt) Speech.stop();
    Speech.speak(text, { language: 'th-TH', rate: SPEECH_RATE });
  }, []);

  /** ให้ผู้ใช้ตรวจว่าได้ยินเสียงก่อนออกเดินทาง */
  const testVoice = useCallback(() => {
    announce('ทดสอบเสียงเตือน ถ้าได้ยินประโยคนี้ แปลว่าพร้อมใช้งาน', { interrupt: true });
  }, [announce]);

  return { announce, isMuted, toggleMute, hasThaiVoice, testVoice };
}
