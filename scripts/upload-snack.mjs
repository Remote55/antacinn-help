/**
 * อัปโหลดโค้ดแอปขึ้น Expo Snack (รายวิชากำหนดให้ส่งงานผ่าน Snack)
 *
 * วิธีใช้:
 *   npm run snack:upload -- --check   ตรวจอย่างเดียวว่า Snack หา dependency ครบ ไม่บันทึก
 *   npm run snack:upload              บันทึกขึ้น Snack แล้วพิมพ์ลิงก์ใหม่
 *
 * ทุกครั้งที่บันทึกจะได้ลิงก์ใหม่ (Snack ที่บันทึกโดยไม่ล็อกอินแก้ของเดิมไม่ได้)
 * ส่งเฉพาะไฟล์ที่แอปใช้ ไม่ส่งเทสต์ สคริปต์ และเอกสาร (อยู่บน GitHub แล้ว)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Snack, isModulePreloaded } from 'snack-sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SDK_VERSION = '54.0.0';
const APP_DIRS = ['components', 'constants', 'data', 'hooks', 'navigation', 'screens', 'utils'];
const APP_ROOT_FILES = ['App.js', 'app.json'];
/** Snack มีให้ในตัวอยู่แล้ว ไม่ต้องประกาศเป็น dependency */
const PROVIDED_BY_SNACK = new Set(['expo', 'react', 'react-dom', 'react-native', 'react-native-web']);

function readCode(relative) {
  return { type: 'CODE', contents: fs.readFileSync(path.join(ROOT, relative), 'utf8') };
}

function collectFiles() {
  const files = {};
  for (const name of APP_ROOT_FILES) files[name] = readCode(name);
  for (const dir of APP_DIRS) {
    for (const entry of fs.readdirSync(path.join(ROOT, dir))) {
      // ข้อมูลส่งเฉพาะ JSON ที่แอปโหลด ไฟล์ .md เป็นเอกสารที่มาของข้อมูล
      if (/\.(js|json)$/.test(entry)) files[`${dir}/${entry}`] = readCode(`${dir}/${entry}`);
    }
  }
  return files;
}

function collectDependencies() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const dependencies = {};
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    if (!PROVIDED_BY_SNACK.has(name)) dependencies[name] = { version };
  }
  return dependencies;
}

/**
 * Snack หา dependency แบบ async รอจนทุกตัวได้ผล (สำเร็จหรือล้มเหลว)
 * ตัวที่ Snack โหลดไว้ในตัวแล้ว (เช่น async-storage) ไม่มี handle เลย จึงไม่ต้องรอ
 */
async function waitForDependencies(snack) {
  for (let second = 0; second < 90; second++) {
    const state = await snack.getStateAsync();
    const pending = Object.entries(state.dependencies).filter(
      ([name, dep]) => !dep.handle && !dep.error && !isModulePreloaded(name, SDK_VERSION)
    );
    if (pending.length === 0) return state;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Snack หา dependency ไม่เสร็จใน 90 วินาที ลองใหม่อีกครั้ง');
}

async function main() {
  const files = collectFiles();
  const dependencies = collectDependencies();
  console.log(`ไฟล์ ${Object.keys(files).length} ไฟล์ · dependency ${Object.keys(dependencies).length} ตัว · Expo SDK ${SDK_VERSION}`);

  const snack = new Snack({
    name: 'AntacinnHelp',
    description:
      'แผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว หาดใหญ่–เมืองสงขลา รายวิชา 344-312 โค้ดเต็มและเอกสาร: https://github.com/Remote55/antacinn-help',
    sdkVersion: SDK_VERSION,
    files,
    dependencies,
  });

  const state = await waitForDependencies(snack);
  const failed = Object.entries(state.dependencies).filter(([, dep]) => dep.error);
  if (failed.length > 0) {
    for (const [name, dep] of failed) console.log(`✗ ${name}: ${String(dep.error.message).split('\n')[0]}`);
    throw new Error('มี dependency ที่ Snack build ไม่ได้ (ดูหมายเหตุเรื่อง native-stack ใน README)');
  }
  console.log('✓ Snack หา dependency ได้ครบทุกตัว');

  if (process.argv.includes('--check')) {
    console.log('ตรวจอย่างเดียว ไม่ได้บันทึก');
    return;
  }
  const saved = await snack.saveAsync();
  console.log(`บันทึกแล้ว: https://snack.expo.dev/${saved.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('ล้มเหลว:', error.message);
    process.exit(1);
  });
