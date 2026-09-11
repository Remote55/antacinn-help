/**
 * รวมจุดเสี่ยงจากทุกแหล่ง แล้วคำนวณคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 *
 * นี่คือ "แหล่งความจริงเดียว" ของข้อมูลจุดเสี่ยงทั้งแอป
 * ทุกหน้าจอที่ต้องใช้จุดเสี่ยง ให้เรียก hook นี้ ห้ามอ่าน JSON ตรง ๆ เอง
 * เพราะถ้าอ่านเอง จะลืมรวมจุดที่ผู้ใช้บันทึก และลืมคำนวณคะแนน
 */

import { useMemo } from 'react';
import baseRiskPoints from '../data/riskPoints.json';
import officialRiskPoints from '../data/officialRiskPoints.json';
import { calculateRiskScore, getRiskLevel, hasIncidentStatistics } from '../utils/riskScore';
import { searchPoints as rankSearchResults } from '../utils/search';
import { useSavedPoints } from './useSavedPoints';

/**
 * @param options.now วันเวลาที่ใช้คำนวณ (ใส่ได้เพื่อทดสอบ) ถ้าไม่ใส่ใช้เวลาปัจจุบัน
 * @param options.typeFilter อาเรย์ของประเภทอันตรายที่ต้องการ ถ้าว่างหรือไม่ใส่ = เอาทั้งหมด
 */
export function useRiskPoints(options = {}) {
  const { savedPoints, isLoading } = useSavedPoints();
  const { now, typeFilter } = options;

  const allPoints = useMemo(() => {
    const current = now || new Date();
    const context = {
      month: current.getMonth() + 1, // getMonth() คืน 0-11 ต้อง +1
      hour: current.getHours(),
    };

    // รวมสามแหล่ง: จุดที่ทีมกรอก จุดทางการจากกระทรวงคมนาคม (สร้างด้วย scripts/mot-accidents.mjs)
    // และจุดที่ผู้ใช้บันทึกเอง
    const merged = [...baseRiskPoints, ...officialRiskPoints, ...savedPoints];

    // เติมคะแนนและระดับความเสี่ยงให้ทุกจุด
    // hasStatistics = false คือคะแนน 0 เพราะยังไม่มีข้อมูล ไม่ใช่เพราะปลอดภัย
    return merged.map((point) => {
      const score = calculateRiskScore(point, context);
      return {
        ...point,
        riskScore: score,
        riskLevel: getRiskLevel(score),
        hasStatistics: hasIncidentStatistics(point),
      };
    });
  }, [savedPoints, now]);

  /** กรองตามประเภทอันตราย ใช้กับปุ่มกรองในหน้าแผนที่ */
  const filteredPoints = useMemo(() => {
    if (!typeFilter || typeFilter.length === 0) return allPoints;
    return allPoints.filter((point) => typeFilter.includes(point.type));
  }, [allPoints, typeFilter]);

  /** จุดที่เสี่ยงที่สุดตอนนี้ ใช้แสดงในหน้าแรก */
  const topRiskPoints = useMemo(() => {
    return [...allPoints].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  }, [allPoints]);

  /** ค้นหาตามชื่อ ประเภทอันตราย และอำเภอ เรียงตามความเกี่ยวข้อง (ตรรกะอยู่ใน utils/search.js) */
  const searchPoints = useMemo(() => {
    return (keyword) => rankSearchResults(allPoints, keyword);
  }, [allPoints]);

  /** หาจุดเดียวตาม id ใช้ตอนเปิดหน้ารายละเอียด */
  const findPointById = useMemo(() => {
    return (id) => allPoints.find((point) => point.id === id) || null;
  }, [allPoints]);

  return { allPoints, filteredPoints, topRiskPoints, searchPoints, findPointById, isLoading };
}
