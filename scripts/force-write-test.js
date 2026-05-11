import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

async function forceWriteTest() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log('📝 Đang thử ghi một dòng test lên Google Sheets...');
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'students!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['TEST_ID', 'test@email.com', 'Test User', 'hash', 'student']]
      }
    });
    console.log('✅ Ghi thành công! Kết quả từ Google:', res.statusText);
  } catch (err) {
    console.error('❌ Lỗi ghi dữ liệu:', err.message);
  }
}

forceWriteTest();
