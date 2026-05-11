import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const SOURCE_PROJECT = 'lms-gtkhmt';
const TARGET_PROJECTS = [
  'lms-baf737-252-l10',
  'lms-baf737-252-l11',
  'lms-baf737-252-l12'
];

const SYNC_DIRS = [
  'client/public/lessons',
  'server/data/questions',
  'server/data/ebook',
  'server/routes',
  'server/services'
];

/**
 * Native recursive copy
 */
async function copyRecursive(src, dest) {
  const stats = await fs.promises.stat(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) await fs.promises.mkdir(dest, { recursive: true });
    const files = await fs.promises.readdir(src);
    for (const file of files) {
      await copyRecursive(join(src, file), join(dest, file));
    }
  } else {
    await fs.promises.copyFile(src, dest);
  }
}

async function sync() {
  console.log('🚀 Bắt đầu đồng bộ dữ liệu giữa các lớp...');

  for (const target of TARGET_PROJECTS) {
    const targetPath = join(ROOT, target);
    
    if (!fs.existsSync(targetPath)) {
      console.warn(`⚠️ Thư mục ${target} không tồn tại. Bỏ qua.`);
      continue;
    }

    console.log(`\n--- Đồng bộ sang: ${target} ---`);

    for (const dir of SYNC_DIRS) {
      const src = join(ROOT, SOURCE_PROJECT, dir);
      const dest = join(targetPath, dir);

      if (fs.existsSync(src)) {
        await copyRecursive(src, dest);
        console.log(`✅ Đã copy: ${dir}`);
      }
    }
  }

  console.log('\n✨ Hoàn tất đồng bộ!');
}

sync().catch(console.error);
