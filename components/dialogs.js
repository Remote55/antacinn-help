/**
 * กล่องข้อความและกล่องยืนยัน ที่ใช้ได้ทั้งมือถือและเว็บ
 *
 * ทำไมต้องมี: Alert.alert ของ react-native-web เป็นฟังก์ชันว่าง ไม่ทำอะไรเลย
 * (ดู node_modules/react-native-web/dist/exports/Alert/index.js)
 * บนเว็บข้อความเตือนทุกอันจึงหายเงียบ และปุ่มที่ต้องกดยืนยันก่อน เช่น ปุ่มลบ จะใช้ไม่ได้เลย
 *
 * วิธีแก้: บนเว็บใช้ window.alert / window.confirm ของเบราว์เซอร์ บนมือถือใช้ Alert.alert ตามเดิม
 */

import { Alert, Platform } from 'react-native';

function joinText(title, message) {
  return message ? `${title}\n\n${message}` : title;
}

/** แจ้งข้อความ มีปุ่มตกลงปุ่มเดียว */
export function showMessage(title, message) {
  if (Platform.OS === 'web') {
    window.alert(joinText(title, message));
    return;
  }
  Alert.alert(title, message);
}

/**
 * ถามยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้ เช่น ลบข้อมูล
 * @param options.onConfirm เรียกเมื่อผู้ใช้กดยืนยันเท่านั้น
 */
export function confirmAction({ title, message, confirmLabel, onConfirm }) {
  if (Platform.OS === 'web') {
    if (window.confirm(joinText(title, message))) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
