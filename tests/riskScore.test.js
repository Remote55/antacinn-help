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

test('getRiskLevel: ต้องไม่มีระดับไหนเป็นสีเขียว', () => {
  for (const score of [0, 25, 50, 75, 100]) {
    const color = getRiskLevel(score).color.toLowerCase();
    assert.ok(!color.startsWith('#0'), `คะแนน ${score} ใช้สีที่ดูเหมือนเขียว: ${color}`);
  }
});
