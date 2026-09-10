/**
 * จัดการจุดเสี่ยงที่ผู้ใช้บันทึกเอง เก็บไว้ในเครื่อง (AsyncStorage)
 *
 * ทำไมต้องเก็บในเครื่อง ไม่ส่งขึ้นเซิร์ฟเวอร์:
 * โปรเจคนี้ไม่มีระบบหลังบ้าน (ตามขอบเขตในเอกสารบทที่ 6.2)
 * แต่การออกแบบฟีเจอร์นี้ไว้ตั้งแต่ต้น ทำให้ต่อยอดเป็นระบบ Crowdsourcing ได้ในอนาคต
 *
 * ข้อมูลจริงอยู่ใน AppDataProvider เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกันทันที
 * hook นี้คงหน้าตาเดิมไว้ หน้าจอที่เรียกใช้อยู่แล้วจึงไม่ต้องแก้อะไร
 */

import { useAppData } from './AppDataProvider';

export function useSavedPoints() {
  const { savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints } = useAppData();
  return { savedPoints, isLoading: isSavedPointsLoading, addPoint, removePoint, reload: reloadSavedPoints };
}
