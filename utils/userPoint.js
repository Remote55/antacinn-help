/**
 * สร้างข้อมูลจุดเสี่ยงที่ผู้ใช้บันทึกเอง
 *
 * แยกออกมาเป็นฟังก์ชันล้วนเพื่อให้เทสต์ได้ว่ากฎสำคัญของโปรเจคไม่มีวันถูกละเมิด:
 * จุดที่ผู้ใช้บันทึกเองต้องเป็น verified: false เสมอ และ source ต้องบอกชัดว่าไม่ใช่สถิติทางการ
 * (ตามเอกสารบทที่ 6.3 เพื่อไม่ให้สับสนกับข้อมูลที่มีแหล่งอ้างอิง)
 */

import { CATEGORIES, DEFAULT_EMERGENCY } from '../constants/config.js';

export const USER_POINT_SOURCE = 'บันทึกโดยผู้ใช้เอง ไม่ใช่ข้อมูลสถิติทางการ';
export const USER_POINT_DISTRICT = 'บันทึกโดยผู้ใช้';

/**
 * @param input.name ชื่อจุด
 * @param input.type ประเภทอันตราย (id ใน HAZARD_TYPES)
 * @param input.description รายละเอียด จะกลายเป็นคำแนะนำข้อแรก
 * @param input.coordinate { lat, lng }
 * @param now เวลาที่บันทึก (ใส่ได้เพื่อทดสอบ)
 */
export function buildUserPoint({ name, type, description, coordinate }, now = new Date()) {
  const trimmedDescription = (description || '').trim();
  return {
    id: 'user-' + now.getTime(),
    name: (name || '').trim(),
    category: CATEGORIES.ROAD,
    type,
    district: USER_POINT_DISTRICT,
    coordinate,
    incidents: [],
    peakMonths: [],
    peakHours: [],
    advice: trimmedDescription ? [trimmedDescription] : [],
    emergency: [DEFAULT_EMERGENCY],
    source: USER_POINT_SOURCE,
    verified: false,
    isUserCreated: true,
    createdAt: now.toISOString(),
  };
}

/**
 * ตรวจและซ่อมรายการจุดที่อ่านขึ้นมาจากที่เก็บในเครื่อง ก่อนส่งให้หน้าจอใช้
 *
 * ข้อมูลในเครื่องเสียได้ (แอปเวอร์ชันเก่าเขียนไว้คนละรูปแบบ เขียนไม่ครบตอนแอปถูกปิดกลางคัน
 * หรือถูกแก้จากภายนอก) ถ้าปล่อยผ่าน หน้าจอที่อ่าน coordinate.lat จะพังทุกครั้งที่เปิดแอป
 *
 * - ไม่ใช่อาเรย์ → รายการว่าง
 * - ทิ้งรายการที่ไม่มี id ไม่มีชื่อ หรือพิกัดไม่ใช่ตัวเลข
 * - บังคับกฎของจุดผู้ใช้ซ้ำทุกครั้งที่อ่าน (เหมือน buildUserPoint): ไม่มีสถิติ verified: false
 *   และ source บอกว่าไม่ใช่สถิติทางการ จุดของผู้ใช้จึงไม่มีทางกลายเป็น "ข้อมูลทางการ"
 */
export function sanitizeSavedPoints(value) {
  if (!Array.isArray(value)) return [];

  return value.filter(isUsableSavedPoint).map((item) => ({
    ...item,
    category: CATEGORIES.ROAD,
    district: USER_POINT_DISTRICT,
    incidents: [],
    peakMonths: [],
    peakHours: [],
    advice: Array.isArray(item.advice) ? item.advice.filter((line) => typeof line === 'string') : [],
    emergency: [DEFAULT_EMERGENCY],
    source: USER_POINT_SOURCE,
    verified: false,
    isUserCreated: true,
  }));
}

function isUsableSavedPoint(item) {
  return Boolean(
    item &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.name === 'string' &&
      item.name.trim().length > 0 &&
      item.coordinate &&
      Number.isFinite(item.coordinate.lat) &&
      Number.isFinite(item.coordinate.lng)
  );
}
