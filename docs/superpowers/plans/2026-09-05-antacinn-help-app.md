# AntacinnHelp Implementation Plan

> **หมายเหตุ (2026-09-11):** ค่าในไฟล์ข้อมูล (`riskPoints.json`, `presetRoutes.json`) ของแผนนี้ถูกแก้ในระยะที่ 2 แล้ว
> พิกัดเดิมในแผนนี้คลาดสูงสุด 11 กม. ให้ถือไฟล์ใน repo เป็นค่าจริง ดูที่มาใน `data/SOURCES.md`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างแอปพลิเคชัน React Native (Expo SDK 54) ที่แสดงจุดเสี่ยงอุบัติเหตุในหาดใหญ่/เมืองสงขลาบนแผนที่ พร้อมวางแผนเส้นทาง เตือนอัตโนมัติด้วย GPS และบันทึกจุดเสี่ยงเอง โดยรันได้จริงทั้งบนมือถือ (Expo Go) และบนเว็บ (Snack Web)

**Architecture:** แบ่งเป็น 4 ชั้นชัดเจน — (1) `utils/` คณิตศาสตร์บริสุทธิ์ ไม่พึ่ง React ทดสอบด้วย `node --test` ได้ 100% (2) `hooks/` จัดการ state, GPS, storage (3) `components/` UI ที่ใช้ซ้ำ รวมถึง `AppMap` ที่แยกไฟล์ตามแพลตฟอร์ม (4) `screens/` ประกอบร่าง หัวใจของการรองรับ 2 แพลตฟอร์มคือ `AppMap.native.js` (react-native-maps) กับ `AppMap.web.js` (Leaflet ผ่าน CDN) ที่รับ props ชุดเดียวกันเป๊ะ ทำให้ทุกหน้าจอเขียนโค้ดครั้งเดียวใช้ได้ทั้งสองที่

**Tech Stack:** JavaScript · React Native · Expo SDK 54 · react-native-maps 1.20.1 (native) · Leaflet 1.9.4 (web) · expo-location · @react-navigation (native-stack + bottom-tabs) · AsyncStorage · OSRM public API

---

## ผลการตรวจสอบทางเทคนิคที่ยืนยันแล้ว (ห้ามเปลี่ยนโดยไม่ตรวจซ้ำ)

ทุกข้อด้านล่างผ่านการตรวจสอบจริงเมื่อ 2026-09-05 ไม่ใช่การคาดเดา

| # | ข้อเท็จจริง | หลักฐาน |
|---|---|---|
| 1 | Snack ใช้ **Expo SDK 54** เป็นค่าเริ่มต้น (เลือกได้ v50–v55) | เปิด snack.expo.dev อ่าน dropdown |
| 2 | `react-native-maps` คู่ SDK 54 คือ **1.20.1** และ **Included in Expo Go** | docs.expo.dev/versions/v54.0.0/sdk/map-view |
| 3 | `react-native-maps` **ไม่รองรับ web** — Snack เว็บจะพัง `Unable to fetch module snackager-1/react-native-maps for web` | ไม่มีป้าย Web ในเอกสาร + รายงานผู้ใช้จริง |
| 4 | `.web.js` / `.native.js` platform extensions **ใช้ได้ใน Metro/Snack** | เอกสาร Expo platform-specific modules |
| 5 | **react-native-web + `<div>` ดิบ + Leaflet CDN ทำงานได้จริง** | ทดสอบจริง: เรนเดอร์ tile OSM ของหาดใหญ่-สงขลา, หมุดสี, polyline, กดหมุดแล้ว React state อัปเดต, 0 console error |
| 6 | `expo-location` รองรับ Android/iOS/**Web** ครบ, `watchPositionAsync` มี `distanceInterval` (เมตร) | docs.expo.dev/versions/v54.0.0/sdk/location |
| 7 | Expo Go **ไม่รองรับ background location service** บน Android — แต่ foreground ใช้ได้ปกติ | เอกสาร Expo (ไม่กระทบ scope เพราะโหมดเดินทางเปิดแอปค้างไว้) |
| 8 | **OSRM ฟรี ไม่ต้องใช้ API key** | ยิงจริง: ม.อ.หาดใหญ่ → หาดสมิหลา = 28,394 ม. / 1,871 วิ / 471 พิกัด |

### การถอดสมการคะแนนความเสี่ยงจากม็อกอัพ (สำคัญมาก)

เอกสารไม่ได้ระบุค่า `N_max`, `f_season`, `f_time` แต่ถอดกลับจากตัวเลขในม็อกอัพได้:

- "ทางขึ้นเขาคอหงส์" มี บาดเจ็บสาหัส 2 + บาดเจ็บเล็กน้อย 3 → ผลรวมถ่วงน้ำหนัก = (2×3) + (3×1) = **9**
- ม็อกอัพแสดง "เสี่ยง **43**" ในช่วงเวลา 17:00–20:00 และ peakMonths = "ตลอดทั้งปี"
- แก้สมการ: (9 / **30**) × 100 × **1.3** × **1.1** = 30 × 1.43 = 42.9 → ปัดเป็น **43** ✓

**ล็อกค่าเหล่านี้:** `N_MAX = 30`, `SEASON_FACTOR = 1.3`, `TIME_FACTOR = 1.1`

ตรวจสอบยันกับม็อกอัพจุดอื่น:
- "ย่านสถานบันเทิงถนนนิพัทธ์อุทิศ 3" = **0** (ยังไม่ยืนยัน, ไม่มีสถิติ) → 0/30 × 100 = 0 ✓
- "ถนนลพบุรีราเมศวร์" = **100** → โดน clamp ที่เพดาน ✓

---

## การแก้ปัญหาที่พบในเอกสารต้นฉบับ

| ปัญหา | การแก้ในแผนนี้ |
|---|---|
| สมการ `× f_season × f_time` ทำให้คะแนนทะลุ 100 ได้ | ใส่ `clamp(0, 100)` ทุกครั้ง |
| `N_max` = "ค่าสูงสุดที่พบในชุดข้อมูล" → เพิ่มจุดใหม่แล้วคะแนนทุกจุดเปลี่ยนหมด เทียบข้ามเวลาไม่ได้ | ตรึงเป็นค่าคงที่ `N_MAX = 30` |
| บทที่ 4 เขียน "4 หน้า" แต่ลิสต์มา 5 | ตีความเป็น **4 แท็บล่าง + 2 หน้า push** = 6 หน้าจอ ตรงกับม็อกอัพ |
| schema มีฟิลด์ `riskScore: 0` พร้อมคอมเมนต์ "คำนวณตอนรันไทม์" | **ตัดออกจาก JSON** คำนวณตอนรันไทม์อย่างเดียว กัน state ซ้ำซ้อน |
| schema ไม่มีฟิลด์อำเภอ แต่ม็อกอัพแสดง "หาดใหญ่ · อุบัติเหตุรถ" | **เพิ่มฟิลด์ `district`** |
| ไม่ระบุว่าเข้า "โหมดเดินทาง" จากไหน | เข้าจากปุ่มในหน้าวางแผนเส้นทาง |

---

## หลักการเขียนโค้ดของโปรเจคนี้

1. **คอมเมนต์ภาษาไทย ชื่อตัวแปร/ฟังก์ชันภาษาอังกฤษ** — เพื่อนในทีมอ่านรู้เรื่อง อาจารย์ตรวจง่าย
2. **ทุกไฟล์ขึ้นต้นด้วยคอมเมนต์บล็อกบอกว่าไฟล์นี้ทำอะไร** และใครควรมาแก้
3. **`utils/` ห้าม import React หรือ react-native เด็ดขาด** — เพื่อให้ทดสอบด้วย Node ล้วนได้
4. **ห้าม hardcode ตัวเลขวิเศษในหน้าจอ** — ทุกค่าคงที่อยู่ใน `constants/config.js`
5. **ห้ามใช้สีเขียวแทนความปลอดภัย** — ตามข้อกำหนดจริยธรรมในเอกสาร
6. **commit บ่อย ๆ** ทุกครั้งที่ test ผ่าน

---

## โครงสร้างไฟล์

```
App.js                              จุดเริ่มต้น ครอบ SafeArea + NavigationContainer
package.json                        ประกาศ dependency ให้ Snack อ่าน

constants/
  config.js                         ค่าคงที่ทั้งหมด (300/500/800/50 ม., N_MAX, สี, ตัวคูณ)
  theme.js                          สี ระยะห่าง ขนาดฟอนต์

data/
  riskPoints.json                   ข้อมูลจุดเสี่ยง (โครงพร้อมกรอก)
  presetRoutes.json                 เส้นทางสำรองออฟไลน์

utils/                              *** ห้าม import react ***
  geo.js                            haversine, distanceToSegment, bounding box
  riskScore.js                      คำนวณคะแนน 0-100 + ระดับ + สี
  routeAnalysis.js                  หาจุดเสี่ยงใกล้เส้นทาง + เรียงตามระยะสะสม
  tripAlerts.js                     ตรรกะกันเตือนซ้ำ (pure function)
  routing.js                        เรียก OSRM + fallback ออฟไลน์
  format.js                         จัดรูปแบบระยะทาง/เวลา/ปี พ.ศ.

hooks/
  useRiskPoints.js                  รวมข้อมูล JSON + จุดที่ผู้ใช้บันทึก + คำนวณคะแนน
  useUserLocation.js                ขอสิทธิ์ + ติดตาม GPS
  useSavedPoints.js                 AsyncStorage CRUD
  useTripMode.js                    รวม GPS + tripAlerts เป็นสถานะโหมดเดินทาง

components/
  AppMap.native.js                  แผนที่บนมือถือ (react-native-maps)
  AppMap.web.js                     แผนที่บนเว็บ (Leaflet CDN)
  RiskBadge.js                      ป้ายสี "เสี่ยง · 43"
  RiskPointCard.js                  การ์ดจุดเสี่ยงในลิสต์
  FilterChips.js                    ชิปกรองประเภทอันตราย
  Disclaimer.js                     ข้อความปฏิเสธความรับผิดชอบ
  EmergencyButton.js                ปุ่มโทร 1669
  ScreenHeader.js                   หัวข้อสีกรมท่า

screens/
  HomeScreen.js                     หน้าแรก
  MapScreen.js                      แผนที่เต็มจอ
  RoutePlannerScreen.js             วางแผนเส้นทาง
  SavePointScreen.js                บันทึกจุดเสี่ยง
  RiskDetailScreen.js               รายละเอียดจุด (push)
  TripModeScreen.js                 โหมดเดินทาง (push)

navigation/
  RootNavigator.js                  Stack ครอบ BottomTabs

tests/                              รันด้วย node --test (ไม่ต้องอัปขึ้น Snack)
  geo.test.js
  riskScore.test.js
  routeAnalysis.test.js
  tripAlerts.test.js
  format.test.js
```

**การแบ่งงาน 4 คน (ลดโอกาส merge conflict):**

| คน | ไฟล์ที่ถือ |
|---|---|
| A | `utils/` ทั้งโฟลเดอร์ + `tests/` — งานคณิตศาสตร์ล้วน เริ่มได้ทันทีไม่ต้องรอใคร |
| B | `components/AppMap.*` + `MapScreen` + `RoutePlannerScreen` — งานแผนที่ |
| C | `hooks/` + `TripModeScreen` + `SavePointScreen` — งาน GPS/storage |
| D | `constants/` + `data/` + `HomeScreen` + `RiskDetailScreen` + `components/` ที่เหลือ — งาน UI/ข้อมูล |

---

## Task 0: ตั้งโปรเจคและ package.json

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: สร้าง package.json ล็อกเวอร์ชันให้ตรงกับ Expo SDK 54**

`package.json`:

```json
{
  "name": "antacinn-help",
  "version": "1.0.0",
  "description": "แอปแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว หาดใหญ่-เมืองสงขลา",
  "main": "expo/AppEntry.js",
  "scripts": {
    "test": "node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \"tests/*.test.js\""
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-location": "~19.0.7",
    "expo-status-bar": "~3.0.8",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4",
    "react-native-maps": "1.20.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "^0.21.0",
    "@react-navigation/native": "^7.1.6",
    "@react-navigation/native-stack": "^7.3.10",
    "@react-navigation/bottom-tabs": "^7.3.10",
    "@react-native-async-storage/async-storage": "2.2.0"
  }
}
```

> **หมายเหตุเรื่องเวอร์ชัน:** ถ้า Snack แจ้งเตือนว่าเวอร์ชันไหนไม่ตรง ให้กดปุ่มที่ Snack แนะนำเพื่อแก้อัตโนมัติ — Snack รู้เวอร์ชันที่ถูกต้องของ SDK ตัวเองเสมอ
>
> **`"main"` ต้องเป็น `expo/AppEntry.js` เท่านั้น ห้ามเขียนเป็น `App.js`:**
> นี่คือบั๊กที่เจ็บที่สุดเพราะ **ไม่มี error ให้เห็นเลย** — หน้าจอขาวเปล่า console ก็สะอาด
> สาเหตุ: ไฟล์ `App.js` แค่ `export default` คอมโพเนนต์ออกมาเฉย ๆ
> ต้องมีใครสักคนเรียก `registerRootComponent(App)` เพื่อบอก React Native ว่าให้เอาไปวาด
> คนที่เรียกให้คือ `node_modules/expo/AppEntry.js` ซึ่งมีแค่ 3 บรรทัด:
> ```js
> import registerRootComponent from 'expo/src/launch/registerRootComponent';
> import App from '../../App';
> registerRootComponent(App);
> ```
> ถ้าชี้ `main` ไปที่ `App.js` ตรง ๆ ขั้นตอนนี้จะถูกข้าม บันเดิลโหลดสำเร็จ 200 OK
> `<div id="root">` มีอยู่จริงขนาดเต็มจอ แต่ข้างในว่างเปล่า (0 children)
> (เจอจริงตอนเปิดดูในเบราว์เซอร์เมื่อ 2026-09-06 — ตอนแรกแผนนี้เขียนผิดเป็น `App.js`)
>
> **`react-dom` กับ `react-native-web` ห้ามลืม:** สองตัวนี้คือสิ่งที่ทำให้แอปรันบนเว็บได้
> ถ้าไม่ประกาศไว้ คำสั่ง `npx expo export --platform web` จะขึ้น
> `CommandError: It looks like you're trying to use web support but don't have the required dependencies installed`
> (เจอจริงตอนทดสอบ build เมื่อ 2026-09-06 — ตอนแรกแผนนี้ลืมใส่ทั้งสองตัว)
>
> **หมายเหตุเรื่องคำสั่ง test:** ต้องเขียนเป็น `"tests/*.test.js"` แบบมีเครื่องหมายคำพูด ห้ามเขียนเป็น `tests/`
> เพราะบน Windows คำสั่ง `node --test tests/` จะขึ้น `Cannot find module ... \tests` (ทดสอบแล้วเมื่อ 2026-09-05)
> ส่วน `--disable-warning=...` มีไว้ปิดคำเตือนของ Node เรื่องไฟล์ ESM ที่ไม่ได้ประกาศ `"type": "module"`
> เราจงใจไม่ใส่ `"type": "module"` ใน package.json เพราะอาจไปกวน Metro ของ Expo

- [ ] **Step 2: สร้าง .gitignore**

`.gitignore`:

```
node_modules/
.expo/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.DS_Store
```

- [ ] **Step 3: สร้าง app.json ตั้งค่าแอปและขอสิทธิ์ตำแหน่ง**

> **ทำไมไฟล์นี้สำคัญ ห้ามข้าม:** ข้อความขอสิทธิ์ตำแหน่งของ iOS
> (`NSLocationWhenInUseUsageDescription`) เป็นสิ่งที่ iOS **บังคับ**
> ถ้าไม่ใส่ iOS จะปฏิเสธการขอตำแหน่งแบบเงียบ ๆ ไม่มี error ให้เห็น
> แปลว่าโหมดเดินทางจะไม่ทำงานเลยบน iPhone จริง โดยที่หาสาเหตุไม่เจอ
>
> บน Snack ไฟล์นี้ไม่จำเป็น (Snack มีของตัวเอง) แต่ตอนรันในเครื่องหรือ build จริงต้องมี

`app.json`:

```json
{
  "expo": {
    "name": "AntacinnHelp",
    "slug": "antacinn-help",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "platforms": ["ios", "android", "web"],
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#1B3A5C"
    },
    "assetBundlePatterns": ["**/*"],

    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "AntacinnHelp ใช้ตำแหน่งของคุณเพื่อเตือนเมื่อกำลังเข้าใกล้จุดเสี่ยง และเพื่อแสดงตำแหน่งคุณบนแผนที่"
      }
    },

    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#1B3A5C"
      },
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    },

    "web": {
      "bundler": "metro"
    },

    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "AntacinnHelp ใช้ตำแหน่งของคุณเพื่อเตือนเมื่อกำลังเข้าใกล้จุดเสี่ยง"
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: สร้าง README.md บอกวิธีรัน**

`README.md`:

````markdown
# AntacinnHelp

แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา

รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569

## วิธีรัน

### บนมือถือ (แนะนำ — แผนที่สมบูรณ์ที่สุด)
1. ติดตั้งแอป **Expo Go** จาก Play Store / App Store
2. เปิด Snack ของโปรเจค แล้วสแกน QR code

### บนเว็บ
กดแท็บ **Web** ใน Snack ได้เลย — แผนที่จะใช้ Leaflet แทน react-native-maps โดยอัตโนมัติ

### รันเทสต์คณิตศาสตร์ (บนเครื่อง ไม่ต้องใช้ Snack)
```bash
npm test
```

## โครงสร้าง
- `utils/` — คณิตศาสตร์ล้วน ไม่พึ่ง React ทดสอบได้ 100%
- `hooks/` — GPS, storage, state
- `components/` — UI ใช้ซ้ำ
- `screens/` — หน้าจอ
````

- [ ] **Step 4: Commit**

```bash
git init
git add package.json .gitignore README.md
git commit -m "chore: ตั้งโปรเจค AntacinnHelp พร้อม dependency สำหรับ Expo SDK 54"
```

---

## Task 1: ค่าคงที่และธีม

**Files:**
- Create: `constants/config.js`
- Create: `constants/theme.js`

- [ ] **Step 1: สร้าง constants/config.js**

ทุกตัวเลขวิเศษของทั้งแอปอยู่ที่นี่ที่เดียว แก้ที่นี่แล้วเปลี่ยนทั้งระบบ

`constants/config.js`:

```javascript
/**
 * ค่าคงที่ทั้งหมดของแอป
 *
 * ตัวเลขทุกตัวที่มีผลต่อพฤติกรรมของระบบต้องอยู่ในไฟล์นี้เท่านั้น
 * ห้ามเขียนตัวเลขวิเศษ (magic number) กระจายในหน้าจอ
 * ค่าเหล่านี้เป็นค่าเริ่มต้น จะปรับหลังทดสอบภาคสนามจริง (ตามเอกสารบทที่ 5.3)
 */

/** ระยะทางต่าง ๆ หน่วยเป็นเมตร */
export const DISTANCE = {
  /** จุดเสี่ยงที่ห่างจากเส้นทางไม่เกินนี้ ถือว่า "อยู่บนเส้นทาง" */
  ON_ROUTE_THRESHOLD: 300,
  /** เข้าใกล้จุดเสี่ยงเท่านี้ เริ่มเตือน (ให้เวลาตอบสนอง 20-30 วินาที) */
  ALERT_TRIGGER: 500,
  /** ออกห่างเกินนี้ ล้างสถานะเตือน เพื่อไม่ให้เตือนซ้ำตอน GPS แกว่ง */
  ALERT_RESET: 800,
  /** ขยับเกินนี้ GPS ถึงจะอัปเดต (ประหยัดแบตเตอรี่) */
  MIN_MOVEMENT_UPDATE: 50,
  /** รัศมีกรองหยาบ ๆ ด้วยกรอบสี่เหลี่ยม ก่อนคำนวณ Haversine จริง */
  BOUNDING_BOX_FILTER: 2000,
};

/** น้ำหนักความรุนแรงของเหตุการณ์ (ตามเอกสารบทที่ 5.4) */
export const SEVERITY_WEIGHTS = {
  fatal: 5,    // เสียชีวิต
  serious: 3,  // บาดเจ็บสาหัส
  minor: 1,    // บาดเจ็บเล็กน้อย
};

/** ป้ายภาษาไทยของความรุนแรง ใช้แสดงในตารางสถิติ */
export const SEVERITY_LABELS = {
  fatal: 'เสียชีวิต',
  serious: 'บาดเจ็บสาหัส',
  minor: 'บาดเจ็บเล็กน้อย',
};

/**
 * ค่าถ่วงสูงสุดที่ใช้ปรับสเกลคะแนนให้อยู่ในช่วง 0-100
 *
 * สำคัญ: ตรึงเป็นค่าคงที่ ไม่ใช้ "ค่าสูงสุดที่พบในชุดข้อมูล"
 * เพราะถ้าใช้ค่าจากชุดข้อมูล พอเพิ่มจุดใหม่ที่รุนแรงกว่าเข้าไปเพียงจุดเดียว
 * คะแนนของ "ทุกจุด" ที่เหลือจะเปลี่ยนตามไปหมด ทำให้เทียบข้ามช่วงเวลาไม่ได้
 */
export const N_MAX = 30;

/** ตัวคูณปรับคะแนนตามบริบท (ถอดค่ามาจากม็อกอัพในเอกสารหน้า 7) */
export const CONTEXT_FACTORS = {
  /** อยู่ในเดือนที่เสี่ยงสูง */
  SEASON_PEAK: 1.3,
  /** อยู่ในช่วงเวลาที่เสี่ยงสูง */
  TIME_PEAK: 1.1,
  /** ไม่อยู่ในช่วงเสี่ยง = ไม่ปรับ */
  NONE: 1.0,
};

/**
 * ระดับความเสี่ยง 3 ระดับ
 *
 * สำคัญ: ห้ามมีสีเขียวเด็ดขาด
 * เพราะถ้าผู้ใช้เห็นสีเขียวจะเข้าใจว่า "ปลอดภัย"
 * แต่ความจริงคือ "ยังไม่มีข้อมูลในระบบ" ซึ่งไม่เหมือนกัน
 */
export const RISK_LEVELS = [
  { id: 'watch',    label: 'เฝ้าระวัง',   min: 0,  max: 39,  color: '#FBC02D' }, // เหลือง
  { id: 'risky',    label: 'เสี่ยง',      min: 40, max: 69,  color: '#F57C00' }, // ส้ม
  { id: 'critical', label: 'อันตรายมาก',  min: 70, max: 100, color: '#D32F2F' }, // แดง
];

/** ประเภทอันตราย ใช้ทั้งในตัวกรองและในฟอร์มบันทึกจุด */
export const HAZARD_TYPES = [
  { id: 'drowning', label: 'จมน้ำ',       icon: '🌊' },
  { id: 'crash',    label: 'อุบัติเหตุรถ', icon: '🚗' },
  { id: 'fall',     label: 'ลื่น/ตก',      icon: '⛰️' },
  { id: 'crime',    label: 'อาชญากรรม',   icon: '👤' },
];

/** หมวดของจุดเสี่ยง */
export const CATEGORIES = {
  DESTINATION: 'destination', // จุดเสี่ยงที่ปลายทาง เช่น ชายหาด น้ำตก
  ROAD: 'road',               // จุดเสี่ยงบนเส้นทาง เช่น โค้งอันตราย แยก
};

/** เบอร์ฉุกเฉินที่ใช้เป็นค่าเริ่มต้นทุกจุด */
export const DEFAULT_EMERGENCY = { label: 'หน่วยกู้ภัย / การแพทย์ฉุกเฉิน', tel: '1669' };

/** บริการหาเส้นทาง OSRM (ฟรี ไม่ต้องใช้ API key — ตรวจสอบแล้วใช้ได้จริง) */
export const OSRM = {
  BASE_URL: 'https://router.project-osrm.org/route/v1/driving',
  /** ถ้าเกินเวลานี้ถือว่าล้มเหลว แล้วสลับไปใช้เส้นทางสำรองออฟไลน์ */
  TIMEOUT_MS: 8000,
};

/** ตำแหน่งเริ่มต้นของแผนที่ = กึ่งกลางระหว่างหาดใหญ่กับเมืองสงขลา */
export const DEFAULT_REGION = {
  latitude: 7.1,
  longitude: 100.55,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** คีย์ที่ใช้เก็บข้อมูลใน AsyncStorage */
export const STORAGE_KEYS = {
  SAVED_POINTS: '@antacinn/saved_points',
};

/** ข้อความปฏิเสธความรับผิดชอบ (ตามเอกสารข้อ 7.4) */
export const DISCLAIMER_TEXT =
  'แอปนี้ไม่ใช่ระบบเตือนภัยอย่างเป็นทางการ และไม่สามารถครอบคลุมอันตรายได้ทุกรูปแบบ ' +
  'ข้อมูลในแอปเป็นเพียงเครื่องมือประกอบการตัดสินใจ ' +
  'ผู้ใช้ยังต้องประเมินความปลอดภัยจากสภาพแวดล้อมจริงด้วยตนเองเสมอ';

/** ข้อความเตือนสำหรับจุดที่ยังไม่ได้ยืนยันแหล่งที่มา */
export const UNVERIFIED_TEXT =
  'ข้อมูลจุดนี้ยังไม่ได้ยืนยันจากเอกสารทางการ อาจมาจากการสอบถามผู้อยู่ในพื้นที่หรือรายงานข่าว ' +
  'โปรดใช้ประกอบการตัดสินใจอย่างระมัดระวัง';
```

- [ ] **Step 2: สร้าง constants/theme.js**

`constants/theme.js`:

```javascript
/**
 * ธีมของแอป — สี ระยะห่าง ขนาดตัวอักษร
 *
 * แยกจาก config.js เพราะไฟล์นี้เกี่ยวกับ "หน้าตา" อย่างเดียว
 * ส่วน config.js เกี่ยวกับ "พฤติกรรม" ของระบบ
 */

export const COLORS = {
  /** สีกรมท่า ใช้เป็นสีหลักของแบรนด์ (จากม็อกอัพ) */
  primary: '#1B3A5C',
  primaryDark: '#12283F',

  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#E1E5EA',

  text: '#1A1A1A',
  textMuted: '#6B7280',

  /** สีเตือน ใช้กับแถบ disclaimer และป้าย "ยังไม่ยืนยัน" */
  warningBackground: '#FEF6DC',
  warningBorder: '#F0C33C',

  danger: '#D32F2F',
  white: '#FFFFFF',
};

/** ระยะห่างมาตรฐาน ใช้คูณเป็นเท่า ๆ เพื่อให้เลย์เอาต์สม่ำเสมอ */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZES = {
  small: 13,
  body: 15,
  subtitle: 17,
  title: 20,
  heading: 24,
  /** ใหญ่พิเศษ ใช้เฉพาะโหมดเดินทาง เพราะผู้ใช้กำลังขับรถ ต้องอ่านได้ใน 1 วินาที */
  alert: 28,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};
```

- [ ] **Step 3: Commit**

```bash
git add constants/
git commit -m "feat: เพิ่มค่าคงที่และธีมของแอป"
```

---

## Task 2: โครงสร้างข้อมูลจุดเสี่ยง

**Files:**
- Create: `data/riskPoints.json`
- Create: `data/presetRoutes.json`

> **สำคัญมาก:** ตัวเลขสถิติทุกตัวในไฟล์นี้เป็น **โครงว่างรอกรอก** ไม่ใช่ข้อมูลจริง
> ทุกจุดตั้ง `verified: false` และ `source` เขียนชัดว่ายังไม่ได้กรอก
> ตามกฎในเอกสารบทที่ 6.3: **ห้ามบันทึกตัวเลขสถิติที่ปราศจากแหล่งอ้างอิง**
> พิกัดเป็นค่าโดยประมาณของสถานที่จริง ต้องยืนยันอีกครั้งตอนลงพื้นที่ (Fieldwork)
>
> **กติกาการตั้ง `id`:** ขึ้นต้นด้วยตัวย่ออำเภอ แล้วตามด้วยชื่อสถานที่และลำดับ
> - `hy-` = อำเภอหาดใหญ่ · `sk-` = อำเภอเมืองสงขลา · `user-` = จุดที่ผู้ใช้บันทึกเอง
> - **คำนำหน้าต้องตรงกับฟิลด์ `district` เสมอ** ถ้าไม่ตรงแปลว่ามีจุดใดจุดหนึ่งผิด
> - เช่น มหาวิทยาลัยราชภัฏสงขลาอยู่ใน อ.เมืองสงขลา จึงต้องใช้ `sk-` ไม่ใช่ `hy-`

- [ ] **Step 1: สร้าง data/riskPoints.json**

`data/riskPoints.json`:

```json
[
  {
    "id": "hy-lopburi-01",
    "name": "ถนนลพบุรีราเมศวร์ ช่วงเลี่ยงเมืองหาดใหญ่",
    "category": "road",
    "type": "crash",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0300, "lng": 100.4600 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "sk-kanjanavanit-01",
    "name": "ถนนกาญจนวนิช หน้ามหาวิทยาลัยราชภัฏสงขลา",
    "category": "road",
    "type": "crash",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.1780, "lng": 100.6070 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-khokhohong-01",
    "name": "ทางขึ้นเขาคอหงส์",
    "category": "road",
    "type": "crash",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0060, "lng": 100.5010 },
    "incidents": [
      { "year": 2566, "severity": "serious", "count": 2, "note": "ตัวอย่างรูปแบบข้อมูล — รอแทนที่ด้วยข้อมูลจริง" },
      { "year": 2565, "severity": "minor",   "count": 3, "note": "ตัวอย่างรูปแบบข้อมูล — รอแทนที่ด้วยข้อมูลจริง" }
    ],
    "peakMonths": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "peakHours": [17, 18, 19, 20],
    "advice": [
      "ใช้เกียร์ต่ำขณะลงเขา อย่าเหยียบเบรกค้าง",
      "ระวังโค้งหักศอกที่มองไม่เห็นรถสวน",
      "หลีกเลี่ยงการขึ้นลงในเวลากลางคืนเพราะแสงสว่างจำกัด"
    ],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ ตัวเลขเป็นตัวอย่างรูปแบบเท่านั้น รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-mandarin-01",
    "name": "แยกแมนดาริน ถนนประชาธิปัตย์ ตัดถนนนิพัทธ์อุทิศ",
    "category": "road",
    "type": "crash",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0090, "lng": 100.4720 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-niphat3-01",
    "name": "ย่านสถานบันเทิงถนนนิพัทธ์อุทิศ 3",
    "category": "road",
    "type": "crime",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0080, "lng": 100.4740 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "sk-smila-01",
    "name": "หาดสมิหลา โซนหน้ารูปนางเงือก",
    "category": "destination",
    "type": "drowning",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.1975, "lng": 100.5960 },
    "incidents": [],
    "peakMonths": [11, 12, 1],
    "peakHours": [16, 17, 18],
    "advice": [
      "ว่ายน้ำเฉพาะในเขตธงแดง-เหลือง",
      "หลีกเลี่ยงการลงน้ำช่วงคลื่นสูงในฤดูมรสุม"
    ],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "sk-samila-cape-01",
    "name": "แหลมสมิหลา บริเวณโขดหิน",
    "category": "destination",
    "type": "fall",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.2050, "lng": 100.5930 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-tonngachang-01",
    "name": "น้ำตกโตนงาช้าง",
    "category": "destination",
    "type": "fall",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 6.9530, "lng": 100.3330 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-kimyong-01",
    "name": "ตลาดกิมหยง ถนนเสน่หานุสรณ์",
    "category": "destination",
    "type": "crime",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0090, "lng": 100.4750 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "hy-psu-gate-01",
    "name": "ประตูทางออก ม.สงขลานครินทร์ ฝั่งถนนกาญจนวนิช",
    "category": "road",
    "type": "crash",
    "district": "หาดใหญ่",
    "coordinate": { "lat": 7.0086, "lng": 100.4980 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "sk-chalatat-01",
    "name": "หาดชลาทัศน์ ช่วงถนนเลียบชายหาด",
    "category": "destination",
    "type": "drowning",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.1830, "lng": 100.6020 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  },
  {
    "id": "sk-tinsulanon-01",
    "name": "สะพานติณสูลานนท์",
    "category": "road",
    "type": "crash",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.2170, "lng": 100.5410 },
    "incidents": [],
    "peakMonths": [],
    "peakHours": [],
    "advice": [],
    "emergency": [{ "label": "หน่วยกู้ภัย / การแพทย์ฉุกเฉิน", "tel": "1669" }],
    "source": "⚠️ รอกรอกข้อมูลจริง",
    "verified": false
  }
]
```

- [ ] **Step 2: สร้าง data/presetRoutes.json (เส้นทางสำรองตอนไม่มีเน็ต)**

`data/presetRoutes.json`:

```json
[
  {
    "id": "psu-to-samila",
    "label": "ม.อ.หาดใหญ่ → หาดสมิหลา",
    "origin": { "lat": 7.0086, "lng": 100.4980, "name": "ม.อ.หาดใหญ่" },
    "destination": { "lat": 7.1975, "lng": 100.5960, "name": "หาดสมิหลา" },
    "fallbackCoordinates": [
      { "lat": 7.0086, "lng": 100.4980 },
      { "lat": 7.0300, "lng": 100.5050 },
      { "lat": 7.0700, "lng": 100.5200 },
      { "lat": 7.1100, "lng": 100.5450 },
      { "lat": 7.1500, "lng": 100.5750 },
      { "lat": 7.1830, "lng": 100.6020 },
      { "lat": 7.1975, "lng": 100.5960 }
    ]
  },
  {
    "id": "psu-to-kimyong",
    "label": "ม.อ.หาดใหญ่ → ตลาดกิมหยง",
    "origin": { "lat": 7.0086, "lng": 100.4980, "name": "ม.อ.หาดใหญ่" },
    "destination": { "lat": 7.0090, "lng": 100.4750, "name": "ตลาดกิมหยง" },
    "fallbackCoordinates": [
      { "lat": 7.0086, "lng": 100.4980 },
      { "lat": 7.0088, "lng": 100.4880 },
      { "lat": 7.0090, "lng": 100.4750 }
    ]
  },
  {
    "id": "hatyai-to-tonngachang",
    "label": "หาดใหญ่ → น้ำตกโตนงาช้าง",
    "origin": { "lat": 7.0090, "lng": 100.4720, "name": "หาดใหญ่" },
    "destination": { "lat": 6.9530, "lng": 100.3330, "name": "น้ำตกโตนงาช้าง" },
    "fallbackCoordinates": [
      { "lat": 7.0090, "lng": 100.4720 },
      { "lat": 6.9950, "lng": 100.4300 },
      { "lat": 6.9750, "lng": 100.3800 },
      { "lat": 6.9530, "lng": 100.3330 }
    ]
  }
]
```

> **หมายเหตุ:** `fallbackCoordinates` เป็นเส้นหยาบ ๆ ใช้เฉพาะตอนไม่มีเน็ต
> ถ้ามีเน็ต ระบบจะดึงเส้นทางจริงจาก OSRM ที่ละเอียดกว่ามาก (471 จุดสำหรับเส้นทางแรก)
> ทีมสามารถอัปเดตให้ละเอียดขึ้นได้โดยรันสคริปต์ใน Task 20 Step 3

- [ ] **Step 3: Commit**

```bash
git add data/
git commit -m "feat: เพิ่มโครงข้อมูลจุดเสี่ยงและเส้นทางสำรอง (รอกรอกข้อมูลจริง)"
```

---

## Task 3: utils/geo.js — คณิตศาสตร์ระยะทาง (TDD)

**Files:**
- Create: `utils/geo.js`
- Test: `tests/geo.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

`tests/geo.test.js`:

```javascript
/**
 * เทสต์ของ utils/geo.js
 * รันด้วย: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineMeters,
  distanceToSegmentMeters,
  projectOnSegment,
  isInsideBoundingBox,
} from '../utils/geo.js';

/** ช่วยเช็คว่าตัวเลขใกล้เคียงกับที่คาดไว้ ภายในค่าคลาดเคลื่อนที่ยอมรับได้ */
function assertClose(actual, expected, toleranceMeters, message) {
  assert.ok(
    Math.abs(actual - expected) <= toleranceMeters,
    `${message}: ได้ ${actual} คาดว่า ${expected} (±${toleranceMeters})`
  );
}

test('haversineMeters: จุดเดียวกันต้องได้ระยะ 0', () => {
  const p = { lat: 7.0086, lng: 100.498 };
  assert.equal(haversineMeters(p, p), 0);
});

test('haversineMeters: ม.อ.หาดใหญ่ → หาดสมิหลา ได้ระยะเส้นตรงประมาณ 22 กม.', () => {
  const psu = { lat: 7.0086, lng: 100.498 };
  const samila = { lat: 7.1975, lng: 100.596 };
  // ระยะเส้นตรง (ไม่ใช่ระยะตามถนน 28.4 กม. ที่ OSRM คืนมา)
  assertClose(haversineMeters(psu, samila), 23600, 800, 'ระยะเส้นตรงหาดใหญ่-สงขลา');
});

test('haversineMeters: 1 องศาละติจูด ประมาณ 111 กม.', () => {
  const a = { lat: 7.0, lng: 100.5 };
  const b = { lat: 8.0, lng: 100.5 };
  assertClose(haversineMeters(a, b), 111195, 500, 'หนึ่งองศาละติจูด');
});

test('haversineMeters: สลับลำดับจุดต้องได้ระยะเท่าเดิม', () => {
  const a = { lat: 7.0086, lng: 100.498 };
  const b = { lat: 7.1975, lng: 100.596 };
  assert.equal(haversineMeters(a, b), haversineMeters(b, a));
});

test('distanceToSegmentMeters: จุดอยู่บนเส้นพอดี ต้องได้ 0', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const middle = { lat: 7.05, lng: 100.5 };
  assertClose(distanceToSegmentMeters(middle, start, end), 0, 1, 'จุดกลางเส้น');
});

test('distanceToSegmentMeters: จุดตั้งฉากกับกลางเส้น วัดระยะตั้งฉากได้ถูก', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  // ขยับไปทางตะวันออก 0.01 องศาลองจิจูด ที่ละติจูด 7 องศา ประมาณ 1,103 เมตร
  const aside = { lat: 7.05, lng: 100.51 };
  assertClose(distanceToSegmentMeters(aside, start, end), 1103, 60, 'ระยะตั้งฉาก');
});

test('distanceToSegmentMeters: จุดเลยปลายเส้นไป ต้องวัดจากปลายเส้น ไม่ใช่เส้นที่ยืดออกไป', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  // จุดนี้อยู่เหนือปลายเส้นขึ้นไปอีก — นี่คือเหตุผลที่ต้อง clamp ค่า t ให้อยู่ใน [0,1]
  const beyond = { lat: 7.2, lng: 100.5 };
  const expected = haversineMeters(beyond, end);
  assertClose(distanceToSegmentMeters(beyond, start, end), expected, 1, 'จุดเลยปลายเส้น');
});

test('distanceToSegmentMeters: จุดอยู่ก่อนจุดเริ่มต้น ต้องวัดจากจุดเริ่มต้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const before = { lat: 6.9, lng: 100.5 };
  const expected = haversineMeters(before, start);
  assertClose(distanceToSegmentMeters(before, start, end), expected, 1, 'จุดก่อนเส้น');
});

test('distanceToSegmentMeters: เส้นที่มีความยาวเป็นศูนย์ ต้องไม่หารด้วยศูนย์', () => {
  const p = { lat: 7.05, lng: 100.5 };
  const same = { lat: 7.0, lng: 100.5 };
  const result = distanceToSegmentMeters(p, same, same);
  assert.ok(Number.isFinite(result), 'ต้องไม่เป็น NaN หรือ Infinity');
  assertClose(result, haversineMeters(p, same), 1, 'ระยะถึงจุดเดี่ยว');
});

test('projectOnSegment: คืนค่า t บอกตำแหน่งบนเส้น 0 = ต้นเส้น 1 = ปลายเส้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };

  // จุดกึ่งกลางเส้น t ต้องเท่ากับ 0.5
  assertClose(projectOnSegment({ lat: 7.05, lng: 100.5 }, start, end).t, 0.5, 0.01, 't กึ่งกลาง');
  // จุดที่ปลายเส้นพอดี t ต้องเท่ากับ 1
  assertClose(projectOnSegment({ lat: 7.1, lng: 100.5 }, start, end).t, 1, 0.01, 't ปลายเส้น');
  // จุดที่ต้นเส้นพอดี t ต้องเท่ากับ 0
  assertClose(projectOnSegment({ lat: 7.0, lng: 100.5 }, start, end).t, 0, 0.01, 't ต้นเส้น');
});

test('projectOnSegment: จุดที่เลยปลายเส้นไป t ต้องถูกบีบไว้ที่ 1 ไม่เกินนั้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const beyond = { lat: 7.5, lng: 100.5 };
  assert.equal(projectOnSegment(beyond, start, end).t, 1);
});

test('isInsideBoundingBox: จุดใกล้ ๆ ต้องอยู่ในกรอบ', () => {
  const center = { lat: 7.0, lng: 100.5 };
  const near = { lat: 7.001, lng: 100.501 };
  assert.equal(isInsideBoundingBox(near, center, 2000), true);
});

test('isInsideBoundingBox: จุดไกลมากต้องอยู่นอกกรอบ', () => {
  const center = { lat: 7.0, lng: 100.5 };
  const far = { lat: 8.5, lng: 102.0 };
  assert.equal(isInsideBoundingBox(far, center, 2000), false);
});

test('isInsideBoundingBox: ต้องอยู่ในกรอบทั้งสองแกน ใกล้แค่แกนเดียวไม่พอ', () => {
  // เทสต์นี้มีไว้ดักกรณีเผลอเปลี่ยน && เป็น || ในโค้ด
  // ถ้าเทสต์วัดแต่ "ใกล้ทั้งสองแกน" กับ "ไกลทั้งสองแกน" จะจับบั๊กนี้ไม่ได้เลย
  const center = { lat: 7.0, lng: 100.5 };

  // ละติจูดตรงกัน แต่ลองจิจูดไกลมาก
  assert.equal(isInsideBoundingBox({ lat: 7.0, lng: 105.0 }, center, 2000), false);
  // ลองจิจูดตรงกัน แต่ละติจูดไกลมาก
  assert.equal(isInsideBoundingBox({ lat: 9.0, lng: 100.5 }, center, 2000), false);
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `node --test tests/geo.test.js`
Expected: FAIL — `Cannot find module '../utils/geo.js'`

- [ ] **Step 3: เขียน utils/geo.js**

`utils/geo.js`:

```javascript
/**
 * ฟังก์ชันคำนวณระยะทางทางภูมิศาสตร์
 *
 * ไฟล์นี้เป็น "คณิตศาสตร์บริสุทธิ์" — ห้าม import react หรือ react-native เด็ดขาด
 * เพราะต้องรันทดสอบด้วย Node ล้วน ๆ ได้ และเรียกใช้ได้จากทุกที่ในแอป
 *
 * รูปแบบพิกัดที่ใช้ทั้งไฟล์: { lat: number, lng: number }
 */

/** รัศมีของโลกเป็นเมตร (ตามเอกสารบทที่ 5.1) */
const EARTH_RADIUS_M = 6371000;

/** แปลงองศาเป็นเรเดียน */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** บีบค่าให้อยู่ในช่วง [min, max] */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * ระยะทางระหว่างสองพิกัดบนผิวโลก ด้วยสูตร Haversine
 *
 * ใช้สูตรนี้แทนสูตรระยะทางแบบระนาบ เพราะโลกโค้ง
 * ถ้าใช้สูตรระนาบตรง ๆ ระยะทางระดับหลายสิบกิโลเมตรจะคลาดเคลื่อนมาก
 *
 *   a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
 *   c = 2 · atan2(√a, √(1−a))
 *   d = R · c
 *
 * @returns ระยะทางหน่วยเมตร
 */
export function haversineMeters(from, to) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * ฉายจุดลงบน "ส่วนของเส้นตรง" แล้วคืนทั้งระยะทางและตำแหน่งบนเส้น
 *
 * วิธีการ: ฉายจุดลงบนเส้น แล้วบีบค่าพารามิเตอร์ t ให้อยู่ในช่วง [0, 1]
 *
 * การบีบค่า t คือหัวใจของฟังก์ชันนี้ — ถ้าไม่บีบ จุดที่ฉายได้อาจหลุดออกไป
 * นอกปลายทั้งสองข้างของเส้น ทำให้ได้ระยะที่สั้นเกินจริง
 * เช่น จุดที่อยู่เลยปลายเส้นไป 10 กม. อาจถูกคำนวณว่าอยู่ห่างแค่ 100 เมตร
 *
 * ทำไมต้องคืนค่า t ออกมาด้วย ไม่ใช่แค่ระยะทาง:
 * routeAnalysis.js ต้องรู้ว่าจุดนั้นอยู่ตรงไหน "ระหว่าง" ต้นกับปลาย segment
 * เพื่อคำนวณระยะทางสะสมได้แม่นยำ ถ้ารู้แค่ว่าเกาะ segment ไหน
 * จุดที่อยู่ปลาย segment กับจุดที่อยู่ต้น segment จะได้ระยะสะสมเท่ากัน ซึ่งผิด
 *
 * หมายเหตุ: ในระยะสั้น ๆ ระดับไม่กี่กิโลเมตร เราถือว่าองศาละติจูด/ลองจิจูด
 * เป็นระนาบได้ (ชดเชยด้วย cos(lat) สำหรับลองจิจูด) เพื่อหาค่า t
 * แต่ตอนวัดระยะจริงยังใช้ Haversine เพื่อความแม่นยำ
 *
 * @returns { distanceM, t } โดย t = 0 คือต้นเส้น, t = 1 คือปลายเส้น
 */
export function projectOnSegment(point, segmentStart, segmentEnd) {
  // ชดเชยความจริงที่ว่า 1 องศาลองจิจูดสั้นลงเมื่อเข้าใกล้ขั้วโลก
  const latitudeScale = Math.cos(toRadians(segmentStart.lat));

  const startToEndX = (segmentEnd.lng - segmentStart.lng) * latitudeScale;
  const startToEndY = segmentEnd.lat - segmentStart.lat;

  const startToPointX = (point.lng - segmentStart.lng) * latitudeScale;
  const startToPointY = point.lat - segmentStart.lat;

  const segmentLengthSquared = startToEndX * startToEndX + startToEndY * startToEndY;

  // กรณีเส้นยาวเป็นศูนย์ (จุดเริ่มกับจุดจบเป็นจุดเดียวกัน) ต้องกันการหารด้วยศูนย์
  if (segmentLengthSquared === 0) {
    return { distanceM: haversineMeters(point, segmentStart), t: 0 };
  }

  const dotProduct = startToPointX * startToEndX + startToPointY * startToEndY;

  // t = ตำแหน่งบนเส้น: 0 = ต้นเส้น, 1 = ปลายเส้น
  // การบีบให้อยู่ใน [0,1] ทำให้จุดที่ฉายไม่หลุดออกนอกปลายเส้น
  const t = clamp(dotProduct / segmentLengthSquared, 0, 1);

  const projected = {
    lat: segmentStart.lat + t * startToEndY,
    lng: segmentStart.lng + (t * startToEndX) / latitudeScale,
  };

  return { distanceM: haversineMeters(point, projected), t };
}

/**
 * ระยะทางที่สั้นที่สุดจากจุดหนึ่ง ไปยัง "ส่วนของเส้นตรง"
 *
 * เป็นตัวห่อบาง ๆ ของ projectOnSegment สำหรับที่ที่ต้องการแค่ระยะทาง
 * ไม่ต้องสนใจว่าจุดฉายอยู่ตรงไหนของเส้น
 *
 * @returns ระยะทางหน่วยเมตร
 */
export function distanceToSegmentMeters(point, segmentStart, segmentEnd) {
  return projectOnSegment(point, segmentStart, segmentEnd).distanceM;
}

/**
 * เช็คหยาบ ๆ ว่าจุดอยู่ในกรอบสี่เหลี่ยมรอบจุดศูนย์กลางหรือไม่
 *
 * ใช้เป็นตัวกรองด่านแรกก่อนคำนวณ Haversine จริง (ตามเอกสารบทที่ 5.3)
 * เพราะการเทียบ +/- ธรรมดา เร็วกว่าการคำนวณ sin/cos/atan2 หลายเท่า
 * ถ้ามีจุดเสี่ยง 500 จุด แต่กรองเหลือ 10 จุดก่อน จะประหยัดการคำนวณไปมาก
 *
 * @param radiusMeters รัศมีโดยประมาณของกรอบ หน่วยเมตร
 */
export function isInsideBoundingBox(point, center, radiusMeters) {
  // 1 องศาละติจูด ประมาณ 111,320 เมตร เสมอ ไม่ว่าจะอยู่ที่ไหนบนโลก
  const latitudeDelta = radiusMeters / 111320;
  // 1 องศาลองจิจูด สั้นลงตาม cos(ละติจูด)
  const longitudeDelta = radiusMeters / (111320 * Math.cos(toRadians(center.lat)));

  return (
    Math.abs(point.lat - center.lat) <= latitudeDelta &&
    Math.abs(point.lng - center.lng) <= longitudeDelta
  );
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/geo.test.js`
Expected: PASS — `# pass 14` `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/geo.js tests/geo.test.js
git commit -m "feat: เพิ่มฟังก์ชันคำนวณระยะทาง Haversine และระยะถึงส่วนของเส้นตรง"
```

---

## Task 4: utils/riskScore.js — คำนวณคะแนนความเสี่ยง (TDD)

**Files:**
- Create: `utils/riskScore.js`
- Test: `tests/riskScore.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

`tests/riskScore.test.js`:

```javascript
/**
 * เทสต์ของ utils/riskScore.js
 *
 * เทสต์สำคัญที่สุดคือ 'ตรงกับม็อกอัพ' — เป็นการยืนยันว่าสูตรที่ถอดมาถูกต้อง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightedIncidents,
  calculateRiskScore,
  getRiskLevel,
} from '../utils/riskScore.js';

/** จุดตัวอย่างสำหรับเทสต์: ทางขึ้นเขาคอหงส์ ตามม็อกอัพในเอกสารหน้า 7 */
const khaoKhoHong = {
  incidents: [
    { year: 2566, severity: 'serious', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ],
  peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  peakHours: [17, 18, 19, 20],
};

test('calculateWeightedIncidents: สาหัส 2 + เล็กน้อย 3 = (2x3) + (3x1) = 9', () => {
  assert.equal(calculateWeightedIncidents(khaoKhoHong.incidents), 9);
});

test('calculateWeightedIncidents: ไม่มีเหตุการณ์เลย ได้ 0', () => {
  assert.equal(calculateWeightedIncidents([]), 0);
});

test('calculateWeightedIncidents: เสียชีวิต 1 ราย มีน้ำหนัก 5', () => {
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal', count: 1 }]), 5);
});

test('calculateWeightedIncidents: ความรุนแรงที่ไม่รู้จัก ต้องข้ามไปไม่พัง', () => {
  assert.equal(calculateWeightedIncidents([{ severity: 'unknown', count: 9 }]), 0);
});

test('calculateWeightedIncidents: incidents ที่ไม่ใช่อาเรย์ ต้องได้ 0 ไม่พัง', () => {
  assert.equal(calculateWeightedIncidents(null), 0);
  assert.equal(calculateWeightedIncidents(undefined), 0);
  assert.equal(calculateWeightedIncidents('ไม่ใช่อาเรย์'), 0);
});

test('calculateWeightedIncidents: count ที่หายไปหรือไม่ใช่ตัวเลข ต้องไม่ทำให้กลายเป็น NaN', () => {
  // กรณีนี้เกิดได้จริง เพราะ riskPoints.json กรอกด้วยมือ อาจลืมใส่ count
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal' }]), 0);
  assert.equal(calculateWeightedIncidents([{ severity: 'fatal', count: null }]), 0);

  // จุดที่มีทั้งข้อมูลดีและข้อมูลเสีย ต้องนับเฉพาะข้อมูลดี ไม่ใช่พังทั้งจุด
  const mixed = [
    { severity: 'fatal', count: undefined },
    { severity: 'minor', count: 3 },
  ];
  assert.equal(calculateWeightedIncidents(mixed), 3);
});

test('ตรงกับม็อกอัพ: เขาคอหงส์ ในเดือนและเวลาที่เสี่ยง ต้องได้ 43', () => {
  // (9 / 30) x 100 x 1.3 x 1.1 = 42.9 -> ปัดเป็น 43
  const score = calculateRiskScore(khaoKhoHong, { month: 8, hour: 18 });
  assert.equal(score, 43);
});

test('เขาคอหงส์ นอกช่วงเวลาเสี่ยง คะแนนต้องต่ำลง', () => {
  // (9 / 30) x 100 x 1.3 x 1.0 = 39
  const score = calculateRiskScore(khaoKhoHong, { month: 8, hour: 9 });
  assert.equal(score, 39);
});

test('จุดที่ไม่มีสถิติเลย ต้องได้ 0 (ตรงกับม็อกอัพ ย่านนิพัทธ์อุทิศ 3)', () => {
  const emptyPoint = { incidents: [], peakMonths: [], peakHours: [] };
  assert.equal(calculateRiskScore(emptyPoint, { month: 8, hour: 18 }), 0);
});

test('คะแนนต้องไม่ทะลุ 100 แม้ตัวคูณจะดันให้เกิน', () => {
  const severePoint = {
    incidents: [{ severity: 'fatal', count: 20 }], // 20 x 5 = 100 -> 333 คะแนนดิบ
    peakMonths: [8],
    peakHours: [18],
  };
  assert.equal(calculateRiskScore(severePoint, { month: 8, hour: 18 }), 100);
});

test('คะแนนต้องไม่ติดลบ', () => {
  const point = { incidents: [], peakMonths: [], peakHours: [] };
  assert.ok(calculateRiskScore(point, { month: 1, hour: 0 }) >= 0);
});

test('จุดที่ไม่มีฟิลด์ peakMonths/peakHours ต้องไม่พัง', () => {
  const point = { incidents: [{ severity: 'minor', count: 3 }] };
  const score = calculateRiskScore(point, { month: 8, hour: 18 });
  assert.equal(score, 10); // (3 / 30) x 100 x 1.0 x 1.0 = 10
});

test('getRiskLevel: 0-39 คือเฝ้าระวัง สีเหลือง', () => {
  assert.equal(getRiskLevel(0).id, 'watch');
  assert.equal(getRiskLevel(39).id, 'watch');
  assert.equal(getRiskLevel(20).color, '#FBC02D');
});

test('getRiskLevel: 40-69 คือเสี่ยง สีส้ม', () => {
  assert.equal(getRiskLevel(40).id, 'risky');
  assert.equal(getRiskLevel(43).label, 'เสี่ยง');
  assert.equal(getRiskLevel(69).id, 'risky');
});

test('getRiskLevel: 70-100 คืออันตรายมาก สีแดง', () => {
  assert.equal(getRiskLevel(70).id, 'critical');
  assert.equal(getRiskLevel(100).label, 'อันตรายมาก');
});

test('getRiskLevel: คะแนนนอกช่วงหรือ NaN ต้องไม่พัง และคืนระดับที่สมเหตุสมผล', () => {
  // บรรทัด return level || RISK_LEVELS[0] ใน riskScore.js มีไว้กันกรณีพวกนี้
  // ถ้าไม่มีเทสต์คุม อาจมีคนลบทิ้งเพราะคิดว่าไม่จำเป็น
  assert.equal(getRiskLevel(NaN).id, 'watch');
  assert.equal(getRiskLevel(-10).id, 'watch');
  assert.equal(getRiskLevel(150).id, 'critical');
});

test('getRiskLevel: ต้องไม่มีระดับไหนเป็นสีเขียว', () => {
  for (const score of [0, 25, 50, 75, 100]) {
    const color = getRiskLevel(score).color.toLowerCase();
    assert.ok(!color.startsWith('#0'), `คะแนน ${score} ใช้สีที่ดูเหมือนเขียว: ${color}`);
  }
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `node --test tests/riskScore.test.js`
Expected: FAIL — `Cannot find module '../utils/riskScore.js'`

- [ ] **Step 3: เขียน utils/riskScore.js**

`utils/riskScore.js`:

```javascript
/**
 * แปลงสถิติอุบัติเหตุให้เป็น "คะแนนความเสี่ยง 0-100"
 *
 * เป้าหมายคือทำให้ผู้ใช้ไม่ต้องตีความตัวเลขสถิติเอง
 * เห็นแค่ตัวเลขเดียวกับสีเดียว ก็รู้ทันทีว่าควรระวังแค่ไหน
 *
 * สูตรตามเอกสารบทที่ 5.4:
 *   S = ( Σ(nᵢ × wᵢ) / N_max ) × 100 × f_season × f_time
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { SEVERITY_WEIGHTS, N_MAX, CONTEXT_FACTORS, RISK_LEVELS } from '../constants/config.js';
import { clamp } from './geo.js';

/**
 * รวมน้ำหนักความรุนแรงของเหตุการณ์ทั้งหมด = Σ(nᵢ × wᵢ)
 *
 * เสียชีวิต 1 ราย (น้ำหนัก 5) ถือว่าร้ายแรงกว่าบาดเจ็บเล็กน้อย 4 ราย (น้ำหนัก 1x4=4)
 * เพราะเราสนใจ "ความรุนแรง" ไม่ใช่แค่ "จำนวนครั้ง"
 */
export function calculateWeightedIncidents(incidents) {
  if (!Array.isArray(incidents)) return 0;

  return incidents.reduce((total, incident) => {
    const weight = SEVERITY_WEIGHTS[incident.severity];
    // ถ้าเจอความรุนแรงที่ไม่รู้จัก ให้ข้ามไป ดีกว่าทำให้คะแนนเพี้ยนทั้งจุด
    if (weight === undefined) return total;

    // กัน count ที่หายไปหรือไม่ใช่ตัวเลข
    // สำคัญเพราะไฟล์ riskPoints.json ถูกกรอกด้วยมือ ถ้าใครลืมใส่ count
    // แล้วปล่อยให้เป็น undefined * weight = NaN คะแนนทั้งจุดจะกลายเป็น NaN
    // แล้วหลุดไปแสดงบนหน้าจอว่า "NaN" ซึ่งผู้ใช้อ่านไม่รู้เรื่อง
    const count = Number.isFinite(incident.count) ? incident.count : 0;

    return total + count * weight;
  }, 0);
}

/**
 * ตัวคูณตามฤดูกาล — เดือนนี้เป็นเดือนที่เสี่ยงสูงของจุดนี้หรือไม่
 * @param month เดือนปัจจุบัน 1-12
 */
function getSeasonFactor(point, month) {
  const peakMonths = point.peakMonths || [];
  return peakMonths.includes(month) ? CONTEXT_FACTORS.SEASON_PEAK : CONTEXT_FACTORS.NONE;
}

/**
 * ตัวคูณตามช่วงเวลา — ตอนนี้เป็นชั่วโมงที่เสี่ยงสูงของจุดนี้หรือไม่
 * @param hour ชั่วโมงปัจจุบัน 0-23
 */
function getTimeFactor(point, hour) {
  const peakHours = point.peakHours || [];
  return peakHours.includes(hour) ? CONTEXT_FACTORS.TIME_PEAK : CONTEXT_FACTORS.NONE;
}

/**
 * คำนวณคะแนนความเสี่ยงของจุดหนึ่ง ณ เวลาที่กำหนด
 *
 * ผลลัพธ์เปลี่ยนตามเวลาจริง ทำให้หมุดจุดเดียวกันเปลี่ยนสีบนแผนที่ได้
 * เช่น จุดที่อันตรายเฉพาะตอนกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 *
 * @param context { month: 1-12, hour: 0-23 } ถ้าไม่ส่งมา จะใช้เวลาปัจจุบันของเครื่อง
 * @returns จำนวนเต็ม 0-100
 */
export function calculateRiskScore(point, context) {
  const now = new Date();
  const month = context?.month ?? now.getMonth() + 1; // getMonth() คืน 0-11 ต้อง +1
  const hour = context?.hour ?? now.getHours();

  const weighted = calculateWeightedIncidents(point.incidents);
  const baseScore = (weighted / N_MAX) * 100;

  const adjusted = baseScore * getSeasonFactor(point, month) * getTimeFactor(point, hour);

  // ต้อง clamp เพราะตัวคูณ 1.3 x 1.1 ทำให้คะแนนทะลุ 100 ได้
  // (เอกสารต้นฉบับไม่ได้ระบุจุดนี้ไว้ แต่จำเป็นต้องมี)
  return Math.round(clamp(adjusted, 0, 100));
}

/**
 * แปลงคะแนนเป็นระดับความเสี่ยง พร้อมป้ายภาษาไทยและสีหมุด
 *
 * @returns { id, label, min, max, color }
 */
export function getRiskLevel(score) {
  const safeScore = clamp(score, 0, 100);
  const level = RISK_LEVELS.find((l) => safeScore >= l.min && safeScore <= l.max);
  // ตามหลักการแล้วหาเจอเสมอ แต่กันเหนียวไว้ไม่ให้คืน undefined
  return level || RISK_LEVELS[0];
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/riskScore.test.js`
Expected: PASS — `# pass 17` `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/riskScore.js tests/riskScore.test.js
git commit -m "feat: เพิ่มการคำนวณคะแนนความเสี่ยงตามบริบทเวลาและฤดูกาล"
```

---

## Task 5: utils/routeAnalysis.js — หาจุดเสี่ยงบนเส้นทาง (TDD)

**Files:**
- Create: `utils/routeAnalysis.js`
- Test: `tests/routeAnalysis.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

`tests/routeAnalysis.test.js`:

```javascript
/**
 * เทสต์ของ utils/routeAnalysis.js
 *
 * โจทย์สำคัญที่สุด: จุดเสี่ยงต้องเรียงตาม "ลำดับที่ผู้ใช้จะขับผ่านจริง"
 * ไม่ใช่เรียงตาม "ระยะห่างจากเส้นทาง" (ตามเอกสารบทที่ 5.2)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findRiskPointsAlongRoute,
  calculateRouteLength,
  calculateRouteRiskScore,
} from '../utils/routeAnalysis.js';

/** เส้นทางทดสอบ: วิ่งตรงขึ้นเหนือจาก lat 7.00 ถึง 7.04 ที่ lng 100.5 */
const straightRoute = [
  { lat: 7.00, lng: 100.5 },
  { lat: 7.01, lng: 100.5 },
  { lat: 7.02, lng: 100.5 },
  { lat: 7.03, lng: 100.5 },
  { lat: 7.04, lng: 100.5 },
];

function makePoint(id, lat, lng) {
  return { id, name: id, coordinate: { lat, lng }, incidents: [], peakMonths: [], peakHours: [] };
}

test('calculateRouteLength: เส้นทางทดสอบยาวประมาณ 4.4 กม.', () => {
  const length = calculateRouteLength(straightRoute);
  assert.ok(Math.abs(length - 4432) < 100, `ได้ ${length} คาดว่าประมาณ 4432`);
});

test('calculateRouteLength: เส้นทางที่มีจุดเดียว ยาว 0', () => {
  assert.equal(calculateRouteLength([{ lat: 7, lng: 100.5 }]), 0);
});

test('calculateRouteLength: เส้นทางว่าง ยาว 0', () => {
  assert.equal(calculateRouteLength([]), 0);
});

test('เลือกเฉพาะจุดที่อยู่ใกล้เส้นทางไม่เกินเกณฑ์', () => {
  const points = [
    makePoint('near', 7.02, 100.5),      // อยู่บนเส้นพอดี
    makePoint('far', 7.02, 100.8),       // ห่างประมาณ 33 กม.
  ];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);
  assert.equal(result.length, 1);
  assert.equal(result[0].point.id, 'near');
});

test('เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่ตามระยะห่างจากเส้นทาง', () => {
  const points = [
    // จุดนี้อยู่ท้ายเส้นทาง แต่ใกล้เส้นมากที่สุด (ห่าง 0 เมตร)
    makePoint('last-but-closest', 7.038, 100.5),
    // จุดนี้อยู่ต้นเส้นทาง แต่ห่างจากเส้น 200 เมตร
    makePoint('first-but-farther', 7.005, 100.5018),
  ];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  assert.equal(result.length, 2);
  // ถ้าเรียงผิด (เรียงตามระยะห่าง) จุด last-but-closest จะมาก่อน ซึ่งผิด
  assert.equal(result[0].point.id, 'first-but-farther', 'จุดต้นทางต้องมาก่อน');
  assert.equal(result[1].point.id, 'last-but-closest', 'จุดปลายทางต้องมาทีหลัง');
});

test('คืนระยะทางสะสมจากจุดเริ่มต้น เพื่อใช้บอกว่า "อีกกี่กิโลเมตรข้างหน้า"', () => {
  const points = [makePoint('middle', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  // จุดนี้อยู่ที่พิกัด 7.02 = ผ่านมาแล้ว 2 segment = 2 x 1112 = ประมาณ 2,224 เมตร
  assert.ok(
    Math.abs(result[0].distanceAlongRouteM - 2224) < 60,
    `ได้ ${result[0].distanceAlongRouteM} คาดว่าประมาณ 2224`
  );
});

test('จุดที่อยู่กลาง segment ต้องได้ระยะสะสมที่ละเอียดกว่าระดับ segment', () => {
  // จุดนี้อยู่กึ่งกลางของ segment แรก (7.00 -> 7.01) = ประมาณ 556 เมตร
  //
  // เทสต์นี้มีไว้จับบั๊กเฉพาะ: ถ้าโค้ดใช้แค่ "ระยะสะสมถึงต้น segment"
  // จุดนี้จะได้ค่า 0 ซึ่งผิด เพราะจริง ๆ ผู้ใช้ต้องขับไปครึ่ง segment ก่อนถึงจุดนี้
  const points = [makePoint('half-way-in', 7.005, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);

  assert.ok(
    Math.abs(result[0].distanceAlongRouteM - 556) < 60,
    `ได้ ${result[0].distanceAlongRouteM} คาดว่าประมาณ 556`
  );
});

test('คืนระยะห่างจากเส้นทางด้วย', () => {
  const points = [makePoint('on-line', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300);
  assert.ok(result[0].distanceFromRouteM < 5, 'จุดที่อยู่บนเส้นต้องห่างเกือบ 0');
});

test('เส้นทางว่าง ต้องคืนอาเรย์ว่าง ไม่พัง', () => {
  assert.deepEqual(findRiskPointsAlongRoute([], [makePoint('a', 7, 100.5)], 300), []);
});

test('ไม่มีจุดเสี่ยงเลย ต้องคืนอาเรย์ว่าง', () => {
  assert.deepEqual(findRiskPointsAlongRoute(straightRoute, [], 300), []);
});

test('จุดเดียวกันต้องไม่ถูกนับซ้ำ แม้จะใกล้หลาย segment', () => {
  const points = [makePoint('corner', 7.02, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 5000);
  assert.equal(result.length, 1, 'ต้องปรากฏแค่ครั้งเดียว');
});

/** ช่วยสร้างข้อมูลรูปแบบเดียวกับที่ findRiskPointsAlongRoute คืนออกมา */
function makeScored(scores) {
  return scores.map((riskScore, index) => ({
    point: { id: 'p' + index, riskScore },
    distanceFromRouteM: 0,
    distanceAlongRouteM: index * 100,
  }));
}

test('calculateRouteRiskScore: เส้นทางที่ไม่มีจุดเสี่ยงเลย ได้ 0', () => {
  assert.equal(calculateRouteRiskScore([]), 0);
});

test('calculateRouteRiskScore: มีจุดเดียว ได้คะแนนเท่ากับจุดนั้น', () => {
  // 0.6 x 50 + 0.4 x 50 = 50
  assert.equal(calculateRouteRiskScore(makeScored([50])), 50);
});

test('calculateRouteRiskScore: จุดอันตรายมาก 1 จุด ต้องดันคะแนนรวมให้สูง', () => {
  // max = 100, avg = 53.33 -> 0.6 x 100 + 0.4 x 53.33 = 81.3 -> 81
  // ถ้าใช้ค่าเฉลี่ยอย่างเดียวจะได้แค่ 53 ซึ่งทำให้ผู้ใช้ประมาท
  assert.equal(calculateRouteRiskScore(makeScored([100, 40, 20])), 81);
});

test('calculateRouteRiskScore: ไม่ทะลุ 100 และไม่ติดลบ', () => {
  const score = calculateRouteRiskScore(makeScored([100, 100, 100]));
  assert.ok(score <= 100 && score >= 0, `คะแนนต้องอยู่ในช่วง 0-100 แต่ได้ ${score}`);
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `node --test tests/routeAnalysis.test.js`
Expected: FAIL — `Cannot find module '../utils/routeAnalysis.js'`

- [ ] **Step 3: เขียน utils/routeAnalysis.js**

`utils/routeAnalysis.js`:

```javascript
/**
 * วิเคราะห์ว่าเส้นทางที่ผู้ใช้จะไป มีจุดเสี่ยงอะไรบ้าง และอยู่ตรงไหนของเส้นทาง
 *
 * ปัญหาที่ยากที่สุดของไฟล์นี้ (ตามเอกสารบทที่ 5.2):
 * จุดเสี่ยงที่ "อยู่ใกล้เส้นทางมากที่สุด" อาจเป็นจุดที่ "อยู่ท้ายสุดของการเดินทาง"
 * ถ้าเรียงตามระยะห่างจากเส้นทาง ผู้ใช้จะเห็นลำดับที่สับสน
 *
 * วิธีแก้: จำว่าจุดเสี่ยงแต่ละจุดเกาะอยู่กับ segment ลำดับที่เท่าไหร่
 * แล้วบวกระยะทางสะสมตั้งแต่จุดเริ่มต้นมาถึง segment นั้น
 * ค่านี้คือ "ระยะทางการเดินทางจริง" ใช้ทั้งเรียงลำดับและแสดงผล "อีก 4.2 กม.ข้างหน้า"
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { haversineMeters, projectOnSegment, clamp } from './geo.js';

/**
 * ความยาวรวมของเส้นทาง หน่วยเมตร
 */
export function calculateRouteLength(routeCoordinates) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    total += haversineMeters(routeCoordinates[i], routeCoordinates[i + 1]);
  }
  return total;
}

/**
 * หาจุดเสี่ยงที่อยู่ใกล้เส้นทาง แล้วเรียงตามลำดับที่จะขับผ่านจริง
 *
 * @param routeCoordinates อาเรย์ของ { lat, lng } เรียงจากต้นทางไปปลายทาง
 * @param riskPoints อาเรย์ของจุดเสี่ยง แต่ละจุดมีฟิลด์ coordinate
 * @param thresholdMeters ห่างจากเส้นทางไม่เกินเท่านี้ถือว่าอยู่บนเส้นทาง
 * @returns อาเรย์ของ { point, distanceFromRouteM, distanceAlongRouteM } เรียงตามระยะทางสะสม
 */
export function findRiskPointsAlongRoute(routeCoordinates, riskPoints, thresholdMeters) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return [];
  if (!Array.isArray(riskPoints) || riskPoints.length === 0) return [];

  // คำนวณความยาวและระยะทางสะสมของแต่ละ segment ไว้ล่วงหน้า
  // cumulativeDistances[i] = ระยะทางจากต้นทาง มาถึง routeCoordinates[i]
  const segmentLengths = [];
  const cumulativeDistances = [0];
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentLength = haversineMeters(routeCoordinates[i], routeCoordinates[i + 1]);
    segmentLengths.push(segmentLength);
    cumulativeDistances.push(cumulativeDistances[i] + segmentLength);
  }

  const matches = [];

  for (const point of riskPoints) {
    let closestDistance = Infinity;
    let closestSegmentIndex = -1;
    let closestT = 0;

    // หาว่าจุดนี้ใกล้ segment ไหนมากที่สุด และเกาะอยู่ตรงไหนของ segment นั้น
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const projection = projectOnSegment(
        point.coordinate,
        routeCoordinates[i],
        routeCoordinates[i + 1]
      );
      if (projection.distanceM < closestDistance) {
        closestDistance = projection.distanceM;
        closestSegmentIndex = i;
        closestT = projection.t;
      }
    }

    // ไกลเกินเกณฑ์ = ไม่ถือว่าอยู่บนเส้นทางนี้
    if (closestDistance > thresholdMeters) continue;

    // ระยะทางสะสมถึงต้น segment บวกด้วยระยะที่เดินเข้าไปใน segment นั้น (t x ความยาว segment)
    //
    // การบวก t x ความยาว สำคัญมาก ถ้าใช้แค่ระยะสะสมถึงต้น segment เฉย ๆ
    // จุดที่อยู่ปลาย segment จะได้ค่าเท่ากับจุดที่อยู่ต้น segment เดียวกัน ซึ่งผิด
    // และจุดที่ตกอยู่บนรอยต่อพอดีจะได้ค่าต่างกันไปเลย ขึ้นกับว่าลูปเจอ segment ไหนก่อน
    const distanceAlongRoute =
      cumulativeDistances[closestSegmentIndex] + closestT * segmentLengths[closestSegmentIndex];

    matches.push({
      point,
      distanceFromRouteM: Math.round(closestDistance),
      // ค่านี้ใช้ทั้งเรียงลำดับ และใช้บอกผู้ใช้ว่า "อีกกี่กิโลเมตรข้างหน้า"
      distanceAlongRouteM: Math.round(distanceAlongRoute),
    });
  }

  // เรียงตามลำดับที่จะขับผ่าน ไม่ใช่ตามความใกล้
  return matches.sort((a, b) => a.distanceAlongRouteM - b.distanceAlongRouteM);
}

/**
 * คะแนนความเสี่ยงรวมของทั้งเส้นทาง 0-100
 * (ตามที่เอกสารบทที่ 4 ระบุว่าหน้าวางแผนเส้นทางต้องแสดง "คะแนนความปลอดภัยรวมของเส้นทาง")
 *
 * สูตร: 60% ของคะแนนจุดที่แย่ที่สุด + 40% ของคะแนนเฉลี่ย
 *
 * ทำไมต้องผสมสองอย่าง ไม่ใช้อย่างใดอย่างหนึ่ง:
 *   - ถ้าใช้ค่าเฉลี่ยอย่างเดียว เส้นทางที่มีจุดอันตรายมาก 1 จุด
 *     ปนกับจุดเฝ้าระวังอีก 9 จุด จะได้คะแนนต่ำ ทั้งที่จริงอันตราย
 *   - ถ้าใช้ค่าสูงสุดอย่างเดียว เส้นทางที่มีจุดเสี่ยง 1 จุด
 *     จะดูอันตรายเท่ากับเส้นทางที่มีจุดเสี่ยงแบบเดียวกัน 15 จุด ซึ่งก็ไม่จริง
 *
 * @param pointsOnRoute ผลลัพธ์จาก findRiskPointsAlongRoute
 * @returns จำนวนเต็ม 0-100
 */
export function calculateRouteRiskScore(pointsOnRoute) {
  if (!Array.isArray(pointsOnRoute) || pointsOnRoute.length === 0) return 0;

  const scores = pointsOnRoute.map((item) => item.point.riskScore || 0);

  const highest = Math.max(...scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(clamp(0.6 * highest + 0.4 * average, 0, 100));
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/routeAnalysis.test.js`
Expected: PASS — `# pass 15` `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/routeAnalysis.js tests/routeAnalysis.test.js
git commit -m "feat: เพิ่มการวิเคราะห์จุดเสี่ยงบนเส้นทาง เรียงตามลำดับการเดินทางจริง พร้อมคะแนนรวมของเส้นทาง"
```

---

## Task 6: utils/tripAlerts.js — ตรรกะกันเตือนซ้ำ (TDD)

**Files:**
- Create: `utils/tripAlerts.js`
- Test: `tests/tripAlerts.test.js`

> ปัญหาที่แก้ในไฟล์นี้ (ตามเอกสารบทที่ 5.3): ถ้าเขียนแบบตรงไปตรงมาว่า
> "ถ้าระยะน้อยกว่า 500 เมตร ให้เตือน" ผู้ใช้จะโดนเตือนหลายสิบครั้งตอนขับผ่านจุดเดียว
> เพราะ GPS อัปเดตทุกไม่กี่วินาที

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

`tests/tripAlerts.test.js`:

```javascript
/**
 * เทสต์ของ utils/tripAlerts.js
 *
 * ไฟล์นี้เป็น pure function ล้วน ไม่มี state ข้างใน
 * ทำให้จำลองสถานการณ์ "ขับรถเข้าใกล้แล้วออกห่าง" ได้ง่ายมาก
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTripAlerts } from '../utils/tripAlerts.js';

const CONFIG = { triggerM: 500, resetM: 800, boundingBoxM: 2000 };

function makePoint(id, lat, lng) {
  return { id, name: id, coordinate: { lat, lng }, incidents: [], peakMonths: [], peakHours: [] };
}

// จุดเสี่ยงอยู่ที่ lat 7.00 พอดี
const points = [makePoint('p1', 7.0, 100.5)];

test('อยู่ไกลมาก ยังไม่เตือน', () => {
  const far = { lat: 7.05, lng: 100.5 }; // ห่างประมาณ 5.5 กม.
  const result = evaluateTripAlerts(far, points, new Set(), CONFIG);
  assert.deepEqual(result.newAlerts, []);
  assert.equal(result.alertedIds.size, 0);
});

test('เข้ามาในระยะ 500 เมตร ต้องเตือน 1 ครั้ง', () => {
  const near = { lat: 7.003, lng: 100.5 }; // ห่างประมาณ 333 เมตร
  const result = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.equal(result.newAlerts.length, 1);
  assert.equal(result.newAlerts[0].point.id, 'p1');
  assert.ok(result.alertedIds.has('p1'), 'ต้องจำไว้ว่าเตือนไปแล้ว');
});

test('ยังอยู่ใกล้จุดเดิม ต้องไม่เตือนซ้ำ', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(near, points, alreadyAlerted, CONFIG);
  assert.deepEqual(result.newAlerts, [], 'ห้ามเตือนซ้ำ');
  assert.ok(result.alertedIds.has('p1'), 'ต้องยังจำว่าเตือนไปแล้ว');
});

test('ขับออกห่างเกิน 800 เมตร ต้องล้างสถานะเตือน', () => {
  const away = { lat: 7.01, lng: 100.5 }; // ห่างประมาณ 1.1 กม.
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(away, points, alreadyAlerted, CONFIG);
  assert.equal(result.alertedIds.has('p1'), false, 'ต้องล้างสถานะแล้ว');
});

test('ระยะระหว่าง 500-800 เมตร ต้องยังจำสถานะไว้ (โซนกันสั่น)', () => {
  // ห่างประมาณ 666 เมตร: เกินระยะเตือน แต่ยังไม่ถึงระยะล้าง
  // โซนนี้มีไว้กัน GPS แกว่งไปมาแล้วเตือนซ้ำ
  const between = { lat: 7.006, lng: 100.5 };
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(between, points, alreadyAlerted, CONFIG);
  assert.ok(result.alertedIds.has('p1'), 'ยังต้องจำไว้');
  assert.deepEqual(result.newAlerts, [], 'และห้ามเตือนซ้ำ');
});

test('ขับออกไปแล้ววนกลับมาใหม่ ต้องเตือนอีกครั้ง', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const away = { lat: 7.02, lng: 100.5 };

  // รอบที่ 1: เข้าใกล้ -> เตือน
  let state = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.equal(state.newAlerts.length, 1);

  // รอบที่ 2: ขับออกไปไกล -> ล้างสถานะ
  state = evaluateTripAlerts(away, points, state.alertedIds, CONFIG);
  assert.equal(state.alertedIds.has('p1'), false);

  // รอบที่ 3: วนกลับมาใหม่ -> ต้องเตือนอีกครั้ง
  state = evaluateTripAlerts(near, points, state.alertedIds, CONFIG);
  assert.equal(state.newAlerts.length, 1, 'กลับมาใหม่ต้องเตือนอีก');
});

test('คืนระยะทางถึงจุดเสี่ยงมาด้วย เพื่อแสดง "อีก 244 ม."', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const result = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.ok(
    Math.abs(result.newAlerts[0].distanceM - 333) < 20,
    `ได้ ${result.newAlerts[0].distanceM} คาดว่าประมาณ 333`
  );
});

test('คืนรายการจุดที่กำลังเฝ้าระวังอยู่ เพื่อแสดง "กำลังเฝ้าระวัง 8 จุด"', () => {
  const manyPoints = [
    makePoint('a', 7.0, 100.5),
    makePoint('b', 7.005, 100.5),
    makePoint('c', 8.0, 101.5), // ไกลมาก ไม่นับ
  ];
  const here = { lat: 7.0, lng: 100.5 };
  const result = evaluateTripAlerts(here, manyPoints, new Set(), CONFIG);
  assert.equal(result.nearbyPoints.length, 2, 'นับเฉพาะจุดที่อยู่ในกรอบใกล้ ๆ');
});

test('ไม่มีตำแหน่งผู้ใช้ ต้องไม่พัง', () => {
  const result = evaluateTripAlerts(null, points, new Set(), CONFIG);
  assert.deepEqual(result.newAlerts, []);
  assert.deepEqual(result.nearbyPoints, []);
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `node --test tests/tripAlerts.test.js`
Expected: FAIL — `Cannot find module '../utils/tripAlerts.js'`

- [ ] **Step 3: เขียน utils/tripAlerts.js**

`utils/tripAlerts.js`:

```javascript
/**
 * ตรรกะการเตือนในโหมดเดินทาง
 *
 * ออกแบบเป็น pure function โดยตั้งใจ:
 * รับสถานะเข้า -> คืนสถานะใหม่ออก ไม่เก็บ state ไว้ข้างใน
 * ทำให้ทดสอบสถานการณ์ "ขับเข้าใกล้ ขับออกห่าง วนกลับมาใหม่" ได้ครบโดยไม่ต้องใช้ GPS จริง
 *
 * ปัญหา 3 อย่างที่ไฟล์นี้แก้ (ตามเอกสารบทที่ 5.3):
 *   1. เตือนซ้ำ  -> จำ id ที่เตือนไปแล้ว ล้างเมื่อออกห่างเกิน resetM
 *   2. เปลืองแบต -> กรองด้วยกรอบสี่เหลี่ยมก่อนคำนวณ Haversine
 *   3. GPS แกว่ง -> ระยะล้าง (800 ม.) มากกว่าระยะเตือน (500 ม.) เป็นโซนกันสั่น
 *
 * ไฟล์นี้เป็นคณิตศาสตร์บริสุทธิ์ — ห้าม import react
 */

import { haversineMeters, isInsideBoundingBox } from './geo.js';

/**
 * ประเมินว่าตอนนี้ควรเตือนจุดไหนบ้าง
 *
 * @param userLocation ตำแหน่งผู้ใช้ { lat, lng } หรือ null ถ้ายังไม่มี
 * @param riskPoints รายการจุดเสี่ยงทั้งหมด
 * @param alertedIds Set ของ id ที่เตือนไปแล้ว (ห้ามแก้ค่าเดิม จะคืน Set ใหม่ให้)
 * @param config { triggerM, resetM, boundingBoxM }
 * @returns {
 *   newAlerts: [{ point, distanceM }]  จุดที่ต้องเตือน "เดี๋ยวนี้"
 *   alertedIds: Set                    สถานะใหม่ ให้เอาไปใช้รอบถัดไป
 *   nearbyPoints: [{ point, distanceM }] จุดที่อยู่ในระยะเฝ้าระวัง เรียงจากใกล้ไปไกล
 * }
 */
export function evaluateTripAlerts(userLocation, riskPoints, alertedIds, config) {
  if (!userLocation || !Array.isArray(riskPoints)) {
    return { newAlerts: [], alertedIds: new Set(alertedIds), nearbyPoints: [] };
  }

  const nextAlertedIds = new Set(alertedIds);
  const newAlerts = [];
  const nearbyPoints = [];

  for (const point of riskPoints) {
    // ด่านที่ 1: กรองหยาบ ๆ ด้วยกรอบสี่เหลี่ยม
    // เร็วกว่าการคำนวณ Haversine มาก ตัดจุดที่ไกลออกไปได้เกือบหมดก่อน
    if (!isInsideBoundingBox(point.coordinate, userLocation, config.boundingBoxM)) {
      // จุดที่ไกลมาก ๆ ให้ล้างสถานะเตือนไปเลย เพราะขับผ่านมานานแล้วแน่ ๆ
      nextAlertedIds.delete(point.id);
      continue;
    }

    // ด่านที่ 2: คำนวณระยะจริง
    const distanceM = haversineMeters(userLocation, point.coordinate);

    nearbyPoints.push({ point, distanceM: Math.round(distanceM) });

    if (distanceM <= config.triggerM) {
      // อยู่ในระยะเตือน — เตือนเฉพาะถ้ายังไม่เคยเตือนจุดนี้
      if (!nextAlertedIds.has(point.id)) {
        newAlerts.push({ point, distanceM: Math.round(distanceM) });
        nextAlertedIds.add(point.id);
      }
    } else if (distanceM > config.resetM) {
      // ออกห่างพอแล้ว ล้างสถานะ เพื่อให้เตือนได้อีกถ้าวนกลับมา
      nextAlertedIds.delete(point.id);
    }
    // ระยะระหว่าง triggerM กับ resetM = โซนกันสั่น ไม่ทำอะไรทั้งสิ้น
  }

  nearbyPoints.sort((a, b) => a.distanceM - b.distanceM);

  return { newAlerts, alertedIds: nextAlertedIds, nearbyPoints };
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/tripAlerts.test.js`
Expected: PASS — `# pass 9` `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/tripAlerts.js tests/tripAlerts.test.js
git commit -m "feat: เพิ่มตรรกะเตือนโหมดเดินทาง พร้อมกลไกกันเตือนซ้ำ"
```

---

## Task 7: utils/format.js — จัดรูปแบบข้อความ (TDD)

**Files:**
- Create: `utils/format.js`
- Test: `tests/format.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ยังไม่ผ่าน**

`tests/format.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance, formatDuration, summarizeIncidents } from '../utils/format.js';

test('formatDistance: ต่ำกว่า 1 กม. แสดงเป็นเมตร', () => {
  assert.equal(formatDistance(244), '244 ม.');
  assert.equal(formatDistance(999), '999 ม.');
});

test('formatDistance: ตั้งแต่ 1 กม. ขึ้นไป แสดงเป็นกิโลเมตร ทศนิยม 1 ตำแหน่ง', () => {
  assert.equal(formatDistance(1000), '1.0 กม.');
  assert.equal(formatDistance(4200), '4.2 กม.');
  assert.equal(formatDistance(28394), '28.4 กม.');
});

test('formatDistance: ปัดเศษเมตรให้เป็นจำนวนเต็ม', () => {
  assert.equal(formatDistance(243.7), '244 ม.');
});

test('formatDuration: ต่ำกว่า 1 ชม. แสดงเป็นนาที', () => {
  assert.equal(formatDuration(1871), '31 นาที');
  assert.equal(formatDuration(60), '1 นาที');
});

test('formatDuration: ตั้งแต่ 1 ชม. แสดงชั่วโมงและนาที', () => {
  assert.equal(formatDuration(3600), '1 ชม.');
  assert.equal(formatDuration(5400), '1 ชม. 30 นาที');
});

test('summarizeIncidents: รวมจำนวนตามความรุนแรง', () => {
  const incidents = [
    { year: 2566, severity: 'serious', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ];
  assert.equal(summarizeIncidents(incidents), 'บาดเจ็บสาหัส 2 · บาดเจ็บเล็กน้อย 3');
});

test('summarizeIncidents: รวมความรุนแรงเดียวกันจากหลายปีเข้าด้วยกัน', () => {
  const incidents = [
    { year: 2566, severity: 'minor', count: 2 },
    { year: 2565, severity: 'minor', count: 3 },
  ];
  assert.equal(summarizeIncidents(incidents), 'บาดเจ็บเล็กน้อย 5');
});

test('summarizeIncidents: ไม่มีข้อมูล แสดงข้อความบอกว่ายังไม่มี', () => {
  assert.equal(summarizeIncidents([]), 'ยังไม่มีข้อมูลสถิติ');
});

test('summarizeIncidents: เรียงจากรุนแรงมากไปน้อย', () => {
  const incidents = [
    { severity: 'minor', count: 1 },
    { severity: 'fatal', count: 1 },
    { severity: 'serious', count: 1 },
  ];
  assert.equal(summarizeIncidents(incidents), 'เสียชีวิต 1 · บาดเจ็บสาหัส 1 · บาดเจ็บเล็กน้อย 1');
});
```

- [ ] **Step 2: รันเทสต์ให้เห็นว่าไม่ผ่าน**

Run: `node --test tests/format.test.js`
Expected: FAIL — `Cannot find module '../utils/format.js'`

- [ ] **Step 3: เขียน utils/format.js**

`utils/format.js`:

```javascript
/**
 * แปลงตัวเลขดิบให้เป็นข้อความภาษาไทยที่ผู้ใช้อ่านเข้าใจ
 *
 * เหตุผลที่แยกเป็นไฟล์ต่างหาก: การจัดรูปแบบเป็นเรื่องที่ต้องใช้ซ้ำหลายหน้าจอ
 * ถ้าเขียนกระจายในแต่ละหน้า จะเกิดกรณีที่หน้าหนึ่งเขียน "4.2 กม."
 * แต่อีกหน้าเขียน "4200 เมตร" ทำให้แอปดูไม่เป็นระบบเดียวกัน
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { SEVERITY_LABELS } from '../constants/config.js';

/**
 * ระยะทาง: ต่ำกว่า 1 กม. บอกเป็นเมตร ตั้งแต่ 1 กม. ขึ้นไปบอกเป็นกิโลเมตร
 *
 * เหตุผล: "244 ม." เข้าใจง่ายกว่า "0.2 กม." สำหรับระยะใกล้
 * แต่ "28.4 กม." เข้าใจง่ายกว่า "28394 ม." สำหรับระยะไกล
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
}

/** ระยะเวลา: วินาที -> "31 นาที" หรือ "1 ชม. 30 นาที" */
export function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} นาที`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ชม.`;
  }
  return `${hours} ชม. ${minutes} นาที`;
}

/** ลำดับความรุนแรงจากมากไปน้อย ใช้เรียงข้อความสรุป */
const SEVERITY_ORDER = ['fatal', 'serious', 'minor'];

/**
 * สรุปสถิติเหตุการณ์เป็นบรรทัดเดียว
 * เช่น "บาดเจ็บสาหัส 2 · บาดเจ็บเล็กน้อย 3"
 *
 * รวมเหตุการณ์ประเภทเดียวกันจากหลายปีเข้าด้วยกัน
 * เพราะผู้ใช้อยากเห็นภาพรวมก่อน ส่วนรายละเอียดแยกปีอยู่ในตารางด้านล่าง
 */
export function summarizeIncidents(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return 'ยังไม่มีข้อมูลสถิติ';
  }

  const totals = {};
  for (const incident of incidents) {
    if (!SEVERITY_LABELS[incident.severity]) continue;
    totals[incident.severity] = (totals[incident.severity] || 0) + incident.count;
  }

  const parts = SEVERITY_ORDER
    .filter((severity) => totals[severity] > 0)
    .map((severity) => `${SEVERITY_LABELS[severity]} ${totals[severity]}`);

  if (parts.length === 0) return 'ยังไม่มีข้อมูลสถิติ';

  return parts.join(' · ');
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/format.test.js`
Expected: PASS — `# pass 9` `# fail 0`

- [ ] **Step 5: รันเทสต์ทั้งหมดพร้อมกัน**

Run: `npm test`
Expected: PASS — `# pass 64` `# fail 0`

- [ ] **Step 6: Commit**

```bash
git add utils/format.js tests/format.test.js
git commit -m "feat: เพิ่มฟังก์ชันจัดรูปแบบระยะทาง เวลา และสรุปสถิติ"
```

---

## Task 8: utils/routing.js — ดึงเส้นทางจาก OSRM พร้อมสำรองออฟไลน์

**Files:**
- Create: `utils/routing.js`

> ไฟล์นี้ไม่ทำ TDD เพราะต้องเรียกเครือข่ายจริง จะทดสอบด้วยมือใน Task 20 แทน

- [ ] **Step 1: เขียน utils/routing.js**

`utils/routing.js`:

```javascript
/**
 * ดึงเส้นทางจริงบนถนน จากบริการ OSRM
 *
 * ทำไมถึงเลือก OSRM: ใช้ฟรี ไม่ต้องสมัคร ไม่ต้องใช้ API key ไม่ต้องผูกบัตรเครดิต
 * ต่างจาก Google Directions API ที่ต้องเปิดบัญชีเรียกเก็บเงิน
 * (ตรวจสอบแล้วเมื่อ 2026-09-05: ม.อ.หาดใหญ่ -> หาดสมิหลา = 28.4 กม. / 31 นาที / 471 พิกัด)
 *
 * ข้อควรระวัง: router.project-osrm.org เป็นเซิร์ฟเวอร์สาธิต ไม่รับประกันความพร้อมใช้งาน
 * ดังนั้นต้องมีเส้นทางสำรองในเครื่องเสมอ เผื่อล่มหรือผู้ใช้ไม่มีอินเทอร์เน็ต
 *
 * ไฟล์นี้ไม่ import react — เรียกใช้จาก hook หรือ screen ก็ได้
 */

import { OSRM } from '../constants/config.js';

/** ผลลัพธ์ที่ทุกฟังก์ชันในไฟล์นี้คืนออกมา จะมีรูปแบบเดียวกันเสมอ */
function makeRouteResult(coordinates, distanceM, durationS, sourceLabel) {
  return { coordinates, distanceM, durationS, source: sourceLabel };
}

/**
 * เรียก OSRM เพื่อขอเส้นทางจริงบนถนน
 *
 * OSRM ใช้ลำดับ lng,lat (ตรงข้ามกับที่เราคุ้นเคย) จึงต้องสลับตอนส่งและตอนรับ
 *
 * @throws Error ถ้าเครือข่ายล้ม หมดเวลา หรือ OSRM หาเส้นทางไม่ได้
 */
export async function fetchRouteFromOsrm(origin, destination) {
  // OSRM ต้องการรูปแบบ lng,lat;lng,lat
  const coordinatePair = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM.BASE_URL}/${coordinatePair}?overview=full&geometries=geojson`;

  // AbortController ใช้ตัดการเชื่อมต่อถ้าเกินเวลาที่กำหนด
  // ถ้าไม่มีตัวนี้ ผู้ใช้อาจต้องรอค้างเป็นนาทีเมื่อเน็ตช้า
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM.TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`OSRM ตอบกลับด้วยสถานะ ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM หาเส้นทางไม่ได้ (code: ${data.code})`);
    }

    const route = data.routes[0];

    // แปลงกลับจาก [lng, lat] เป็น { lat, lng } ที่แอปเราใช้
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

    return makeRouteResult(coordinates, route.distance, route.duration, 'osrm');
  } finally {
    // ต้องล้าง timer เสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว
    clearTimeout(timeoutId);
  }
}

/**
 * ขอเส้นทาง โดยพยายามใช้ OSRM ก่อน ถ้าไม่ได้ค่อยใช้เส้นทางสำรองในเครื่อง
 *
 * นี่คือฟังก์ชันที่หน้าจอควรเรียกใช้ ไม่ใช่ fetchRouteFromOsrm โดยตรง
 * เพราะฟังก์ชันนี้รับประกันว่าจะได้เส้นทางเสมอ ไม่มีทาง throw
 *
 * @param presetRoute รายการจาก data/presetRoutes.json ที่มี fallbackCoordinates
 * @returns { coordinates, distanceM, durationS, source: 'osrm' | 'offline' }
 */
export async function getRouteWithFallback(presetRoute) {
  const origin = presetRoute.origin;
  const destination = presetRoute.destination;

  try {
    return await fetchRouteFromOsrm(origin, destination);
  } catch (error) {
    // ไม่ throw ต่อ เพราะแอปต้องใช้งานได้แม้ไม่มีอินเทอร์เน็ต (ตามเอกสารบทที่ 6.2)
    console.warn('ดึงเส้นทางจาก OSRM ไม่สำเร็จ ใช้เส้นทางสำรองแทน:', error.message);

    const coordinates = presetRoute.fallbackCoordinates || [origin, destination];

    // เส้นทางสำรองไม่มีข้อมูลระยะทาง/เวลาจริง ส่ง null ไปให้หน้าจอตัดสินใจว่าจะซ่อนหรือแสดงอะไร
    return makeRouteResult(coordinates, null, null, 'offline');
  }
}
```

- [ ] **Step 2: ทดสอบด้วยมือว่าเรียก OSRM ได้จริง**

สร้างไฟล์ชั่วคราวชื่อ `check-osrm.mjs` ที่รากโปรเจค:

```javascript
import { getRouteWithFallback } from './utils/routing.js';
import presetRoutes from './data/presetRoutes.json' with { type: 'json' };

const result = await getRouteWithFallback(presetRoutes[0]);
console.log('แหล่งข้อมูล:', result.source);
console.log('จำนวนพิกัด:', result.coordinates.length);
console.log('ระยะทาง (ม.):', result.distanceM);
console.log('เวลา (วินาที):', result.durationS);
```

Run: `node check-osrm.mjs`
Expected: `แหล่งข้อมูล: osrm` · `จำนวนพิกัด: 471` · `ระยะทาง (ม.): 28394.4`

จากนั้นลบไฟล์ทดสอบทิ้ง: `rm check-osrm.mjs`

- [ ] **Step 3: Commit**

```bash
git add utils/routing.js
git commit -m "feat: เพิ่มการดึงเส้นทางจาก OSRM พร้อมเส้นทางสำรองออฟไลน์"
```

---

## Task 9: hooks/useSavedPoints.js — จุดที่ผู้ใช้บันทึกเอง

**Files:**
- Create: `hooks/useSavedPoints.js`

- [ ] **Step 1: เขียน hooks/useSavedPoints.js**

`hooks/useSavedPoints.js`:

```javascript
/**
 * จัดการจุดเสี่ยงที่ผู้ใช้บันทึกเอง เก็บไว้ในเครื่อง (AsyncStorage)
 *
 * ทำไมต้องเก็บในเครื่อง ไม่ส่งขึ้นเซิร์ฟเวอร์:
 * โปรเจคนี้ไม่มีระบบหลังบ้าน (ตามขอบเขตในเอกสารบทที่ 6.2)
 * แต่การออกแบบฟีเจอร์นี้ไว้ตั้งแต่ต้น ทำให้ต่อยอดเป็นระบบ Crowdsourcing ได้ในอนาคต
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_EMERGENCY, CATEGORIES } from '../constants/config';

export function useSavedPoints() {
  const [savedPoints, setSavedPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /** อ่านข้อมูลจากเครื่องขึ้นมาใส่ state */
  const loadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_POINTS);
      setSavedPoints(raw ? JSON.parse(raw) : []);
    } catch (error) {
      // ถ้าอ่านไม่ได้ ให้เริ่มจากรายการว่าง ดีกว่าทำให้แอปพัง
      console.warn('อ่านจุดที่บันทึกไว้ไม่สำเร็จ:', error.message);
      setSavedPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // โหลดครั้งแรกตอนแอปเปิด
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  /** เขียนลงเครื่องแล้วอัปเดต state ให้ตรงกัน */
  const persist = useCallback(async (points) => {
    setSavedPoints(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_POINTS, JSON.stringify(points));
    } catch (error) {
      console.warn('บันทึกจุดลงเครื่องไม่สำเร็จ:', error.message);
    }
  }, []);

  /**
   * เพิ่มจุดใหม่
   *
   * จุดที่ผู้ใช้บันทึกเองจะมี verified: false เสมอ
   * และ source บอกชัดว่ามาจากผู้ใช้ ไม่ใช่สถิติทางการ
   * เพื่อไม่ให้สับสนกับข้อมูลที่มีแหล่งอ้างอิง (ตามเอกสารบทที่ 6.3)
   */
  const addPoint = useCallback(
    async ({ name, type, description, coordinate }) => {
      const newPoint = {
        id: 'user-' + Date.now(),
        name,
        category: CATEGORIES.ROAD,
        type,
        district: 'บันทึกโดยผู้ใช้',
        coordinate,
        incidents: [],
        peakMonths: [],
        peakHours: [],
        advice: description ? [description] : [],
        emergency: [DEFAULT_EMERGENCY],
        source: 'บันทึกโดยผู้ใช้เอง ไม่ใช่ข้อมูลสถิติทางการ',
        verified: false,
        isUserCreated: true,
        createdAt: new Date().toISOString(),
      };

      await persist([...savedPoints, newPoint]);
      return newPoint;
    },
    [savedPoints, persist]
  );

  /** ลบจุดตาม id */
  const removePoint = useCallback(
    async (id) => {
      await persist(savedPoints.filter((p) => p.id !== id));
    },
    [savedPoints, persist]
  );

  return { savedPoints, isLoading, addPoint, removePoint, reload: loadFromStorage };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useSavedPoints.js
git commit -m "feat: เพิ่ม hook จัดการจุดเสี่ยงที่ผู้ใช้บันทึกเอง"
```

---

## Task 10: hooks/useRiskPoints.js — รวมข้อมูลและคำนวณคะแนน

**Files:**
- Create: `hooks/useRiskPoints.js`

- [ ] **Step 1: เขียน hooks/useRiskPoints.js**

`hooks/useRiskPoints.js`:

```javascript
/**
 * รวมจุดเสี่ยงจากทุกแหล่ง แล้วคำนวณคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 *
 * นี่คือ "แหล่งความจริงเดียว" ของข้อมูลจุดเสี่ยงทั้งแอป
 * ทุกหน้าจอที่ต้องใช้จุดเสี่ยง ให้เรียก hook นี้ ห้ามอ่าน JSON ตรง ๆ เอง
 * เพราะถ้าอ่านเอง จะลืมรวมจุดที่ผู้ใช้บันทึก และลืมคำนวณคะแนน
 */

import { useMemo } from 'react';
import baseRiskPoints from '../data/riskPoints.json';
import { calculateRiskScore, getRiskLevel } from '../utils/riskScore';
import { useSavedPoints } from './useSavedPoints';

/**
 * @param options.now วันเวลาที่ใช้คำนวณ (ใส่ได้เพื่อทดสอบ) ถ้าไม่ใส่ใช้เวลาปัจจุบัน
 * @param options.typeFilter อาเรย์ของประเภทอันตรายที่ต้องการ ถ้าว่างหรือไม่ใส่ = เอาทั้งหมด
 */
export function useRiskPoints(options = {}) {
  const { savedPoints, isLoading } = useSavedPoints();
  const { now, typeFilter } = options;

  const allPoints = useMemo(() => {
    const current = now || new Date();
    const context = {
      month: current.getMonth() + 1, // getMonth() คืน 0-11 ต้อง +1
      hour: current.getHours(),
    };

    // รวมข้อมูลจากไฟล์ JSON กับจุดที่ผู้ใช้บันทึกเอง
    const merged = [...baseRiskPoints, ...savedPoints];

    // เติมคะแนนและระดับความเสี่ยงให้ทุกจุด
    return merged.map((point) => {
      const score = calculateRiskScore(point, context);
      return {
        ...point,
        riskScore: score,
        riskLevel: getRiskLevel(score),
      };
    });
  }, [savedPoints, now]);

  /** กรองตามประเภทอันตราย ใช้กับปุ่มกรองในหน้าแผนที่ */
  const filteredPoints = useMemo(() => {
    if (!typeFilter || typeFilter.length === 0) return allPoints;
    return allPoints.filter((point) => typeFilter.includes(point.type));
  }, [allPoints, typeFilter]);

  /** จุดที่เสี่ยงที่สุดตอนนี้ ใช้แสดงในหน้าแรก */
  const topRiskPoints = useMemo(() => {
    return [...allPoints].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  }, [allPoints]);

  /** ค้นหาตามชื่อ ใช้กับช่องค้นหาในหน้าแรก */
  const searchPoints = useMemo(() => {
    return (keyword) => {
      const trimmed = (keyword || '').trim().toLowerCase();
      if (!trimmed) return [];
      return allPoints.filter(
        (point) =>
          point.name.toLowerCase().includes(trimmed) ||
          point.district.toLowerCase().includes(trimmed)
      );
    };
  }, [allPoints]);

  /** หาจุดเดียวตาม id ใช้ตอนเปิดหน้ารายละเอียด */
  const findPointById = useMemo(() => {
    return (id) => allPoints.find((point) => point.id === id) || null;
  }, [allPoints]);

  return { allPoints, filteredPoints, topRiskPoints, searchPoints, findPointById, isLoading };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useRiskPoints.js
git commit -m "feat: เพิ่ม hook รวมข้อมูลจุดเสี่ยงและคำนวณคะแนนตามเวลาจริง"
```

---

## Task 11: hooks/useUserLocation.js — ติดตามตำแหน่ง GPS

**Files:**
- Create: `hooks/useUserLocation.js`

- [ ] **Step 1: เขียน hooks/useUserLocation.js**

`hooks/useUserLocation.js`:

```javascript
/**
 * ขอสิทธิ์เข้าถึงตำแหน่ง และติดตามตำแหน่งผู้ใช้
 *
 * ข้อจำกัดที่ต้องรู้:
 * Expo Go บน Android ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง (background service)
 * ดังนั้นโหมดเดินทางต้องเปิดแอปค้างไว้ ซึ่งไม่กระทบการใช้งานจริง
 * เพราะผู้ใช้จะตั้งมือถือไว้บนแฮนด์อยู่แล้วขณะขับขี่
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { DISTANCE } from '../constants/config';

/**
 * @param options.watch ถ้าเป็น true จะติดตามตำแหน่งต่อเนื่อง ถ้า false จะดึงครั้งเดียว
 */
export function useUserLocation({ watch = false } = {}) {
  const [location, setLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // เก็บ subscription ไว้เพื่อยกเลิกตอน component ถูกถอด
  const subscriptionRef = useRef(null);

  /** แปลงผลลัพธ์จาก expo-location ให้เป็นรูปแบบ { lat, lng } ที่แอปเราใช้ทั้งระบบ */
  function toAppCoordinate(result) {
    return {
      lat: result.coords.latitude,
      lng: result.coords.longitude,
      accuracy: result.coords.accuracy,
    };
  }

  /** ดึงตำแหน่งปัจจุบันครั้งเดียว ใช้กับปุ่ม "ดึงพิกัดปัจจุบัน" */
  const fetchCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในการตั้งค่า');
        return null;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinate = toAppCoordinate(result);
      setLocation(coordinate);
      setErrorMessage(null);
      return coordinate;
    } catch (error) {
      setErrorMessage('ดึงตำแหน่งไม่สำเร็จ: ' + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ติดตามตำแหน่งต่อเนื่อง เมื่อ watch เป็น true
  useEffect(() => {
    if (!watch) {
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;

    async function startWatching() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (!isCancelled) {
            setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในการตั้งค่า');
            setIsLoading(false);
          }
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            // อัปเดตเมื่อขยับเกิน 50 เมตร แทนการอัปเดตตามเวลา
            // ช่วยประหยัดแบตเตอรี่มาก เพราะตอนรถติดจะไม่อัปเดตถี่ ๆ โดยเปล่าประโยชน์
            distanceInterval: DISTANCE.MIN_MOVEMENT_UPDATE,
          },
          (result) => {
            if (!isCancelled) {
              setLocation(toAppCoordinate(result));
              setIsLoading(false);
            }
          }
        );

        if (isCancelled) {
          subscription.remove();
        } else {
          subscriptionRef.current = subscription;
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage('ติดตามตำแหน่งไม่สำเร็จ: ' + error.message);
          setIsLoading(false);
        }
      }
    }

    startWatching();

    // สำคัญ: ต้องหยุดติดตามเมื่อออกจากหน้าจอ
    // ไม่งั้น GPS จะทำงานค้างและกินแบตต่อไปเรื่อย ๆ แม้ผู้ใช้ออกจากโหมดเดินทางแล้ว
    return () => {
      isCancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [watch]);

  return { location, errorMessage, isLoading, fetchCurrentLocation };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useUserLocation.js
git commit -m "feat: เพิ่ม hook ขอสิทธิ์และติดตามตำแหน่ง GPS"
```

---

## Task 12: components/AppMap — แผนที่ที่ทำงานได้ทั้งมือถือและเว็บ

**Files:**
- Create: `components/AppMap.native.js`
- Create: `components/AppMap.web.js`

> **นี่คือไฟล์ที่สำคัญที่สุดของโปรเจค** และเป็นเหตุผลที่แอปรันได้ทั้งสองแพลตฟอร์ม
>
> `react-native-maps` ทำงานบนเว็บไม่ได้ ถ้า import มันไว้ในไฟล์ที่เว็บต้องโหลด
> Snack เว็บจะพังทันทีด้วยข้อความ `Unable to fetch module snackager-1/react-native-maps for web`
>
> วิธีแก้คือใช้ **platform extension** ของ Metro:
> - เวลารันบนมือถือ Metro จะหยิบ `AppMap.native.js`
> - เวลารันบนเว็บ Metro จะหยิบ `AppMap.web.js`
> - หน้าจอทุกหน้าเขียนแค่ `import AppMap from '../components/AppMap'` (ไม่ต้องใส่นามสกุล)
>
> ทั้งสองไฟล์ **ต้องรับ props ชุดเดียวกันเป๊ะ** ไม่งั้นหน้าจอจะทำงานได้แค่แพลตฟอร์มเดียว
>
> วิธีนี้ทดสอบจริงแล้วเมื่อ 2026-09-05: Leaflet เรนเดอร์ใน react-native-web ได้
> แสดง tile แผนที่หาดใหญ่-สงขลา หมุดสี เส้นทาง และกดหมุดแล้ว React state อัปเดตถูกต้อง ไม่มี console error

### สัญญา props ที่ทั้งสองไฟล์ต้องทำตาม

| prop | ชนิด | ความหมาย |
|---|---|---|
| `region` | `{ latitude, longitude, latitudeDelta, longitudeDelta }` | ตำแหน่งและระดับซูมของกล้อง |
| `markers` | `[{ id, lat, lng, color, label }]` | หมุดบนแผนที่ |
| `polyline` | `[{ lat, lng }]` หรือ `null` | เส้นทาง |
| `userLocation` | `{ lat, lng }` หรือ `null` | ตำแหน่งผู้ใช้ |
| `onMarkerPress` | `(id) => void` | เรียกเมื่อกดหมุด |
| `style` | object | สไตล์ของกล่องแผนที่ |

- [ ] **Step 1: เขียน components/AppMap.native.js**

`components/AppMap.native.js`:

```javascript
/**
 * แผนที่สำหรับมือถือ (Android / iOS) ใช้ react-native-maps
 *
 * ไฟล์นี้จะถูกใช้อัตโนมัติเมื่อรันบน Expo Go
 * เวลารันบนเว็บ Metro จะข้ามไฟล์นี้ไปใช้ AppMap.web.js แทน
 *
 * ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.web.js ให้ตรงกัน
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS } from '../constants/theme';

export default function AppMap({
  region,
  markers = [],
  polyline = null,
  userLocation = null,
  onMarkerPress,
  style,
}) {
  return (
    <MapView
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      region={region}
      showsUserLocation={Boolean(userLocation)}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {/* วาดเส้นทางก่อนหมุด เพื่อให้หมุดอยู่ทับด้านบนเส้น */}
      {polyline && polyline.length > 1 && (
        <Polyline
          coordinates={polyline.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
          strokeColor={COLORS.primary}
          strokeWidth={4}
        />
      )}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.lat, longitude: marker.lng }}
          title={marker.label}
          onPress={() => onMarkerPress && onMarkerPress(marker.id)}
        >
          {/* วาดหมุดเอง แทนหมุดมาตรฐาน เพื่อให้สีตรงกับฝั่งเว็บเป๊ะ ๆ */}
          <View style={[styles.pin, { backgroundColor: marker.color }]} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
```

- [ ] **Step 2: เขียน components/AppMap.web.js**

`components/AppMap.web.js`:

```javascript
/**
 * แผนที่สำหรับเว็บ ใช้ Leaflet โหลดจาก CDN
 *
 * ทำไมต้องใช้ Leaflet: react-native-maps ทำงานบนเว็บไม่ได้เลย
 * และ Leaflet ใช้แผนที่ OpenStreetMap ซึ่งฟรี ไม่ต้องใช้ API key เหมือน Google Maps
 *
 * เทคนิคสำคัญ: React.createElement('div', ...)
 * react-native-web เรนเดอร์ผ่าน React DOM อยู่แล้ว การเขียน tag เป็นสตริงตัวเล็ก
 * จะได้ DOM element จริง ๆ ออกมา ทำให้ Leaflet เข้ามาควบคุมได้
 * (ทดสอบยืนยันแล้วเมื่อ 2026-09-05 ว่าใช้ได้จริง)
 *
 * ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.native.js ให้ตรงกัน
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * โหลดไลบรารี Leaflet เข้ามาในหน้าเว็บ
 *
 * เก็บ Promise ไว้ที่ window เพื่อให้โหลดแค่ครั้งเดียว
 * ถึงจะมีแผนที่หลายหน้าจอ ก็ใช้สคริปต์ตัวเดียวกัน ไม่โหลดซ้ำ
 */
function loadLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('ไม่ได้อยู่ในเบราว์เซอร์'));
  }
  if (window.__antacinnLeafletPromise) {
    return window.__antacinnLeafletPromise;
  }

  window.__antacinnLeafletPromise = new Promise((resolve, reject) => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = LEAFLET_CSS;
    document.head.appendChild(stylesheet);

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('โหลดไลบรารีแผนที่จาก CDN ไม่สำเร็จ'));
    document.head.appendChild(script);
  });

  return window.__antacinnLeafletPromise;
}

/** แปลง latitudeDelta ของ react-native-maps เป็นระดับซูมของ Leaflet โดยประมาณ */
function deltaToZoom(latitudeDelta) {
  if (latitudeDelta >= 0.5) return 9;
  if (latitudeDelta >= 0.2) return 11;
  if (latitudeDelta >= 0.05) return 13;
  if (latitudeDelta >= 0.01) return 15;
  return 16;
}

export default function AppMap({
  region,
  markers = [],
  polyline = null,
  userLocation = null,
  onMarkerPress,
  style,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [loadError, setLoadError] = useState(null);

  // ต้องเก็บ "แผนที่พร้อมแล้วหรือยัง" ไว้ใน state ไม่ใช่แค่ใน ref
  //
  // เหตุผล: Leaflet โหลดจาก CDN แบบ async กว่าแผนที่จะถูกสร้างเสร็จ
  // effect ที่วาดหมุดได้ทำงานไปแล้วรอบหนึ่งและออกไปตั้งแต่ต้นเพราะ mapRef ยังว่าง
  // การกำหนดค่าให้ ref ไม่ทำให้ React วาดใหม่ effect วาดหมุดจึงไม่ถูกเรียกอีกเลย
  // ผลคือได้แผนที่เปล่า ๆ ที่ไม่มีหมุดสักอัน โดยไม่มี error ให้เห็น
  // การใช้ state ทำให้เกิดการวาดใหม่ แล้ว effect ทุกตัวที่พึ่งแผนที่จะได้ทำงาน
  const [isMapReady, setIsMapReady] = useState(false);

  // สร้างแผนที่ครั้งเดียวตอน component ถูกสร้าง
  useEffect(() => {
    let isCancelled = false;

    loadLeaflet()
      .then((L) => {
        if (isCancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current).setView(
          [region.latitude, region.longitude],
          deltaToZoom(region.latitudeDelta)
        );

        L.tileLayer(OSM_TILES, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // ใช้ layerGroup เพื่อล้างหมุดเก่าทั้งชุดได้ในคำสั่งเดียว
        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // บอก React ว่าแผนที่พร้อมแล้ว เพื่อให้ effect ที่วาดหมุดและเส้นทางได้ทำงาน
        setIsMapReady(true);
      })
      .catch((error) => {
        if (!isCancelled) setLoadError(error.message);
      });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // ตั้งใจให้ทำงานครั้งเดียว ส่วนการอัปเดต region อยู่ใน effect ถัดไป
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ย้ายกล้องเมื่อ region เปลี่ยน
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(
      [region.latitude, region.longitude],
      deltaToZoom(region.latitudeDelta)
    );
  }, [isMapReady, region.latitude, region.longitude, region.latitudeDelta]);

  // วาดหมุดใหม่ทุกครั้งที่รายการหมุดเปลี่ยน
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      L.circleMarker([marker.lat, marker.lng], {
        radius: 9,
        color: COLORS.white,
        weight: 2,
        fillColor: marker.color,
        fillOpacity: 1,
      })
        .bindTooltip(marker.label || '')
        .on('click', () => onMarkerPress && onMarkerPress(marker.id))
        .addTo(markerLayerRef.current);
    });
  }, [isMapReady, markers, onMarkerPress]);

  // วาดเส้นทางใหม่เมื่อเส้นทางเปลี่ยน
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (polyline && polyline.length > 1) {
      polylineRef.current = L.polyline(
        polyline.map((c) => [c.lat, c.lng]),
        { color: COLORS.primary, weight: 4 }
      ).addTo(mapRef.current);
    }
  }, [isMapReady, polyline]);

  // จุดสีฟ้าแสดงตำแหน่งผู้ใช้
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 7,
        color: COLORS.white,
        weight: 3,
        fillColor: '#1E88E5',
        fillOpacity: 1,
      }).addTo(mapRef.current);
    }
  }, [isMapReady, userLocation]);

  // ถ้าโหลด Leaflet ไม่ได้ (เช่น CDN ถูกบล็อก) ต้องบอกผู้ใช้ ไม่ใช่แสดงกล่องว่างเปล่า
  if (loadError) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>แสดงแผนที่ไม่ได้</Text>
        <Text style={styles.fallbackText}>{loadError}</Text>
        <Text style={styles.fallbackText}>
          ลองเปิดบนมือถือผ่านแอป Expo Go แทน หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        </Text>
      </View>
    );
  }

  // นี่คือหัวใจ: สร้าง div จริงในหน้าเว็บ ให้ Leaflet เข้ามาควบคุม
  return (
    <View style={[styles.wrapper, style]}>
      {React.createElement('div', {
        ref: containerRef,
        style: { width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  fallbackTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fallbackText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/AppMap.native.js components/AppMap.web.js
git commit -m "feat: เพิ่มแผนที่ที่ทำงานได้ทั้งมือถือ (react-native-maps) และเว็บ (Leaflet)"
```

---

## Task 13: components ที่ใช้ซ้ำ

**Files:**
- Create: `components/RiskBadge.js`
- Create: `components/RiskPointCard.js`
- Create: `components/FilterChips.js`
- Create: `components/Disclaimer.js`
- Create: `components/EmergencyButton.js`
- Create: `components/ScreenHeader.js`

- [ ] **Step 1: เขียน components/RiskBadge.js**

`components/RiskBadge.js`:

```javascript
/**
 * ป้ายสีแสดงระดับความเสี่ยง เช่น "เสี่ยง · 43"
 *
 * ใช้ซ้ำทุกที่ที่ต้องแสดงคะแนน เพื่อให้หน้าตาเหมือนกันทั้งแอป
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function RiskBadge({ riskLevel, score, size = 'normal' }) {
  const isLarge = size === 'large';

  return (
    <View
      style={[styles.badge, { backgroundColor: riskLevel.color }, isLarge && styles.badgeLarge]}
    >
      <Text style={[styles.text, isLarge && styles.textLarge]}>
        {riskLevel.label} · {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  badgeLarge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
  },
  textLarge: {
    fontSize: FONT_SIZES.subtitle,
  },
});
```

- [ ] **Step 2: เขียน components/RiskPointCard.js**

`components/RiskPointCard.js`:

```javascript
/**
 * การ์ดแสดงจุดเสี่ยงหนึ่งจุด ใช้ในหน้าแรกและหน้าวางแผนเส้นทาง
 *
 * แสดง: ไอคอนประเภท ชื่อจุด อำเภอ ป้ายคะแนน และระยะทาง (ถ้ามี)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import RiskBadge from './RiskBadge';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** หาไอคอนและป้ายชื่อของประเภทอันตราย */
function getHazardInfo(typeId) {
  return HAZARD_TYPES.find((h) => h.id === typeId) || { icon: '📍', label: 'ไม่ระบุ' };
}

export default function RiskPointCard({ point, distanceLabel, onPress }) {
  const hazard = getHazardInfo(point.type);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{hazard.icon}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {point.name}
        </Text>
        {distanceLabel && <Text style={styles.distance}>{distanceLabel}</Text>}
      </View>

      <Text style={styles.meta}>
        {point.district} · {hazard.label}
      </Text>

      <View style={styles.footer}>
        <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} />
        {/* จุดที่ยังไม่ยืนยันแหล่งที่มา ต้องบอกให้ชัด ไม่ให้เข้าใจผิดว่าเป็นสถิติทางการ */}
        {!point.verified && <Text style={styles.unverified}>⚠️ ยังไม่ยืนยัน</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  cardPressed: {
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: FONT_SIZES.title,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  distance: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  unverified: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
});
```

- [ ] **Step 3: เขียน components/FilterChips.js**

`components/FilterChips.js`:

```javascript
/**
 * แถวชิปให้เลือกประเภทอันตราย
 *
 * ใช้ 2 ที่:
 *   - หน้าแผนที่: เลือกได้หลายอันพร้อมกัน เพื่อกรองหมุด
 *   - หน้าบันทึกจุด: ส่ง singleSelect เป็น true เพื่อให้เลือกได้ทีละอัน
 */

import React from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function FilterChips({ selectedIds, onChange, singleSelect = false }) {
  function toggle(typeId) {
    if (singleSelect) {
      onChange([typeId]);
      return;
    }

    if (selectedIds.includes(typeId)) {
      onChange(selectedIds.filter((id) => id !== typeId));
    } else {
      onChange([...selectedIds, typeId]);
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {HAZARD_TYPES.map((hazard) => {
        const isSelected = selectedIds.includes(hazard.id);
        return (
          <Pressable
            key={hazard.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggle(hazard.id)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {hazard.icon} {hazard.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  labelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: เขียน components/Disclaimer.js**

`components/Disclaimer.js`:

```javascript
/**
 * แถบข้อความปฏิเสธความรับผิดชอบ
 *
 * ตามเอกสารข้อ 7.4: ต้องแสดงในหน้าหลักและหน้ารายละเอียด
 * เพื่อชี้แจงว่าแอปนี้เป็นเครื่องมือประกอบการตัดสินใจ ไม่ใช่ระบบเตือนภัยทางการ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DISCLAIMER_TEXT, UNVERIFIED_TEXT } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/**
 * @param variant 'general' = ข้อความทั่วไป, 'unverified' = เตือนว่าจุดนี้ยังไม่ยืนยันแหล่งที่มา
 */
export default function Disclaimer({ variant = 'general' }) {
  const text = variant === 'unverified' ? UNVERIFIED_TEXT : DISCLAIMER_TEXT;

  return (
    <View style={styles.box}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warningBorder,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
});
```

- [ ] **Step 5: เขียน components/EmergencyButton.js**

`components/EmergencyButton.js`:

```javascript
/**
 * ปุ่มโทรฉุกเฉิน กดแล้วเปิดแอปโทรศัพท์พร้อมเบอร์ที่กรอกไว้
 *
 * ใช้ Linking ของ React Native ซึ่งทำงานได้ทั้งบนมือถือและเว็บ
 */

import React from 'react';
import { Text, Pressable, Linking, Alert, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function EmergencyButton({ label, tel }) {
  async function handlePress() {
    const url = 'tel:' + tel;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
      }
    } catch (error) {
      Alert.alert('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handlePress}
    >
      <Text style={styles.text}>
        📞 โทร {tel} · {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 6: เขียน components/ScreenHeader.js**

`components/ScreenHeader.js`:

```javascript
/**
 * หัวข้อสีกรมท่าด้านบนของแต่ละหน้า ตามม็อกอัพในเอกสาร
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

export default function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.heading,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.85,
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add components/RiskBadge.js components/RiskPointCard.js components/FilterChips.js components/Disclaimer.js components/EmergencyButton.js components/ScreenHeader.js
git commit -m "feat: เพิ่ม component ที่ใช้ซ้ำ (ป้ายคะแนน การ์ดจุด ชิปกรอง disclaimer ปุ่มโทร หัวข้อ)"
```

---

## Task 14: screens/HomeScreen.js — หน้าแรก

**Files:**
- Create: `screens/HomeScreen.js`

- [ ] **Step 1: เขียน screens/HomeScreen.js**

`screens/HomeScreen.js`:

```javascript
/**
 * หน้าแรก — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้ยังอยู่บ้าน กำลังวางแผน จึงเน้นให้เห็นภาพรวมเร็วที่สุด:
 *   1. ช่องค้นหาสถานที่
 *   2. แถบสรุปว่าเดือนนี้ต้องระวังอะไรเป็นพิเศษ
 *   3. การ์ดจุดที่ควรระวังมากที่สุดตอนนี้
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import RiskPointCard from '../components/RiskPointCard';
import Disclaimer from '../components/Disclaimer';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** ชื่อเดือนภาษาไทย ใช้แสดงในแถบสรุป (index 0 = มกราคม) */
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const { allPoints, topRiskPoints, searchPoints } = useRiskPoints();

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthName = THAI_MONTHS[currentMonth - 1];

  // นับว่ามีกี่จุดที่เดือนนี้เป็นเดือนเสี่ยงสูง
  const pointsPeakingThisMonth = allPoints.filter((point) =>
    (point.peakMonths || []).includes(currentMonth)
  );

  const searchResults = searchPoints(keyword);
  const isSearching = keyword.trim().length > 0;

  function openDetail(pointId) {
    navigation.navigate('RiskDetail', { pointId });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="AntacinnHelp" subtitle="รู้ก่อนไป ว่าตรงไหนต้องระวัง" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.searchBox}
          placeholder="ค้นหาสถานที่ เช่น หาดสมิหลา"
          placeholderTextColor={COLORS.textMuted}
          value={keyword}
          onChangeText={setKeyword}
        />

        {isSearching ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ผลการค้นหา ({searchResults.length})</Text>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>
                ไม่พบสถานที่ที่ตรงกับคำค้นหา ลองพิมพ์ชื่ออำเภอ เช่น หาดใหญ่
              </Text>
            ) : (
              searchResults.map((point) => (
                <RiskPointCard
                  key={point.id}
                  point={point}
                  onPress={() => openDetail(point.id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ช่วง{monthName}นี้ต้องระวังเป็นพิเศษ</Text>
              <Text style={styles.seasonText}>
                {pointsPeakingThisMonth.length > 0
                  ? `มี ${pointsPeakingThisMonth.length} จุดที่อยู่ในช่วงเสี่ยงสูงของปี ควรเพิ่มความระมัดระวัง`
                  : 'เดือนนี้ไม่มีจุดใดที่อยู่ในช่วงเสี่ยงสูงเป็นพิเศษ แต่ยังควรระวังตามปกติ'}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>จุดที่ควรระวังมากที่สุดตอนนี้</Text>
                <Pressable onPress={() => navigation.navigate('Map')}>
                  <Text style={styles.link}>ดูแผนที่ทั้งหมด</Text>
                </Pressable>
              </View>

              {topRiskPoints.map((point) => (
                <RiskPointCard
                  key={point.id}
                  point={point}
                  onPress={() => openDetail(point.id)}
                />
              ))}
            </View>
          </>
        )}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  seasonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/HomeScreen.js
git commit -m "feat: เพิ่มหน้าแรก พร้อมช่องค้นหาและสรุปความเสี่ยงประจำเดือน"
```

---

## Task 15: screens/MapScreen.js — แผนที่เต็มจอ

**Files:**
- Create: `screens/MapScreen.js`

- [ ] **Step 1: เขียน screens/MapScreen.js**

`screens/MapScreen.js`:

```javascript
/**
 * หน้าแผนที่ — เห็นภาพรวมว่าบริเวณไหนควรระวัง
 *
 * หมุดจะเปลี่ยนสีตามคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 * เช่น จุดที่อันตรายเฉพาะกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import FilterChips from '../components/FilterChips';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function MapScreen({ navigation }) {
  const [typeFilter, setTypeFilter] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);

  const { filteredPoints } = useRiskPoints({ typeFilter });
  const { location, fetchCurrentLocation } = useUserLocation();

  /** แปลงจุดเสี่ยงให้อยู่ในรูปแบบที่ AppMap ต้องการ */
  const markers = filteredPoints.map((point) => ({
    id: point.id,
    lat: point.coordinate.lat,
    lng: point.coordinate.lng,
    color: point.riskLevel.color,
    label: point.name,
  }));

  /** ปุ่มกลับมาที่ตำแหน่งตัวเอง */
  async function goToMyLocation() {
    const coordinate = await fetchCurrentLocation();
    if (coordinate) {
      setRegion({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.filterBar}>
        <FilterChips selectedIds={typeFilter} onChange={setTypeFilter} />
        <Text style={styles.countText}>แสดง {filteredPoints.length} จุด</Text>
      </View>

      <View style={styles.mapContainer}>
        <AppMap
          region={region}
          markers={markers}
          userLocation={location}
          onMarkerPress={(pointId) => navigation.navigate('RiskDetail', { pointId })}
        />

        <Pressable style={styles.locateButton} onPress={goToMyLocation}>
          <Text style={styles.locateIcon}>📍</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  mapContainer: {
    flex: 1,
  },
  locateButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locateIcon: {
    fontSize: FONT_SIZES.title,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/MapScreen.js
git commit -m "feat: เพิ่มหน้าแผนที่ พร้อมตัวกรองประเภทและปุ่มกลับตำแหน่งตัวเอง"
```

---

## Task 16: screens/RiskDetailScreen.js — รายละเอียดจุดเสี่ยง

**Files:**
- Create: `screens/RiskDetailScreen.js`

- [ ] **Step 1: เขียน screens/RiskDetailScreen.js**

`screens/RiskDetailScreen.js`:

```javascript
/**
 * หน้ารายละเอียดจุดเสี่ยง — ระยะ "ถึงปลายทาง"
 *
 * ผู้ใช้อยู่หน้างานจริงแล้ว ต้องการรู้ว่า "ต้องทำตัวยังไงเมื่ออยู่ตรงนั้น"
 * จึงเน้นข้อเสนอแนะเชิงปฏิบัติ และปุ่มโทรฉุกเฉินที่กดได้ทันที
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RiskBadge from '../components/RiskBadge';
import Disclaimer from '../components/Disclaimer';
import EmergencyButton from '../components/EmergencyButton';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { summarizeIncidents } from '../utils/format';
import { SEVERITY_LABELS, HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** แปลงรายการเดือนเป็นข้อความอ่านง่าย */
function describeMonths(peakMonths) {
  if (!peakMonths || peakMonths.length === 0) return 'ยังไม่ระบุ';
  if (peakMonths.length === 12) return 'ตลอดทั้งปี';
  return peakMonths.map((m) => THAI_MONTHS_SHORT[m - 1]).join(' · ');
}

/** แปลงรายการชั่วโมงเป็นช่วงเวลา เช่น "17:00-20:00" */
function describeHours(peakHours) {
  if (!peakHours || peakHours.length === 0) return 'ยังไม่ระบุ';
  const sorted = [...peakHours].sort((a, b) => a - b);
  const first = String(sorted[0]).padStart(2, '0');
  // +1 เพราะชั่วโมง 20 หมายถึงช่วง 20:00-21:00 จึงจบที่ 21:00
  const last = String(sorted[sorted.length - 1] + 1).padStart(2, '0');
  return `${first}:00-${last}:00`;
}

export default function RiskDetailScreen({ route }) {
  const { pointId } = route.params;
  const { findPointById } = useRiskPoints();
  const point = findPointById(pointId);

  // กันกรณีหาจุดไม่เจอ เช่น ผู้ใช้ลบจุดที่บันทึกเองไปแล้วแต่ยังเปิดหน้านี้ค้างอยู่
  if (!point) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.notFound}>ไม่พบข้อมูลจุดเสี่ยงนี้</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hazard = HAZARD_TYPES.find((h) => h.id === point.type) || { icon: '📍', label: 'ไม่ระบุ' };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>
          {hazard.icon} {point.name}
        </Text>
        <Text style={styles.meta}>
          {point.district} · {hazard.label}
        </Text>

        <View style={styles.badgeRow}>
          <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} size="large" />
        </View>

        {/* จุดที่ยังไม่ยืนยันแหล่งที่มา ต้องเตือนก่อนที่ผู้ใช้จะอ่านสถิติ */}
        {!point.verified && <Disclaimer variant="unverified" />}

        <Text style={styles.sectionTitle}>สถิติย้อนหลัง</Text>
        <Text style={styles.summary}>{summarizeIncidents(point.incidents)}</Text>

        {point.incidents.length > 0 && (
          <View style={styles.table}>
            {point.incidents.map((incident, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableYear}>พ.ศ. {incident.year}</Text>
                <Text style={styles.tableSeverity}>{SEVERITY_LABELS[incident.severity]}</Text>
                <Text style={styles.tableCount}>{incident.count}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>ช่วงที่ต้องระวังเป็นพิเศษ</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>เดือน</Text>
          <Text style={styles.infoValue}>{describeMonths(point.peakMonths)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ช่วงเวลา</Text>
          <Text style={styles.infoValue}>{describeHours(point.peakHours)}</Text>
        </View>

        <Text style={styles.sectionTitle}>สิ่งที่ควรทำ</Text>
        {point.advice && point.advice.length > 0 ? (
          point.advice.map((line, index) => (
            <Text key={index} style={styles.adviceItem}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>ยังไม่มีคำแนะนำสำหรับจุดนี้</Text>
        )}

        <Text style={styles.sectionTitle}>แหล่งอ้างอิง</Text>
        <Text style={styles.sourceText}>{point.source}</Text>

        <Text style={styles.sectionTitle}>ติดต่อฉุกเฉิน</Text>
        {point.emergency.map((contact, index) => (
          <EmergencyButton key={index} label={contact.label} tel={contact.tel} />
        ))}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  name: {
    fontSize: FONT_SIZES.heading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  badgeRow: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  summary: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  table: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableYear: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  tableSeverity: {
    flex: 2,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  tableCount: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    width: 90,
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  adviceItem: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  sourceText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  notFound: {
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/RiskDetailScreen.js
git commit -m "feat: เพิ่มหน้ารายละเอียดจุดเสี่ยง พร้อมสถิติ คำแนะนำ และปุ่มโทรฉุกเฉิน"
```

---

## Task 17: screens/RoutePlannerScreen.js — วางแผนเส้นทาง

**Files:**
- Create: `screens/RoutePlannerScreen.js`

- [ ] **Step 1: เขียน screens/RoutePlannerScreen.js**

`screens/RoutePlannerScreen.js`:

```javascript
/**
 * หน้าวางแผนเส้นทาง — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้เลือกเส้นทาง แล้วเห็นล่วงหน้าว่าจะเจอจุดเสี่ยงอะไรบ้างระหว่างทาง
 * เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่เรียงตามความใกล้เส้นทาง
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import RiskPointCard from '../components/RiskPointCard';
import RiskBadge from '../components/RiskBadge';
import presetRoutes from '../data/presetRoutes.json';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { getRouteWithFallback } from '../utils/routing';
import { findRiskPointsAlongRoute, calculateRouteRiskScore } from '../utils/routeAnalysis';
import { getRiskLevel } from '../utils/riskScore';
import { formatDistance, formatDuration } from '../utils/format';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function RoutePlannerScreen({ navigation }) {
  const [selectedRouteId, setSelectedRouteId] = useState(presetRoutes[0].id);
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { allPoints } = useRiskPoints();

  const selectedRoute = presetRoutes.find((r) => r.id === selectedRouteId);

  // ดึงเส้นทางใหม่ทุกครั้งที่ผู้ใช้เลือกเส้นทางอื่น
  useEffect(() => {
    let isCancelled = false;

    async function loadRoute() {
      setIsLoading(true);
      const result = await getRouteWithFallback(selectedRoute);
      if (!isCancelled) {
        setRouteResult(result);
        setIsLoading(false);
      }
    }

    loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [selectedRouteId, selectedRoute]);

  // หาจุดเสี่ยงบนเส้นทาง เรียงตามลำดับที่จะขับผ่าน
  const pointsOnRoute = routeResult
    ? findRiskPointsAlongRoute(routeResult.coordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD)
    : [];

  // คะแนนความปลอดภัยรวมของเส้นทาง ตามที่เอกสารบทที่ 4 กำหนดให้หน้านี้ต้องแสดง
  const routeRiskScore = calculateRouteRiskScore(pointsOnRoute);
  const routeRiskLevel = getRiskLevel(routeRiskScore);

  const markers = pointsOnRoute.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  // จัดกล้องให้เห็นทั้งเส้นทาง โดยวางกึ่งกลางระหว่างต้นทางกับปลายทาง
  const region = {
    latitude: (selectedRoute.origin.lat + selectedRoute.destination.lat) / 2,
    longitude: (selectedRoute.origin.lng + selectedRoute.destination.lng) / 2,
    latitudeDelta: Math.abs(selectedRoute.origin.lat - selectedRoute.destination.lat) * 2 + 0.05,
    longitudeDelta: Math.abs(selectedRoute.origin.lng - selectedRoute.destination.lng) * 2 + 0.05,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ชิปเลือกเส้นทาง */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {presetRoutes.map((preset) => {
          const isSelected = preset.id === selectedRouteId;
          return (
            <Pressable
              key={preset.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedRouteId(preset.id)}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapContainer}>
        <AppMap
          region={region}
          markers={markers}
          polyline={routeResult ? routeResult.coordinates : null}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>กำลังหาเส้นทาง...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                พบจุดเสี่ยง {pointsOnRoute.length} จุดบนเส้นทางนี้
              </Text>
              {routeResult && routeResult.distanceM !== null && (
                <Text style={styles.summaryMeta}>
                  {formatDistance(routeResult.distanceM)} · {formatDuration(routeResult.durationS)}
                </Text>
              )}

              {/* คะแนนความปลอดภัยรวมของทั้งเส้นทาง */}
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>คะแนนความเสี่ยงรวมของเส้นทาง</Text>
                <RiskBadge riskLevel={routeRiskLevel} score={routeRiskScore} />
              </View>
            </View>

            {/* บอกผู้ใช้ตรง ๆ ว่ากำลังใช้เส้นทางสำรอง จะได้ไม่เข้าใจผิดว่าเป็นเส้นทางจริง */}
            {routeResult && routeResult.source === 'offline' && (
              <Text style={styles.offlineNote}>
                ⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ กำลังแสดงเส้นทางโดยประมาณที่เก็บไว้ในเครื่อง
              </Text>
            )}

            {pointsOnRoute.map((item) => (
              <RiskPointCard
                key={item.point.id}
                point={item.point}
                distanceLabel={formatDistance(item.distanceAlongRouteM)}
                onPress={() => navigation.navigate('RiskDetail', { pointId: item.point.id })}
              />
            ))}

            <Pressable
              style={styles.startButton}
              onPress={() => navigation.navigate('TripMode')}
            >
              <Text style={styles.startButtonText}>เริ่มโหมดเดินทาง</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chipRow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  chipLabelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mapContainer: {
    height: 240,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  summaryRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryMeta: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  offlineNote: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/RoutePlannerScreen.js
git commit -m "feat: เพิ่มหน้าวางแผนเส้นทาง แสดงจุดเสี่ยงเรียงตามลำดับการเดินทาง"
```

---

## Task 18: screens/TripModeScreen.js — โหมดเดินทาง

**Files:**
- Create: `screens/TripModeScreen.js`

> หน้านี้ออกแบบต่างจากหน้าอื่นทั้งหมด เพราะ **ผู้ใช้กำลังขับรถอยู่**
> ตัวอักษรต้องใหญ่ สีต้องชัด และข้อมูลสำคัญต้องอ่านได้ภายใน 1 วินาที

- [ ] **Step 1: เขียน screens/TripModeScreen.js**

`screens/TripModeScreen.js`:

```javascript
/**
 * โหมดเดินทาง — ระยะ "ระหว่างการเดินทาง"
 *
 * ระบบติดตาม GPS แล้วเตือนอัตโนมัติเมื่อเข้าใกล้จุดเสี่ยงในระยะ 500 เมตร
 *
 * ข้อจำกัดที่ต้องบอกผู้ใช้: ต้องเปิดแอปค้างไว้
 * เพราะ Expo Go ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { evaluateTripAlerts } from '../utils/tripAlerts';
import { formatDistance } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const ALERT_CONFIG = {
  triggerM: DISTANCE.ALERT_TRIGGER,
  resetM: DISTANCE.ALERT_RESET,
  boundingBoxM: DISTANCE.BOUNDING_BOX_FILTER,
};

export default function TripModeScreen({ navigation }) {
  const { allPoints } = useRiskPoints();
  const { location, errorMessage } = useUserLocation({ watch: true });

  // การ์ดเตือนที่กำลังแสดงอยู่ตอนนี้ (แสดงทีละใบ ไม่ให้ผู้ใช้สับสน)
  const [currentAlert, setCurrentAlert] = useState(null);
  // จุดที่อยู่ในระยะเฝ้าระวัง ใช้แสดง "กำลังเฝ้าระวัง N จุด"
  const [nearbyPoints, setNearbyPoints] = useState([]);
  // ประวัติการเตือนในทริปนี้ แสดงเป็นรายการด้านล่าง
  const [alertHistory, setAlertHistory] = useState([]);

  // เก็บ id ที่เตือนไปแล้วไว้ใน ref ไม่ใช่ state
  // เพราะถ้าใช้ state จะทำให้ effect วนซ้ำไม่รู้จบ (state เปลี่ยน -> effect ทำงาน -> state เปลี่ยน)
  const alertedIdsRef = useRef(new Set());

  // ทุกครั้งที่ GPS อัปเดต ให้ประเมินใหม่ว่าควรเตือนอะไร
  useEffect(() => {
    if (!location) return;

    const result = evaluateTripAlerts(location, allPoints, alertedIdsRef.current, ALERT_CONFIG);

    alertedIdsRef.current = result.alertedIds;
    setNearbyPoints(result.nearbyPoints);

    if (result.newAlerts.length > 0) {
      // ถ้ามีหลายจุดพร้อมกัน ให้แสดงจุดที่ใกล้ที่สุดก่อน
      const closest = result.newAlerts.reduce((a, b) => (a.distanceM <= b.distanceM ? a : b));
      setCurrentAlert(closest);
      setAlertHistory((history) => [closest, ...history]);
    }
  }, [location, allPoints]);

  const markers = nearbyPoints.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  const region = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>กำลังเฝ้าระวัง {nearbyPoints.length} จุด</Text>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {!location && !errorMessage && (
        <Text style={styles.waitingText}>กำลังรอสัญญาณ GPS...</Text>
      )}

      {/* การ์ดเตือน ตัวใหญ่พิเศษ เพราะผู้ใช้กำลังขับรถ */}
      {currentAlert && (
        <Pressable
          style={[styles.alertCard, { backgroundColor: currentAlert.point.riskLevel.color }]}
          onPress={() =>
            navigation.navigate('RiskDetail', { pointId: currentAlert.point.id })
          }
        >
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>⚠️ ระวัง!</Text>
            <Text style={styles.alertDistance}>อีก {formatDistance(currentAlert.distanceM)}</Text>
            <Pressable onPress={() => setCurrentAlert(null)} hitSlop={12}>
              <Text style={styles.alertClose}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.alertName}>{currentAlert.point.name}</Text>
          <Text style={styles.alertMeta}>
            {currentAlert.point.riskLevel.label} · {currentAlert.point.riskScore}
          </Text>
          <Text style={styles.alertHint}>แตะเพื่อดูรายละเอียด</Text>
        </Pressable>
      )}

      <View style={styles.mapContainer}>
        <AppMap region={region} markers={markers} userLocation={location} />
      </View>

      <ScrollView contentContainerStyle={styles.history}>
        <Text style={styles.historyTitle}>แจ้งเตือนไปแล้ว</Text>
        {alertHistory.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือนในทริปนี้</Text>
        ) : (
          alertHistory.map((alert, index) => (
            <View key={`${alert.point.id}-${index}`} style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {alert.point.name}
              </Text>
              <Text style={styles.historyDistance}>{formatDistance(alert.distanceM)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.stopButton} onPress={() => navigation.goBack()}>
        <Text style={styles.stopButtonText}>หยุดโหมดเดินทาง</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  statusText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
    padding: SPACING.md,
  },
  waitingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    padding: SPACING.md,
  },
  alertCard: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  alertDistance: {
    color: COLORS.white,
    fontSize: FONT_SIZES.alert,
    fontWeight: 'bold',
  },
  alertClose: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
  },
  alertName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
  },
  alertMeta: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.9,
  },
  alertHint: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.8,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
  },
  history: {
    padding: SPACING.md,
  },
  historyTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  historyName: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  historyDistance: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/TripModeScreen.js
git commit -m "feat: เพิ่มโหมดเดินทาง ติดตาม GPS และเตือนอัตโนมัติเมื่อเข้าใกล้จุดเสี่ยง"
```

---

## Task 19: screens/SavePointScreen.js — บันทึกจุดเสี่ยง

**Files:**
- Create: `screens/SavePointScreen.js`

- [ ] **Step 1: เขียน screens/SavePointScreen.js**

`screens/SavePointScreen.js`:

```javascript
/**
 * หน้าบันทึกจุดเสี่ยง — ระยะ "หลังเดินทาง"
 *
 * ผู้ใช้บันทึกจุดที่เจอเองไว้เตือนตัวเองครั้งหน้า
 * ข้อมูลเก็บในเครื่องเท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
 *
 * จุดที่บันทึกเองจะถูกทำเครื่องหมายว่ายังไม่ยืนยันเสมอ
 * เพื่อไม่ให้ปนกับข้อมูลสถิติที่มีแหล่งอ้างอิง
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import FilterChips from '../components/FilterChips';
import { useSavedPoints } from '../hooks/useSavedPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function SavePointScreen() {
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([HAZARD_TYPES[1].id]); // ค่าเริ่มต้น: อุบัติเหตุรถ
  const [description, setDescription] = useState('');
  const [coordinate, setCoordinate] = useState(null);

  const { savedPoints, addPoint, removePoint } = useSavedPoints();
  const { fetchCurrentLocation, isLoading } = useUserLocation();

  async function handleGetLocation() {
    const result = await fetchCurrentLocation();
    if (result) {
      setCoordinate({ lat: result.lat, lng: result.lng });
    } else {
      Alert.alert('ดึงพิกัดไม่สำเร็จ', 'กรุณาตรวจสอบว่าเปิดสิทธิ์การเข้าถึงตำแหน่งแล้ว');
    }
  }

  async function handleSave() {
    // ตรวจข้อมูลที่จำเป็นก่อนบันทึก
    if (!name.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกชื่อจุด');
      return;
    }
    if (!coordinate) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากดปุ่มดึงพิกัดปัจจุบันก่อนบันทึก');
      return;
    }

    await addPoint({
      name: name.trim(),
      type: selectedTypes[0],
      description: description.trim(),
      coordinate,
    });

    // ล้างฟอร์มให้พร้อมบันทึกจุดถัดไป
    setName('');
    setDescription('');
    setCoordinate(null);

    Alert.alert('บันทึกแล้ว', 'จุดนี้ถูกเก็บไว้ในเครื่องของคุณ');
  }

  function handleDelete(point) {
    Alert.alert('ลบจุดนี้?', point.name, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => removePoint(point.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="บันทึกจุดเสี่ยง" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>บันทึกจุดเสี่ยงที่คุณพบ</Text>
        <Text style={styles.subheading}>
          ช่วยกันบันทึกจุดที่คุณเห็นว่าอันตราย เพื่อเตือนตัวเองในครั้งหน้า
        </Text>

        <Text style={styles.label}>ชื่อจุด *</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น โค้งหน้าปั๊มน้ำมัน"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>ประเภทอันตราย *</Text>
        <FilterChips selectedIds={selectedTypes} onChange={setSelectedTypes} singleSelect />

        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="เช่น โค้งหักศอก มองไม่เห็นรถสวน"
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>พิกัด *</Text>
        <Pressable style={styles.outlineButton} onPress={handleGetLocation} disabled={isLoading}>
          <Text style={styles.outlineButtonText}>
            {isLoading ? 'กำลังดึงพิกัด...' : 'ดึงพิกัดปัจจุบัน'}
          </Text>
        </Pressable>
        {coordinate && (
          <Text style={styles.coordinateText}>
            {coordinate.lat.toFixed(6)}, {coordinate.lng.toFixed(6)}
          </Text>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </Pressable>

        {savedPoints.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.heading}>จุดที่บันทึกไว้ ({savedPoints.length})</Text>
            {savedPoints.map((point) => (
              <View key={point.id} style={styles.savedRow}>
                <Text style={styles.savedName} numberOfLines={1}>
                  {point.name}
                </Text>
                <Pressable onPress={() => handleDelete(point)} hitSlop={8}>
                  <Text style={styles.deleteText}>ลบ</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  heading: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subheading: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  label: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  coordinateText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  savedSection: {
    marginTop: SPACING.xl,
  },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  savedName: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  deleteText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/SavePointScreen.js
git commit -m "feat: เพิ่มหน้าบันทึกจุดเสี่ยงที่ผู้ใช้พบเอง"
```

---

## Task 20: navigation + App.js — ประกอบร่างทั้งแอป

**Files:**
- Create: `navigation/RootNavigator.js`
- Create: `App.js`

- [ ] **Step 1: เขียน navigation/RootNavigator.js**

`navigation/RootNavigator.js`:

```javascript
/**
 * โครงสร้างการนำทางของทั้งแอป
 *
 *   Stack (ชั้นนอก)
 *   ├── MainTabs — แถบเมนู 4 ปุ่มด้านล่าง
 *   │   ├── หน้าแรก
 *   │   ├── แผนที่
 *   │   ├── เส้นทาง
 *   │   └── บันทึก
 *   ├── RiskDetail — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *   └── TripMode   — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *
 * ออกแบบให้ผู้ใช้ไปถึงข้อมูลที่ต้องการภายในการกดไม่เกิน 2 ครั้งจากหน้าแรก
 */

import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import RoutePlannerScreen from '../screens/RoutePlannerScreen';
import SavePointScreen from '../screens/SavePointScreen';
import RiskDetailScreen from '../screens/RiskDetailScreen';
import TripModeScreen from '../screens/TripModeScreen';

import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ใช้ emoji เป็นไอคอน เพราะไม่ต้องพึ่งไลบรารีเพิ่ม และแสดงผลได้ทั้งมือถือและเว็บ */
function makeTabIcon(emoji) {
  return function TabIcon() {
    return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
  };
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'หน้าแรก', tabBarIcon: makeTabIcon('🏠') }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'แผนที่', tabBarIcon: makeTabIcon('🗺️') }}
      />
      <Tab.Screen
        name="RoutePlanner"
        component={RoutePlannerScreen}
        options={{ title: 'เส้นทาง', tabBarIcon: makeTabIcon('🛣️') }}
      />
      <Tab.Screen
        name="SavePoint"
        component={SavePointScreen}
        options={{ title: 'บันทึก', tabBarIcon: makeTabIcon('✏️') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="RiskDetail"
        component={RiskDetailScreen}
        options={{ title: 'รายละเอียดจุดเสี่ยง' }}
      />
      <Stack.Screen
        name="TripMode"
        component={TripModeScreen}
        options={{ title: 'โหมดเดินทาง' }}
      />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: เขียน App.js**

`App.js`:

```javascript
/**
 * จุดเริ่มต้นของแอป AntacinnHelp
 *
 * แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว
 * พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา
 *
 * รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569
 *
 * ไฟล์นี้ทำแค่ 3 อย่าง คือครอบ SafeArea, ครอบ NavigationContainer และเรียก RootNavigator
 * ตรรกะทั้งหมดอยู่ในโฟลเดอร์ screens, hooks และ utils
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add navigation/RootNavigator.js App.js
git commit -m "feat: ประกอบร่างแอป เชื่อมทุกหน้าจอด้วย Stack และ Bottom Tabs"
```

---

## Task 21: ตรวจสอบว่าใช้งานได้จริง

**Files:** ไม่มีการสร้างไฟล์ใหม่ — งานนี้คือการทดสอบ

- [ ] **Step 1: รันเทสต์คณิตศาสตร์ทั้งหมด**

Run: `npm test`
Expected: PASS — `# pass 64` `# fail 0`

ถ้ามีข้อไหนไม่ผ่าน **ห้ามข้ามไปทำขั้นตอนถัดไป** ต้องแก้ให้ผ่านก่อน
เพราะฟังก์ชันเหล่านี้เป็นฐานของทุกหน้าจอ ถ้าผิดจะผิดไปทั้งแอป

- [ ] **Step 2: ตรวจว่าไม่มีไฟล์ไหนเผลอ import react-native-maps ตรง ๆ**

Run: `grep -rn "react-native-maps" --include="*.js" . | grep -v node_modules | grep -v "AppMap.native.js"`
Expected: ไม่มีผลลัพธ์ (ว่างเปล่า)

ถ้ามีผลลัพธ์ออกมา แปลว่ามีไฟล์ที่จะทำให้ **เว็บพัง** ต้องย้าย import นั้นไปไว้ใน `AppMap.native.js` เท่านั้น

- [ ] **Step 3: ตรวจว่าทุกหน้าจอ import AppMap แบบไม่ใส่นามสกุลไฟล์**

Run: `grep -rn "from '../components/AppMap" --include="*.js" screens/`
Expected: ทุกบรรทัดต้องลงท้ายด้วย `AppMap';` ไม่ใช่ `AppMap.web';` หรือ `AppMap.native';`

ถ้าใส่นามสกุล Metro จะไม่เลือกไฟล์ตามแพลตฟอร์มให้ ทำให้พังบนแพลตฟอร์มใดแพลตฟอร์มหนึ่ง

- [ ] **Step 4: อัปโค้ดขึ้น Snack**

1. เปิด https://snack.expo.dev แล้วล็อกอิน
2. ตรวจว่า SDK ที่มุมขวาล่างเป็น **v54.0.0**
3. ลากไฟล์และโฟลเดอร์ทั้งหมดจากเครื่องมาวางในหน้าต่าง Snack
   (ยกเว้น `node_modules/`, `tests/`, `docs/` และ `.git/` ซึ่งไม่ต้องอัป)
4. ถ้า Snack แจ้งว่าเวอร์ชัน dependency ไม่ตรง ให้กดปุ่มที่ Snack แนะนำเพื่อแก้อัตโนมัติ
5. รอจน `package.json` แสดงว่าติดตั้ง dependency ครบ

> เผื่อเวลาไว้ประมาณ 4 วันสำหรับขั้นตอนนี้ ตามที่ระบุไว้ในเอกสารข้อ 7.2
> เพราะระบบนำเข้าไฟล์ของ Snack อาจมีปัญหาที่ต้องแก้

- [ ] **Step 5: ทดสอบบนเว็บ (แท็บ Web ใน Snack)**

ตรวจทีละข้อ ทำเครื่องหมายเมื่อผ่าน:

- [ ] หน้าแรกแสดงหัวข้อ AntacinnHelp พร้อมช่องค้นหา
- [ ] แถบสรุปประจำเดือนแสดงชื่อเดือนปัจจุบันถูกต้อง
- [ ] พิมพ์ "หาด" ในช่องค้นหา แล้วเจอผลลัพธ์
- [ ] กดแท็บ "แผนที่" แล้ว **เห็นแผนที่ OpenStreetMap จริง ๆ** ไม่ใช่กล่องว่าง
- [ ] เห็นหมุดสีเหลือง/ส้ม/แดง บนแผนที่ ตามคะแนนของแต่ละจุด
- [ ] กดหมุด แล้วเด้งไปหน้ารายละเอียดจุดเสี่ยง
- [ ] กดชิปกรอง เช่น "จมน้ำ" แล้วจำนวนหมุดลดลง
- [ ] กดแท็บ "เส้นทาง" แล้วเห็นเส้นทางสีกรมท่าลากบนแผนที่
- [ ] รายการจุดเสี่ยงใต้แผนที่แสดงระยะทางเรียงจากน้อยไปมาก
- [ ] เห็นป้าย "คะแนนความเสี่ยงรวมของเส้นทาง" พร้อมตัวเลขและสี
- [ ] สลับไปเส้นทางอื่น แล้วรายการจุดเสี่ยงกับคะแนนรวมเปลี่ยนตาม
- [ ] กดแท็บ "บันทึก" แล้วกรอกฟอร์มได้

- [ ] **Step 6: ทดสอบบนมือถือ (สแกน QR ด้วย Expo Go)**

- [ ] แอปเปิดได้ ไม่มีหน้าจอแดง
- [ ] แผนที่แสดงเป็น Google Maps (Android) หรือ Apple Maps (iOS)
- [ ] กดปุ่ม 📍 มุมขวาล่างของหน้าแผนที่ แล้วมีป๊อปอัพขอสิทธิ์ตำแหน่ง
- [ ] อนุญาตแล้ว แผนที่เลื่อนมาที่ตำแหน่งตัวเอง
- [ ] เข้าหน้ารายละเอียดจุด แล้วกดปุ่มโทร 1669 แล้วเปิดแอปโทรศัพท์ (**อย่ากดโทรออกจริง**)
- [ ] เข้าหน้า "บันทึก" กดปุ่มดึงพิกัดปัจจุบัน แล้วมีตัวเลขพิกัดขึ้นมา
- [ ] บันทึกจุดใหม่ แล้วปิดแอปเปิดใหม่ จุดนั้นยังอยู่ (พิสูจน์ว่า AsyncStorage ทำงาน)
- [ ] จุดที่บันทึกเองปรากฏบนแผนที่ด้วย

- [ ] **Step 7: ทดสอบโหมดเดินทางภาคสนาม**

นี่คือฟีเจอร์เดียวที่ทดสอบบนโต๊ะไม่ได้ ต้องออกไปขับจริง (ให้คนอื่นขับ ตัวเองถือมือถือ)

- [ ] เข้าหน้า "เส้นทาง" แล้วกด "เริ่มโหมดเดินทาง"
- [ ] แถบบนสุดแสดงจำนวนจุดที่กำลังเฝ้าระวัง และตัวเลขเปลี่ยนตามการเคลื่อนที่
- [ ] เมื่อเข้าใกล้จุดเสี่ยงในระยะ 500 ม. มีการ์ดสีเด้งขึ้นมา
- [ ] **ขับผ่านจุดเดิม แล้วต้องเตือนแค่ครั้งเดียว ไม่เตือนซ้ำ** ← ข้อสำคัญที่สุด
- [ ] วนกลับมาที่จุดเดิมอีกครั้ง (ห่างเกิน 800 ม. แล้วกลับมา) ต้องเตือนใหม่ได้
- [ ] กด "หยุดโหมดเดินทาง" แล้วกลับหน้าเดิม

> **บันทึกผลไว้เพื่อปรับค่า:** ถ้าเตือนช้าไป (ใกล้เกินจนเบรกไม่ทัน)
> ให้เพิ่ม `DISTANCE.ALERT_TRIGGER` ใน `constants/config.js`
> ถ้าเตือนซ้ำถี่ ให้เพิ่ม `DISTANCE.ALERT_RESET`
> แก้ที่ไฟล์เดียว มีผลทั้งแอป

- [ ] **Step 8: Commit ผลการตรวจสอบ**

```bash
git add -A
git commit -m "test: ตรวจสอบการทำงานครบทุกหน้าจอ ทั้งบนเว็บและมือถือ"
```

---

## หลังจากแผนนี้เสร็จ: สิ่งที่ทีมต้องทำต่อ

แผนนี้สร้าง **ระบบที่ทำงานได้ครบทุกฟังก์ชัน** แต่ยัง **ไม่มีข้อมูลจริง**
งานที่เหลือเป็นงานเก็บข้อมูล ไม่ใช่งานเขียนโค้ด:

1. **ลงพื้นที่เก็บข้อมูล (Fieldwork)** — ยืนยันพิกัดของทุกจุดใน `data/riskPoints.json`
   ด้วยการไปยืนที่จุดจริงแล้วอ่านค่าจาก GPS (ใช้ปุ่มดึงพิกัดในหน้า "บันทึก" ของแอปเราเองได้เลย)

2. **กรอกสถิติจากแหล่งอ้างอิง** — เปิด `data/riskPoints.json` แล้วเติม:
   - `incidents` — จาก datagov.mot.go.th (CSV ตั้งแต่ปี 2562) และ ThaiRSC
   - `peakMonths` / `peakHours` — วิเคราะห์จากข้อมูลอุบัติเหตุที่รวบรวมได้
   - `advice` — ข้อเสนอแนะเชิงปฏิบัติ 2-4 ข้อต่อจุด
   - `source` — ชื่อแหล่งอ้างอิง + วันที่เข้าถึง (**ห้ามเว้นว่าง**)
   - `verified` — เปลี่ยนเป็น `true` เฉพาะจุดที่มีเอกสารอ้างอิงจริง

3. **ทำวิดีโอสาธิต** — ตามแผนสำรองในเอกสารข้อ 7.3
   ถึงตอนนี้เว็บจะใช้ได้แล้ว แต่มีวิดีโอไว้ก็อุ่นใจกว่าตอนนำเสนอ

**สิ่งที่ต้องระวังที่สุด:** อย่าเติมตัวเลขสถิติที่ไม่มีแหล่งอ้างอิง
เพราะเป็นการขัดกฎที่ทีมตั้งไว้เอง (เอกสารบทที่ 6.3) และเป็นจุดที่อาจารย์น่าจะถามในวันนำเสนอ
ถ้าเป็นข้อมูลจากการสอบถามคนในพื้นที่ ให้เขียนใน `source` ให้ชัดว่ามาจากการสัมภาษณ์
แล้วปล่อย `verified: false` ไว้ — แอปจะแสดงป้าย "⚠️ ยังไม่ยืนยัน" ให้เองอัตโนมัติ
