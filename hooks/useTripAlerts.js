/**
 * ตรรกะการเตือนของโหมดเดินทาง แยกออกจากหน้าจอให้หน้าจอเหลือแค่การแสดงผล
 *
 * ทุกครั้งที่ตำแหน่งเปลี่ยน (จาก GPS จริงหรือจากโหมดจำลอง) ประเมินใหม่ว่าควรเตือนอะไร
 * ตัวตัดสินใจจริงคือ evaluateTripAlerts ใน utils/tripAlerts.js ซึ่งมีเทสต์คุมการกันเตือนซ้ำแล้ว
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateTripAlerts } from '../utils/tripAlerts';
import { DISTANCE } from '../constants/config';

const ALERT_CONFIG = {
  triggerM: DISTANCE.ALERT_TRIGGER,
  resetM: DISTANCE.ALERT_RESET,
  boundingBoxM: DISTANCE.BOUNDING_BOX_FILTER,
};

/**
 * @param options.location ตำแหน่งปัจจุบัน { lat, lng } หรือ null
 * @param options.points จุดเสี่ยงทั้งหมด
 * @param options.onNewAlert เรียกเมื่อมีการเตือนใหม่ ส่ง { point, distanceM } ของจุดที่ใกล้ที่สุด
 */
export function useTripAlerts({ location, points, onNewAlert }) {
  // จุดที่อยู่ในระยะเฝ้าระวัง ใช้แสดง "กำลังเฝ้าระวัง N จุด"
  const [nearbyPoints, setNearbyPoints] = useState([]);
  // ประวัติการเตือนในทริปนี้
  const [history, setHistory] = useState([]);

  // เก็บ id ที่เตือนไปแล้วใน ref ไม่ใช่ state ถ้าใช้ state จะทำให้ effect วนซ้ำไม่รู้จบ
  const alertedIdsRef = useRef(new Set());

  // เก็บ callback ล่าสุดใน ref เพื่อไม่ให้การสร้างฟังก์ชันใหม่ทุกครั้งที่หน้าจอวาดใหม่ ไปกระตุ้น effect
  const onNewAlertRef = useRef(onNewAlert);
  onNewAlertRef.current = onNewAlert;

  useEffect(() => {
    if (!location) return;

    const result = evaluateTripAlerts(location, points, alertedIdsRef.current, ALERT_CONFIG);
    alertedIdsRef.current = result.alertedIds;
    setNearbyPoints(result.nearbyPoints);

    if (result.newAlerts.length > 0) {
      // ถ้ามีหลายจุดพร้อมกัน เตือนจุดที่ใกล้ที่สุดก่อน
      const closest = result.newAlerts.reduce((a, b) => (a.distanceM <= b.distanceM ? a : b));
      setHistory((current) => [closest, ...current]);
      if (onNewAlertRef.current) onNewAlertRef.current(closest);
    }
  }, [location, points]);

  /** ล้างสถานะทั้งหมด ใช้ตอนเริ่มการจำลองใหม่ ให้ทุกจุดเตือนได้อีกครั้ง */
  const reset = useCallback(() => {
    alertedIdsRef.current = new Set();
    setHistory([]);
  }, []);

  return { nearbyPoints, history, reset };
}
