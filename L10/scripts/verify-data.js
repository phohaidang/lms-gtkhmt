import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'students!A1:Z100',
    });
    
    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ Hiện tại tab "students" đang trống không (trên Server Google).');
    } else {
      console.log(`✅ Tìm thấy ${rows.length} dòng dữ liệu trong tab "students":`);
      rows.forEach((row, i) => console.log(`${i + 1}: ${row.join(' | ')}`));
    }
  } catch (err) {
    console.error('❌ Lỗi khi đọc dữ liệu:', err.message);
  }
}

checkData();
