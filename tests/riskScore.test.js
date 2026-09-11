/**
 * เทสต์ของ utils/riskScore.js
 *
 * เทสต์สำคัญที่สุดคือ 'ตรงกับม็อกอัพ' — เป็นการยืนยันว่าสูตรที่ถอดมาถูกต้อง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightedIncidents,
  calculateRiskScore,
  getRiskLevel,
  hasIncidentStatistics,
} from '../utils/riskScore.js';

/** จุดตัวอย่างสำหรับเทสต์: ทางขึ้นเขาคอหงส์ ตามม็อกอัพในเอกสารหน้า 7 */
const khaoKhoHong = {
  incidents: [
    { year: 2566, severity: 'serious', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ],
  peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  peakHours: [17, 18, 19, 20],
};

test('calculateWeightedIncidents: สาหัส 2 + เล็กน้อย 3 = (2x3) + (3x1) = 9', () => {
  assert.equal(calculateWeightedIncidents(khaoKhoHong.incidents), 9);
});

test('calculateWeightedIncidents: ไม่มีเหตุการณ์เลย ได้ 0', () => {
  assert.equal(calculateWeightedIncidents([]), 0);
});

test('calculateWeightedIncidents: เสียชีวิต 1 ราย มีน้ำหนัก 5', () => {
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal', count: 1 }]), 5);
});

test('calculateWeightedIncidents: ความรุนแรงที่ไม่รู้จัก ต้องข้ามไปไม่พัง', () => {
  assert.equal(calculateWeightedIncidents([{ severity: 'unknown', count: 9 }]), 0);
});

test('calculateWeightedIncidents: incidents ที่ไม่ใช่อาเรย์ ต้องได้ 0 ไม่พัง', () => {
  assert.equal(calculateWeightedIncidents(null), 0);
  assert.equal(calculateWeightedIncidents(undefined), 0);
  assert.equal(calculateWeightedIncidents('ไม่ใช่อาเรย์'), 0);
});

test('calculateWeightedIncidents: count ที่หายไปหรือไม่ใช่ตัวเลข ต้องไม่ทำให้กลายเป็น NaN', () => {
  // กรณีนี้เกิดได้จริง เพราะ riskPoints.json กรอกด้วยมือ อาจลืมใส่ count
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal' }]), 0);
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal', count: null }]), 0);

  // จุดที่มีทั้งข้อมูลดีและข้อมูลเสีย ต้องนับเฉพาะข้อมูลดี ไม่ใช่พังทั้งจุด
  const mixed = [
    { severity: 'fatal', count: undefined },
    { severity: 'minor', count: 3 },
  ];
  assert.equal(calculateWeightedIncidents(mixed), 3);
});

test('ตรงกับม็อกอัพ: เขาคอหงส์ ในเดือนและเวลาที่เสี่ยง ต้องได้ 43', () => {
  // (9 / 30) x 100 x 1.3 x 1.1 = 42.9 -> ปัดเป็น 43
  const score = calculateRiskScore(khaoKhoHong, { month: 8, hour: 18 });
  assert.equal(score, 43);
});

test('เขาคอหงส์ นอกช่วงเวลาเสี่ยง คะแนนต้องต่ำลง', () => {
  // (9 / 30) x 100 x 1.3 x 1.0 = 39
  const score = calculateRiskScore(khaoKhoHong, { month: 8, hour: 9 });
  assert.equal(score, 39);
});

test('จุดที่ไม่มีสถิติเลย ต้องได้ 0 (ตรงกับม็อกอัพ ย่านนิพัทธ์อุทิศ 3)', () => {
  const emptyPoint = { incidents: [], peakMonths: [], peakHours: [] };
  assert.equal(calculateRiskScore(emptyPoint, { month: 8, hour: 18 }), 0);
});

test('คะแนนต้องไม่ทะลุ 100 แม้ตัวคูณจะดันให้เกิน', () => {
  const severePoint = {
    incidents: [{ severity: 'fatal', count: 20 }], // 20 x 5 = 100 -> 333 คะแนนดิบ
    peakMonths: [8],
    peakHours: [18],
  };
  assert.equal(calculateRiskScore(severePoint, { month: 8, hour: 18 }), 100);
});

test('คะแนนต้องไม่ติดลบ', () => {
  const point = { incidents: [], peakMonths: [], peakHours: [] };
  assert.ok(calculateRiskScore(point, { month: 1, hour: 0 }) >= 0);
});

test('จุดที่ไม่มีฟิลด์ peakMonths/peakHours ต้องไม่พัง', () => {
  const point = { incidents: [{ severity: 'minor', count: 3 }] };
  const score = calculateRiskScore(point, { month: 8, hour: 18 });
  assert.equal(score, 10); // (3 / 30) x 100 x 1.0 x 1.0 = 10
});

test('getRiskLevel: 0-39 คือเฝ้าระวัง สีเหลือง', () => {
  assert.equal(getRiskLevel(0).id, 'watch');
  assert.equal(getRiskLevel(39).id, 'watch');
  assert.equal(getRiskLevel(20).color, '#FBC02D');
});

test('getRiskLevel: 40-69 คือเสี่ยง สีส้ม', () => {
  assert.equal(getRiskLevel(40).id, 'risky');
  assert.equal(getRiskLevel(43).label, 'เสี่ยง');
  assert.equal(getRiskLevel(69).id, 'risky');
});

test('getRiskLevel: 70-100 คืออันตรายมาก สีแดง', () => {
  assert.equal(getRiskLevel(70).id, 'critical');
  assert.equal(getRiskLevel(100).label, 'อันตรายมาก');
});

test('getRiskLevel: คะแนนนอกช่วงหรือ NaN ต้องไม่พัง และคืนระดับที่สมเหตุสมผล', () => {
  // บรรทัด return level || RISK_LEVELS[0] ใน riskScore.js มีไว้กันกรณีพวกนี้
  // ถ้าไม่มีเทสต์คุม อาจมีคนลบทิ้งเพราะคิดว่าไม่จำเป็น
  assert.equal(getRiskLevel(NaN).id, 'watch');
  assert.equal(getRiskLevel(-10).id, 'watch');
  assert.equal(getRiskLevel(150).id, 'critical');
});

test('getRiskLevel: ต้องไม่มีระดับไหนเป็นสีเขียว', () => {
  for (const score of [0, 25, 50, 75, 100]) {
    const color = getRiskLevel(score).color.toLowerCase();
    assert.ok(!color.startsWith('#0'), `คะแนน ${score} ใช้สีที่ดูเหมือนเขียว: ${color}`);
  }
});

// คะแนน 0 ของจุดที่ไม่มีสถิติ ไม่ได้แปลว่าปลอดภัย แค่ยังไม่มีข้อมูล หน้าจอต้องแยกสองกรณีนี้ออกจากกัน
test('hasIncidentStatistics: จุดที่ยังไม่มีสถิติ (อาเรย์ว่าง หรือไม่มีฟิลด์) = false', () => {
  assert.equal(hasIncidentStatistics({ incidents: [] }), false);
  assert.equal(hasIncidentStatistics({}), false);
});

test('hasIncidentStatistics: มีแถวแต่จำนวนเป็น 0 หรือความรุนแรงที่ไม่รู้จัก = false', () => {
  assert.equal(hasIncidentStatistics({ incidents: [{ year: 2566, severity: 'minor', count: 0 }] }), false);
  assert.equal(hasIncidentStatistics({ incidents: [{ year: 2566, severity: 'unknown', count: 3 }] }), false);
});

test('hasIncidentStatistics: มีเหตุการณ์อย่างน้อยหนึ่งครั้ง = true', () => {
  assert.equal(hasIncidentStatistics({ incidents: [{ year: 2566, severity: 'minor', count: 1 }] }), true);
});
