/**
 * scripts/sync-l11-final.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

async function sync() {
  const l10EnvPath = join(process.cwd(), '..', 'L10', '.env');
  const l11EnvPath = join(process.cwd(), '..', 'L11', '.env');
  const l11DataPath = join(process.cwd(), '..', 'L11', 'data', '_mock_db.json');

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

  const spreadsheetId = getEnvFromFile(l11EnvPath, 'GOOGLE_SHEETS_ID');

  if (!spreadsheetId) {
    console.error('❌ Không tìm thấy Spreadsheet ID của L11');
    return;
  }

  const data = JSON.parse(readFileSync(l11DataPath, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  console.log(`🚀 Đang đẩy ${students.length} sinh viên lên Sheet L11: ${spreadsheetId}...`);

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

    console.log('✨ THÀNH CÔNG! Sinh viên lớp L11 đã được nạp.');
  } catch (err) {
    console.error('❌ Lỗi API Google:', err.message);
  }
}

sync();
