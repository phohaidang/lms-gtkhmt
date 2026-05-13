/**
 * sync-students-to-sheets.js
 * 
 * Đẩy danh sách sinh viên từ file _mock_db.json lên Google Sheets.
 * Chạy script này từ thư mục gốc của lớp (ví dụ: L12)
 */

import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

async function sync() {
  const MOCK_DB_PATH = join(process.cwd(), 'data', '_mock_db.json');
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    console.error('❌ Lỗi: Không tìm thấy GOOGLE_SHEETS_ID trong .env');
    return;
  }

  if (!existsSync(MOCK_DB_PATH)) {
    console.error('❌ Lỗi: Không tìm thấy file dữ liệu tại:', MOCK_DB_PATH);
    return;
  }

  const data = JSON.parse(readFileSync(MOCK_DB_PATH, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  if (students.length === 0) {
    console.log('⚠️ Không có sinh viên nào để đồng bộ.');
    return;
  }

  console.log(`🚀 Đang chuẩn bị đẩy ${students.length} sinh viên lên Google Sheet: ${spreadsheetId}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Chuẩn bị dữ liệu hàng (rows)
    // Header: ['student_id', 'email', 'full_name', 'password_hash', 'role', 'must_change_password', 'created_at', 'last_login']
    const rows = students.map(s => [
      s.student_id,
      s.email,
      s.full_name,
      s.password_hash,
      'student',
      s.must_change_password ? 'TRUE' : 'FALSE',
      s.created_at,
      ''
    ]);

    // Đẩy lên Sheet 'students', bắt đầu từ hàng 2 (sau header)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'students!A2',
      valueInputOption: 'RAW',
      requestBody: { values: [ ...rows ] }
    });

    console.log('✨ Đã đồng bộ thành công! Giờ sinh viên có thể đăng nhập trên Vercel.');
  } catch (err) {
    console.error('❌ Lỗi đồng bộ:', err.message);
  }
}

sync();
