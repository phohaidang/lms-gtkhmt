import 'dotenv/config';
import db from './server/services/sheets.js';

async function checkAdmin() {
  console.log('🔍 Kiểm tra quyền Admin lớp L12...');
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const user = await db.findOne('students', s => s.email === adminEmail);
    
    if (user) {
      console.log(`✅ Tìm thấy tài khoản: ${user.email}`);
      console.log(`🔑 Role hiện tại: [${user.role}]`);
      if (user.role !== 'admin') {
        console.log('⚠️ CẢNH BÁO: Tài khoản chưa có quyền [admin]! Đang tiến hành cập nhật...');
        await db.update('students', s => s.email === adminEmail, { role: 'admin' });
        console.log('✨ Đã cập nhật quyền admin thành công!');
      }
    } else {
      console.log('❌ Không tìm thấy tài khoản admin trong Sheet students!');
    }
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

checkAdmin();
