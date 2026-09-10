/**
 * ตรวจไฟล์ข้อมูลจริงของแอปด้วยกฎใน utils/dataValidation.js
 *
 * ถ้าเทสต์นี้แดง แปลว่ามีคนกรอกข้อมูลผิด ข้อความจะบอกว่าจุดไหนผิดเรื่องอะไร
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRiskPoints, validatePresetRoutes } from '../utils/dataValidation.js';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

test('data/riskPoints.json ผ่านกฎทุกข้อ', () => {
  const errors = validateRiskPoints(readJson('../data/riskPoints.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});

test('data/presetRoutes.json ผ่านกฎทุกข้อ', () => {
  const errors = validatePresetRoutes(readJson('../data/presetRoutes.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});
