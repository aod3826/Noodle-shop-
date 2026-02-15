// ============================================
// NOODLE SHOP MANAGEMENT SYSTEM
// PRODUCTION READY - VERSION 5.0.0
// LINE LIFF + Google Apps Script + Google Sheets
// ============================================

// ========== CONFIGURATION ==========
function getEnvironment() {
  const url = ScriptApp.getService().getUrl();
  if (url.includes('dev') || url.includes('test')) return 'DEV';
  const prodUrl = PropertiesService.getScriptProperties().getProperty('PROD_URL');
  return (prodUrl && url === prodUrl) ? 'PROD' : 'DEV';
}

function getSecret(key) {
  const env = getEnvironment();
  const secretKey = `${env}_${key}`;
  let value = PropertiesService.getScriptProperties().getProperty(secretKey);
  if (!value) value = PropertiesService.getScriptProperties().getProperty(key);
  return value;
}

// ========== SHEETS INITIALIZATION ==========
function getSheet(sheetName) {
  const spreadsheetId = "1g2rOFvKwPOXWSCnl5Pb_7V21mhrYIX6w_E-L2XhlXMY";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`ไม่พบชีต "${sheetName}" กรุณารัน initialSetup`);
  return sheet;
}

// ========== AUTH MIDDLEWARE with AUTO-ONBOARDING ==========
function verifyAuth(userId, requiredRole = null) {
  if (!userId) throw new Error('ไม่พบ User ID กรุณาเข้าสู่ระบบผ่าน LINE');

  const userSheet = getSheet('Users');
  const data = userSheet.getDataRange().getValues();
  const headers = data.shift();
  const userIdIdx = headers.indexOf('userId');
  const roleIdx = headers.indexOf('role');
  const nameIdx = headers.indexOf('name');
  const timestampIdx = headers.indexOf('timestamp');

  let userRole = null;
  let userExists = false;
  let userRow = null;

  for (const row of data) {
    if (row[userIdIdx] === userId) {
      userRole = row[roleIdx];
      userExists = true;
      userRow = row;
      break;
    }
  }

  // ----- AUTO-ONBOARDING -----
  if (!userExists) {
    const displayName = 'ลูกค้าใหม่'; // สามารถรับจาก frontend ได้
    const now = new Date();

    const newRow = [];
    headers.forEach((h, i) => {
      if (h === 'userId') newRow[i] = userId;
      else if (h === 'name') newRow[i] = displayName;
      else if (h === 'role') newRow[i] = 'Customer';
      else if (h === 'timestamp') newRow[i] = now;
      else newRow[i] = '';
    });
    userSheet.appendRow(newRow);

    userRole = 'Customer';
    console.log(`✅ New user auto-registered: ${userId}`);
  }

  if (requiredRole) {
    const hierarchy = { Admin:3, Staff:2, Customer:1 };
    if (hierarchy[userRole] < hierarchy[requiredRole])
      throw new Error(`ต้องการสิทธิ์ ${requiredRole} แต่คุณมีสิทธิ์ ${userRole}`);
  }

  return userRole;
}

// ========== MAIN ROUTER ==========
function doPost(e) { return handleRequest(e, 'POST'); }
function doGet(e) { return handleRequest(e, 'GET'); }

function handleRequest(e, method) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action = params.action || postData.action;
    const userId = params.userId || postData.userId;

    logActivity(action, userId, { method });

    let result;
    switch (action) {
      // Public APIs
      case 'getConfig':
        result = getPublicConfig();
        break;
      
      // Customer APIs
      case 'getMenu':
        verifyAuth(userId, 'Customer');
        result = getMenu();
        break;
      
      case 'createOrder':
        verifyAuth(userId, 'Customer');
        result = createOrder(userId, postData);
        break;
      
      case 'getMyOrders':
        verifyAuth(userId, 'Customer');
        result = getUserOrders(userId);
        break;
      
      // Staff APIs
      case 'getActiveOrders':
        verifyAuth(userId, 'Staff');
        result = getActiveOrders();
        break;
      
      case 'updateOrderStatus':
        verifyAuth(userId, 'Staff');
        result = updateOrderStatus(userId, postData);
        break;
      
      case 'checkNewOrders':
        verifyAuth(userId, 'Staff');
        result = checkNewOrders(userId, postData.lastCheck);
        break;
      
      case 'billCalculation':
        verifyAuth(userId, 'Staff');
        result = calculateBill(postData.orderId, postData.payment);
        break;
      
      // Admin APIs
      case 'manageMenu':
        verifyAuth(userId, 'Admin');
        result = manageMenu(userId, postData.action, postData.menuData);
        break;
      
      case 'getAllUsers':
        verifyAuth(userId, 'Admin');
        result = getAllUsers();
        break;
      
      default:
        throw new Error(`ไม่พบ action: ${action}`);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('API Error:', error);
    logError(error, e.parameter);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message, env: getEnvironment() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// ========== PUBLIC CONFIG ==========
function getPublicConfig() {
  return {
    environment: getEnvironment(),
    liffId: "2008933274-bXEJEVx2",
    shopName: getConfigValue('shopName') || 'ร้านก๋วยเตี๋ยว',
    version: '5.0.0',
    businessHours: getConfigValue('businessHours') || '10:00-22:00'
  };
}

function getConfigValue(key) {
  try {
    const sheet = getSheet('Config');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) return data[i][1];
    }
  } catch (e) {}
  return null;
}

// ========== MENU ==========
function getMenu() {
  const sheet = getSheet('Menu');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const item = {};
    headers.forEach((h, i) => {
      if (h === 'price') item[h] = Number(row[i]);
      else item[h] = row[i];
    });
    if (item.imageUrl && item.imageUrl.includes('drive.google.com'))
      item.imageUrl = convertDriveLink(item.imageUrl);
    return item;
  }).filter(item => item.status !== 'deleted' && item.status !== 'ซ่อน');
}

function convertDriveLink(url) {
  const id = extractFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : url;
}

function extractFileId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// ========== ORDER ==========
function createOrder(userId, data) {
  const { tableNo, items, totalPrice, specialNotes } = data;
  if (!items?.length) throw new Error('กรุณาเลือกรายการอาหาร');

  const sheet = getSheet('Orders');
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
  
  const order = {
    orderId: orderId,
    userId: userId,
    tableNo: tableNo || 'Takeaway',
    items: JSON.stringify(items),
    totalPrice: totalPrice,
    specialNotes: specialNotes || '',
    status: 'Pending',
    timestamp: new Date(),
    paymentStatus: 'Pending'
  };

  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(h => order[h] || '');
  sheet.appendRow(newRow);

  notifyNewOrder(order);
  return { orderId: orderId, ...order };
}

function getActiveOrders() {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const active = ['Pending','Cooking','Served'];
  
  return data.map(row => {
    const o = {};
    headers.forEach((h,i) => {
      if (h === 'items' && row[i]) {
        try { o[h] = JSON.parse(row[i]); } catch { o[h] = row[i]; }
      } else if (h === 'totalPrice') {
        o[h] = Number(row[i]) || 0;
      } else {
        o[h] = row[i];
      }
    });
    return o;
  }).filter(o => active.includes(o.status))
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getUserOrders(userId) {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    const o = {};
    headers.forEach((h,i) => {
      if (h === 'items' && row[i]) {
        try { o[h] = JSON.parse(row[i]); } catch { o[h] = row[i]; }
      } else {
        o[h] = row[i];
      }
    });
    return o;
  }).filter(o => o.userId === userId)
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function updateOrderStatus(staffId, { orderId, newStatus }) {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf('orderId');
  const statusCol = headers.indexOf('status') + 1;
  const userCol = headers.indexOf('userId');

  for (let i=0; i<data.length; i++) {
    if (data[i][idCol] === orderId) {
      sheet.getRange(i+2, statusCol).setValue(newStatus);
      
      if (newStatus === 'Served') {
        const customerId = data[i][userCol];
        notifyCustomerServed(customerId, orderId);
      }
      
      logActivity('updateOrderStatus', staffId, { orderId, newStatus });
      return { success: true, orderId, newStatus };
    }
  }
  throw new Error('ไม่พบออเดอร์');
}

function checkNewOrders(userId, lastCheck) {
  verifyAuth(userId, 'Staff');
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const tsCol = headers.indexOf('timestamp');
  const statusCol = headers.indexOf('status');
  const last = lastCheck ? new Date(lastCheck) : new Date(0);

  const newOrders = data
    .filter(row => new Date(row[tsCol]) > last && ['Pending','Cooking'].includes(row[statusCol]))
    .map(row => {
      const o = {};
      headers.forEach((h,i) => {
        if (h === 'items' && row[i]) {
          try { o[h] = JSON.parse(row[i]); } catch { o[h] = row[i]; }
        } else {
          o[h] = row[i];
        }
      });
      return o;
    });

  return { 
    hasNewOrders: newOrders.length > 0, 
    newOrders: newOrders, 
    count: newOrders.length 
  };
}

function calculateBill(orderId, payment) {
  const sheet = getSheet('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf('orderId');
  const priceCol = headers.indexOf('totalPrice');
  const statusCol = headers.indexOf('status') + 1;
  const payStatusCol = headers.indexOf('paymentStatus') + 1;

  for (let i=0; i<data.length; i++) {
    if (data[i][idCol] === orderId) {
      const total = Number(data[i][priceCol]);
      if (payment < total) throw new Error('เงินไม่พอ');
      
      sheet.getRange(i+2, statusCol).setValue('Paid');
      if (payStatusCol) sheet.getRange(i+2, payStatusCol).setValue('Paid');
      
      return { 
        total: total, 
        payment: payment, 
        change: payment - total,
        success: true 
      };
    }
  }
  throw new Error('ไม่พบออเดอร์');
}

// ========== ADMIN MENU MANAGEMENT ==========
function manageMenu(userId, action, menuData) {
  verifyAuth(userId, 'Admin');
  const sheet = getSheet('Menu');

  switch(action) {
    case 'getAll':
      return getMenu();
      
    case 'toggleStatus':
      const { itemId, status } = menuData;
      return toggleMenuItemStatus(sheet, itemId, status);
      
    case 'updatePrice':
      const { id, price } = menuData;
      return updateMenuItemPrice(sheet, id, price);
      
    case 'add':
      return addMenuItem(sheet, menuData);
      
    case 'delete':
      return deleteMenuItem(sheet, menuData.deleteId);
      
    default:
      throw new Error('Invalid action');
  }
}

function toggleMenuItemStatus(sheet, id, status) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf('id');
  const statusCol = headers.indexOf('status') + 1;
  
  for (let i=0; i<data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i+2, statusCol).setValue(status);
      return { success: true, message: `เปลี่ยนสถานะเป็น ${status}` };
    }
  }
  throw new Error('ไม่พบเมนู');
}

function updateMenuItemPrice(sheet, id, newPrice) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf('id');
  const priceCol = headers.indexOf('price') + 1;
  
  for (let i=0; i<data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i+2, priceCol).setValue(newPrice);
      return { success: true, message: 'อัปเดตราคาเรียบร้อย' };
    }
  }
  throw new Error('ไม่พบเมนู');
}

function addMenuItem(sheet, item) {
  const lastRow = sheet.getLastRow();
  const newId = `M${String(lastRow).padStart(3,'0')}`;
  const newRow = [
    newId, 
    item.name, 
    item.category, 
    item.price, 
    item.imageUrl || '', 
    item.status || 'มี'
  ];
  sheet.appendRow(newRow);
  return { success: true, id: newId, message: 'เพิ่มเมนูเรียบร้อย' };
}

function deleteMenuItem(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf('id');
  
  for (let i=0; i<data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i+2);
      return { success: true, message: 'ลบเมนูเรียบร้อย' };
    }
  }
  throw new Error('ไม่พบเมนู');
}

function getAllUsers() {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    const user = {};
    headers.forEach((h,i) => { user[h] = row[i]; });
    return user;
  });
}

// ========== NOTIFICATIONS ==========
function notifyNewOrder(order) {
  const token = getSecret('CHANNEL_ACCESS_TOKEN');
  if (!token) return;
  
  const userSheet = getSheet('Users');
  const data = userSheet.getDataRange().getValues();
  const headers = data.shift();
  const roleIdx = headers.indexOf('role');
  const userIdIdx = headers.indexOf('userId');
  
  const staff = data
    .filter(r => r[roleIdx] === 'Staff' || r[roleIdx] === 'Admin')
    .map(r => r[userIdIdx]);

  const items = JSON.parse(order.items);
  const summary = items.map(i => `${i.name} x${i.quantity}`).join(', ');
  
  staff.forEach(uid => {
    sendLineMessage(uid, { 
      type: 'text', 
      text: `🍜 ออเดอร์ใหม่!\nโต๊ะ: ${order.tableNo}\nรายการ: ${summary}\nรวม: ${order.totalPrice} บาท` 
    });
  });
}

function notifyCustomerServed(customerId, orderId) {
  const token = getSecret('CHANNEL_ACCESS_TOKEN');
  if (!token) return;
  
  sendLineMessage(customerId, { 
    type: 'text', 
    text: `🍜 อาหารของคุณเสิร์ฟแล้ว! หมายเลขออเดอร์: ${orderId}\n\nขอให้อร่อยนะคะ 😊` 
  });
}

function sendLineMessage(userId, message) {
  const token = getSecret('CHANNEL_ACCESS_TOKEN');
  if (!token) return;
  
  const options = {
    method: 'post',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    payload: JSON.stringify({ to: userId, messages: [message] }),
    muteHttpExceptions: true
  };
  
  try { 
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options); 
  } catch (e) {
    console.error('LINE Push Error:', e);
  }
}

// ========== LOGGING ==========
function logActivity(action, userId, details={}) {
  try {
    getSheet('Logs').appendRow([
      new Date(), 
      action || 'unknown', 
      userId || 'system', 
      JSON.stringify(details), 
      getEnvironment(), 
      'INFO'
    ]);
  } catch (e) {}
}

function logError(error, ctx={}) {
  try {
    getSheet('Logs').appendRow([
      new Date(), 
      'ERROR', 
      ctx.userId || 'system', 
      error.toString(), 
      getEnvironment(), 
      'ERROR'
    ]);
  } catch (e) {}
}

// ========== HTML SERVICE ==========
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.config = getPublicConfig();
  
  return template
    .evaluate()
    .setTitle('ร้านก๋วยเตี๋ยว')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
