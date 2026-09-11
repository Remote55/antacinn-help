/**
 * ดึงสภาพคลื่นหรือฝนตอนนี้ ครั้งเดียวตอนเปิดหน้าจอ
 *
 * ไม่มีเน็ตหรือบริการล่ม ได้ null กลับมา หน้าจอซ่อนการ์ดไปเฉย ๆ ไม่แสดงค่าเก่าหรือค่าเดา
 */

import { useState, useEffect } from 'react';
import { fetchWaves, fetchRain } from '../utils/conditions';

/**
 * @param coordinate { lat, lng } หรือ null (ไม่ดึงอะไร)
 * @param needs { waves, rain } อยากได้ข้อมูลไหนบ้าง
 * @returns { waves, rain, isLoading }
 */
export function useLiveConditions(coordinate, { waves: wantsWaves = false, rain: wantsRain = false } = {}) {
  const lat = coordinate ? coordinate.lat : null;
  const lng = coordinate ? coordinate.lng : null;
  const isWanted = lat !== null && (wantsWaves || wantsRain);

  const [state, setState] = useState({ waves: null, rain: null, isLoading: isWanted });

  useEffect(() => {
    if (!isWanted) {
      setState({ waves: null, rain: null, isLoading: false });
      return undefined;
    }

    let isCancelled = false;
    const target = { lat, lng };
    setState({ waves: null, rain: null, isLoading: true });
    Promise.all([wantsWaves ? fetchWaves(target) : null, wantsRain ? fetchRain(target) : null]).then(
      ([waves, rain]) => {
        if (!isCancelled) setState({ waves, rain, isLoading: false });
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [isWanted, wantsWaves, wantsRain, lat, lng]);

  return state;
}
