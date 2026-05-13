/**
 * scripts/force-sync.js
 * 
 * Đồng bộ sinh viên lên Google Sheets (Fix lỗi định dạng Key)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

async function sync() {
  const targetDir = existsSync(join(process.cwd(), '.env')) ? '.' : 'L12';
  const classDir = join(process.cwd(), targetDir === '.' ? '' : targetDir);
  const envPath = join(classDir, '.env');
  const mockDbPath = join(classDir, 'data', '_mock_db.json');

  console.log(`🔍 Đang đọc cấu hình từ: ${envPath}`);
  const envContent = readFileSync(envPath, 'utf-8');
  
  // Parse thủ công để tránh lỗi DECODER
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    let val = match ? match[1].trim() : null;
    if (val && val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    return val;
  };

  const spreadsheetId = getEnv('GOOGLE_SHEETS_ID');
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  let privateKey = getEnv('GOOGLE_PRIVATE_KEY');

  if (!privateKey) {
    console.error('❌ Không tìm thấy GOOGLE_PRIVATE_KEY');
    return;
  }

  // Fix định dạng key
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (!existsSync(mockDbPath)) {
    console.error(`❌ Không tìm thấy file dữ liệu tại: ${mockDbPath}`);
    return;
  }

  const data = JSON.parse(readFileSync(mockDbPath, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  console.log(`🚀 Đang đẩy ${students.length} sinh viên lên Sheet: ${spreadsheetId}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey
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
      requestBody: { values: rows }
    });

    console.log('✨ Xong! Sinh viên lớp L12 hiện đã có thể đăng nhập.');
  } catch (err) {
    console.error('❌ Lỗi API Google:', err.message);
  }
}

sync();
