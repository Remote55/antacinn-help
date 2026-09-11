/**
 * แปลงจุดเสี่ยงเป็นหมุดที่ AppMap วาด
 *
 * ใช้ร่วมกันทุกหน้าจอที่มีแผนที่ หมุดจึงหน้าตาเหมือนกันทั้งแอป
 * verified = true วาดขอบสีน้ำเงิน (ข้อมูลทางการ) ส่วนจุดที่ยังไม่ยืนยันขอบขาว
 * (คำอธิบายสัญลักษณ์อยู่ใน components/MapLegend.js)
 */
export function pointToMarker(point) {
  return {
    id: point.id,
    lat: point.coordinate.lat,
    lng: point.coordinate.lng,
    color: point.riskLevel.color,
    label: point.name,
    verified: point.verified === true,
  };
}
