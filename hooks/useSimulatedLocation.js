/**
 * ตำแหน่งเสมือนที่วิ่งไปตามเส้นทาง ใช้แทน GPS ในโหมดจำลองการเดินทาง
 *
 * คืนค่าในรูปแบบ { lat, lng } เหมือน useUserLocation ทุกอย่าง
 * หน้าจอโหมดเดินทางจึงสลับแหล่งตำแหน่งได้โดยไม่ต้องแก้ตรรกะการเตือน
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { positionAtDistance, metersPerTick } from '../utils/simulation';
import { calculateRouteLength } from '../utils/routeAnalysis';
import { SIMULATION } from '../constants/config';

/**
 * @param options.routeCoordinates เส้นทางที่จะวิ่งตาม
 * @param options.enabled ถ้า false จะไม่ทำงานเลย (ใช้ตอนอยู่ในโหมด GPS)
 */
export function useSimulatedLocation({ routeCoordinates, enabled }) {
  const totalM = useMemo(() => calculateRouteLength(routeCoordinates || []), [routeCoordinates]);

  const [progressM, setProgressM] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedUp, setSpeedUp] = useState(SIMULATION.DEFAULT_SPEED_UP);

  // เลื่อนตำแหน่งทุกจังหวะขณะกำลังเล่น
  useEffect(() => {
    if (!enabled || !isPlaying || totalM === 0) return undefined;

    const stepM = metersPerTick(SIMULATION.SPEED_KMH, speedUp, SIMULATION.TICK_MS);
    const timer = setInterval(() => {
      setProgressM((current) => Math.min(current + stepM, totalM));
    }, SIMULATION.TICK_MS);

    // หยุดตัวจับเวลาเมื่อหยุดเล่น เปลี่ยนความเร็ว หรือออกจากหน้าจอ
    return () => clearInterval(timer);
  }, [enabled, isPlaying, speedUp, totalM]);

  // ถึงปลายทางแล้วหยุดเอง
  useEffect(() => {
    if (isPlaying && totalM > 0 && progressM >= totalM) setIsPlaying(false);
  }, [isPlaying, progressM, totalM]);

  const location = useMemo(() => {
    if (!enabled || !routeCoordinates || routeCoordinates.length === 0) return null;
    return positionAtDistance(routeCoordinates, progressM);
  }, [enabled, routeCoordinates, progressM]);

  const play = useCallback(() => {
    // ถ้าจบไปแล้ว กดเล่นอีกครั้งให้เริ่มจากต้นทาง
    setProgressM((current) => (current >= totalM ? 0 : current));
    setIsPlaying(true);
  }, [totalM]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const restart = useCallback(() => {
    setProgressM(0);
    setIsPlaying(true);
  }, []);

  return {
    location,
    progressM,
    totalM,
    isPlaying,
    isFinished: totalM > 0 && progressM >= totalM,
    speedUp,
    setSpeedUp,
    play,
    pause,
    restart,
  };
}
