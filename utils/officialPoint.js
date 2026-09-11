/**
 * แปลง "จุดรวมเหตุ" จากข้อมูลกระทรวงคมนาคม ให้เป็นจุดเสี่ยงรูปแบบเดียวกับ data/riskPoints.json
 *
 * ทุกข้อความในจุดที่สร้าง (สถิติ ช่วงเวลา คำแนะนำ) มาจากข้อมูลทางการของกลุ่มนั้นเท่านั้น
 * จึงตั้ง verified: true ได้ตามนิยามของทีม (UNVERIFIED_TEXT ใน constants/config.js)
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { DEFAULT_EMERGENCY, CATEGORIES } from '../constants/config.js';
import { describeHours } from './format.js';

/** สายด่วนตำรวจทางหลวง ใช้กับจุดบนทางหลวง */
export const HIGHWAY_POLICE = { label: 'ตำรวจทางหลวง', tel: '1193' };

const DATASET_NAME = 'อุบัติเหตุบนโครงข่ายถนนของกระทรวงคมนาคม';
const DATASET_URL = 'datagov.mot.go.th/dataset/roadaccident';

/**
 * คำแนะนำตามมูลเหตุ (ชื่อผ่าน normalizeCause แล้ว)
 * ท่อนแรกก่อนเว้นวรรคต้องเป็นประโยคที่ครบในตัว เพราะโหมดเดินทางพูดเฉพาะท่อนแรก (utils/alertMessage.js)
 */
const CAUSE_ADVICE = {
  'ขับรถเร็วเกินอัตรากำหนด': 'ลดความเร็วก่อนถึงช่วงนี้',
  'หลับใน': 'ถ้าง่วงให้จอดพักก่อนถึงช่วงนี้',
  'คน/รถ/สัตว์ตัดหน้ากระชั้นชิด': 'ระวังรถหรือคนตัดหน้า เว้นระยะจากคันหน้าให้มากขึ้น',
  'อุปกรณ์ยานพาหนะบกพร่อง': 'ตรวจเบรกและไฟรถก่อนเดินทาง',
  'ยางเสื่อมสภาพ/ยางแตก': 'ตรวจสภาพยางและลมยางก่อนเดินทาง',
  'เมาสุรา': 'ระวังรถที่ขับส่ายไปมา โดยเฉพาะช่วงกลางคืน',
  'ถนนลื่น': 'ลดความเร็วเมื่อถนนเปียก',
  'ฝ่าฝืนสัญญาณไฟ/เครื่องหมายจราจร': 'ชะลอก่อนถึงทางแยก ระวังรถฝ่าสัญญาณไฟ',
  'แซงรถอย่างผิดกฎหมาย': 'อย่าแซงในช่วงนี้ ระวังรถสวนที่แซงมา',
  'ทางโค้งอันตราย': 'ชะลอความเร็วก่อนเข้าโค้ง',
};
const GENERIC_ADVICE = 'ลดความเร็วและเพิ่มความระวังเมื่อผ่านช่วงนี้';

/** ช่วงเสี่ยงยาว 3 ชั่วโมงหรือ 3 เดือน */
const PEAK_WINDOW_SIZE = 3;
/** ต้องมีเหตุในช่วงอย่างน้อย 3 ครั้ง และเป็นอย่างน้อยครึ่งหนึ่งของเหตุที่รู้เวลา ถึงนับว่าเป็นช่วงเสี่ยงสูง */
const PEAK_MIN_COUNT = 3;
const PEAK_MIN_SHARE = 0.5;

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const round5 = (value) => Math.round(value * 1e5) / 1e5;

/**
 * หาช่วงต่อเนื่องที่มีเหตุมากที่สุด วนรอบได้ เช่น ธ.ค.–ม.ค. หรือ 23:00–01:00
 * คืนเฉพาะค่าในช่วงนั้นที่เกิดเหตุจริง (ไม่เติมเดือนหรือชั่วโมงที่ไม่มีเหตุเข้าไปให้ครบ 3)
 * และคืนค่าเฉพาะเมื่อมีหลักฐานพอ ไม่งั้นคืนอาเรย์ว่าง
 * เพราะช่วงเสี่ยงเป็นตัวคูณคะแนน ใส่จากหลักฐานน้อยเกินไปจะดันคะแนนสูงเกินจริง
 * @param values ค่าที่พบในแต่ละเหตุ (null = ไม่รู้ ไม่นับ)
 * @param domain ค่าที่เป็นไปได้ทั้งหมดเรียงตามลำดับ เช่น เดือน 1–12
 */
export function findPeakWindow(values, domain) {
  const known = (values || []).filter((value) => domain.includes(value));
  if (known.length < PEAK_MIN_COUNT) return [];

  let bestWindow = [];
  let bestCount = 0;
  for (let start = 0; start < domain.length; start++) {
    const window = Array.from({ length: PEAK_WINDOW_SIZE }, (_, i) => domain[(start + i) % domain.length]);
    const count = known.filter((value) => window.includes(value)).length;
    if (count > bestCount) {
      bestCount = count;
      bestWindow = window;
    }
  }

  const hasEnoughEvidence = bestCount >= PEAK_MIN_COUNT && bestCount / known.length >= PEAK_MIN_SHARE;
  return hasEnoughEvidence ? bestWindow.filter((value) => known.includes(value)) : [];
}

/** รวมจำนวนผู้เสียชีวิตและบาดเจ็บของแต่ละปี ในรูปแบบ incidents ของ riskPoints.json (ปีใหม่ขึ้นก่อน) */
export function incidentsByYear(members) {
  const years = [...new Set(members.map((item) => item.yearBE))].sort((a, b) => b - a);
  const result = [];
  for (const year of years) {
    const ofYear = members.filter((item) => item.yearBE === year);
    const note = `ข้อมูลกระทรวงคมนาคม ปี ${year}: เกิดเหตุ ${ofYear.length} ครั้งในบริเวณนี้`;
    for (const severity of ['fatal', 'serious', 'minor']) {
      const count = ofYear.reduce((sum, item) => sum + item[severity], 0);
      if (count > 0) result.push({ year, severity, count, note });
    }
  }
  return result;
}

/** นับค่าที่ซ้ำกัน เรียงจากพบมากไปน้อย */
function countByValue(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function buildAdvice(members, peakHours) {
  const lines = [];
  const [topCause] = countByValue(members.map((item) => item.cause).filter(Boolean));
  if (topCause) {
    const [cause, count] = topCause;
    lines.push(
      `${CAUSE_ADVICE[cause] || GENERIC_ADVICE} (มูลเหตุที่บันทึกบ่อยที่สุด: ${cause} ${count} จาก ${members.length} ครั้ง)`
    );
  } else {
    lines.push(GENERIC_ADVICE);
  }

  const rainyCount = members.filter((item) => item.isRaining).length;
  if (rainyCount >= 2 && rainyCount / members.length >= 1 / 3) {
    lines.push(`ระวังเป็นพิเศษตอนฝนตก ${rainyCount} จาก ${members.length} ครั้งเกิดขณะฝนตก`);
  }
  if (peakHours.length > 0) {
    lines.push(`เกิดเหตุบ่อยช่วง ${describeHours(peakHours)} น.`);
  }
  return lines;
}

function buildSource(cluster, info) {
  const years = cluster.years;
  const yearText = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : `${years[0]}`;
  return (
    `กระทรวงคมนาคม ชุดข้อมูล "${DATASET_NAME}" (${DATASET_URL} สัญญาอนุญาต Open Data Common) ` +
    `ปี ${yearText}: เกิดเหตุ ${cluster.members.length} ครั้งในรัศมี ${info.radiusM} ม. ` +
    `ผู้เสียชีวิต ${cluster.fatal} บาดเจ็บสาหัส ${cluster.serious} บาดเจ็บเล็กน้อย ${cluster.minor} ราย ` +
    `ดึงข้อมูลเมื่อ ${info.fetchedDate} ด้วย scripts/mot-accidents.mjs`
  );
}

/**
 * @param cluster ผลจาก clusterIncidents / summarizeCluster
 * @param info { id, name, district, fetchedDate, radiusM }
 */
export function buildOfficialPoint(cluster, info) {
  const { members } = cluster;
  const peakHours = findPeakWindow(
    members.map((item) => item.hour),
    HOURS
  );

  return {
    id: info.id,
    name: info.name,
    category: CATEGORIES.ROAD,
    type: 'crash',
    district: info.district,
    coordinate: { lat: round5(cluster.center.lat), lng: round5(cluster.center.lng) },
    incidents: incidentsByYear(members),
    peakMonths: findPeakWindow(
      members.map((item) => item.month),
      MONTHS
    ),
    peakHours,
    advice: buildAdvice(members, peakHours),
    emergency: [DEFAULT_EMERGENCY, HIGHWAY_POLICE],
    source: buildSource(cluster, info),
    verified: true,
  };
}
