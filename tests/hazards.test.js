/**
 * เทสต์ของ utils/hazards.js
 *
 * โจทย์: ทุกหน้าที่แสดงประเภทอันตรายต้องได้ชื่อและไอคอนเดียวกัน
 * และจุดที่ประเภทไม่ถูกต้อง (เช่น ข้อมูลในเครื่องเก่า) ต้องแสดงได้ ไม่พัง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hazardFor, UNKNOWN_HAZARD } from '../utils/hazards.js';
import { HAZARD_TYPES } from '../constants/config.js';

test('หาประเภทอันตรายตาม id ได้ชื่อไทยและไอคอน', () => {
  const hazard = hazardFor('drowning');
  assert.equal(hazard.label, 'จมน้ำ');
  assert.equal(hazard.icon, 'water-outline');
});

test('id ที่ไม่รู้จัก ได้ "ไม่ระบุ" แทน ไม่คืน undefined', () => {
  assert.equal(hazardFor('meteor'), UNKNOWN_HAZARD);
  assert.equal(hazardFor(undefined).label, 'ไม่ระบุ');
});

test('ทุกประเภทใช้ชื่อไอคอน Ionicons ไม่ใช่ emoji (emoji หน้าตาต่างกันตามเครื่อง)', () => {
  for (const hazard of [...HAZARD_TYPES, UNKNOWN_HAZARD]) {
    assert.match(hazard.icon, /^[a-z-]+$/, `${hazard.id} ใช้ไอคอน "${hazard.icon}"`);
  }
});
