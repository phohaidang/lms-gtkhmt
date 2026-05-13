/**
 * scripts/ensure-sheets-tabs.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

async function ensure() {
  const l10EnvPath = join(process.cwd(), '..', 'L10', '.env');
  const classes = ['L11', 'L12'];

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

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  for (const classId of classes) {
    const classEnvPath = join(process.cwd(), '..', classId, '.env');
    const spreadsheetId = getEnvFromFile(classEnvPath, 'GOOGLE_SHEETS_ID');

    if (!spreadsheetId) continue;

    console.log(`🛠️ Đang kiểm tra cấu trúc Sheet cho lớp ${classId}: ${spreadsheetId}...`);

    try {
      const response = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = response.data.sheets.map(s => s.properties.title);

      const requiredSheets = [
        { title: 'session_feedback', header: ['session_id', 'student_id', 'rating', 'comment', 'created_at'] },
        { title: 'attendance_log', header: ['student_id', 'session_id', 'status', 'method', 'timestamp'] }
      ];

      for (const sheet of requiredSheets) {
        if (!existingSheets.includes(sheet.title)) {
          console.log(`   + Đang tạo Tab thiếu: ${sheet.title}`);
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: sheet.title } } }]
            }
          });
          
          // Add header
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheet.title}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [sheet.header] }
          });
        } else {
          console.log(`   ✓ Tab ${sheet.title} đã tồn tại.`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Lỗi lớp ${classId}:`, err.message);
    }
  }

  console.log('\n✨ Xong! Cấu trúc dữ liệu cho tất cả các lớp đã hoàn thiện.');
}

ensure();
