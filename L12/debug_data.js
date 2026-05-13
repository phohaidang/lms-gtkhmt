import fs from 'fs';
import { google } from 'googleapis';

async function debug() {
  console.log('🧪 Đang nội soi Tab [session_feedback] (ESM Mode)...');
  
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getVar = (name) => {
    const lines = envContent.split('\n');
    const line = lines.find(l => l.startsWith(name + '='));
    if (!line) return null;
    let val = line.substring(name.length + 1).trim();
    return val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  };

  const email = getVar('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  let key = getVar('GOOGLE_PRIVATE_KEY');
  const sheetId = getVar('GOOGLE_SHEETS_ID');

  if (!key) {
    console.log('❌ Không tìm thấy Private Key trong .env');
    return;
  }

  // Sửa lỗi xuống dòng trong key
  key = key.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'session_feedback!A:Z'
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ Tab [session_feedback] TRỐNG RỖNG!');
    } else {
      console.log('✅ Tiêu đề:', rows[0]);
      console.log('✅ Số dòng dữ liệu:', rows.length - 1);
      if (rows.length > 1) {
          console.log('✅ Dòng 1:', JSON.stringify(rows[1]));
      }
    }

    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'attendance_log!A:Z'
    });
    console.log('\n✅ Tiêu đề [attendance_log]:', res2.data.values ? res2.data.values[0] : 'TRỐNG');
    if (res2.data.values && res2.data.values.length > 1) {
        console.log('✅ Dòng 1 [attendance_log]:', JSON.stringify(res2.data.values[1]));
    }

  } catch (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  }
}

debug();
