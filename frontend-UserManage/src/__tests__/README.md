# Test Documentation

## Overview
นี่คือ Unit Tests และ Integration Tests สำหรับระบบ Session Management และ Path Permission ของโปรเจค User Management

## Test Coverage

### 1. Middleware Tests (`middleware.test.ts`)
ทดสอบการทำงานของ middleware ที่ทำหน้าที่:
-  **Public Path Access**: อนุญาตให้เข้าถึง public paths ได้
-  **Authentication Check**: ตรวจสอบการมี token และ redirect ไป login
-  **API Permission Check**: เรียก API เพื่อตรวจสอบสิทธิ์การเข้าถึง
-  **Path Permission Logic**: ตรวจสอบ exact path และ wildcard permissions
-  **Cache Functionality**: ใช้ cache เพื่อลดการเรียก API
-  **Error Handling**: จัดการกับ network errors และ API errors

### 2. TokenMonitor Tests (`TokenMonitor.test.tsx`)
ทดสอบ React component ที่ทำหน้าที่:
-  **Public Path Handling**: ไม่ monitor session บน public paths
-  **Session Monitoring**: ตรวจสอบเวลาหมดอายุของ session
-  **Warning Display**: แสดงแจ้งเตือนเมื่อ session เหลือน้อยกว่า 5 นาที
-  **Expiry Dialog**: แสดง dialog เมื่อ session หมดอายุ
-  **Dialog Interactions**: จัดการการ logout
-  **Warning Timeout**: ซ่อนการแจ้งเตือนหลัง 10 วินาที
-  **Edge Cases**: จัดการกับข้อมูลที่ไม่ครบถ้วน

### 3. AuthOptions Tests (`authOptions.test.ts`)
ทดสอบการตั้งค่า NextAuth:
-  **Credentials Provider**: การ authorize ด้วย OTP และ Login response
-  **JWT Callback**: การสร้างและอัพเดต JWT token
-  **Session Callback**: การ map ข้อมูล token ไป session
-  **Token Refresh**: การรีเฟรชข้อมูล user
-  **Error Handling**: จัดการกับ API errors
-  **Configuration**: ตรวจสอบการตั้งค่า session และ pages

### 4. Integration Tests (`integration.test.ts`)
ทดสอบการทำงานร่วมกันของทุกส่วน:
-  **Complete Authentication Flow**: ตั้งแต่ login จนถึง session
-  **Token Refresh Flow**: การอัพเดตข้อมูล user
-  **Permission & Access Control**: การควบคุมการเข้าถึง paths
-  **Session Timing**: การคำนวณเวลาหมดอายุ
-  **Error Handling**: จัดการกับ network errors
-  **Cache Functionality**: การใช้งาน cache

## การรัน Tests

```bash
# รัน tests ทั้งหมด
npm test

# รัน tests แบب watch mode
npm run test:watch

# รัน tests พร้อม coverage report
npm run test:coverage

# รัน tests สำหรับ CI/CD
npm run test:ci
```

## Test Coverage Goals

ตั้งเป้าไว้ที่:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Key Features Tested

###  Session End Detection
- ตรวจสอบการหมดอายุของ session
- แสดงแจ้งเตือนก่อนหมดอายุ 5 นาที
- บังคับ logout เมื่อหมดอายุ

###  Path Permission Check
- ตรวจสอบสิทธิ์การเข้าถึงแต่ละ path
- รองรับ exact path matching
- รองรับ wildcard permissions (path/*)
- Cache permissions เพื่อเพิ่มประสิทธิภาพ

###  Token Management
- การสร้าง JWT token จากการ login
- การรีเฟรชข้อมูล user
- การจัดการ token expiry

###  Error Handling
- Network errors
- API errors (401, 500, etc.)
- Malformed data
- Missing required fields

## ผลการทดสอบที่คาดหวัง

เมื่อรันคำสั่ง `npm test` คุณควรจะเห็น:

```
 PASS  src/__tests__/middleware.test.ts
 PASS  src/__tests__/TokenMonitor.test.tsx  
 PASS  src/__tests__/authOptions.test.ts
 PASS  src/__tests__/integration.test.ts

Test Suites: 4 passed, 4 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXXs
```

## การแก้ไขปัญหา

หากพบปัญหาในการรัน tests:

1. **Module not found**: ตรวจสอบว่าได้ติดตั้ง dependencies ครบแล้ว
2. **TypeScript errors**: ตรวจสอบ types ใน jest.setup.js
3. **Mock errors**: ตรวจสอบการ mock external modules

## การเพิ่ม Tests ใหม่

เมื่อเพิ่มฟีเจอร์ใหม่ ควรเพิ่ม tests ใน:
- Unit tests สำหรับฟังก์ชันแต่ละตัว
- Integration tests สำหรับการทำงานร่วมกัน
- Edge cases และ error scenarios