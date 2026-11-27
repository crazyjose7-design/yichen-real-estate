/**
 * 億辰不動產聯絡表單接收端
 * Deploy as a Google Apps Script Web App after setting Script Properties.
 * Required Script Property: RECIPIENT_EMAIL
 * Optional: SPREADSHEET_ID, LINE_CHANNEL_ACCESS_TOKEN, LINE_TO_ID
 */

function doGet() {
  return json_({ ok: true, service: 'yichen-contact-endpoint', version: '1.0.0' });
}

function doPost(e) {
  var requestId = Utilities.getUuid();
  var receivedAt = new Date();
  var payload;
  var emailSent = false;
  var lineStatus = 'not_configured';
  var sheetStatus = 'not_configured';
  var errorMessage = '';

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('EMPTY_REQUEST');
    }
    payload = JSON.parse(e.postData.contents);
    var data = validatePayload_(payload);
    var properties = PropertiesService.getScriptProperties();
    var recipient = String(properties.getProperty('RECIPIENT_EMAIL') || '').trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new Error('RECIPIENT_EMAIL_NOT_CONFIGURED');
    }

    var subject = '[億辰官網諮詢] ' + data.name + '｜' + data.purpose + '｜' + requestId;
    var body = [
      '億辰不動產網站收到一筆新諮詢。',
      '案件編號：' + requestId,
      '收到時間：' + receivedAt.toISOString(),
      '姓名：' + data.name,
      '電話：' + data.phone,
      'Email：' + data.email,
      'LINE ID（僅供聯絡，不是 Messaging API userId）：' + data.lineId,
      '居住縣市：' + data.city,
      '委託目的：' + data.purpose,
      '',
      '需求說明：',
      data.message
    ].join('\n');

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      htmlBody: '<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">' + escapeHtml_(body) + '</pre>',
      replyTo: data.email,
      name: '億辰不動產網站'
    });
    emailSent = true;

    var token = String(properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '').trim();
    var lineTo = String(properties.getProperty('LINE_TO_ID') || '').trim();
    if (token && lineTo) {
      try {
        lineStatus = sendLine_(token, lineTo, body) ? 'sent' : 'failed';
      } catch (lineError) {
        lineStatus = 'failed: ' + String(lineError.message || lineError).slice(0, 180);
      }
    }

    try {
      sheetStatus = appendLead_(properties, requestId, receivedAt, data, emailSent, lineStatus);
    } catch (sheetError) {
      sheetStatus = 'failed: ' + String(sheetError.message || sheetError).slice(0, 180);
    }

    logEvent_('CONTACT_ACCEPTED', {
      requestId: requestId,
      emailSent: emailSent,
      lineStatus: lineStatus,
      sheetStatus: sheetStatus
    });

    return json_({
      ok: true,
      requestId: requestId,
      emailSent: emailSent,
      lineStatus: lineStatus,
      sheetStatus: sheetStatus
    });
  } catch (error) {
    errorMessage = String(error.message || error).slice(0, 240);
    try {
      logEvent_('CONTACT_REJECTED', { requestId: requestId, error: errorMessage });
    } catch (ignored) {}
    return json_({ ok: false, requestId: requestId, error: errorMessage });
  }
}

function validatePayload_(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('INVALID_PAYLOAD');
  var data = {
    name: clean_(p.name, 80),
    phone: clean_(p.phone, 40),
    email: clean_(p.email, 160),
    lineId: clean_(p.lineId, 100),
    city: clean_(p.city, 40),
    purpose: clean_(p.purpose, 60),
    message: clean_(p.message, 3000),
    source: clean_(p.source || '億辰不動產集團官方網站', 100)
  };
  if (!data.name || !data.phone || !data.email || !data.city || !data.purpose || !data.message) {
    throw new Error('REQUIRED_FIELD_MISSING');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('INVALID_EMAIL');
  if (!/^[0-9+()\-\s#]{6,40}$/.test(data.phone)) throw new Error('INVALID_PHONE');
  return data;
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function sendLine_(token, to, message) {
  var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      to: to,
      messages: [{ type: 'text', text: message.slice(0, 4900) }]
    }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('LINE_API_HTTP_' + status + ': ' + response.getContentText().slice(0, 120));
  }
  return true;
}

function appendLead_(properties, requestId, receivedAt, data, emailSent, lineStatus) {
  var spreadsheetId = String(properties.getProperty('SPREADSHEET_ID') || '').trim();
  if (!spreadsheetId) return 'not_configured';
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName('ContactLeads') || spreadsheet.insertSheet('ContactLeads');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['requestId', 'receivedAt', 'name', 'phone', 'email', 'lineId', 'city', 'purpose', 'message', 'emailSent', 'lineStatus']);
  }
  sheet.appendRow([
    requestId, receivedAt, data.name, data.phone, data.email, data.lineId,
    data.city, data.purpose, data.message, emailSent, lineStatus
  ]);
  return 'saved';
}

function logEvent_(eventName, details) {
  console.log(JSON.stringify({
    event: eventName,
    at: new Date().toISOString(),
    details: details
  }));
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the Apps Script editor to verify required configuration. */
function testConfiguration() {
  var p = PropertiesService.getScriptProperties();
  var recipient = String(p.getProperty('RECIPIENT_EMAIL') || '').trim();
  if (!recipient) throw new Error('Set Script Property RECIPIENT_EMAIL before deploying.');
  return {
    recipientConfigured: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient),
    spreadsheetConfigured: !!p.getProperty('SPREADSHEET_ID'),
    lineConfigured: !!p.getProperty('LINE_CHANNEL_ACCESS_TOKEN') && !!p.getProperty('LINE_TO_ID')
  };
}
