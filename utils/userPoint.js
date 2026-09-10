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
