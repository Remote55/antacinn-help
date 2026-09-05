/**
 * แปลงสถิติอุบัติเหตุให้เป็น "คะแนนความเสี่ยง 0-100"
 *
 * เป้าหมายคือทำให้ผู้ใช้ไม่ต้องตีความตัวเลขสถิติเอง
 * เห็นแค่ตัวเลขเดียวกับสีเดียว ก็รู้ทันทีว่าควรระวังแค่ไหน
 *
 * สูตรตามเอกสารบทที่ 5.4:
 *   S = ( Σ(nᵢ × wᵢ) / N_max ) × 100 × f_season × f_time
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { SEVERITY_WEIGHTS, N_MAX, CONTEXT_FACTORS, RISK_LEVELS } from '../constants/config.js';
import { clamp } from './geo.js';

/**
 * รวมน้ำหนักความรุนแรงของเหตุการณ์ทั้งหมด = Σ(nᵢ × wᵢ)
 *
 * เสียชีวิต 1 ราย (น้ำหนัก 5) ถือว่าร้ายแรงกว่าบาดเจ็บเล็กน้อย 4 ราย (น้ำหนัก 1x4=4)
 * เพราะเราสนใจ "ความรุนแรง" ไม่ใช่แค่ "จำนวนครั้ง"
 */
export function calculateWeightedIncidents(incidents) {
  if (!Array.isArray(incidents)) return 0;

  return incidents.reduce((total, incident) => {
    const weight = SEVERITY_WEIGHTS[incident.severity];
    // ถ้าเจอความรุนแรงที่ไม่รู้จัก ให้ข้ามไป ดีกว่าทำให้คะแนนเพี้ยนทั้งจุด
    if (weight === undefined) return total;

    // กัน count ที่หายไปหรือไม่ใช่ตัวเลข
    // สำคัญเพราะไฟล์ riskPoints.json ถูกกรอกด้วยมือ ถ้าใครลืมใส่ count
    // แล้วปล่อยให้เป็น undefined * weight = NaN คะแนนทั้งจุดจะกลายเป็น NaN
    // แล้วหลุดไปแสดงบนหน้าจอว่า "NaN" ซึ่งผู้ใช้อ่านไม่รู้เรื่อง
    const count = Number.isFinite(incident.count) ? incident.count : 0;

    return total + count * weight;
  }, 0);
}

/**
 * ตัวคูณตามฤดูกาล — เดือนนี้เป็นเดือนที่เสี่ยงสูงของจุดนี้หรือไม่
 * @param month เดือนปัจจุบัน 1-12
 */
function getSeasonFactor(point, month) {
  const peakMonths = point.peakMonths || [];
  return peakMonths.includes(month) ? CONTEXT_FACTORS.SEASON_PEAK : CONTEXT_FACTORS.NONE;
}

/**
 * ตัวคูณตามช่วงเวลา — ตอนนี้เป็นชั่วโมงที่เสี่ยงสูงของจุดนี้หรือไม่
 * @param hour ชั่วโมงปัจจุบัน 0-23
 */
function getTimeFactor(point, hour) {
  const peakHours = point.peakHours || [];
  return peakHours.includes(hour) ? CONTEXT_FACTORS.TIME_PEAK : CONTEXT_FACTORS.NONE;
}

/**
 * คำนวณคะแนนความเสี่ยงของจุดหนึ่ง ณ เวลาที่กำหนด
 *
 * ผลลัพธ์เปลี่ยนตามเวลาจริง ทำให้หมุดจุดเดียวกันเปลี่ยนสีบนแผนที่ได้
 * เช่น จุดที่อันตรายเฉพาะตอนกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 *
 * @param context { month: 1-12, hour: 0-23 } ถ้าไม่ส่งมา จะใช้เวลาปัจจุบันของเครื่อง
 * @returns จำนวนเต็ม 0-100
 */
export function calculateRiskScore(point, context) {
  const now = new Date();
  const month = context?.month ?? now.getMonth() + 1; // getMonth() คืน 0-11 ต้อง +1
  const hour = context?.hour ?? now.getHours();

  const weighted = calculateWeightedIncidents(point.incidents);
  const baseScore = (weighted / N_MAX) * 100;

  const adjusted = baseScore * getSeasonFactor(point, month) * getTimeFactor(point, hour);

  // ต้อง clamp เพราะตัวคูณ 1.3 x 1.1 ทำให้คะแนนทะลุ 100 ได้
  // (เอกสารต้นฉบับไม่ได้ระบุจุดนี้ไว้ แต่จำเป็นต้องมี)
  return Math.round(clamp(adjusted, 0, 100));
}

/**
 * แปลงคะแนนเป็นระดับความเสี่ยง พร้อมป้ายภาษาไทยและสีหมุด
 *
 * @returns { id, label, min, max, color }
 */
export function getRiskLevel(score) {
  const safeScore = clamp(score, 0, 100);
  const level = RISK_LEVELS.find((l) => safeScore >= l.min && safeScore <= l.max);
  // ตามหลักการแล้วหาเจอเสมอ แต่กันเหนียวไว้ไม่ให้คืน undefined
  return level || RISK_LEVELS[0];
}
