/**
 * สร้างจุดเสี่ยงบนทางหลวงจากข้อมูลอุบัติเหตุทางการของกระทรวงคมนาคม
 *
 * ผลลัพธ์:
 *   data/officialRiskPoints.json  จุดเสี่ยงที่ผ่านเกณฑ์ แอปโหลดใช้ทันที
 *                                 ห้ามแก้ไฟล์นี้ด้วยมือ ให้รันสคริปต์ใหม่แทน (รันแล้วเขียนทับทั้งไฟล์)
 *   data/MOT_REPORT.md            รายงานที่มา วิธีคิด และรายการที่ผ่าน/ไม่ผ่านเกณฑ์ ให้ตรวจย้อนได้
 *
 * วิธีใช้ (ต้องต่ออินเทอร์เน็ต ใช้เวลาราว 1 นาที): npm run data:mot
 * กระทรวงเปิดข้อมูลปีใหม่เมื่อไหร่ รันซ้ำได้เลย สคริปต์หาไฟล์ของทุกปีเองจากหน้าชุดข้อมูล
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeMotRecord } from '../utils/motRecords.js';
import { clusterIncidents } from '../utils/motClusters.js';
import { buildOfficialPoint } from '../utils/officialPoint.js';
import { isInServiceArea } from '../utils/geo.js';
import { validateRiskPoints } from '../utils/dataValidation.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://datagov.mot.go.th/api/3/action';
const DATASET_ID = 'roadaccident';
const PROVINCE = 'สงขลา';
const USER_AGENT = 'AntacinnHelp-student-project/1.0 (MOT data pipeline)';

/** เกณฑ์คัดจุด (เอกสารออกแบบระยะที่ 2 ข้อ D2) */
const CLUSTER_RADIUS_M = 500; // เท่ากับระยะเริ่มเตือนของโหมดเดินทาง
const MIN_YEARS = 2; // เกิดซ้ำอย่างน้อย 2 ปี ไม่ใช่เหตุบังเอิญครั้งเดียว
const MIN_WEIGHT = 10; // น้ำหนักรวม ตาย 5 สาหัส 3 เล็กน้อย 1

/** อำเภอเป้าหมายตามขอบเขตเอกสารบทที่ 1.3 และคำนำหน้า id */
const TARGET_DISTRICTS = { 'หาดใหญ่': 'hy', 'เมืองสงขลา': 'sk' };

/** ชื่อที่คนในพื้นที่เรียกทางหลวงสายหลัก ใช้ตั้งชื่อจุดคู่กับหลักกิโลเมตรของสายเดียวกัน */
const HIGHWAY_NAMES = { '4': 'ถนนเพชรเกษม', '407': 'ถนนกาญจนวนิช', '414': 'ถนนลพบุรีราเมศวร์' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const today = new Date().toISOString().slice(0, 10);

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

/** ไฟล์ CSV ของทุกปีที่เปิดให้ค้นผ่าน API */
async function listYearResources() {
  const { result } = await getJson(`${API}/package_show?id=${DATASET_ID}`);
  const usable = [];
  const skipped = [];
  for (const resource of result.resources) {
    const year = Number((String(resource.name).match(/ปี\s*(\d{4})/) || [])[1]);
    if (!year || String(resource.format).toUpperCase() !== 'CSV') continue;
    if (resource.datastore_active) usable.push({ year, id: resource.id });
    else skipped.push(year);
  }
  return {
    title: result.title,
    license: result.license_title,
    usable: usable.sort((a, b) => a.year - b.year),
    skipped: skipped.sort(),
  };
}

/** ดึงทุกแถวของจังหวัดเป้าหมายในไฟล์เดียว ทีละ 1,000 แถว */
async function pullProvince(resourceId) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URLSearchParams({
      resource_id: resourceId,
      filters: JSON.stringify({ 'จังหวัด': PROVINCE }),
      limit: '1000',
      offset: String(offset),
    });
    const { result } = await getJson(`${API}/datastore_search?${query}`);
    rows.push(...result.records);
    if (offset + 1000 >= result.total) return rows;
  }
}

/** หาอำเภอและชื่อหมู่บ้านจากพิกัด (Nominatim อนุญาต 1 ครั้งต่อวินาที) */
async function reverseGeocode({ lat, lng }) {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=th' +
    `&lat=${lat}&lon=${lng}`;
  const { address = {} } = await getJson(url);
  const district = String(address.county || address.state_district || '').replace(/^อำเภอ/, '').trim();
  // ใช้เฉพาะชื่อหมู่บ้านที่อยู่ใกล้จริง (village, hamlet) ไม่ใช้ town หรือ municipality
  // เพราะสองช่องนั้นเป็นชื่อเมืองที่อาจอยู่ไกลหลายกิโลเมตรหรือคนละอำเภอ เช่น จุดในอำเภอหาดใหญ่ได้ town เป็นเขารูปช้าง
  // และใช้เฉพาะชื่อที่เป็นภาษาไทยล้วน บางที่ใน OpenStreetMap มีแต่ชื่ออังกฤษ
  const locality =
    [address.village, address.hamlet].find((name) => name && /[ก-๙]/.test(name) && !/[A-Za-z]/.test(name)) || '';
  return { district, locality };
}

function roadLabel(route) {
  if (HIGHWAY_NAMES[route]) return HIGHWAY_NAMES[route];
  if (/^สข\./.test(route)) return `ทางหลวงชนบท ${route}`;
  return `ทางหลวงหมายเลข ${route}`;
}

/** ชื่อจุด = ถนน + หลักกิโลเมตร + หมู่บ้าน เช่น "ถนนลพบุรีราเมศวร์ กม. 3.6 ช่วงบ้านท่านางหอม" */
function nameFor(cluster, locality) {
  const { route, km } = cluster.representative;
  const kmText = km !== null ? ` กม. ${km.toFixed(1)}` : '';
  return `${roadLabel(route)}${kmText}${locality ? ` ช่วง${locality}` : ''}`;
}

function idFor(prefix, cluster, usedIds) {
  const { route, km } = cluster.representative;
  const routeSlug = route.replace(/\D/g, '') || 'road';
  const kmSlug = km !== null ? `km${km.toFixed(1).replace('.', '-')}` : 'km-na';
  let id = `${prefix}-mot-${routeSlug}-${kmSlug}`;
  for (let n = 2; usedIds.has(id); n++) id = `${prefix}-mot-${routeSlug}-${kmSlug}-${n}`;
  usedIds.add(id);
  return id;
}

function writeReport({ dataset, yearStats, candidates, points }) {
  const lines = [
    '# รายงานจุดเสี่ยงจากข้อมูลกระทรวงคมนาคม',
    '',
    `สร้างโดย \`scripts/mot-accidents.mjs\` เมื่อ ${today} ห้ามแก้ไฟล์นี้ด้วยมือ ให้รัน \`npm run data:mot\` ใหม่`,
    '',
    `ชุดข้อมูล: **${dataset.title}** (https://datagov.mot.go.th/dataset/${DATASET_ID}) สัญญาอนุญาต ${dataset.license}`,
    `จังหวัด: ${PROVINCE}`,
    '',
    '## ข้อมูลที่ใช้',
    '',
    '| ปี | เหตุการณ์ | มีพิกัด | อยู่ในพื้นที่ให้บริการ | ผู้เสียชีวิต |',
    '|---|---|---|---|---|',
    ...yearStats.map((s) => `| ${s.year} | ${s.rows} | ${s.withCoordinate} | ${s.inArea} | ${s.fatal} |`),
    '',
    dataset.skipped.length > 0
      ? `ปีที่ยังค้นผ่าน API ไม่ได้ (ยังไม่เปิด datastore): ${dataset.skipped.join(', ')}`
      : 'ทุกปีที่มีไฟล์ค้นผ่าน API ได้',
    '',
    '## ข้อควรรู้เกี่ยวกับข้อมูล',
    '',
    '- ครอบคลุมเฉพาะถนนในความดูแลของกระทรวงคมนาคม (กรมทางหลวง กรมทางหลวงชนบท) ไม่รวมถนนเทศบาลในเมือง',
    '- แต่ละปีเก็บวันที่คนละรูปแบบ แปลงด้วย `utils/motRecords.js` ที่มีเทสต์คุมทุกรูปแบบ',
    '- ปี 2565 วันกับเดือนสลับกัน จึงไม่ใช้หาเดือนที่เสี่ยง แต่ยังนับจำนวนเหตุ',
    '- ตัวเลขนับเฉพาะเหตุที่หน่วยงานบันทึก จำนวนจริงอาจสูงกว่านี้',
    '',
    '## วิธีคัดจุด',
    '',
    `1. จัดกลุ่มเหตุที่อยู่ในรัศมี ${CLUSTER_RADIUS_M} ม. โดยใช้เหตุที่รุนแรงที่สุดเป็นแกน (\`utils/motClusters.js\`)`,
    `2. เก็บเฉพาะกลุ่มที่เกิดเหตุซ้ำอย่างน้อย ${MIN_YEARS} ปี และมีน้ำหนักรวม (ตาย 5 สาหัส 3 เล็กน้อย 1) ไม่ต่ำกว่า ${MIN_WEIGHT}`,
    `3. เก็บเฉพาะกลุ่มที่อยู่ในอำเภอ${Object.keys(TARGET_DISTRICTS).join(' หรือ ')} (ตรวจอำเภอจาก OpenStreetMap)`,
    '4. ช่วงเวลาและเดือนที่เสี่ยงใส่เฉพาะเมื่อมีเหตุในช่วง 3 ชั่วโมง/3 เดือนเดียวกันอย่างน้อย 3 ครั้ง และเป็นอย่างน้อยครึ่งหนึ่งของเหตุที่รู้เวลา',
    '',
    '## กลุ่มที่ผ่านเกณฑ์น้ำหนักและจำนวนปี',
    '',
    '| # | พิกัด | สายทาง กม. | เหตุ | ตาย/สาหัส/เล็กน้อย | น้ำหนัก | ปี | อำเภอ | ผล |',
    '|---|---|---|---|---|---|---|---|---|',
    ...candidates.map((c, i) => {
      const r = c.cluster.representative;
      const result = c.pointId ? `✓ ${c.pointId}` : `✗ ${c.reason}`;
      return (
        `| ${i + 1} | ${c.cluster.center.lat.toFixed(5)}, ${c.cluster.center.lng.toFixed(5)} | ${r.route} ${r.km ?? '-'} ` +
        `| ${c.cluster.members.length} | ${c.cluster.fatal}/${c.cluster.serious}/${c.cluster.minor} | ${c.cluster.weight} ` +
        `| ${c.cluster.years.join(', ')} | ${c.district || '-'} | ${result} |`
      );
    }),
    '',
    `## จุดที่เขียนลง data/officialRiskPoints.json (${points.length} จุด)`,
    '',
    ...points.map((p) => `- \`${p.id}\` ${p.name} (${p.district})`),
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'data', 'MOT_REPORT.md'), lines.join('\n'));
}

async function main() {
  console.log('1/4 อ่านรายการไฟล์ของชุดข้อมูล...');
  const dataset = await listYearResources();

  console.log(`2/4 ดึงข้อมูลจังหวัด${PROVINCE} ${dataset.usable.length} ปี...`);
  const incidents = [];
  const yearStats = [];
  for (const { year, id } of dataset.usable) {
    const rows = await pullProvince(id);
    const normalized = rows.map((row) => normalizeMotRecord(row, year)).filter(Boolean);
    const inArea = normalized.filter((item) => isInServiceArea(item));
    incidents.push(...inArea);
    yearStats.push({
      year,
      rows: rows.length,
      withCoordinate: normalized.length,
      inArea: inArea.length,
      fatal: normalized.reduce((sum, item) => sum + item.fatal, 0),
    });
    console.log(`   ปี ${year}: ${rows.length} เหตุการณ์ อยู่ในพื้นที่ ${inArea.length}`);
  }

  console.log('3/4 จัดกลุ่มและตรวจอำเภอ...');
  const qualified = clusterIncidents(incidents, CLUSTER_RADIUS_M).filter(
    (cluster) => cluster.years.length >= MIN_YEARS && cluster.weight >= MIN_WEIGHT
  );

  const usedIds = new Set();
  const candidates = [];
  const points = [];
  for (const cluster of qualified) {
    const place = await reverseGeocode(cluster.center);
    await sleep(1100);
    const prefix = TARGET_DISTRICTS[place.district];
    if (!prefix) {
      candidates.push({ cluster, district: place.district, reason: 'อยู่นอกอำเภอเป้าหมาย' });
      continue;
    }
    const point = buildOfficialPoint(cluster, {
      id: idFor(prefix, cluster, usedIds),
      name: nameFor(cluster, place.locality),
      district: place.district,
      fetchedDate: today,
      radiusM: CLUSTER_RADIUS_M,
    });
    points.push(point);
    candidates.push({ cluster, district: place.district, pointId: point.id });
    console.log(`   ✓ ${point.name}`);
  }

  // ต้องผ่านกฎเดียวกับจุดที่ทีมกรอกเอง ไม่งั้นไม่เขียนไฟล์
  const errors = validateRiskPoints(points);
  if (errors.length > 0) throw new Error('จุดที่สร้างไม่ผ่านกฎ:\n' + errors.join('\n'));

  console.log('4/4 เขียนไฟล์...');
  fs.writeFileSync(path.join(ROOT, 'data', 'officialRiskPoints.json'), JSON.stringify(points, null, 2) + '\n');
  writeReport({ dataset, yearStats, candidates, points });
  console.log(`เสร็จ: ${points.length} จุด → data/officialRiskPoints.json และรายงาน data/MOT_REPORT.md`);
}

main().catch((error) => {
  console.error('ล้มเหลว:', error.message);
  process.exitCode = 1;
});
