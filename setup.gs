// ============================================
// SETUP SCRIPT FOR NOODLE SHOP SYSTEM
// Version: 2.1.0 (Fixed UI Context Issue)
// Google Sheets ID: 1g2rOFvKwPOXWSCnl5Pb_7V21mhrYIX6w_E-L2XhlXMY
// ============================================

/**
 * ฟังก์ชันหลักสำหรับสร้างชีตทั้งหมด (เรียกผ่าน Editor)
 * ใช้สำหรับรันจาก Apps Script Editor โดยตรง
 */
function initialSetup() {
  try {
    // บันทึกข้อความเริ่มต้น
    console.log('🚀 เริ่มสร้างโครงสร้างชีต...');
    
    // รับค่า Spreadsheet ที่กำลังใช้งานอยู่
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = ss.getId();
    
    console.log('📊 Spreadsheet ID: ' + spreadsheetId);
    
    // สร้างชีตทั้งหมด
    createConfigSheet(ss);
    createUsersSheet(ss);
    createMenuSheet(ss);
    createOrdersSheet(ss);
    createLogsSheet(ss);
    
    // ตั้งค่าเริ่มต้น
    setupInitialData(ss);
    
    // แสดงข้อความสำเร็จ
    console.log('✅ สร้างโครงสร้างชีตเรียบร้อยแล้ว!');
    
    // ไม่ใช้ SpreadsheetApp.getUi() ในที่นี้เพราะเรียกจาก Editor
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด: ' + error.toString());
  }
}

/**
 * ฟังก์ชันสำหรับเรียกผ่านเมนู (มี UI)
 */
function setupFromMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    // ขอ確認ก่อนดำเนินการ
    const response = ui.alert(
      '⚠️ ยืนยันการตั้งค่าระบบ',
      'ระบบจะสร้างชีตทั้งหมดใหม่ (Config, Users, Menu, Orders, Logs) และลบข้อมูลเก่า\n\nคุณต้องการดำเนินการต่อหรือไม่?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      ui.alert('❌ ยกเลิกการตั้งค่า');
      return;
    }
    
    // เรียกฟังก์ชันตั้งค่า
    initialSetup();
    
    // แสดงผลผ่าน UI
    ui.alert(
      '✅ สำเร็จ', 
      'สร้างชีตทั้งหมดเรียบร้อยแล้ว:\n- Config\n- Users\n- Menu\n- Orders\n- Logs',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ ข้อผิดพลาด', 
      'เกิดข้อผิดพลาด: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * ฟังก์ชันตรวจสอบชีตที่มีอยู่ (สำหรับเรียกผ่านเมนู)
 */
function checkExistingSheetsFromMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets().map(sheet => sheet.getName());
    
    const requiredSheets = ['Config', 'Users', 'Menu', 'Orders', 'Logs'];
    const existing = [];
    const missing = [];
    
    requiredSheets.forEach(sheetName => {
      if (sheets.includes(sheetName)) {
        existing.push(sheetName);
      } else {
        missing.push(sheetName);
      }
    });
    
    let message = '';
    let title = '';
    
    if (missing.length === 0) {
      title = '✅ ระบบพร้อมใช้งาน';
      message = 'ชีตครบทั้งหมด:\n' + existing.join(', ');
    } else {
      title = '⚠️ ชีตไม่ครบ';
      message = 'ชีตที่มี: ' + (existing.length > 0 ? existing.join(', ') : 'ไม่มี') + '\n\n' +
                'ชีตที่ขาด: ' + missing.join(', ');
    }
    
    ui.alert(title, message, ui.ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ ข้อผิดพลาด', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * ฟังก์ชันล้างข้อมูลทั้งหมด (สำหรับเรียกผ่านเมนู)
 */
function resetAllSheetsFromMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    const response = ui.alert(
      '⚠️ คำเตือน',
      'คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมดและสร้างใหม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      initialSetup();
      ui.alert('✅ ล้างข้อมูลและสร้างใหม่เรียบร้อย');
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ ข้อผิดพลาด', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * ฟังก์ชันตั้งค่า Script Properties (สำหรับเรียกผ่านเมนู)
 */
function setupScriptPropertiesFromMenu() {
  try {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = ss.getId();
    const props = PropertiesService.getScriptProperties();
    
    // ตั้งค่า Spreadsheet ID
    props.setProperty('DEV_SPREADSHEET_ID', spreadsheetId);
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
    props.setProperty('PROD_SPREADSHEET_ID', spreadsheetId); // เผื่อใช้
    
    // ตั้งค่า Environment
    props.setProperty('ENVIRONMENT', 'DEV');
    
    // ขอให้ผู้ใช้ใส่ LIFF ID
    const liffResponse = ui.prompt(
      '🔐 ตั้งค่า LIFF ID',
      'กรุณาใส่ LIFF ID ของคุณ (ถ้ายังไม่มี กด Cancel เพื่อข้ามไปก่อน):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (liffResponse.getSelectedButton() === ui.Button.OK) {
      const liffId = liffResponse.getResponseText();
      if (liffId) {
        props.setProperty('DEV_LIFF_ID', liffId);
        props.setProperty('LIFF_ID', liffId);
      }
    }
    
    // ขอให้ผู้ใช้ใส่ Channel Access Token
    const tokenResponse = ui.prompt(
      '🔐 ตั้งค่า Channel Access Token',
      'กรุณาใส่ Channel Access Token ของคุณ (ถ้ายังไม่มี กด Cancel เพื่อข้ามไปก่อน):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (tokenResponse.getSelectedButton() === ui.Button.OK) {
      const token = tokenResponse.getResponseText();
      if (token) {
        props.setProperty('DEV_CHANNEL_ACCESS_TOKEN', token);
        props.setProperty('CHANNEL_ACCESS_TOKEN', token);
      }
    }
    
    // แสดงข้อมูลที่ตั้งค่าแล้ว
    const allProps = props.getProperties();
    let propsList = '';
    for (let key in allProps) {
      propsList += '\n' + key + ': ' + allProps[key];
    }
    
    ui.alert(
      '✅ ตั้งค่า Script Properties เรียบร้อย',
      'ค่าที่ตั้งแล้ว:' + propsList + '\n\nคุณสามารถแก้ไขเพิ่มเติมได้ที่ File > Project Properties > Script Properties',
      ui.ButtonSet.OK
    );
    
    console.log('✅ ตั้งค่า Script Properties เรียบร้อย');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ ข้อผิดพลาด', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ========== ฟังก์ชันสร้างชีต (ไม่มี UI) ==========

/**
 * สร้าง Config Sheet
 */
function createConfigSheet(ss) {
  let sheet = ss.getSheetByName('Config');
  
  // ลบชีทเก่าถ้ามี
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  // สร้างชีทใหม่
  sheet = ss.insertSheet('Config');
  
  // กำหนด Headers
  const headers = [['key', 'value', 'description']];
  const headerRange = sheet.getRange('A1:C1');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // ข้อมูลเริ่มต้น
  const initialData = [
    ['shopName', 'ร้านก๋วยเตี๋ยวบ้านครัว', 'ชื่อร้าน'],
    ['taxRate', '7', 'อัตราภาษี (%)'],
    ['serviceCharge', '0', 'ค่าบริการ (%)'],
    ['minOrder', '1', 'จำนวนสั่งขั้นต่ำ'],
    ['maxTable', '20', 'จำนวนโต๊ะสูงสุด'],
    ['notificationSound', 'true', 'เปิด/ปิดเสียงแจ้งเตือน'],
    ['businessHours', '10:00-22:00', 'เวลาเปิด-ปิด'],
    ['contactPhone', '02-123-4567', 'เบอร์โทรติดต่อ'],
    ['lineOfficialAccount', '@noodleshop', 'LINE OA']
  ];
  
  sheet.getRange('A2:C' + (initialData.length + 1)).setValues(initialData);
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 300);
  
  console.log('✅ สร้าง Config Sheet เรียบร้อย');
}

/**
 * สร้าง Users Sheet
 */
function createUsersSheet(ss) {
  let sheet = ss.getSheetByName('Users');
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet('Users');
  
  // Headers ตามโครงสร้างใน Code.gs
  const headers = [['userId', 'name', 'role', 'timestamp']];
  const headerRange = sheet.getRange('A1:D1');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 250); // userId
  sheet.setColumnWidth(2, 200); // name
  sheet.setColumnWidth(3, 100); // role
  sheet.setColumnWidth(4, 180); // timestamp
  
  // เพิ่มข้อมูลตัวอย่าง
  const now = new Date();
  const sampleData = [
    ['U' + generateId(10), 'ผู้ดูแลระบบ', 'Admin', now],
    ['U' + generateId(10), 'พนักงานครัว', 'Staff', now],
    ['U' + generateId(10), 'ลูกค้าทั่วไป', 'Customer', now]
  ];
  
  sheet.getRange('A2:D' + (sampleData.length + 1)).setValues(sampleData);
  
  console.log('✅ สร้าง Users Sheet เรียบร้อย');
}

/**
 * สร้าง Menu Sheet
 */
function createMenuSheet(ss) {
  let sheet = ss.getSheetByName('Menu');
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet('Menu');
  
  // Headers ตามโครงสร้างใน Code.gs
  const headers = [['id', 'name', 'category', 'price', 'imageUrl', 'status']];
  const headerRange = sheet.getRange('A1:F1');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 100);  // id
  sheet.setColumnWidth(2, 200);  // name
  sheet.setColumnWidth(3, 120);  // category
  sheet.setColumnWidth(4, 80);   // price
  sheet.setColumnWidth(5, 250);  // imageUrl
  sheet.setColumnWidth(6, 100);  // status
  
  // เพิ่มข้อมูลตัวอย่าง
  const sampleMenu = [
    ['M001', 'ก๋วยเตี๋ยวน้ำใสหมู', 'น้ำใส', 50, 'https://via.placeholder.com/300', 'มี'],
    ['M002', 'ก๋วยเตี๋ยวต้มยำ', 'ต้มยำ', 60, 'https://via.placeholder.com/300', 'มี'],
    ['M003', 'ก๋วยเตี๋ยวแห้ง', 'แห้ง', 55, 'https://via.placeholder.com/300', 'มี'],
    ['M004', 'เย็นตาโฟ', 'เย็นตาโฟ', 65, 'https://via.placeholder.com/300', 'มี'],
    ['M005', 'เกาเหลา', 'เกาเหลา', 50, 'https://via.placeholder.com/300', 'หมด']
  ];
  
  sheet.getRange('A2:F' + (sampleMenu.length + 1)).setValues(sampleMenu);
  
  console.log('✅ สร้าง Menu Sheet เรียบร้อย');
}

/**
 * สร้าง Orders Sheet
 */
function createOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Orders');
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet('Orders');
  
  // Headers ตามโครงสร้างใน Code.gs
  const headers = [['orderId', 'userId', 'tableNo', 'items', 'totalPrice', 'status', 'timestamp']];
  const headerRange = sheet.getRange('A1:G1');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 120); // orderId
  sheet.setColumnWidth(2, 250); // userId
  sheet.setColumnWidth(3, 80);  // tableNo
  sheet.setColumnWidth(4, 300); // items (JSON)
  sheet.setColumnWidth(5, 100); // totalPrice
  sheet.setColumnWidth(6, 100); // status
  sheet.setColumnWidth(7, 180); // timestamp
  
  // เพิ่มข้อมูลตัวอย่าง (1 ออเดอร์)
  const now = new Date();
  const sampleOrder = [
    [
      'ORD-' + generateId(6), 
      'U' + generateId(10), 
      '5', 
      '[{"name":"ก๋วยเตี๋ยวน้ำใส","quantity":2,"price":50}]', 
      100, 
      'Pending', 
      now
    ]
  ];
  
  sheet.getRange('A2:G' + (sampleOrder.length + 1)).setValues(sampleOrder);
  
  console.log('✅ สร้าง Orders Sheet เรียบร้อย');
}

/**
 * สร้าง Logs Sheet
 */
function createLogsSheet(ss) {
  let sheet = ss.getSheetByName('Logs');
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet('Logs');
  
  // Headers ตามโครงสร้างใน Code.gs
  const headers = [['timestamp', 'action', 'userId', 'details', 'environment', 'level']];
  const headerRange = sheet.getRange('A1:F1');
  headerRange.setValues(headers);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 180); // timestamp
  sheet.setColumnWidth(2, 150); // action
  sheet.setColumnWidth(3, 250); // userId
  sheet.setColumnWidth(4, 300); // details
  sheet.setColumnWidth(5, 80);  // environment
  sheet.setColumnWidth(6, 80);  // level
  
  // เพิ่มข้อมูลตัวอย่าง
  const now = new Date();
  const sampleLogs = [
    [now, 'initialSetup', 'system', 'สร้างระบบครั้งแรก', 'DEV', 'INFO'],
    [now, 'createOrder', 'U' + generateId(10), 'ออเดอร์ใหม่ ORD-001', 'DEV', 'INFO']
  ];
  
  sheet.getRange('A2:F' + (sampleLogs.length + 1)).setValues(sampleLogs);
  
  console.log('✅ สร้าง Logs Sheet เรียบร้อย');
}

/**
 * ตั้งค่าข้อมูลเริ่มต้นเพิ่มเติม
 */
function setupInitialData(ss) {
  // อัปเดต Config เพิ่มเติม
  const configSheet = ss.getSheetByName('Config');
  
  // เพิ่ม spreadsheet ID ใน config
  const lastRow = configSheet.getLastRow();
  configSheet.getRange('A' + (lastRow + 1) + ':C' + (lastRow + 1))
    .setValues([['spreadsheetId', ss.getId(), 'Spreadsheet ID']]);
  
  // เพิ่มวันที่ติดตั้ง
  configSheet.getRange('A' + (lastRow + 2) + ':C' + (lastRow + 2))
    .setValues([['installedDate', new Date().toISOString(), 'วันที่ติดตั้งระบบ']]);
  
  console.log('✅ ตั้งค่าข้อมูลเริ่มต้นเรียบร้อย');
}

/**
 * ฟังก์ชันสร้าง ID แบบง่าย
 */
function generateId(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ฟังก์ชันสร้างเมนูแบบกำหนดเอง (เรียกอัตโนมัติเมื่อเปิดไฟล์)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🍜 ร้านก๋วยเตี๋ยว')
    .addItem('1️⃣ ตั้งค่าระบบ (มี UI ยืนยัน)', 'setupFromMenu')
    .addItem('2️⃣ ตรวจสอบชีต', 'checkExistingSheetsFromMenu')
    .addItem('3️⃣ ตั้งค่า Script Properties', 'setupScriptPropertiesFromMenu')
    .addSeparator()
    .addItem('⚠️ ล้างข้อมูลทั้งหมด', 'resetAllSheetsFromMenu')
    .addToUi();
}

/**
 * ฟังก์ชันสำหรับทดสอบว่าทำงานถูกต้อง
 */
function test() {
  console.log('✅ ระบบพร้อมทำงาน');
  console.log('📊 Spreadsheet ID: ' + SpreadsheetApp.getActiveSpreadsheet().getId());
}
