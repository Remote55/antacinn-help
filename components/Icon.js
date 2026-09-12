/**
 * ไอคอนของแอป ใช้ชุด Ionicons ชุดเดียวทั้งแอป (แบบเส้น หน้าตาเหมือนกันทุกเครื่อง ต่างจาก emoji)
 * ดูชื่อไอคอนได้ที่ https://icons.expo.fyi (เลือกชุด Ionicons)
 *
 * import จาก '@expo/vector-icons/Ionicons' เท่านั้น ห้าม import จาก '@expo/vector-icons' เฉย ๆ
 * เพราะแบบนั้นจะรวมฟอนต์ไอคอนทุกชุด (หลาย MB) เข้ามาในเว็บ
 * (ตัวตรวจโค้ดของ Snack ไม่รู้จัก path ย่อยนี้ scripts/upload-snack.mjs จึงเปลี่ยนให้ตอนอัปโหลด)
 * ไอคอนเป็นของตกแต่ง (aria-hidden) ข้อความข้าง ๆ หรือ accessibilityLabel ของปุ่มเป็นตัวบอกความหมาย
 */

import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants/theme';

export default function Icon({ name, size = 20, color = COLORS.text, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} aria-hidden />;
}
