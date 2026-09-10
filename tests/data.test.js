/**
 * ตรวจไฟล์ข้อมูลจริงของแอปด้วยกฎใน utils/dataValidation.js
 *
 * ถ้าเทสต์นี้แดง แปลว่ามีคนกรอกข้อมูลผิด ข้อความจะบอกว่าจุดไหนผิดเรื่องอะไร
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRiskPoints, validatePresetRoutes, validatePlaces } from '../utils/dataValidation.js';
import { haversineMeters } from '../utils/geo.js';
import { DISTANCE } from '../constants/config.js';

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

test('data/places.json ผ่านกฎทุกข้อ', () => {
  const errors = validatePlaces(readJson('../data/places.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});

test('ต้นทางและปลายทางของเส้นทางแนะนำทุกเส้น มีสถานที่ในรายการอยู่ใกล้ ๆ', () => {
  // ผู้ใช้ที่เลือกต้นทางปลายทางเองจากรายการสถานที่ ต้องได้ใช้เส้นทางสำรองออฟไลน์ของเส้นทางแนะนำด้วย
  const places = readJson('../data/places.json');
  const routes = readJson('../data/presetRoutes.json');
  const tooFar = [];
  for (const route of routes) {
    for (const end of ['origin', 'destination']) {
      const nearestM = Math.min(...places.map((place) => haversineMeters(place.coordinate, route[end])));
      if (nearestM > DISTANCE.PRESET_MATCH_RADIUS) {
        tooFar.push(`${route.id} ${end} ห่างสถานที่ที่ใกล้ที่สุด ${Math.round(nearestM)} ม.`);
      }
    }
  }
  assert.deepEqual(tooFar, []);
});
