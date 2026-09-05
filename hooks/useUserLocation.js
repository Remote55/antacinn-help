/**
 * ขอสิทธิ์เข้าถึงตำแหน่ง และติดตามตำแหน่งผู้ใช้
 *
 * ข้อจำกัดที่ต้องรู้:
 * Expo Go บน Android ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง (background service)
 * ดังนั้นโหมดเดินทางต้องเปิดแอปค้างไว้ ซึ่งไม่กระทบการใช้งานจริง
 * เพราะผู้ใช้จะตั้งมือถือไว้บนแฮนด์อยู่แล้วขณะขับขี่
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { DISTANCE } from '../constants/config';

/**
 * @param options.watch ถ้าเป็น true จะติดตามตำแหน่งต่อเนื่อง ถ้า false จะดึงครั้งเดียว
 */
export function useUserLocation({ watch = false } = {}) {
  const [location, setLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // เก็บ subscription ไว้เพื่อยกเลิกตอน component ถูกถอด
  const subscriptionRef = useRef(null);

  /** แปลงผลลัพธ์จาก expo-location ให้เป็นรูปแบบ { lat, lng } ที่แอปเราใช้ทั้งระบบ */
  function toAppCoordinate(result) {
    return {
      lat: result.coords.latitude,
      lng: result.coords.longitude,
      accuracy: result.coords.accuracy,
    };
  }

  /** ดึงตำแหน่งปัจจุบันครั้งเดียว ใช้กับปุ่ม "ดึงพิกัดปัจจุบัน" */
  const fetchCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในการตั้งค่า');
        return null;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinate = toAppCoordinate(result);
      setLocation(coordinate);
      setErrorMessage(null);
      return coordinate;
    } catch (error) {
      setErrorMessage('ดึงตำแหน่งไม่สำเร็จ: ' + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ติดตามตำแหน่งต่อเนื่อง เมื่อ watch เป็น true
  useEffect(() => {
    if (!watch) {
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;

    async function startWatching() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (!isCancelled) {
            setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในการตั้งค่า');
            setIsLoading(false);
          }
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            // อัปเดตเมื่อขยับเกิน 50 เมตร แทนการอัปเดตตามเวลา
            // ช่วยประหยัดแบตเตอรี่มาก เพราะตอนรถติดจะไม่อัปเดตถี่ ๆ โดยเปล่าประโยชน์
            distanceInterval: DISTANCE.MIN_MOVEMENT_UPDATE,
          },
          (result) => {
            if (!isCancelled) {
              setLocation(toAppCoordinate(result));
              setIsLoading(false);
            }
          }
        );

        if (isCancelled) {
          subscription.remove();
        } else {
          subscriptionRef.current = subscription;
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage('ติดตามตำแหน่งไม่สำเร็จ: ' + error.message);
          setIsLoading(false);
        }
      }
    }

    startWatching();

    // สำคัญ: ต้องหยุดติดตามเมื่อออกจากหน้าจอ
    // ไม่งั้น GPS จะทำงานค้างและกินแบตต่อไปเรื่อย ๆ แม้ผู้ใช้ออกจากโหมดเดินทางแล้ว
    return () => {
      isCancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [watch]);

  return { location, errorMessage, isLoading, fetchCurrentLocation };
}
