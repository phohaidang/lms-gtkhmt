/**
 * setup-sheets.js
 * 
 * Kiểm tra và tự động tạo các Sheet (Tab) còn thiếu trong Google Spreadsheet.
 */

import 'dotenv/config';
import { google } from 'googleapis';

async function setup() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.log('⚠️ Đang chạy ở chế độ MOCK (không có GOOGLE_SHEETS_ID). Không cần setup Sheets.');
    return;
  }

  console.log(`🚀 Đang kiểm tra Google Sheet: ${spreadsheetId}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 1. Lấy danh sách các sheet hiện có
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log('✅ Các sheet hiện có:', existingSheets.join(', '));

    const requiredSheets = [
      { name: 'students', headers: ['student_id', 'email', 'full_name', 'password_hash', 'role', 'must_change_password', 'created_at', 'last_login'] },
      { name: 'quiz_attempts', headers: ['id', 'student_id', 'session_number', 'score', 'total_questions', 'submitted_at'] },
      { name: 'exam_attempts', headers: ['id', 'student_id', 'exam_id', 'score', 'submitted_at'] },
      { name: 'session_feedback', headers: ['id', 'session_id', 'anon_hash', 'understanding', 'pace', 'usefulness', 'comment', 'submitted_at'] },
      { name: 'attendance_log', headers: ['id', 'session_id', 'student_id', 'student_name', 'checked_in_at'] },
      { name: 'manual_grades', headers: ['id', 'student_id', 'exam_id', 'file_path', 'uploaded_at'] }
    ];

    for (const req of requiredSheets) {
      if (!existingSheets.includes(req.name)) {
        console.log(`➕ Đang tạo sheet: ${req.name}...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: req.name } } }]
          }
        });

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${req.name}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [req.headers] }
        });
        console.log(`   ✅ Đã tạo xong ${req.name} với header chuẩn.`);
      } else {
        console.log(`✔ Sheet [${req.name}] đã tồn tại.`);
      }
    }

    console.log('\n✨ Chúc mừng! Google Sheet của bạn đã sẵn sàng cho tất cả các tính năng.');
  } catch (err) {
    console.error('❌ Lỗi setup Sheets:', err.message);
    if (err.message.includes('not found')) {
      console.error('👉 Vui lòng kiểm tra lại GOOGLE_SHEETS_ID trong file .env');
    }
  }
}

setup();
