// ============================================
// SETUP SCRIPT - CREATE ALL SHEETS
// Google Sheets ID: 1g2rOFvKwPOXWSCnl5Pb_7V21mhrYIX6w_E-L2XhlXMY
// ============================================

function initialSetup() {
  try {
    console.log('🚀 เริ่มสร้างโครงสร้างชีต...');
    
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
    
    console.log('✅ สร้างโครงสร้างชีตเรียบร้อยแล้ว!');
    
    SpreadsheetApp.getUi().alert(
      '✅ สำเร็จ', 
      'สร้างชีตทั้งหมดเรียบร้อย:\n- Config\n- Users\n- Menu\n- Orders\n- Logs',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    SpreadsheetApp.getUi().alert(
      '❌ ข้อผิดพลาด', 
      error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function createConfigSheet(ss) {
  let sheet = ss.getSheetByName('Config');
  if (sheet) ss.deleteSheet(sheet);
  
  sheet = ss.insertSheet('Config');
  
  const headers = [['key', 'value', 'description']];
  sheet.getRange('A1:C1').setValues(headers)
    .setFontWeight('bold').setBackground('#f3f4f6');
  
  const initialData = [
    ['shopName', 'ร้านก๋วยเตี๋ยวบ้านครัว', 'ชื่อร้าน'],
    ['taxRate', '7', 'อัตราภาษี (%)'],
    ['serviceCharge', '0', 'ค่าบริการ (%)'],
    ['minOrder', '1', 'จำนวนสั่งขั้นต่ำ'],
    ['maxTable', '20', 'จำนวนโต๊ะสูงสุด'],
    ['notificationSound', 'true', 'เปิด/ปิดเสียงแจ้งเตือน'],
    ['businessHours', '10:00-22:00', 'เวลาเปิด-ปิด'],
    ['contactPhone', '02-123-4567', 'เบอร์โทรติดต่อ']
  ];
  
  sheet.getRange(2, 1, initialData.length, 3).setValues(initialData);
  sheet.setColumnWidths(1, 3, 200);
  
  console.log('✅ สร้าง Config Sheet');
}

function createUsersSheet(ss) {
  let sheet = ss.getSheetByName('Users');
  if (sheet) ss.deleteSheet(sheet);
  
  sheet = ss.insertSheet('Users');
  
  const headers = [['userId', 'name', 'role', 'timestamp']];
  sheet.getRange('A1:D1').setValues(headers)
    .setFontWeight('bold').setBackground('#f3f4f6');
  
  const now = new Date();
  const sampleData = [
    ['Uadmin123', 'ผู้ดูแลระบบ', 'Admin', now],
    ['Ustaff456', 'พนักงานครัว', 'Staff', now],
    ['Ucustomer789', 'ลูกค้าทั่วไป', 'Customer', now]
  ];
  
  sheet.getRange(2, 1, sampleData.length, 4).setValues(sampleData);
  
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 180);
  
  console.log('✅ สร้าง Users Sheet');
}

function createMenuSheet(ss) {
  let sheet = ss.getSheetByName('Menu');
  if (sheet) ss.deleteSheet(sheet);
  
  sheet = ss.insertSheet('Menu');
  
  const headers = [['id', 'name', 'category', 'price', 'imageUrl', 'status']];
  sheet.getRange('A1:F1').setValues(headers)
    .setFontWeight('bold').setBackground('#f3f4f6');
  
  const sampleMenu = [
    ['M001', 'ก๋วยเตี๋ยวน้ำใสหมู', 'น้ำใส', 50, 'https://via.placeholder.com/300', 'มี'],
    ['M002', 'ก๋วยเตี๋ยวต้มยำ', 'ต้มยำ', 60, 'https://via.placeholder.com/300', 'มี'],
    ['M003', 'ก๋วยเตี๋ยวแห้ง', 'แห้ง', 55, 'https://via.placeholder.com/300', 'มี'],
    ['M004', 'เย็นตาโฟ', 'เย็นตาโฟ', 65, 'https://via.placeholder.com/300', 'มี'],
    ['M005', 'เกาเหลาหมู', 'เกาเหลา', 50, 'https://via.placeholder.com/300', 'หมด']
  ];
  
  sheet.getRange(2, 1, sampleMenu.length, 6).setValues(sampleMenu);
  
  sheet.setColumnWidths(1, 6, 120);
  
  console.log('✅ สร้าง Menu Sheet');
}

function createOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Orders');
  if (sheet) ss.deleteSheet(sheet);
  
  sheet = ss.insertSheet('Orders');
  
  const headers = [['orderId', 'userId', 'tableNo', 'items', 'totalPrice', 'status', 'timestamp', 'paymentStatus']];
  sheet.getRange('A1:H1').setValues(headers)
    .setFontWeight('bold').setBackground('#f3f4f6');
  
  const now = new Date();
  const sampleOrder = [
    [
      'ORD-TEST001', 
      'Ucustomer789', 
      '5', 
      '[{"name":"ก๋วยเตี๋ยวน้ำใส","quantity":2,"price":50}]', 
      100, 
      'Pending', 
      now,
      'Pending'
    ]
  ];
  
  sheet.getRange(2, 1, sampleOrder.length, 8).setValues(sampleOrder);
  
  sheet.setColumnWidths(1, 8, 120);
  
  console.log('✅ สร้าง Orders Sheet');
}

function createLogsSheet(ss) {
  let sheet = ss.getSheetByName('Logs');
  if (sheet) ss.deleteSheet(sheet);
  
  sheet = ss.insertSheet('Logs');
  
  const headers = [['timestamp', 'action', 'userId', 'details', 'environment', 'level']];
  sheet.getRange('A1:F1').setValues(headers)
    .setFontWeight('bold').setBackground('#f3f4f6');
  
  const now = new Date();
  const sampleLogs = [
    [now, 'initialSetup', 'system', 'สร้างระบบครั้งแรก', 'DEV', 'INFO'],
    [now, 'createOrder', 'Ucustomer789', 'ออเดอร์ใหม่ ORD-TEST001', 'DEV', 'INFO']
  ];
  
  sheet.getRange(2, 1, sampleLogs.length, 6).setValues(sampleLogs);
  
  sheet.setColumnWidths(1, 6, 150);
  
  console.log('✅ สร้าง Logs Sheet');
}

function setupInitialData(ss) {
  const configSheet = ss.getSheetByName('Config');
  const lastRow = configSheet.getLastRow();
  
  configSheet.getRange(lastRow + 1, 1, 1, 3)
    .setValues([['spreadsheetId', ss.getId(), 'Spreadsheet ID']]);
  
  configSheet.getRange(lastRow + 2, 1, 1, 3)
    .setValues([['installedDate', new Date().toISOString(), 'วันที่ติดตั้งระบบ']]);
  
  console.log('✅ ตั้งค่าข้อมูลเริ่มต้น');
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍜 ร้านก๋วยเตี๋ยว')
    .addItem('1️⃣ ตั้งค่าระบบ (สร้างชีต)', 'initialSetup')
    .addToUi();
}
