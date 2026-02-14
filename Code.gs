// ============================================
// SENIOR FULL-STACK ARCHITECTURE
// NOODLE SHOP MANAGEMENT SYSTEM
// Environment: Multi-environment (DEV/PROD)
// Security: Zero-trust, Secret Management
// ============================================

// ========== CONFIGURATION ==========
// ตรวจสอบ Environment จาก URL หรือ Constant
function getEnvironment() {
  const url = ScriptApp.getService().getUrl();
  if (url.includes('dev') || url.includes('test') || url.includes('localhost')) {
    return 'DEV';
  }
  // ใช้ ScriptProperties กำหนดค่า PROD_URL เพื่อเทียบได้
  const prodUrl = PropertiesService.getScriptProperties().getProperty('PROD_URL');
  if (prodUrl && url === prodUrl) {
    return 'PROD';
  }
  return 'DEV'; // fallback
}

// ดึง Secret จาก ScriptProperties เท่านั้น!
function getSecret(key) {
  const env = getEnvironment();
  // รองรับการแยก Secret ตาม Environment
  const secretKey = `${env}_${key}`;
  const value = PropertiesService.getScriptProperties().getProperty(secretKey);
  if (!value) {
    console.error(`Secret not found: ${secretKey}`);
    throw new Error(`Configuration error: ${key} not set`);
  }
  return value;
}

// ========== SHEETS INITIALIZATION ==========
function getSheet(sheetName) {
  const spreadsheetId = getSecret('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  return sheet;
}

// ========== AUTH MIDDLEWARE ==========
function verifyAuth(userId, requiredRole = null) {
  if (!userId) {
    throw new Error('Unauthorized: No user ID');
  }
  
  // ดึงข้อมูล user จาก Sheets
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
    // Auto-register สำหรับ Customer ถ้ายังไม่มีในระบบ
    if (requiredRole === 'Customer' || !requiredRole) {
      return 'Customer'; // อนุญาตชั่วคราว
    }
    throw new Error('Forbidden: User not registered');
  }
  
  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      'Admin': 3,
      'Staff': 2,
      'Customer': 1
    };
    
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      throw new Error(`Forbidden: Required role ${requiredRole}, but user has ${userRole}`);
    }
  }
  
  return userRole;
}

// ========== API ROUTER ==========
function doPost(e) {
  return handleRequest(e, 'POST');
}

function doGet(e) {
  return handleRequest(e, 'GET');
}

function handleRequest(e, method) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    // Parse request
    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action = params.action || postData.action;
    const userId = params.userId || postData.userId;
    
    // Log request (สำหรับ audit)
    logActivity({
      action,
      userId,
      method,
      timestamp: new Date(),
      environment: getEnvironment()
    });
    
    // Route requests
    let result;
    switch (action) {
      // ===== Public APIs (ไม่ต้อง Auth) =====
      case 'getConfig':
        result = getPublicConfig();
        break;
        
      // ===== Customer APIs =====
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
        
      // ===== Staff APIs =====
      case 'getActiveOrders':
        verifyAuth(userId, 'Staff');
        result = getActiveOrders();
        break;
        
      case 'updateOrderStatus':
        verifyAuth(userId, 'Staff');
        result = updateOrderStatus(userId, postData);
        break;
        
      case 'billCalculation':
        verifyAuth(userId, 'Staff');
        result = calculateBill(postData.orderId, postData.payment);
        break;
        
      // ===== Admin APIs =====
      case 'manageUsers':
        verifyAuth(userId, 'Admin');
        result = manageUsers(postData);
        break;
        
      case 'manageMenu':
        verifyAuth(userId, 'Admin');
        result = manageMenu(postData);
        break;
        
      case 'getReports':
        verifyAuth(userId, 'Admin');
        result = getReports(postData);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('API Error:', error);
    
    // Log error
    logError({
      error: error.toString(),
      stack: error.stack,
      params: e.parameter,
      userId: e.parameter?.userId
    });
    
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

// ========== PUBLIC CONFIG (ส่งให้ Frontend) ==========
function getPublicConfig() {
  const env = getEnvironment();
  return {
    environment: env,
    liffId: getSecret('LIFF_ID'),  // LIFF ID ตาม Environment
    version: '1.0.0',
    features: {
      audioNotification: true,
      tableSelection: true,
      specialRequests: true
    }
  };
}

// ========== MENU MANAGEMENT ==========
function getMenu() {
  const menuSheet = getSheet('Menu');
  const data = menuSheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    
    // แปลง Google Drive Image URL เป็น Direct Link
    if (item.imageUrl && item.imageUrl.includes('drive.google.com')) {
      item.imageUrl = convertDriveLink(item.imageUrl);
    }
    
    return item;
  }).filter(item => item.status !== 'deleted'); // ไม่แสดงที่ลบแล้ว
}

// ========== ORDER MANAGEMENT ==========
function createOrder(userId, data) {
  const { tableNo, items, totalPrice, specialNotes } = data;
  
  if (!items || !items.length) {
    throw new Error('Order must have at least one item');
  }
  
  const orderSheet = getSheet('Orders');
  const orderId = generateOrderId();
  
  const orderData = {
    orderId,
    userId,
    tableNo: tableNo || 'Takeaway',
    items: JSON.stringify(items),
    totalPrice,
    specialNotes: specialNotes || '',
    status: 'Pending',
    timestamp: new Date(),
    createdBy: userId
  };
  
  // Append to sheet
  const headers = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => orderData[header] || '');
  orderSheet.appendRow(newRow);
  
  // Send notifications
  notifyNewOrder(orderData);
  
  return { orderId, ...orderData };
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
        } else {
          order[header] = row[index];
        }
      });
      return order;
    })
    .filter(order => activeStatuses.includes(order.status))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // ใหม่สุดขึ้นก่อน
}

function updateOrderStatus(staffId, data) {
  const { orderId, newStatus } = data;
  
  const orderSheet = getSheet('Orders');
  const dataRange = orderSheet.getDataRange().getValues();
  const headers = dataRange.shift();
  
  const orderIdCol = headers.indexOf('orderId');
  const statusCol = headers.indexOf('status');
  
  for (let i = 0; i < dataRange.length; i++) {
    if (dataRange[i][orderIdCol] === orderId) {
      // Update status
      orderSheet.getRange(i + 2, statusCol + 1).setValue(newStatus);
      
      // If status is 'Served', send push message to customer
      if (newStatus === 'Served') {
        const userId = dataRange[i][headers.indexOf('userId')];
        notifyCustomerServed(userId, orderId);
      }
      
      // Log activity
      logActivity({
        action: 'updateOrderStatus',
        userId: staffId,
        details: { orderId, newStatus }
      });
      
      return { success: true, orderId, newStatus };
    }
  }
  
  throw new Error('Order not found');
}

// ========== BILLING ==========
function calculateBill(orderId, payment) {
  const orderSheet = getSheet('Orders');
  const dataRange = orderSheet.getDataRange().getValues();
  const headers = dataRange.shift();
  
  const orderIdCol = headers.indexOf('orderId');
  const totalPriceCol = headers.indexOf('totalPrice');
  const statusCol = headers.indexOf('status');
  
  for (let i = 0; i < dataRange.length; i++) {
    if (dataRange[i][orderIdCol] === orderId) {
      const total = dataRange[i][totalPriceCol];
      const change = payment - total;
      
      if (change < 0) {
        throw new Error('Insufficient payment');
      }
      
      // Update status to Paid
      orderSheet.getRange(i + 2, statusCol + 1).setValue('Paid');
      
      return {
        total,
        payment,
        change,
        success: true
      };
    }
  }
  
  throw new Error('Order not found');
}

// ========== NOTIFICATION SYSTEM (Messaging API) ==========
function notifyNewOrder(orderData) {
  try {
    const channelToken = getSecret('CHANNEL_ACCESS_TOKEN');
    const staffSheet = getSheet('Users');
    const staffData = staffSheet.getDataRange().getValues();
    const headers = staffData.shift();
    
    const roleCol = headers.indexOf('role');
    const userIdCol = headers.indexOf('userId');
    
    // หา Staff ทุกคน
    const staffUsers = staffData
      .filter(row => row[roleCol] === 'Staff' || row[roleCol] === 'Admin')
      .map(row => row[userIdCol]);
    
    // ส่ง Push Message ไปหา Staff ทุกคน
    staffUsers.forEach(staffId => {
      sendLineMessage(staffId, {
        type: 'text',
        text: `🍜 ออเดอร์ใหม่!\nโต๊ะ: ${orderData.tableNo}\nจำนวน: ${JSON.parse(orderData.items).length} รายการ\nรวม: ${orderData.totalPrice} บาท`
      });
    });
    
  } catch (error) {
    console.error('Failed to send notification:', error);
    logError(error);
  }
}

function notifyCustomerServed(customerId, orderId) {
  sendLineMessage(customerId, {
    type: 'text',
    text: `🍜 อาหารของคุณเสิร์ฟแล้ว! กรุณารับที่โต๊ะ\nหมายเลขออเดอร์: ${orderId}\n\nขอให้อร่อยนะคะ 😊`
  });
}

function sendLineMessage(userId, message) {
  const channelToken = getSecret('CHANNEL_ACCESS_TOKEN');
  
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
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  } catch (error) {
    console.error('LINE Push Error:', error);
    logError(error);
  }
}

// ========== UTILITIES ==========
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

function convertDriveLink(driveUrl) {
  // แปลง Google Drive link เป็น direct image URL
  const fileId = extractFileId(driveUrl);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
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

// ========== LOGGING ==========
function logActivity(data) {
  try {
    const logSheet = getSheet('Logs');
    logSheet.appendRow([
      new Date(),
      data.action || 'unknown',
      data.userId || 'system',
      JSON.stringify(data.details || {}),
      getEnvironment(),
      'INFO'
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

function logError(error) {
  try {
    const logSheet = getSheet('Logs');
    logSheet.appendRow([
      new Date(),
      'ERROR',
      'system',
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

// Include function สำหรับเรียกไฟล์ HTML อื่นๆ
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
