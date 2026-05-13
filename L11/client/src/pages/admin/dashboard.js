import { api } from '../../api.js';

export async function renderAdminDashboard(app) {
  app.innerHTML = `<div class="container page"><div class="loading"><div class="spinner"></div></div></div>`;

  const grades = await api.get('/grades/admin/all');
  const totalStudents = grades.length;
  const avgQuiz = grades.filter(g => g.quiz_avg).reduce((s, g) => s + g.quiz_avg, 0) / (grades.filter(g => g.quiz_avg).length || 1);

  app.innerHTML = `
    <div class="container page">
      <div class="page-header">
        <h1 class="page-title">🛠 Admin Dashboard</h1>
        <p class="page-subtitle">Quản trị môn học ITS717</p>
      </div>

      <div class="grid grid-3" style="margin-bottom:2rem">
        <div class="stat-card">
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">Sinh viên đăng ký</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgQuiz.toFixed(1)}</div>
          <div class="stat-label">Điểm TB Quiz</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${grades.filter(g => g.quiz_count >= 9).length}</div>
          <div class="stat-label">SV hoàn thành quiz</div>
        </div>
      </div>

      <div style="display:flex;gap:1rem;margin-bottom:1.5rem">
        <a href="#/admin/grades" class="btn btn-primary">📋 Quản lý điểm</a>
        <a href="#/admin/evidence" class="btn btn-secondary">📦 Xuất minh chứng</a>
      </div>

      <h2 style="margin: 2rem 0 1rem">📊 Danh sách sinh viên</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>MSSV</th><th>Họ tên</th><th>Quiz (TB)</th><th>Số quiz</th><th>Kiểm tra</th></tr>
          </thead>
          <tbody>
            ${grades.map(g => `
              <tr>
                <td><code>${g.student_id}</code></td>
                <td>${g.full_name}</td>
                <td>${g.quiz_avg ? `<span class="badge ${g.quiz_avg >= 8 ? 'badge-success' : g.quiz_avg >= 5 ? 'badge-warning' : 'badge-danger'}">${g.quiz_avg}</span>` : '—'}</td>
                <td>${g.quiz_count}/9</td>
                <td>${g.exams.map(e => `${e.exam_id}: ${e.score}`).join(', ') || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="admin-goals-section" style="margin-top: 3rem">
        <h2 style="margin-bottom:1rem">🎯 Mục tiêu & Tự đánh giá</h2>
        <div class="card"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  // Load goals
  renderAdminGoals(document.getElementById('admin-goals-section'));
}

async function renderAdminGoals(container) {
  try {
    const goals = await api.get('/goals/admin/all');
    if (goals.length === 0) {
      container.innerHTML = `
        <h2 style="margin-bottom:1rem">🎯 Mục tiêu & Tự đánh giá</h2>
        <div class="alert alert-info">Chưa có sinh viên nào thiết lập mục tiêu.</div>
      `;
      return;
    }

    container.innerHTML = `
      <h2 style="margin-bottom:1rem">🎯 Mục tiêu & Tự đánh giá</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>MSSV</th><th>Sinh viên</th><th>Mục tiêu học tập</th><th>Đạt được (%)</th></tr>
          </thead>
          <tbody>
            ${goals.map(g => `
              <tr>
                <td><code>${g.student_id}</code></td>
                <td>${g.student_name}</td>
                <td style="max-width: 400px; font-style: italic">"${g.goal_statement}"</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem">
                    <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden">
                      <div style="width: ${g.achievement_percent}%; height: 100%; background: var(--success)"></div>
                    </div>
                    <span style="font-weight: bold; width: 40px">${g.achievement_percent}%</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="alert alert-danger">Lỗi tải dữ liệu mục tiêu.</div>';
  }
}

