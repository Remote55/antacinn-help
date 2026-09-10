/**
 * ตรวจว่าทุกบรรทัด import ในโปรเจคหาไฟล์เจอ และชื่อที่ import มามีอยู่จริงในไฟล์ปลายทาง
 *
 * ทำไมต้องมี: Metro build ผ่านได้แม้ import ชื่อที่ไม่มีอยู่จริง ค่าที่ได้จะเป็น undefined
 * แล้วไปพังตอนผู้ใช้กดปุ่มนั้น การตรวจนี้จับได้ตั้งแต่ก่อนอัปโหลดขึ้น Snack
 *
 * วิธีใช้: npm run check:imports
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'docs', 'dist', '.expo', 'scripts']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');

/** หาไฟล์ปลายทางแบบเดียวกับ Metro: ชื่อตรง, .js, .json, .native.js, .web.js, /index.js */
function resolveImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, base + '.js', base + '.json', base + '.native.js', base + '.web.js', path.join(base, 'index.js')];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

function exportedNames(file) {
  const source = fs.readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of source.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/gm)) names.add(m[1]);
  for (const m of source.matchAll(/^export\s+const\s+([A-Za-z0-9_]+)/gm)) names.add(m[1]);
  for (const m of source.matchAll(/^export\s*\{([^}]+)\}/gm)) {
    for (const piece of m[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  if (/^export\s+default/m.test(source)) names.add('default');
  return names;
}

const problems = [];
let importCount = 0;

for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  // [^;]*? กันไม่ให้ส่วนหน้าของบรรทัด import หนึ่งไปจับคู่กับ path ของบรรทัดถัดไป
  for (const m of source.matchAll(/^import\s+([^;]*?)\s+from\s+['"](\.[^'"]+)['"]\s*;/gm)) {
    importCount++;
    const [, clause, specifier] = m;
    const target = resolveImport(file, specifier);
    if (!target) {
      problems.push(`${relative(file)}: หาไฟล์ "${specifier}" ไม่เจอ`);
      continue;
    }
    if (target.endsWith('.json')) continue;

    const named = clause.match(/\{([^}]*)\}/);
    if (!named) continue;
    const available = exportedNames(target);
    for (const piece of named[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/)[0].trim();
      if (name && !available.has(name)) {
        problems.push(`${relative(file)}: "${name}" ไม่มีอยู่ใน ${relative(target)}`);
      }
    }
  }
}

console.log(`ตรวจ import ${importCount} บรรทัด`);
if (problems.length === 0) {
  console.log('OK: ทุก import หาไฟล์เจอ และทุกชื่อมีอยู่จริง');
} else {
  console.log(`พบปัญหา ${problems.length} จุด:`);
  for (const p of problems) console.log('  ' + p);
  process.exitCode = 1;
}
