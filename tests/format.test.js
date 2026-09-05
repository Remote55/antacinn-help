import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance, formatDuration, summarizeIncidents } from '../utils/format.js';

test('formatDistance: ต่ำกว่า 1 กม. แสดงเป็นเมตร', () => {
  assert.equal(formatDistance(244), '244 ม.');
  assert.equal(formatDistance(999), '999 ม.');
});

test('formatDistance: ตั้งแต่ 1 กม. ขึ้นไป แสดงเป็นกิโลเมตร ทศนิยม 1 ตำแหน่ง', () => {
  assert.equal(formatDistance(1000), '1.0 กม.');
  assert.equal(formatDistance(4200), '4.2 กม.');
  assert.equal(formatDistance(28394), '28.4 กม.');
});

test('formatDistance: ปัดเศษเมตรให้เป็นจำนวนเต็ม', () => {
  assert.equal(formatDistance(243.7), '244 ม.');
});

test('formatDuration: ต่ำกว่า 1 ชม. แสดงเป็นนาที', () => {
  assert.equal(formatDuration(1871), '31 นาที');
  assert.equal(formatDuration(60), '1 นาที');
});

test('formatDuration: ตั้งแต่ 1 ชม. แสดงชั่วโมงและนาที', () => {
  assert.equal(formatDuration(3600), '1 ชม.');
  assert.equal(formatDuration(5400), '1 ชม. 30 นาที');
});

test('summarizeIncidents: รวมจำนวนตามความรุนแรง', () => {
  const incidents = [
    { year: 2566, severity: 'serious', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ];
  assert.equal(summarizeIncidents(incidents), 'บาดเจ็บสาหัส 2 · บาดเจ็บเล็กน้อย 3');
});

test('summarizeIncidents: รวมความรุนแรงเดียวกันจากหลายปีเข้าด้วยกัน', () => {
  const incidents = [
    { year: 2566, severity: 'minor', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ];
  assert.equal(summarizeIncidents(incidents), 'บาดเจ็บเล็กน้อย 5');
});

test('summarizeIncidents: ไม่มีข้อมูล แสดงข้อความบอกว่ายังไม่มี', () => {
  assert.equal(summarizeIncidents([]), 'ยังไม่มีข้อมูลสถิติ');
});

test('summarizeIncidents: เรียงจากรุนแรงมากไปน้อย', () => {
  const incidents = [
    { severity: 'minor', count: 1 },
    { severity: 'fatal', count: 1 },
    { severity: 'serious', count: 1 },
  ];
  assert.equal(summarizeIncidents(incidents), 'เสียชีวิต 1 · บาดเจ็บสาหัส 1 · บาดเจ็บเล็กน้อย 1');
});
