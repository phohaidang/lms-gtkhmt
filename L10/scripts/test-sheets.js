import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log('🔍 Kiểm tra kết nối Google Sheets...');
  console.log('ID Sheet:', process.env.GOOGLE_SHEETS_ID);
  console.log('Email Bot:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID
    });
    console.log('✅ Kết nối thành công!');
    console.log('Tên file Sheet:', res.data.properties.title);
    console.log('Các tab hiện có:', res.data.sheets.map(s => s.properties.title).join(', '));
  } catch (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  }
}

testConnection();
