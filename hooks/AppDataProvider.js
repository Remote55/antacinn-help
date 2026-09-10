/**
 * ข้อมูลที่ต้องใช้ร่วมกันทั้งแอป เก็บไว้ที่เดียว
 *
 * ปัญหาที่ไฟล์นี้แก้:
 * เดิมทุกหน้าจอเรียก useSavedPoints แยกกัน แต่ละหน้าจอจึงถือสำเนาของตัวเอง
 * แท็บด้านล่างไม่ถูกปิดเมื่อสลับไปมา พอบันทึกจุดใหม่ในแท็บ "บันทึก"
 * แท็บ "แผนที่" ที่เปิดค้างไว้จะไม่เห็นจุดนั้นจนกว่าจะปิดแอปแล้วเปิดใหม่
 *
 * วิธีแก้: เก็บข้อมูลไว้ใน React Context ที่ครอบทั้งแอป หน้าจอไหนแก้ ทุกหน้าจอเห็นทันที
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { buildUserPoint } from '../utils/userPoint';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [savedPoints, setSavedPoints] = useState([]);
  const [isSavedPointsLoading, setIsSavedPointsLoading] = useState(true);

  // เก็บค่าล่าสุดไว้ใน ref ด้วย เพื่อให้การเพิ่มหรือลบติดกันเร็ว ๆ ไม่ทำงานบนข้อมูลเก่า
  const savedPointsRef = useRef([]);

  /** อ่านข้อมูลจากเครื่องขึ้นมาใส่ state */
  const reloadSavedPoints = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_POINTS);
      const points = raw ? JSON.parse(raw) : [];
      savedPointsRef.current = points;
      setSavedPoints(points);
    } catch (error) {
      // อ่านไม่ได้ให้เริ่มจากรายการว่าง ดีกว่าทำให้แอปพัง
      console.warn('อ่านจุดที่บันทึกไว้ไม่สำเร็จ:', error.message);
      savedPointsRef.current = [];
      setSavedPoints([]);
    } finally {
      setIsSavedPointsLoading(false);
    }
  }, []);

  // โหลดครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    reloadSavedPoints();
  }, [reloadSavedPoints]);

  /** อัปเดตทุกหน้าจอทันที แล้วค่อยเขียนลงเครื่อง */
  const persistSavedPoints = useCallback(async (points) => {
    savedPointsRef.current = points;
    setSavedPoints(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_POINTS, JSON.stringify(points));
    } catch (error) {
      console.warn('บันทึกจุดลงเครื่องไม่สำเร็จ:', error.message);
    }
  }, []);

  const addPoint = useCallback(
    async (input) => {
      const newPoint = buildUserPoint(input);
      await persistSavedPoints([...savedPointsRef.current, newPoint]);
      return newPoint;
    },
    [persistSavedPoints]
  );

  const removePoint = useCallback(
    async (id) => {
      await persistSavedPoints(savedPointsRef.current.filter((p) => p.id !== id));
    },
    [persistSavedPoints]
  );

  const value = useMemo(
    () => ({ savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints }),
    [savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** ใช้ในหน้าจอหรือ hook อื่นเพื่อเข้าถึงข้อมูลกลาง */
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData ต้องใช้ภายใน <AppDataProvider> (ดู App.js)');
  }
  return context;
}
