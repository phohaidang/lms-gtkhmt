/**
 * scripts/sync-l12.js
 * 
 * Sử dụng trực tiếp DB Service của hệ thống để đồng bộ dữ liệu.
 */

import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import db from '../server/services/sheets.js';

async function sync() {
  const mockDbPath = join(process.cwd(), 'data', '_mock_db.json');

  if (!existsSync(mockDbPath)) {
    console.error(`❌ Không tìm thấy file dữ liệu tại: ${mockDbPath}`);
    return;
  }

  const data = JSON.parse(readFileSync(mockDbPath, 'utf-8'));
  const students = data.students.filter(s => s.role === 'student');

  console.log(`🚀 Đang đồng bộ ${students.length} sinh viên lên Google Sheets thông qua DB Service...`);

  try {
    for (const s of students) {
      const payload = {
        student_id: s.student_id,
        email: s.email,
        full_name: s.full_name,
        password_hash: s.password_hash,
        role: 'student',
        must_change_password: s.must_change_password ? 'TRUE' : 'FALSE',
        created_at: s.created_at,
        last_login: ''
      };
      
      // Kiểm tra xem đã tồn tại chưa để tránh trùng lặp
      const existing = await db.findOne('students', x => x.student_id === s.student_id);
      if (!existing) {
        await db.append('students', payload);
        console.log(`✅ Đã nạp: ${s.student_id} - ${s.full_name}`);
      } else {
        console.log(`ℹ️ Đã tồn tại: ${s.student_id}`);
      }
    }

    console.log('\n✨ Chúc mừng! Toàn bộ sinh viên lớp L12 đã được nạp lên Google Sheets.');
  } catch (err) {
    console.error('❌ Lỗi đồng bộ:', err.message);
  }
}

sync();
