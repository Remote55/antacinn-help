/**
 * รายการโปรด: เก็บเป็นอาเรย์ของ id จุดเสี่ยง (เอกสารตาราง 6.1)
 *
 * เก็บแค่ id ไม่เก็บทั้งจุด เพราะคะแนนความเสี่ยงเปลี่ยนตามเดือนและเวลา
 * ถ้าเก็บทั้งจุด คะแนนในรายการโปรดจะค้างเป็นค่าตอนกดบันทึก
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

/**
 * เพิ่มถ้ายังไม่มี (ไว้บนสุด) หรือเอาออกถ้ามีอยู่แล้ว
 * @returns อาเรย์ใหม่เสมอ ไม่แก้อาเรย์เดิม
 */
export function toggleFavoriteId(ids, id) {
  const current = Array.isArray(ids) ? ids : [];
  return current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
}

/**
 * แปลง id เป็นจุดเสี่ยงตามลำดับที่บันทึก
 * ข้าม id ที่หาไม่เจอ เช่น จุดที่ผู้ใช้บันทึกเองแล้วลบทิ้งไปแล้ว
 */
export function pickFavoritePoints(ids, points) {
  const pointById = new Map((points || []).map((point) => [point.id, point]));
  return (ids || []).map((id) => pointById.get(id)).filter(Boolean);
}
