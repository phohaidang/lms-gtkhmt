import 'dotenv/config';
import db from './server/services/sheets.js';

async function diagnose() {
  console.log('🔍 Bắt đầu kiểm tra dữ liệu lớp L12...');
  try {
    const feedback = await db.getAll('session_feedback');
    const attendance = await db.getAll('attendance_log');

    console.log(`\n📊 SESSION_FEEDBACK (${feedback.length} bản ghi):`);
    feedback.forEach((f, i) => {
      console.log(`${i+1}. Session: ${f.session_id} (Type: ${typeof f.session_id}), Content: ${f.comment || 'N/A'}`);
    });

    console.log(`\n📋 ATTENDANCE_LOG (${attendance.length} bản ghi):`);
    attendance.forEach((a, i) => {
      console.log(`${i+1}. Session: ${a.session_id} (Type: ${typeof a.session_id}), Student: ${a.student_name}`);
    });

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

diagnose();
