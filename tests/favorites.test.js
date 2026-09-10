/**
 * เทสต์ของ utils/favorites.js
 *
 * โจทย์ (เอกสารตาราง 6.1): AsyncStorage เก็บ "รายการโปรด" ของผู้ใช้
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleFavoriteId, pickFavoritePoints } from '../utils/favorites.js';

test('กดครั้งแรกเพิ่มเข้ารายการ ไว้บนสุดเพราะเพิ่งสนใจล่าสุด', () => {
  assert.deepEqual(toggleFavoriteId(['a'], 'b'), ['b', 'a']);
});

test('กดซ้ำเอาออกจากรายการ', () => {
  assert.deepEqual(toggleFavoriteId(['b', 'a'], 'b'), ['a']);
});

test('ไม่แก้อาเรย์เดิม (React ต้องได้อาเรย์ใหม่ถึงจะวาดหน้าจอใหม่)', () => {
  const ids = ['a'];
  toggleFavoriteId(ids, 'b');
  assert.deepEqual(ids, ['a']);
});

test('ข้อมูลในเครื่องเสีย (ไม่ใช่อาเรย์) เริ่มจากรายการว่าง ไม่พัง', () => {
  assert.deepEqual(toggleFavoriteId(null, 'a'), ['a']);
});

test('แปลง id เป็นจุดเสี่ยงตามลำดับที่บันทึก ข้ามจุดที่หาไม่เจอ', () => {
  const points = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const picked = pickFavoritePoints(['c', 'ถูกลบไปแล้ว', 'a'], points);
  assert.deepEqual(picked.map((p) => p.id), ['c', 'a']);
});
