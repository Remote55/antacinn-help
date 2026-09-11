/**
 * ไฟล์นี้ไม่ถูกใช้ตอนรันจริง
 *
 * Metro และ Snack เลือกไฟล์ตามแพลตฟอร์มก่อนเสมอ:
 *   เว็บ          → AppMap.web.js     (Leaflet)
 *   Android / iOS → AppMap.native.js  (react-native-maps)
 *
 * มีไว้เพราะตัวตรวจโค้ดในหน้าแก้ไขของ Snack ไม่รู้จักไฟล์แยกแพลตฟอร์ม
 * ถ้าไม่มีไฟล์นี้ Snack จะขึ้นแถบแดงว่า "Cannot find file '../components/AppMap'"
 * ทั้งที่แอปรันได้ปกติ (ตรวจกับโค้ด runtime ของ Snack แล้ว: packages/snack-runtime/src/Modules.tsx)
 *
 * ชี้ไปที่เวอร์ชันเว็บ เพราะถ้าเครื่องมือไหนหยิบไฟล์นี้ไปใช้จริง
 * เวอร์ชันเว็บมีข้อความบอกผู้ใช้เมื่อแสดงแผนที่ไม่ได้ ส่วน react-native-maps พังทันทีบนเว็บ
 */
export { default } from './AppMap.web';
