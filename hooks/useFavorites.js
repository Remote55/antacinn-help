/**
 * รายการโปรดของผู้ใช้ (เอกสารตาราง 6.1)
 *
 * ข้อมูลจริงอยู่ใน AppDataProvider กดดาวในหน้ารายละเอียด หน้าแรกเห็นทันที
 */

import { useCallback } from 'react';
import { useAppData } from './AppDataProvider';

export function useFavorites() {
  const { favoriteIds, toggleFavorite } = useAppData();
  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);
  return { favoriteIds, isFavorite, toggleFavorite };
}
