/**
 * สถานที่ท่องเที่ยวยอดนิยม พร้อมสรุปจุดเสี่ยงรอบแต่ละแห่ง
 *
 * ใช้ร่วมกันทั้งการ์ดในหน้าแรก ตัวเลือกต้นทางปลายทาง และการเปิดแผนที่ไปที่สถานที่
 * จำนวนจุดเสี่ยงรอบสถานที่นับรวมจุดที่ผู้ใช้บันทึกเองด้วย เพราะคำนวณจาก useRiskPoints
 */

import { useMemo, useCallback } from 'react';
import placesData from '../data/places.json';
import { useRiskPoints } from './useRiskPoints';
import { summarizeRisksNearPlace, searchPlaces as rankPlaces } from '../utils/places';
import { DISTANCE } from '../constants/config';

export function usePlaces() {
  const { allPoints } = useRiskPoints();

  // เติม risk = { count, highest, nearby } ให้ทุกสถานที่
  const places = useMemo(
    () =>
      placesData.map((place) => ({
        ...place,
        risk: summarizeRisksNearPlace(place, allPoints, DISTANCE.PLACE_RISK_RADIUS),
      })),
    [allPoints]
  );

  const findPlaceById = useCallback((id) => places.find((place) => place.id === id) || null, [places]);

  /** ค้นตามชื่อและอำเภอ เรียงตามความเกี่ยวข้อง (ตรรกะอยู่ใน utils/places.js) */
  const searchPlaces = useCallback((query) => rankPlaces(places, query), [places]);

  return { places, findPlaceById, searchPlaces };
}
