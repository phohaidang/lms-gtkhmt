/**
 * scripts/sync-students.js
 * 
 * Cách dùng: node scripts/sync-students.js [Tên thư mục lớp]
 * Ví dụ: node scripts/sync-students.js L12
 */

import 'dotenv/config'; // Sẽ dùng .env của root hoặc của lớp
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';
import dotenv from 'dotenv';

async function sync() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error('❌ Vui lòng chỉ định thư mục lớp. Ví dụ: node scripts/sync-students.js L12');
    return;
  }

  const classDir = join(process.cwd(), targetDir);
  const envPath = join(classDir, '.env');
  const mockDbPath = join(classDir, 'data', '_mock_db.json');

  if (!existsSync(envPath)) {
    console.error(`❌ Không tìm thấy file .env tại: ${envPath}`);
    return;
  }

  // Nạp cấu hình từ .env của lớp đó
  const config = dotenv.parse(readFileSync(envPath));
  const spreadsheetId = config.GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    console.error('❌ Lỗi: Không tìm thấy GOOGLE_SHEETS_ID trong file .env của lớp.');
    return;
  }

  if (!existsSync(mockDbPath)) {
    console.error(`❌ Lỗi: Không tìm thấy file _mock_db.json tại: ${mockDbPath}`);
    return;
  }

  const data = JSON.parse(readFileSync(mockDbPath, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  if (students.length === 0) {
    console.log('⚠️ Không có sinh viên nào để đồng bộ.');
    return;
  }

  console.log(`🚀 Đang chuẩn bị đẩy ${students.length} sinh viên của [${targetDir}] lên Google Sheet: ${spreadsheetId}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: config.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
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

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'students!A2',
      valueInputOption: 'RAW',
      requestBody: { values: [ ...rows ] }
    });

    console.log(`✨ Đã đồng bộ thành công cho lớp [${targetDir}]! Giờ sinh viên có thể đăng nhập trên Vercel.`);
  } catch (err) {
    console.error('❌ Lỗi đồng bộ:', err.message);
  }
}

sync();
