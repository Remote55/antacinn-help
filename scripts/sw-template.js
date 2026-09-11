/**
 * Service worker ของ AntacinnHelp — ให้เว็บแอปเปิดได้แม้ไม่มีอินเทอร์เน็ต
 *
 * ไฟล์นี้เป็นแม่แบบ: scripts/build-sw.mjs เติมรายการไฟล์และเวอร์ชัน แล้วเขียนเป็น dist/sw.js หลัง build เว็บ
 * (ชื่อไฟล์ JS ที่ Expo สร้างมี hash เปลี่ยนทุกครั้งที่แก้โค้ด จึงเขียนรายการไว้ล่วงหน้าไม่ได้)
 *
 * กลยุทธ์:
 *   ติดตั้ง        เก็บไฟล์ทั้งหมดของแอปเวอร์ชันนี้ไว้ในเครื่อง (หน้าเว็บ JS รูป ไอคอน และ Leaflet)
 *   เปิดหน้าเว็บ   ขอจากเน็ตก่อน จะได้เวอร์ชันใหม่ทันทีที่ deploy ถ้าออฟไลน์หรือช้าเกิน 4 วินาทีใช้หน้าที่เก็บไว้
 *   ไฟล์ของแอป    ใช้ของที่เก็บไว้ (ชื่อไฟล์มี hash เนื้อหาไม่มีวันเปลี่ยน)
 *   อย่างอื่น      ไม่เก็บ ปล่อยผ่านไปที่เน็ตตามปกติ
 *     - แผ่นแผนที่ OpenStreetMap: นโยบายการใช้งานของ OSM ไม่อนุญาตให้แอปเก็บแผ่นแผนที่ไว้ใช้ออฟไลน์
 *     - OSRM และ Open-Meteo: เส้นทางและสภาพอากาศต้องเป็นค่าปัจจุบัน ค่าเก่าอันตรายกว่าไม่มีค่า
 *
 * ข้อมูลจุดเสี่ยงทั้งหมดอยู่ในไฟล์ JS ของแอปแล้ว ออฟไลน์จึงยังดูจุดเสี่ยง รายละเอียด คำแนะนำ
 * และวางแผนด้วยเส้นทางสำรองออฟไลน์ได้ครบ
 */

/* global self, caches, fetch, Request, Response, URL */

const VERSION = '__VERSION__';
/** ไฟล์ของแอป (ตำแหน่งเทียบกับไฟล์ sw.js) './' คือหน้าเว็บ */
const APP_FILES = __APP_FILES__;

/** GitHub Pages ใช้โดเมนร่วมกับ repo อื่นของเจ้าของ ชื่อ cache ต้องมีชื่อแอปนำหน้า จะได้ไม่ลบของแอปอื่น */
const CACHE_PREFIX = 'antacinn-help-';
const CACHE_NAME = CACHE_PREFIX + VERSION;

/** Leaflet ที่แผนที่บนเว็บโหลดจาก CDN (ต้องตรงกับ components/AppMap.web.js) */
const LEAFLET_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
];

/** เน็ตช้ากว่านี้ (สัญญาณอ่อนแถวชายหาดหรือบนเขา) เปิดหน้าที่เก็บไว้ก่อน */
const NAVIGATION_TIMEOUT_MS = 4000;

const SHELL_URL = new URL('./', self.location).href;
const APP_URLS = APP_FILES.map((file) => new URL(file, self.location).href);
const CACHED_URLS = new Set([...APP_URLS, ...LEAFLET_FILES]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // cache: 'reload' ข้าม cache ของเบราว์เซอร์ ไม่อย่างนั้นอาจได้หน้าเว็บรุ่นเก่า ที่อ้างถึงไฟล์ JS ที่ไม่มีแล้ว
      await cache.addAll(APP_URLS.map((url) => new Request(url, { cache: 'reload' })));
      // CDN ล่มก็ยังติดตั้งต่อ แอปใช้ออฟไลน์ได้ แค่แผนที่ไม่ขึ้น
      await cache.addAll(LEAFLET_FILES).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // ลบไฟล์ของเวอร์ชันก่อน ๆ
      const names = await caches.keys();
      const oldNames = names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME);
      await Promise.all(oldNames.map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(openPage(request));
  } else if (CACHED_URLS.has(request.url)) {
    event.respondWith(cacheFirst(request));
  }
  // นอกนั้นไม่ตอบเอง เบราว์เซอร์ส่งไปที่เน็ตตามปกติ
});

async function openPage(request) {
  try {
    const response = await withTimeout(fetch(request), NAVIGATION_TIMEOUT_MS);
    // เซิร์ฟเวอร์ตอบผิดพลาด (เช่น ระหว่าง deploy) ใช้หน้าที่เก็บไว้ถ้ามี
    if (response.ok) return response;
    return (await caches.match(SHELL_URL, { cacheName: CACHE_NAME })) || response;
  } catch (error) {
    return (await caches.match(SHELL_URL, { cacheName: CACHE_NAME })) || Response.error();
  }
}

async function cacheFirst(request) {
  return (await caches.match(request, { cacheName: CACHE_NAME })) || fetch(request);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('หมดเวลา')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
