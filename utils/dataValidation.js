/**
 * ตรวจความถูกต้องของไฟล์ข้อมูล data/riskPoints.json และ data/presetRoutes.json
 *
 * ทำไมต้องมี:
 * ไฟล์ข้อมูลกรอกด้วยมือ และทีมจะกรอกเพิ่มเรื่อย ๆ หลังลงพื้นที่
 * การพิมพ์ผิดเล็กน้อย เช่น เดือน 13 หรือ severity สะกดผิด ทำให้คะแนนเพี้ยนเงียบ ๆ โดยไม่มี error
 * ฟังก์ชันนี้คืนรายการปัญหาเป็นภาษาไทยที่อ่านแล้วรู้ทันทีว่าต้องแก้ตรงไหน
 *
 * ใช้ผ่านเทสต์ tests/data.test.js ซึ่งรันทุกครั้งที่สั่ง npm test
 */

import { HAZARD_TYPES, CATEGORIES, SEVERITY_WEIGHTS } from '../constants/config.js';
import { haversineMeters } from './geo.js';

/** คำนำหน้า id ของแต่ละอำเภอ คำนำหน้าต้องตรงกับฟิลด์ district เสมอ */
export const DISTRICT_PREFIXES = {
  'hy-': 'หาดใหญ่',
  'sk-': 'เมืองสงขลา',
  'sn-': 'สิงหนคร',
};

/**
 * กรอบพื้นที่ให้บริการของแอป
 * กว้างพอให้ครอบน้ำตกโตนงาช้าง (ทิศตะวันตก) และสะพานติณสูลานนท์ (ทิศเหนือ)
 * ถ้ามีจุดหลุดกรอบนี้ แปลว่าพิมพ์พิกัดผิด เช่น สลับ lat กับ lng
 */
export const SERVICE_AREA = { minLat: 6.85, maxLat: 7.3, minLng: 100.15, maxLng: 100.7 };

/** คำที่บอกว่าแหล่งอ้างอิงเป็นหน่วยงานทางการ ใช้ตรวจจุดที่ตั้ง verified: true */
const OFFICIAL_SOURCE_KEYWORDS = ['กระทรวง', 'กรม', 'สำนักงาน', 'data.go.th', 'datagov', 'ThaiRSC', 'สภ.', 'ศปถ'];

/** ข้อความที่แปลว่า "ยังไม่ได้กรอกข้อมูลจริง" */
const PLACEHOLDER_TEXT = 'รอกรอกข้อมูลจริง';

const HAZARD_TYPE_IDS = HAZARD_TYPES.map((t) => t.id);
const CATEGORY_IDS = Object.values(CATEGORIES);
const SEVERITY_KEYS = Object.keys(SEVERITY_WEIGHTS);

function isInServiceArea(coordinate) {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.lat) &&
      Number.isFinite(coordinate.lng) &&
      coordinate.lat >= SERVICE_AREA.minLat &&
      coordinate.lat <= SERVICE_AREA.maxLat &&
      coordinate.lng >= SERVICE_AREA.minLng &&
      coordinate.lng <= SERVICE_AREA.maxLng
  );
}

function isIntegerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * ตรวจจุดเสี่ยงทั้งไฟล์
 * @returns อาเรย์ข้อความปัญหา ถ้าข้อมูลถูกต้องทั้งหมดจะได้อาเรย์ว่าง
 */
export function validateRiskPoints(points) {
  if (!Array.isArray(points)) return ['ข้อมูลจุดเสี่ยงต้องเป็นอาเรย์'];

  const errors = [];
  const seenIds = new Set();

  points.forEach((point, index) => {
    const label = point && point.id ? point.id : `ลำดับที่ ${index + 1}`;
    const problem = (message) => errors.push(`${label}: ${message}`);

    if (!point || typeof point.id !== 'string' || point.id === '') {
      problem('ไม่มี id');
      return;
    }
    if (seenIds.has(point.id)) problem('id ซ้ำกับจุดอื่น');
    seenIds.add(point.id);

    const prefix = Object.keys(DISTRICT_PREFIXES).find((p) => point.id.startsWith(p));
    if (!prefix) {
      problem(`id ต้องขึ้นต้นด้วย ${Object.keys(DISTRICT_PREFIXES).join(' ')}`);
    } else if (point.district !== DISTRICT_PREFIXES[prefix]) {
      problem(`คำนำหน้า ${prefix} หมายถึงอำเภอ${DISTRICT_PREFIXES[prefix]} แต่ district เป็น "${point.district}"`);
    }

    if (typeof point.name !== 'string' || point.name.trim() === '') problem('ไม่มีชื่อ');
    if (!CATEGORY_IDS.includes(point.category)) problem(`category "${point.category}" ไม่รู้จัก`);
    if (!HAZARD_TYPE_IDS.includes(point.type)) problem(`type "${point.type}" ไม่รู้จัก`);
    if (!isInServiceArea(point.coordinate)) {
      problem('พิกัดอยู่นอกพื้นที่ให้บริการ (ตรวจว่าสลับ lat กับ lng หรือพิมพ์ผิดหรือไม่)');
    }

    const incidents = Array.isArray(point.incidents) ? point.incidents : null;
    if (!incidents) problem('incidents ต้องเป็นอาเรย์');
    (incidents || []).forEach((incident, i) => {
      const where = `incidents[${i}]`;
      if (!isIntegerBetween(incident.year, 2540, 2575)) problem(`${where}.year ต้องเป็นปี พ.ศ. 2540–2575`);
      if (!SEVERITY_KEYS.includes(incident.severity)) problem(`${where}.severity ต้องเป็น ${SEVERITY_KEYS.join(' / ')}`);
      if (!Number.isInteger(incident.count) || incident.count < 1) problem(`${where}.count ต้องเป็นจำนวนเต็มตั้งแต่ 1`);
    });

    (point.peakMonths || []).forEach((m) => {
      if (!isIntegerBetween(m, 1, 12)) problem(`peakMonths มีค่า ${m} ต้องเป็น 1–12`);
    });
    (point.peakHours || []).forEach((h) => {
      if (!isIntegerBetween(h, 0, 23)) problem(`peakHours มีค่า ${h} ต้องเป็น 0–23`);
    });

    if (!Array.isArray(point.emergency) || point.emergency.length === 0 || point.emergency.some((e) => !e.tel)) {
      problem('emergency ต้องมีอย่างน้อยหนึ่งเบอร์');
    }

    const source = typeof point.source === 'string' ? point.source : '';
    if (source.trim() === '') problem('source ห้ามว่าง (เอกสารบทที่ 6.2 กำหนดเป็นฟิลด์บังคับ)');
    if (incidents && incidents.length > 0 && source.includes(PLACEHOLDER_TEXT)) {
      problem('มีตัวเลขเหตุการณ์แต่ source ยังเป็นข้อความรอกรอก ต้องระบุแหล่งอ้างอิงจริง');
    }

    if (typeof point.verified !== 'boolean') problem('verified ต้องเป็น true หรือ false');
    if (point.verified === true) {
      const isOfficial = OFFICIAL_SOURCE_KEYWORDS.some((k) => source.includes(k));
      if (!isOfficial || source.includes(PLACEHOLDER_TEXT)) {
        problem('ตั้ง verified: true ได้เฉพาะเมื่อ source เป็นหน่วยงานทางการ (นิยามใน UNVERIFIED_TEXT)');
      }
    }
  });

  return errors;
}

/**
 * ตรวจเส้นทางสำเร็จรูป
 * @returns อาเรย์ข้อความปัญหา ถ้าถูกต้องทั้งหมดจะได้อาเรย์ว่าง
 */
export function validatePresetRoutes(routes) {
  if (!Array.isArray(routes)) return ['ข้อมูลเส้นทางต้องเป็นอาเรย์'];

  const errors = [];
  const seenIds = new Set();

  routes.forEach((route, index) => {
    const label = route && route.id ? route.id : `ลำดับที่ ${index + 1}`;
    const problem = (message) => errors.push(`${label}: ${message}`);

    if (!route || !route.id) {
      problem('ไม่มี id');
      return;
    }
    if (seenIds.has(route.id)) problem('id ซ้ำกับเส้นทางอื่น');
    seenIds.add(route.id);

    for (const end of ['origin', 'destination']) {
      if (!isInServiceArea(route[end])) problem(`${end} อยู่นอกพื้นที่ให้บริการ`);
      if (!route[end] || !route[end].name) problem(`${end} ไม่มีชื่อ`);
    }

    const fallback = route.fallbackCoordinates;
    if (!Array.isArray(fallback) || fallback.length < 2) {
      problem('fallbackCoordinates ต้องมีอย่างน้อย 2 จุด');
      return;
    }
    if (fallback.some((c) => !isInServiceArea(c))) problem('fallbackCoordinates มีจุดอยู่นอกพื้นที่ให้บริการ');

    // เส้นทางสำรองต้องเริ่มและจบใกล้ต้นทางปลายทางจริง ไม่งั้นตอนออฟไลน์จะลากเส้นไปคนละที่
    if (isInServiceArea(route.origin) && haversineMeters(fallback[0], route.origin) > 1000) {
      problem('จุดแรกของ fallbackCoordinates ห่างต้นทางเกิน 1 กม.');
    }
    const last = fallback[fallback.length - 1];
    if (isInServiceArea(route.destination) && haversineMeters(last, route.destination) > 1000) {
      problem('จุดสุดท้ายของ fallbackCoordinates ห่างปลายทางเกิน 1 กม.');
    }
  });

  return errors;
}
