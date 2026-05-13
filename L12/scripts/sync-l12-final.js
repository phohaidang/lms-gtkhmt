/**
 * scripts/sync-l12-final.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

async function sync() {
  // 1. Lấy thông tin xác thực từ L10 (Bản đang chạy tốt)
  const l10EnvPath = join(process.cwd(), '..', 'L10', '.env');
  const l12EnvPath = join(process.cwd(), '.env');
  const l12DataPath = join(process.cwd(), 'data', '_mock_db.json');

  const getEnvFromFile = (filePath, key) => {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    let val = match ? match[1].trim() : null;
    if (val && val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    return val;
  };

  const clientEmail = getEnvFromFile(l10EnvPath, 'GOOGLE_SERVICE_ACCOUNT_EMAIL');
  let privateKey = getEnvFromFile(l10EnvPath, 'GOOGLE_PRIVATE_KEY');
  privateKey = privateKey.replace(/\\n/g, '\n');

  // 2. Lấy Spreadsheet ID của L12
  const spreadsheetId = getEnvFromFile(l12EnvPath, 'GOOGLE_SHEETS_ID');

  if (!spreadsheetId) {
    console.error('❌ Không tìm thấy Spreadsheet ID của L12');
    return;
  }

  // 3. Đọc dữ liệu sinh viên L12
  const data = JSON.parse(readFileSync(l12DataPath, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  console.log(`🚀 Đang dùng xác thực L10 để đẩy ${students.length} sinh viên lên Sheet L12: ${spreadsheetId}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
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
      requestBody: { values: rows }
    });

    console.log('✨ THÀNH CÔNG! Sinh viên lớp L12 đã được nạp. Bạn hãy kiểm tra đăng nhập trên Vercel.');
  } catch (err) {
    console.error('❌ Lỗi API Google:', err.message);
  }
}

sync();
