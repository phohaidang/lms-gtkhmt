import 'dotenv/config';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from '../server/services/sheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper decode HTML entities cơ bản
function decodeHTML(str) {
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&nbsp;/g, ' ')
            .trim();
}

async function importStudents(filePath) {
  console.log(`📂 Đang đọc file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Không tìm thấy file!');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex tìm các hàng <tr> chứa dữ liệu sinh viên
  // Cấu trúc: <td>STT</td><td>MaSV</td><td>Lop</td><td>HoLot</td><td>Ten</td>...
  const rowRegex = /<tr>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>/gi;
  
  let match;
  const students = [];

  while ((match = rowRegex.exec(content)) !== null) {
    const student_id = match[2].trim();
    const ho_lot = decodeHTML(match[3]);
    const ten = decodeHTML(match[4]);
    const full_name = `${ho_lot} ${ten}`.replace(/\s+/g, ' ').trim();
    
    students.push({
      student_id,
      full_name,
      email: `${student_id}@st.hub.edu.vn`,
      password: student_id // Password mặc định là MSSV
    });
  }

  console.log(`✅ Tìm thấy ${students.length} sinh viên. Bắt đầu import vào Google Sheets...`);

  let count = 0;
  for (const s of students) {
    try {
      // Kiểm tra trùng
      const existing = await db.findOne('students', item => item.student_id === s.student_id);
      if (existing) {
        console.log(`⏩ Bỏ qua ${s.student_id} (Đã tồn tại)`);
        continue;
      }

      // Hash mật khẩu
      const password_hash = await bcrypt.hash(s.password, 10);
      
      const user = {
        student_id: s.student_id,
        email: s.email,
        full_name: s.full_name,
        password_hash,
        role: 'student',
        must_change_password: true, // Yêu cầu đổi pass lần đầu
        created_at: new Date().toISOString(),
        last_login: ''
      };

      await db.append('students', user);
      count++;
      console.log(`+ Đã thêm: ${s.student_id} - ${s.full_name}`);
    } catch (err) {
      console.error(`❌ Lỗi khi thêm ${s.student_id}:`, err.message);
    }
  }

  console.log(`\n✨ Hoàn tất! Đã thêm mới ${count} sinh viên vào hệ thống.`);
  process.exit(0);
}

// Chạy script với đối số là đường dẫn file
const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Vui lòng cung cấp đường dẫn file. VD: node scripts/import-students.js client/public/Class/BAF737_252_L10.xls.md');
} else {
  importStudents(join(__dirname, '..', fileArg));
}
