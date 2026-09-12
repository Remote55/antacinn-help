/**
 * เทสต์ของ utils/color.js และคู่สีที่แอปใช้จริง
 *
 * โจทย์: ตัวอักษรต้องอ่านออกบนพื้นทุกสี โดยเฉพาะการ์ดเตือนที่ผู้ใช้ต้องอ่านขณะขับขี่
 * เกณฑ์ WCAG 2.1 ระดับ AA: ตัวอักษรขนาดปกติต้องมีความคมชัดอย่างน้อย 4.5:1
 * (เดิมใช้ตัวอักษรขาวบนพื้นเหลือง ได้แค่ 1.7:1 แทบมองไม่เห็นกลางแดด)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from '../utils/color.js';
import { RISK_LEVELS } from '../constants/config.js';
import { COLORS } from '../constants/theme.js';

/** เกณฑ์ WCAG AA สำหรับตัวอักษรขนาดปกติ */
const AA_NORMAL_TEXT = 4.5;

test('ดำบนขาวคมชัดที่สุด 21:1 สีเดียวกันได้ 1:1', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FBC02D', '#FBC02D'), 1);
});

test('สลับสีตัวอักษรกับพื้นได้ค่าเท่าเดิม', () => {
  assert.equal(contrastRatio('#1B3A5C', '#FFFFFF'), contrastRatio('#FFFFFF', '#1B3A5C'));
});

test('รับรหัสสีแบบย่อ 3 หลักและตัวพิมพ์เล็กได้', () => {
  assert.equal(contrastRatio('#fff', '#000'), 21);
});

test('ตรงกับค่าอ้างอิงของ WCAG: เทา #777777 บนขาว ≈ 4.48:1', () => {
  assert.equal(Math.round(contrastRatio('#777777', '#FFFFFF') * 100) / 100, 4.48);
});

test('รหัสสีผิดรูปแบบโยน error บอกชัดเจน ไม่คืนค่า NaN แบบเงียบๆ', () => {
  assert.throws(() => contrastRatio('red', '#FFFFFF'), /รหัสสี/);
});

for (const level of RISK_LEVELS) {
  test(`ป้ายระดับ "${level.label}": ตัวอักษรบนพื้น ${level.color} อ่านออก (≥ 4.5:1)`, () => {
    assert.ok(
      contrastRatio(level.textColor, level.color) >= AA_NORMAL_TEXT,
      `${level.textColor} บน ${level.color} ได้ ${contrastRatio(level.textColor, level.color).toFixed(2)}:1`
    );
  });
}

/** คู่สีตัวอักษร/พื้นที่ใช้จริงในหน้าจอต่างๆ */
const PAIRS_IN_USE = [
  ['text', 'page'],
  ['text', 'card'],
  ['text', 'warningBackground'],
  ['text', 'verifiedBackground'],
  ['textSecondary', 'page'],
  ['textSecondary', 'card'],
  ['textSecondary', 'warningBackground'],
  ['textSecondary', 'dangerSoft'],
  ['textMuted', 'page'],
  ['textMuted', 'card'],
  ['textMuted', 'cardHover'],
  ['caution', 'page'],
  ['caution', 'card'],
  ['danger', 'card'],
  ['dangerDark', 'dangerSoft'],
  ['dangerDark', 'card'],
  ['primary', 'card'],
  ['primary', 'page'],
  ['primary', 'primarySoft'],
  ['primary', 'verifiedBackground'],
  ['white', 'primary'],
  ['white', 'primaryHover'],
  ['white', 'danger'],
  ['white', 'dangerDark'],
  // ส่วนหัวสีกรมท่าของหน้าแรก
  ['onPrimaryMuted', 'primary'],
  ['accent', 'primary'],
];

for (const [foreground, background] of PAIRS_IN_USE) {
  test(`ธีม: ${foreground} บน ${background} อ่านออก (≥ 4.5:1)`, () => {
    const ratio = contrastRatio(COLORS[foreground], COLORS[background]);
    assert.ok(ratio >= AA_NORMAL_TEXT, `${COLORS[foreground]} บน ${COLORS[background]} ได้ ${ratio.toFixed(2)}:1`);
  });
}
