// ============================================
// SETUP SCRIPT FOR NOODLE SHOP SYSTEM
// Google Sheets Structure Initialization
// Version: 1.0.0
// ============================================

/**
 * ฟังก์ชันหลักสำหรับตั้งค่าระบบทั้งหมด
 * เรียกใช้ครั้งแรกเมื่อติดตั้งระบบ
 */
function initialSetup() {
  try {
    // สร้าง UI Dialog เพื่อยืนยันการตั้งค่า
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '⚠️ ตั้งค่าระบบร้านก๋วยเตี๋ยว',
      'ระบบจะสร้างชีตและโครงสร้างข้อมูลทั้งหมดที่มีอยู่แล้วจะถูกลบ (ข้อมูลเก่าจะหายไป) คุณต้องการดำเนินการต่อหรือไม่?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      ui.alert('❌ ยกเลิกการตั้งค่า');
      return;
    }

    // เริ่มต้นการตั้งค่า
    Logger.log('🚀 เริ่มต้นการตั้งค่าระบบ...');
    
    // ลบชีตเก่าทั้งหมด (ยกเว้นชีตที่จำเป็น)
    resetSheets();
    
    // สร้างชีตใหม่ทั้งหมด
    createConfigSheet();
    createUsersSheet();
    createMenuSheet();
    createOrdersSheet();
    createLogsSheet();
    
    // เพิ่มข้อมูลตัวอย่าง (Optional)
    const addSampleData = ui.alert(
      'เพิ่มข้อมูลตัวอย่าง?',
      'ต้องการเพิ่มข้อมูลตัวอย่างสำหรับทดสอบหรือไม่? (เมนูตัวอย่าง, ผู้ใช้ตัวอย่าง)',
      ui.ButtonSet.YES_NO
    );
    
    if (addSampleData === ui.Button.YES) {
      addSampleData();
    }
    
    // ตั้งค่า ScriptProperties ถ้ายังไม่มี
    setupScriptProperties();
    
    // สร้างเมนูแบบกำหนดเองใน Google Sheets
    createCustomMenu();
    
    // แสดงสรุปผลการตั้งค่า
    showSetupSummary();
    
    Logger.log('✅ ตั้งค่าระบบเสร็จสมบูรณ์');
    
  } catch (error) {
    Logger.log('❌ เกิดข้อผิดพลาด: ' + error.toString());
    SpreadsheetApp.getUi().alert('❌ เกิดข้อผิดพลาด: ' + error.toString());
  }
}

/**
 * ล้างชีตเก่าและสร้างใหม่
 */
function resetSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // รายชื่อชีตที่ต้องการเก็บไว้ (ถ้ามี)
  const sheetsToKeep = ['Setup']; // เก็บชีต Setup ไว้
  
  // ลบชีตที่ไม่ต้องการ
  ss.getSheets().forEach(sheet => {
    const sheetName = sheet.getName();
    if (!sheetsToKeep.includes(sheetName)) {
      ss.deleteSheet(sheet);
      Logger.log(`🗑️ ลบชีต: ${sheetName}`);
    }
  });
  
  Logger.log('✅ ล้างข้อมูลชีตเก่าเรียบร้อย');
}

/**
 * สร้าง Config Sheet
 */
function createConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Config');
  
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Config');
  }
  
  // กำหนด Headers
  const headers = [['key', 'value', 'description', 'lastUpdated']];
  sheet.getRange(1, 1, 1, 4).setValues(headers);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f3f4f6');
  
  // ข้อมูลเริ่มต้น
  const initialConfig = [
    ['shopName', 'ร้านก๋วยเตี๋ยวบ้านครัว', 'ชื่อร้าน', new Date()],
    ['taxRate', '7', 'อัตราภาษี (%)', new Date()],
    ['serviceCharge', '0', 'ค่าบริการ (%)', new Date()],
    ['minOrder', '1', 'จำนวนสั่งขั้นต่ำ', new Date()],
    ['maxTable', '20', 'จำนวนโต๊ะสูงสุด', new Date()],
    ['notificationSound', 'true', 'เปิด/ปิดเสียงแจ้งเตือน', new Date()],
    ['autoKitchenPrint', 'false', 'พิมพ์ออเดอร์ไปครัวอัตโนมัติ', new Date()],
    ['businessHours', '10:00-22:00', 'เวลาเปิด-ปิด', new Date()],
    ['contactPhone', '02-123-4567', 'เบอร์โทรติดต่อ', new Date()],
    ['lineOfficialAccount', '@noodleshop', 'LINE OA', new Date()]
  ];
  
  sheet.getRange(2, 1, initialConfig.length, 4).setValues(initialConfig);
  
  // กำหนดคอลัมน์ให้กว้างพอ
  sheet.setColumnWidths(1, 4, 200);
  
  Logger.log('✅ สร้าง Config Sheet เรียบร้อย');
}

/**
 * สร้าง Users Sheet
 */
function createUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Users');
  
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Users');
  }
  
  // กำหนด Headers ตามโครงสร้างใน Code.gs
  const headers = [['userId', 'name', 'role', 'phone', 'email', 'lastLogin', 'createdAt', 'updatedAt']];
  sheet.getRange(1, 1, 1, 8).setValues(headers);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  
  // สร้าง Data Validation สำหรับ role
  const roleRange = sheet.getRange('C2:C');
  const roleValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Admin', 'Staff', 'Customer'], true)
    .setAllowInvalid(false)
    .build();
  roleRange.setDataValidation(roleValidation);
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 250); // userId
  sheet.setColumnWidth(2, 200); // name
  sheet.setColumnWidth(3, 100); // role
  sheet.setColumnWidth(4, 120); // phone
  sheet.setColumnWidth(5, 200); // email
  sheet.setColumnWidth(6, 180); // lastLogin
  sheet.setColumnWidth(7, 180); // createdAt
  sheet.setColumnWidth(8, 180); // updatedAt
  
  // เพิ่มข้อมูล Admin เริ่มต้น (ตัวอย่าง)
  const initialUsers = [
    ['U' + generateRandomId(20), 'ผู้ดูแลระบบ', 'Admin', '081-234-5678', 'admin@noodleshop.com', new Date(), new Date(), new Date()],
    ['U' + generateRandomId(20), 'พนักงานครัว', 'Staff', '082-345-6789', 'staff@noodleshop.com', new Date(), new Date(), new Date()]
  ];
  
  sheet.getRange(2, 1, initialUsers.length, 8).setValues(initialUsers);
  
  // เพิ่มหมายเหตุ
  sheet.getRange('A1:H1').setNote('⚠️ userId ต้องตรงกับ LINE User ID เท่านั้น');
  
  Logger.log('✅ สร้าง Users Sheet เรียบร้อย');
}

/**
 * สร้าง Menu Sheet
 */
function createMenuSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Menu');
  
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Menu');
  }
  
  // กำหนด Headers ตามโครงสร้างใน Code.gs
  const headers = [['id', 'name', 'category', 'price', 'imageUrl', 'status', 'description', 'options', 'createdAt', 'updatedAt']];
  sheet.getRange(1, 1, 1, 10).setValues(headers);
  sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#f3f4f6');
  
  // Data Validation สำหรับ category
  const categoryRange = sheet.getRange('C2:C');
  const categoryValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['น้ำใส', 'ต้มยำ', 'แห้ง', 'เย็นตาโฟ', 'เกาเหลา', 'พิเศษ'], true)
    .setAllowInvalid(false)
    .build();
  categoryRange.setDataValidation(categoryValidation);
  
  // Data Validation สำหรับ status
  const statusRange = sheet.getRange('F2:F');
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['มีสินค้า', 'หมด', 'ซ่อน', 'deleted'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusValidation);
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 100);  // id
  sheet.setColumnWidth(2, 200);  // name
  sheet.setColumnWidth(3, 120);  // category
  sheet.setColumnWidth(4, 80);   // price
  sheet.setColumnWidth(5, 250);  // imageUrl
  sheet.setColumnWidth(6, 100);  // status
  sheet.setColumnWidth(7, 300);  // description
  sheet.setColumnWidth(8, 200);  // options (JSON)
  sheet.setColumnWidth(9, 180);  // createdAt
  sheet.setColumnWidth(10, 180); // updatedAt
  
  // สร้างตัวกรอง
  sheet.getRange('A1:J1').createFilter();
  
  Logger.log('✅ สร้าง Menu Sheet เรียบร้อย');
}

/**
 * สร้าง Orders Sheet
 */
function createOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Orders');
  
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Orders');
  }
  
  // กำหนด Headers ตามโครงสร้างใน Code.gs
  const headers = [
    ['orderId', 'userId', 'tableNo', 'items', 'totalPrice', 'status', 
     'paymentMethod', 'paymentStatus', 'specialNotes', 'timestamp', 
     'completedAt', 'createdBy', 'updatedBy']
  ];
  
  sheet.getRange(1, 1, 1, 13).setValues(headers);
  sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#f3f4f6');
  
  // Data Validation สำหรับ status
  const statusRange = sheet.getRange('F2:F');
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Cooking', 'Served', 'Paid', 'Cancelled'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusValidation);
  
  // Data Validation สำหรับ paymentStatus
  const paymentStatusRange = sheet.getRange('H2:H');
  const paymentStatusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Paid', 'Refunded'], true)
    .setAllowInvalid(false)
    .build();
  paymentStatusRange.setDataValidation(paymentStatusValidation);
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 120); // orderId
  sheet.setColumnWidth(2, 250); // userId
  sheet.setColumnWidth(3, 80);  // tableNo
  sheet.setColumnWidth(4, 300); // items (JSON)
  sheet.setColumnWidth(5, 100); // totalPrice
  sheet.setColumnWidth(6, 100); // status
  sheet.setColumnWidth(7, 120); // paymentMethod
  sheet.setColumnWidth(8, 100); // paymentStatus
  sheet.setColumnWidth(9, 200); // specialNotes
  sheet.setColumnWidth(10, 180); // timestamp
  sheet.setColumnWidth(11, 180); // completedAt
  sheet.setColumnWidth(12, 250); // createdBy
  sheet.setColumnWidth(13, 250); // updatedBy
  
  // แช่แข็งแถวหัวตาราง
  sheet.setFrozenRows(1);
  
  // สร้างตัวกรอง
  sheet.getRange('A1:M1').createFilter();
  
  Logger.log('✅ สร้าง Orders Sheet เรียบร้อย');
}

/**
 * สร้าง Logs Sheet
 */
function createLogsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Logs');
  
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Logs');
  }
  
  // กำหนด Headers ตามโครงสร้างใน Code.gs
  const headers = [['timestamp', 'action', 'userId', 'details', 'environment', 'level', 'ipAddress', 'userAgent']];
  sheet.getRange(1, 1, 1, 8).setValues(headers);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  
  // Data Validation สำหรับ level
  const levelRange = sheet.getRange('F2:F');
  const levelValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['INFO', 'WARNING', 'ERROR', 'DEBUG'], true)
    .setAllowInvalid(false)
    .build();
  levelRange.setDataValidation(levelValidation);
  
  // Data Validation สำหรับ environment
  const envRange = sheet.getRange('E2:E');
  const envValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['DEV', 'PROD'], true)
    .setAllowInvalid(false)
    .build();
  envRange.setDataValidation(envValidation);
  
  // กำหนดความกว้างคอลัมน์
  sheet.setColumnWidth(1, 180); // timestamp
  sheet.setColumnWidth(2, 150); // action
  sheet.setColumnWidth(3, 250); // userId
  sheet.setColumnWidth(4, 300); // details
  sheet.setColumnWidth(5, 80);  // environment
  sheet.setColumnWidth(6, 80);  // level
  sheet.setColumnWidth(7, 150); // ipAddress
  sheet.setColumnWidth(8, 200); // userAgent
  
  Logger.log('✅ สร้าง Logs Sheet เรียบร้อย');
}

/**
 * เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ
 */
function addSampleData() {
  try {
    // เพิ่มเมนูตัวอย่าง
    const menuSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Menu');
    const sampleMenu = [
      ['MENU001', 'ก๋วยเตี๋ยวน้ำใสหมู', 'น้ำใส', 50, 'https://via.placeholder.com/300', 'มีสินค้า', 'น้ำซุปหมูใส เส้นเล็ก หมูสับ ลูกชิ้น', '{"noodle":["เส้นเล็ก","เส้นใหญ่","หมี่"]}', new Date(), new Date()],
      ['MENU002', 'ก๋วยเตี๋ยวน้ำตก', 'ต้มยำ', 60, 'https://via.placeholder.com/300', 'มีสินค้า', 'น้ำตกหมู เครื่องแน่น', '{"spicy":["ไม่เผ็ด","น้อย","กลาง","มาก"]}', new Date(), new Date()],
      ['MENU003', 'ก๋วยเตี๋ยวแห้ง', 'แห้ง', 55, 'https://via.placeholder.com/300', 'มีสินค้า', 'แห้งหมู กระเทียมเจียว', '{"pork":["หมูกรอบ","หมูเด้ง","หมูสับ"]}', new Date(), new Date()],
      ['MENU004', 'เย็นตาโฟ', 'เย็นตาโฟ', 65, 'https://via.placeholder.com/300', 'มีสินค้า', 'เย็นตาโฟหมูกรอบ', '{"tofu":["เย็นตาโฟ","เลือดหมู"]}', new Date(), new Date()],
      ['MENU005', 'เกาเหลาหมู', 'เกาเหลา', 50, 'https://via.placeholder.com/300', 'มีสินค้า', 'เกาเหลา น้ำใส', '{"meat":["หมู","เนื้อ"]}', new Date(), new Date()]
    ];
    
    menuSheet.getRange(2, 1, sampleMenu.length, 10).setValues(sampleMenu);
    Logger.log('✅ เพิ่มเมนูตัวอย่างเรียบร้อย');
    
    // เพิ่มผู้ใช้ตัวอย่าง
    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    const sampleUsers = [
      ['U' + generateRandomId(20), 'สมชาย ใจดี', 'Admin', '089-123-4567', 'somchai@example.com', new Date(), new Date(), new Date()],
      ['U' + generateRandomId(20), 'วิชัย ทำอาหาร', 'Staff', '089-234-5678', 'wichai@example.com', new Date(), new Date(), new Date()],
      ['U' + generateRandomId(20), 'อรอนงค์ ลูกค้า', 'Customer', '089-345-6789', 'orn@example.com', new Date(), new Date(), new Date()]
    ];
    
    userSheet.getRange(3, 1, sampleUsers.length, 8).setValues(sampleUsers);
    Logger.log('✅ เพิ่มผู้ใช้ตัวอย่างเรียบร้อย');
    
    SpreadsheetApp.getUi().alert('✅ เพิ่มข้อมูลตัวอย่างเรียบร้อย');
    
  } catch (error) {
    Logger.log('❌ ไม่สามารถเพิ่มข้อมูลตัวอย่าง: ' + error.toString());
  }
}

/**
 * ตั้งค่า ScriptProperties
 */
function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  
  // ตรวจสอบว่ามีค่าอยู่แล้วหรือไม่
  const existingDevId = props.getProperty('DEV_SPREADSHEET_ID');
  const existingProdId = props.getProperty('PROD_SPREADSHEET_ID');
  
  const ui = SpreadsheetApp.getUi();
  
  if (!existingDevId && !existingProdId) {
    // ยังไม่มีการตั้งค่า ให้สอบถามผู้ใช้
    const response = ui.prompt(
      '🔐 ตั้งค่า Spreadsheet ID',
      'กรุณาระบุ Environment นี้ (DEV หรือ PROD):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.OK) {
      const env = response.getResponseText().toUpperCase();
      if (env === 'DEV' || env === 'PROD') {
        props.setProperty(`${env}_SPREADSHEET_ID`, spreadsheetId);
        props.setProperty('ENVIRONMENT', env);
        Logger.log(`✅ ตั้งค่า ${env}_SPREADSHEET_ID เรียบร้อย`);
      }
    }
  }
  
  // ตั้งค่า Default Config
  props.setProperty('DEFAULT_LIFF_ID', 'YOUR_LIFF_ID_HERE');
  props.setProperty('DEFAULT_CHANNEL_TOKEN', 'YOUR_CHANNEL_TOKEN_HERE');
  
  Logger.log('✅ ตั้งค่า Script Properties เรียบร้อย');
}

/**
 * สร้างเมนูแบบกำหนดเองใน Google Sheets
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🍜 ร้านก๋วยเตี๋ยว')
    .addItem('🔄 ตั้งค่าระบบใหม่', 'initialSetup')
    .addItem('📊 ดู Dashboard', 'showDashboard')
    .addItem('📝 จัดการเมนู', 'openMenuManager')
    .addSeparator()
    .addItem('📈 รายงานยอดขาย', 'generateSalesReport')
    .addItem('👥 จัดการผู้ใช้', 'openUserManager')
    .addSeparator()
    .addItem('⚙️ ตั้งค่า Script Properties', 'openScriptProperties')
    .addItem('❓ วิธีใช้', 'showHelp')
    .addToUi();
  
  Logger.log('✅ สร้าง Custom Menu เรียบร้อย');
}

/**
 * แสดงสรุปผลการตั้งค่า
 */
function showSetupSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().map(s => s.getName()).join(', ');
  
  const summary = `
✅ **การตั้งค่าระบบเสร็จสมบูรณ์**

📊 **ชีตที่สร้าง:**
${sheets}

🔐 **Script Properties:**
- ตรวจสอบ/ตั้งค่าใน File > Project Properties > Script Properties

📝 **ขั้นตอนถัดไป:**
1. ตั้งค่า LIFF ID ใน Script Properties
2. ตั้งค่า Channel Access Token
3. ทดสอบระบบด้วยการ Deploy เป็น Web App

⚠️ **หมายเหตุ:**
- อย่าลืมตั้งค่า Environment (DEV/PROD)
- ตรวจสอบข้อมูลในชีต Config
`;

  SpreadsheetApp.getUi().alert('✅ ตั้งค่าระบบเสร็จสมบูรณ์', summary, ui.ButtonSet.OK);
}

/**
 * Utility: สร้าง random ID
 */
function generateRandomId(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ฟังก์ชันสำหรับเรียกจากเมนู
 */
function showDashboard() {
  SpreadsheetApp.getUi().alert('📊 Dashboard', 'กำลังพัฒนา...', ui.ButtonSet.OK);
}

function openMenuManager() {
  SpreadsheetApp.getUi().alert('📝 จัดการเมนู', 'กำลังพัฒนา...', ui.ButtonSet.OK);
}

function generateSalesReport() {
  SpreadsheetApp.getUi().alert('📈 รายงานยอดขาย', 'กำลังพัฒนา...', ui.ButtonSet.OK);
}

function openUserManager() {
  SpreadsheetApp.getUi().alert('👥 จัดการผู้ใช้', 'กำลังพัฒนา...', ui.ButtonSet.OK);
}

function openScriptProperties() {
  const html = HtmlService.createHtmlOutput(`
    <html>
      <body style="padding: 20px; font-family: sans-serif;">
        <h2>🔐 ตั้งค่า Script Properties</h2>
        <p>ไปที่: <b>File > Project Properties > Script Properties</b></p>
        <p><b>Required Properties:</b></p>
        <ul>
          <li>DEV_SPREADSHEET_ID / PROD_SPREADSHEET_ID</li>
          <li>DEV_LIFF_ID / PROD_LIFF_ID</li>
          <li>DEV_CHANNEL_ACCESS_TOKEN / PROD_CHANNEL_ACCESS_TOKEN</li>
        </ul>
        <button onclick="google.script.host.close()">ปิด</button>
      </body>
    </html>
  `).setWidth(400).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'ตั้งค่า Script Properties');
}

function showHelp() {
  SpreadsheetApp.getUi().alert(
    '❓ วิธีใช้ระบบ',
    '1. เรียก initialSetup() เพื่อสร้างโครงสร้าง\n' +
    '2. ตั้งค่า Script Properties\n' +
    '3. เพิ่มข้อมูลเมนูใน Menu Sheet\n' +
    '4. Deploy เป็น Web App\n' +
    '5. ทดสอบกับ LINE LIFF',
    ui.ButtonSet.OK
  );
}

/**
 * ฟังก์ชันตรวจสอบความถูกต้องของโครงสร้างชีต
 */
function validateSheetStructure() {
  const requiredSheets = ['Config', 'Users', 'Menu', 'Orders', 'Logs'];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existingSheets = ss.getSheets().map(s => s.getName());
  
  const missingSheets = requiredSheets.filter(s => !existingSheets.includes(s));
  
  if (missingSheets.length > 0) {
    SpreadsheetApp.getUi().alert(
      '⚠️ ชีตไม่ครบ',
      'ชีตที่ขาด: ' + missingSheets.join(', '),
      ui.ButtonSet.OK
    );
    return false;
  }
  
  SpreadsheetApp.getUi().alert('✅ โครงสร้างชีตถูกต้อง');
  return true;
}

/**
 * ฟังก์ชันสำรองข้อมูล
 */
function backupData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const date = new Date().toISOString().slice(0,10);
  const backupName = `Backup_${date}`;
  
  // สร้างสำเนา
  const backupFile = DriveApp.getFileById(ss.getId()).makeCopy(backupName);
  
  SpreadsheetApp.getUi().alert(
    '✅ สำรองข้อมูลเรียบร้อย',
    'ไฟล์สำรอง: ' + backupName + '\nID: ' + backupFile.getId(),
    ui.ButtonSet.OK
  );
}

/**
 * เรียกใช้เมื่อเปิด Spreadsheet ครั้งแรก
 */
function onOpen() {
  createCustomMenu();
  validateSheetStructure();
}

/**
 * เรียกใช้เมื่อมีการแก้ไข
 */
function onEdit(e) {
  // บันทึกการแก้ไขลง Logs ถ้าจำเป็น
  const range = e.range;
  const sheet = range.getSheet();
  const value = e.value;
  const oldValue = e.oldValue;
  
  // เฉพาะชีตสำคัญ
  if (['Menu', 'Orders', 'Users'].includes(sheet.getName())) {
    Logger.log(`📝 แก้ไข: ${sheet.getName()} - Row: ${range.getRow()}, Col: ${range.getColumn()}`);
  }
}
