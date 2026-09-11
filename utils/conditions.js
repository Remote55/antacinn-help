/**
 * สภาพคลื่นและฝนตอนนี้ จาก Open-Meteo (เอกสารบทที่ 8: อยากเชื่อมข้อมูลสภาพอากาศ)
 *
 * ใช้แสดงผลอย่างเดียว ไม่นำไปคูณคะแนนความเสี่ยง
 * เพราะสูตรคะแนนเป็นการตัดสินใจของทีม และมีเทสต์ "ตรงกับม็อกอัพ" คุมอยู่
 *
 * ฟังก์ชันที่ดึงข้อมูลไม่มีทาง throw: ล้มเหลวคืน null ให้หน้าจอซ่อนการ์ดไปเฉย ๆ
 * ห้ามแสดงค่าเก่าหรือค่าเดา (เอกสารออกแบบระยะที่ 2 ข้อ 5)
 *
 * ไฟล์นี้ไม่ import react
 */

import { CONDITIONS, CATEGORIES } from '../constants/config.js';
import { haversineMeters } from './geo.js';

/** ระดับคลื่นตาม Douglas Sea Scale (มาตรฐานสภาพทะเลที่ใช้สากล) ความสูงต่ำกว่า maxM */
const WAVE_LEVELS = [
  { id: 'calm', maxM: 0.5, label: 'ทะเลสงบ', advice: 'ลงเล่นน้ำเฉพาะในเขตที่มีธงอนุญาต' },
  { id: 'slight', maxM: 1.25, label: 'คลื่นเล็กน้อย', advice: 'ระวังเด็กเล็ก อย่าออกไปไกลจากฝั่ง' },
  { id: 'rough', maxM: 2.5, label: 'คลื่นแรง', advice: 'ไม่ควรลงเล่นน้ำ' },
  { id: 'danger', maxM: Infinity, label: 'คลื่นสูงอันตราย', advice: 'ห้ามลงน้ำเด็ดขาด' },
];

/** ความแรงของฝนรายชั่วโมงตามเกณฑ์ WMO */
const RAIN = {
  none: { id: 'none', label: 'ไม่มีฝน' },
  light: { id: 'light', label: 'ฝนเล็กน้อย' },
  moderate: { id: 'moderate', label: 'ฝนปานกลาง', advice: 'หินลื่นและน้ำอาจหลากฉับพลัน ไม่ควรลงเล่นน้ำ' },
  heavy: { id: 'heavy', label: 'ฝนหนัก', advice: 'น้ำอาจหลากฉับพลัน อย่าเข้าใกล้ลำน้ำ' },
};

/** @returns { id, label, advice } หรือ null ถ้าค่าใช้ไม่ได้ */
export function classifyWaves(heightM) {
  if (!Number.isFinite(heightM) || heightM < 0) return null;
  return WAVE_LEVELS.find((level) => heightM < level.maxM);
}

/** @returns { id, label, advice? } หรือ null ถ้าค่าใช้ไม่ได้ */
export function classifyRain(mmPerHour) {
  if (!Number.isFinite(mmPerHour) || mmPerHour < 0) return null;
  if (mmPerHour === 0) return RAIN.none;
  if (mmPerHour < 2.5) return RAIN.light;
  if (mmPerHour <= 7.6) return RAIN.moderate;
  return RAIN.heavy;
}

/**
 * จุดไหนต้องดูอะไร: จุดจมน้ำดูคลื่น จุดลื่น/ตกที่เป็นสถานที่ท่องเที่ยว (เช่น น้ำตก) ดูฝน
 * จุดอื่นไม่ดึงข้อมูลเลย ประหยัดเน็ตของผู้ใช้
 */
export function conditionsNeededFor(point) {
  if (!point) return { waves: false, rain: false };
  return {
    waves: point.type === 'drowning',
    rain: point.type === 'fall' && point.category === CATEGORIES.DESTINATION,
  };
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * คลื่นตอนนี้ใกล้พิกัดที่ให้มา
 * Open-Meteo ใช้จุดกริดทะเลที่ใกล้ที่สุด ซึ่งอาจอยู่นอกชายฝั่งหลายกิโลเมตร จึงคืนระยะนั้นมาให้หน้าจอบอกผู้ใช้
 * @returns { heightM, time, gridDistanceM } หรือ null
 */
export async function fetchWaves(coordinate, timeoutMs = CONDITIONS.TIMEOUT_MS) {
  try {
    const url =
      `${CONDITIONS.MARINE_URL}?latitude=${coordinate.lat}&longitude=${coordinate.lng}` +
      '&current=wave_height&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, timeoutMs);
    const heightM = json.current ? json.current.wave_height : null;
    if (!Number.isFinite(heightM)) return null;
    return {
      heightM,
      time: json.current.time,
      gridDistanceM: haversineMeters(coordinate, { lat: json.latitude, lng: json.longitude }),
    };
  } catch (error) {
    return null;
  }
}

/**
 * ฝนตอนนี้ หน่วย มม./ชม.
 * precipitation ของ current คือปริมาณฝนในช่วง interval วินาทีก่อนหน้า (ปกติ 15 นาที)
 * จึงต้องแปลงเป็นรายชั่วโมงก่อนเทียบเกณฑ์ WMO
 * @returns { mmPerHour, time } หรือ null
 */
export async function fetchRain(coordinate, timeoutMs = CONDITIONS.TIMEOUT_MS) {
  try {
    const url =
      `${CONDITIONS.WEATHER_URL}?latitude=${coordinate.lat}&longitude=${coordinate.lng}` +
      '&current=precipitation&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, timeoutMs);
    const { precipitation, interval, time } = json.current || {};
    if (!Number.isFinite(precipitation) || !Number.isFinite(interval) || interval <= 0) return null;
    const mmPerHour = Math.round(((precipitation * 3600) / interval) * 10) / 10;
    return { mmPerHour, time };
  } catch (error) {
    return null;
  }
}
