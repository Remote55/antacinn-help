/**
 * ข้อมูลประเภทอันตราย (ชื่อไทย ไอคอน คำเตือนที่พูด) ของจุดเสี่ยงหนึ่งจุด
 * ใช้ร่วมกันทุกหน้าจอ ประเภทเดียวกันจึงชื่อและไอคอนตรงกันทั้งแอป
 */

import { HAZARD_TYPES } from '../constants/config.js';

/** ใช้เมื่อประเภทไม่ถูกต้อง เช่น จุดในเครื่องที่บันทึกจากแอปเวอร์ชันเก่า */
export const UNKNOWN_HAZARD = { id: 'unknown', label: 'ไม่ระบุ', icon: 'location-outline', spokenAdvice: '' };

export function hazardFor(typeId) {
  return HAZARD_TYPES.find((hazard) => hazard.id === typeId) || UNKNOWN_HAZARD;
}
