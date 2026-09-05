/**
 * จัดการจุดเสี่ยงที่ผู้ใช้บันทึกเอง เก็บไว้ในเครื่อง (AsyncStorage)
 *
 * ทำไมต้องเก็บในเครื่อง ไม่ส่งขึ้นเซิร์ฟเวอร์:
 * โปรเจคนี้ไม่มีระบบหลังบ้าน (ตามขอบเขตในเอกสารบทที่ 6.2)
 * แต่การออกแบบฟีเจอร์นี้ไว้ตั้งแต่ต้น ทำให้ต่อยอดเป็นระบบ Crowdsourcing ได้ในอนาคต
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_EMERGENCY, CATEGORIES } from '../constants/config';

export function useSavedPoints() {
  const [savedPoints, setSavedPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /** อ่านข้อมูลจากเครื่องขึ้นมาใส่ state */
  const loadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_POINTS);
      setSavedPoints(raw ? JSON.parse(raw) : []);
    } catch (error) {
      // ถ้าอ่านไม่ได้ ให้เริ่มจากรายการว่าง ดีกว่าทำให้แอปพัง
      console.warn('อ่านจุดที่บันทึกไว้ไม่สำเร็จ:', error.message);
      setSavedPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // โหลดครั้งแรกตอนแอปเปิด
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  /** เขียนลงเครื่องแล้วอัปเดต state ให้ตรงกัน */
  const persist = useCallback(async (points) => {
    setSavedPoints(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_POINTS, JSON.stringify(points));
    } catch (error) {
      console.warn('บันทึกจุดลงเครื่องไม่สำเร็จ:', error.message);
    }
  }, []);

  /**
   * เพิ่มจุดใหม่
   *
   * จุดที่ผู้ใช้บันทึกเองจะมี verified: false เสมอ
   * และ source บอกชัดว่ามาจากผู้ใช้ ไม่ใช่สถิติทางการ
   * เพื่อไม่ให้สับสนกับข้อมูลที่มีแหล่งอ้างอิง (ตามเอกสารบทที่ 6.3)
   */
  const addPoint = useCallback(
    async ({ name, type, description, coordinate }) => {
      const newPoint = {
        id: 'user-' + Date.now(),
        name,
        category: CATEGORIES.ROAD,
        type,
        district: 'บันทึกโดยผู้ใช้',
        coordinate,
        incidents: [],
        peakMonths: [],
        peakHours: [],
        advice: description ? [description] : [],
        emergency: [DEFAULT_EMERGENCY],
        source: 'บันทึกโดยผู้ใช้เอง ไม่ใช่ข้อมูลสถิติทางการ',
        verified: false,
        isUserCreated: true,
        createdAt: new Date().toISOString(),
      };

      await persist([...savedPoints, newPoint]);
      return newPoint;
    },
    [savedPoints, persist]
  );

  /** ลบจุดตาม id */
  const removePoint = useCallback(
    async (id) => {
      await persist(savedPoints.filter((p) => p.id !== id));
    },
    [savedPoints, persist]
  );

  return { savedPoints, isLoading, addPoint, removePoint, reload: loadFromStorage };
}
