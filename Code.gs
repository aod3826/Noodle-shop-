// ============================================
// NOODLE SHOP MANAGEMENT SYSTEM - COMPLETE VERSION
// LINE LIFF + Google Apps Script + Google Sheets
// Version: 3.0.0 (Production Ready)
// ============================================

// ========== CONFIGURATION ==========
function getEnvironment() {
  const url = ScriptApp.getService().getUrl();
  if (url.includes('dev') || url.includes('test')) {
    return 'DEV';
  }
  const prodUrl = PropertiesService.getScriptProperties().getProperty('PROD_URL');
  if (prodUrl && url === prodUrl) {
    return 'PROD';
  }
  return 'DEV';
}

function getSecret(key) {
  const env = getEnvironment();
  const secretKey = `${env}_${key}`;
  const value = PropertiesService.getScriptProperties().getProperty(secretKey);
  if (!value) {
    const defaultKey = key;
    return PropertiesService.getScriptProperties().getProperty(defaultKey);
  }
  return value;
}

// ========== SHEETS INITIALIZATION ==========
function getSheet(sheetName) {
  const spreadsheetId = getSecret('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('ไม่พบ SPREADSHEET_ID กรุณาตั้งค่าใน Script Properties');
  }
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`ไม่พบชีต "${sheetName}" กรุณารัน initialSetup ก่อน`);
  }
  return sheet;
}

// ========== AUTH MIDDLEWARE ==========
function verifyAuth(userId, requiredRole = null) {
  if (!userId) {
    throw new Error('ไม่พบ User ID กรุณาเข้าสู่ระบบผ่าน LINE');
  }
  
  const userSheet = getSheet('Users');
  const userData = userSheet.getDataRange().getValues();
  const headers = userData.shift();
  const userIdCol = headers.indexOf('userId');
  const roleCol = headers.indexOf('role');
  
  let userRole = null;
  for (const row of userData) {
    if (row[userIdCol] === userId) {
      userRole = row[roleCol];
      break;
    }
  }
  
  if (!userRole) {
    if (requiredRole === 'Customer' || !requiredRole) {
      return 'Customer';
    }
    throw new Error('ไม่มีสิทธิ์ใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }
  
  if (requiredRole) {
    const roleHierarchy = {
      'Admin': 3,
      'Staff': 2,
      'Customer': 1
    };
    
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      throw new Error(`ต้องการสิทธิ์ ${requiredRole} แต่คุณมีสิทธิ์ ${userRole}`);
    }
  }
  
  return userRole;
}

// ========== MAIN ROUTER ==========
function doPost(e) {
  return handleRequest(e, 'POST');
}

function doGet(e) {
  return handleRequest(e, 'GET');
}

function handleRequest(e, method) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.message,
        env: getEnvironment()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// ========== PUBLIC CONFIG ==========
function getPublicConfig() {
  return {
    environment: getEnvironment(),
    liffId: getSecret('LIFF_ID'),
    shopName: getConfigValue('shopName') || 'ร้านก๋วยเตี๋ยว',
    version: '3.0.0',
    businessHours: getConfigValue('businessHours') || '10:00-22:00'
  };
}

function getConfigValue(key) {
  try {
    const configSheet = getSheet('Config');
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ========== MENU MANAGEMENT ==========
function getMenu() {
  const menuSheet = getSheet('Menu');
  const data = menuSheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      if (header === 'price' && row[index]) {
        item[header] = Number(row[index]);
      } else {
        item[header] = row[index];
      }
    });
    
    if (item.imageUrl && item.imageUrl.includes('drive.google.com')) {
      item.imageUrl = convertDriveLink(item.imageUrl);
    }
    
    return item;
  }).filter(item => item.status !== 'deleted' && item.status !== 'ซ่อน');
}

function convertDriveLink(driveUrl) {
  const fileId = extractFileId(driveUrl);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  return driveUrl;
}

function extractFileId(url) {
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ========== ORDER MANAGEMENT ==========
function createOrder(userId, data) {
  const { tableNo, items, totalPrice, specialNotes } = data;
  
  if (!items || !items.length) {
    throw new Error('กรุณาเลือกรายการอาหาร');
  }
  
  const orderSheet = getSheet('Orders');
  const orderId = 'ORD-' + new Date().getTime().toString(36).toUpperCase() + 
                  Math.random().toString(36).substring(2, 5).toUpperCase();
  
  const orderData = {
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
  
  const headers = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => orderData[header] || '');
  orderSheet.appendRow(newRow);
  
  notifyNewOrder(orderData);
  
  return { orderId: orderId, ...orderData };
}

function getActiveOrders() {
  const orderSheet = getSheet('Orders');
  const data = orderSheet.getDataRange().getValues();
  const headers = data.shift();
  
  const activeStatuses = ['Pending', 'Cooking', 'Served'];
  
  return data
    .map(row => {
      const order = {};
      headers.forEach((header, index) => {
        if (header === 'items' && row[index]) {
          try {
            order[header] = JSON.parse(row[index]);
          } catch {
            order[header] = row[index];
          }
        } else if (header === 'totalPrice') {
          order[header] = Number(row[index]) || 0;
        } else {
          order[header] = row[index];
        }
      });
      return order;
    })
    .filter(order => activeStatuses.includes(order.status))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getUserOrders(userId) {
  const orderSheet = getSheet('Orders');
  const data = orderSheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data
    .map(row => {
      const order = {};
      headers.forEach((header, index) => {
        if (header === 'items' && row[index]) {
          try {
            order[header] = JSON.parse(row[index]);
          } catch {
            order[header] = row[index];
          }
        } else {
          order[header] = row[index];
        }
      });
      return order;
    })
    .filter(order => order.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function updateOrderStatus(staffId, data) {
  const { orderId, newStatus } = data;
  
  const orderSheet = getSheet('Orders');
  const dataRange = orderSheet.getDataRange().getValues();
  const headers = dataRange.shift();
  
  const orderIdCol = headers.indexOf('orderId');
  const statusCol = headers.indexOf('status');
  const userIdCol = headers.indexOf('userId');
  
  for (let i = 0; i < dataRange.length; i++) {
    if (dataRange[i][orderIdCol] === orderId) {
      orderSheet.getRange(i + 2, statusCol + 1).setValue(newStatus);
      
      if (newStatus === 'Served') {
        const customerId = dataRange[i][userIdCol];
        notifyCustomerServed(customerId, orderId);
      }
      
      logActivity('updateOrderStatus', staffId, { orderId, newStatus });
      
      return { success: true, orderId, newStatus };
    }
  }
  
  throw new Error('ไม่พบออเดอร์');
}

// ========== NEW ORDER CHECKER ==========
function checkNewOrders(userId, lastCheck) {
  try {
    verifyAuth(userId, 'Staff');
    
    const orderSheet = getSheet('Orders');
    const data = orderSheet.getDataRange().getValues();
    const headers = data.shift();
    
    const timestampCol = headers.indexOf('timestamp');
    const statusCol = headers.indexOf('status');
    
    const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
    
    const newOrders = data
      .filter(row => {
        const orderDate = new Date(row[timestampCol]);
        return orderDate > lastCheckDate && 
               ['Pending', 'Cooking'].includes(row[statusCol]);
      })
      .map(row => {
        const order = {};
        headers.forEach((header, index) => {
          if (header === 'items' && row[index]) {
            try {
              order[header] = JSON.parse(row[index]);
            } catch {
              order[header] = row[index];
            }
          } else {
            order[header] = row[index];
          }
        });
        return order;
      });
    
    return {
      hasNewOrders: newOrders.length > 0,
      newOrders: newOrders,
      count: newOrders.length
    };
    
  } catch (error) {
    logError(error);
    return { hasNewOrders: false, newOrders: [], count: 0 };
  }
}

// ========== BILLING ==========
function calculateBill(orderId, payment) {
  const orderSheet = getSheet('Orders');
  const dataRange = orderSheet.getDataRange().getValues();
  const headers = dataRange.shift();
  
  const orderIdCol = headers.indexOf('orderId');
  const totalPriceCol = headers.indexOf('totalPrice');
  const statusCol = headers.indexOf('status');
  const paymentStatusCol = headers.indexOf('paymentStatus') || headers.length;
  
  for (let i = 0; i < dataRange.length; i++) {
    if (dataRange[i][orderIdCol] === orderId) {
      const total = Number(dataRange[i][totalPriceCol]);
      const change = payment - total;
      
      if (change < 0) {
        throw new Error('เงินไม่พอ');
      }
      
      orderSheet.getRange(i + 2, statusCol + 1).setValue('Paid');
      if (paymentStatusCol <= headers.length) {
        orderSheet.getRange(i + 2, paymentStatusCol + 1).setValue('Paid');
      }
      
      return {
        total: total,
        payment: payment,
        change: change,
        success: true
      };
    }
  }
  
  throw new Error('ไม่พบออเดอร์');
}

// ========== ADMIN MENU MANAGEMENT ==========
function manageMenu(userId, action, menuData) {
  verifyAuth(userId, 'Admin');
  
  const menuSheet = getSheet('Menu');
  
  switch(action) {
    case 'getAll':
      return getMenu();
      
    case 'update':
      const { id, updates } = menuData;
      return updateMenuItem(menuSheet, id, updates);
      
    case 'toggle':
      const { itemId, status } = menuData;
      return toggleMenuItemStatus(menuSheet, itemId, status);
      
    case 'add':
      return addMenuItem(menuSheet, menuData);
      
    case 'delete':
      const { deleteId } = menuData;
      return deleteMenuItem(menuSheet, deleteId);
      
    default:
      throw new Error('Invalid action');
  }
}

function updateMenuItem(sheet, id, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const idCol = headers.indexOf('id');
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][idCol] === id) {
      const row = i + 2;
      
      Object.entries(updates).forEach(([key, value]) => {
        const colIndex = headers.indexOf(key) + 1;
        if (colIndex > 0) {
          sheet.getRange(row, colIndex).setValue(value);
        }
      });
      
      return { success: true, message: 'อัพเดทเมนูเรียบร้อย' };
    }
  }
  
  throw new Error('ไม่พบเมนู');
}

function toggleMenuItemStatus(sheet, itemId, status) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const idCol = headers.indexOf('id');
  const statusCol = headers.indexOf('status') + 1;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][idCol] === itemId) {
      sheet.getRange(i + 2, statusCol).setValue(status);
      return { success: true, message: `เปลี่ยนสถานะเป็น ${status} เรียบร้อย` };
    }
  }
  
  throw new Error('ไม่พบเมนู');
}

function addMenuItem(sheet, newItem) {
  const lastRow = sheet.getLastRow();
  const newId = `M${String(lastRow).padStart(3, '0')}`;
  
  const newRow = [
    newId,
    newItem.name,
    newItem.category,
    newItem.price,
    newItem.imageUrl || '',
    newItem.status || 'มี'
  ];
  
  sheet.appendRow(newRow);
  
  return { success: true, id: newId, message: 'เพิ่มเมนูเรียบร้อย' };
}

function deleteMenuItem(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const idCol = headers.indexOf('id');
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 2);
      return { success: true, message: 'ลบเมนูเรียบร้อย' };
    }
  }
  
  throw new Error('ไม่พบเมนู');
}

function getAllUsers() {
  const userSheet = getSheet('Users');
  const data = userSheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    const user = {};
    headers.forEach((header, index) => {
      user[header] = row[index];
    });
    return user;
  });
}

// ========== NOTIFICATION SYSTEM ==========
function notifyNewOrder(orderData) {
  try {
    const channelToken = getSecret('CHANNEL_ACCESS_TOKEN');
    if (!channelToken) return;
    
    const userSheet = getSheet('Users');
    const userData = userSheet.getDataRange().getValues();
    const headers = userData.shift();
    
    const roleCol = headers.indexOf('role');
    const userIdCol = headers.indexOf('userId');
    
    const staffUsers = userData
      .filter(row => row[roleCol] === 'Staff' || row[roleCol] === 'Admin')
      .map(row => row[userIdCol]);
    
    const items = JSON.parse(orderData.items);
    const itemSummary = items.map(i => `${i.name} x${i.quantity}`).join(', ');
    
    staffUsers.forEach(staffId => {
      sendLineMessage(staffId, {
        type: 'text',
        text: `🍜 ออเดอร์ใหม่!\nโต๊ะ: ${orderData.tableNo}\nรายการ: ${itemSummary}\nรวม: ${orderData.totalPrice} บาท`
      });
    });
    
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

function notifyCustomerServed(customerId, orderId) {
  const channelToken = getSecret('CHANNEL_ACCESS_TOKEN');
  if (!channelToken) return;
  
  sendLineMessage(customerId, {
    type: 'text',
    text: `🍜 อาหารของคุณเสิร์ฟแล้ว! กรุณารับที่โต๊ะ\nหมายเลขออเดอร์: ${orderId}\n\nขอให้อร่อยนะคะ 😊`
  });
}

function sendLineMessage(userId, message) {
  const channelToken = getSecret('CHANNEL_ACCESS_TOKEN');
  if (!channelToken) return;
  
  const payload = {
    to: userId,
    messages: [message]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelToken}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  } catch (error) {
    console.error('LINE Push Error:', error);
  }
}

// ========== LOGGING ==========
function logActivity(action, userId, details = {}) {
  try {
    const logSheet = getSheet('Logs');
    logSheet.appendRow([
      new Date(),
      action || 'unknown',
      userId || 'system',
      JSON.stringify(details),
      getEnvironment(),
      'INFO'
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

function logError(error, context = {}) {
  try {
    const logSheet = getSheet('Logs');
    logSheet.appendRow([
      new Date(),
      'ERROR',
      context.userId || 'system',
      error.toString(),
      getEnvironment(),
      'ERROR'
    ]);
  } catch (e) {
    console.error('Failed to log error:', e);
  }
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
