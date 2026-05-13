import { api, getUser } from '../api.js';

export async function renderDashboard(app) {
  const user = getUser();
  
  app.innerHTML = `
    <div class="container page">
      <div class="page-header">
        <h1 class="page-title">Xin chào, ${user.full_name}! 👋</h1>
        <p class="page-subtitle">BAF737 — Giới thiệu Khoa học máy tính | ĐH Ngân Hàng TP.HCM</p>
      </div>

      <div class="grid grid-4" id="stats">
        <div class="stat-card"><div class="spinner"></div></div>
        <div class="stat-card"><div class="spinner"></div></div>
        <div class="stat-card"><div class="spinner"></div></div>
        <div class="stat-card"><div class="spinner"></div></div>
      </div>

      <div id="goals-section" style="margin-top: 2rem">
         <div class="card"><div class="spinner"></div> Đang tải mục tiêu học tập...</div>
      </div>

      <div style="margin-top: 2rem">
        <h2 style="margin-bottom: 1rem">🚀 Truy cập nhanh</h2>
        <div class="grid grid-3">
          <a href="#/course" class="card" style="text-decoration:none">
            <h3>📚 Buổi học</h3>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.5rem">
              Xem giáo án, slide 6 buổi học
            </p>
          </a>
          <a href="#/ebook" class="card" style="text-decoration:none">
            <h3>📖 eBook</h3>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.5rem">
              Ôn tập theo SCQA + 3-Level Test
            </p>
          </a>
          <a href="#/grades" class="card" style="text-decoration:none">
            <h3>📋 Bảng điểm</h3>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.5rem">
              Xem điểm quiz, kiểm tra, tổng kết
            </p>
          </a>
        </div>
      </div>
    </div>
  `;

  // Gọi hàm renderGoals
  const goalsContainer = document.getElementById('goals-section');
  if (goalsContainer) {
    renderGoals(goalsContainer);
  }

  // Load stats
  try {
    const [quizzes, grades] = await Promise.all([
      api.get('/quizzes/my/attempts'),
      api.get('/grades/me')
    ]);

    const quizDone = quizzes.length;
    const avgScore = quizzes.length > 0
      ? (quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length).toFixed(1)
      : '—';
    const examsDone = grades.exams?.length || 0;
    const totalScore = grades.manual?.total_score ?? '—';

    document.getElementById('stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${quizDone}/6</div>
        <div class="stat-label">Quiz đã làm</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScore}</div>
        <div class="stat-label">Điểm TB Quiz</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${examsDone}</div>
        <div class="stat-label">Bài kiểm tra</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalScore}</div>
        <div class="stat-label">Điểm tổng kết</div>
      </div>
    `;
  } catch (err) {
    document.getElementById('stats').innerHTML = `
      <div class="alert alert-warning" style="grid-column: 1/-1">
        Tạm thời không thể tải thống kê. Hãy bắt đầu làm quiz!
      </div>
    `;
  }
}

async function renderGoals(container) {
  try {
    const goal = await api.get('/goals/my');
    
    if (!goal.id) {
      container.innerHTML = `
        <div class="card" style="background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white;">
          <h2 style="margin-bottom: 1rem">🎯 Xác lập mục tiêu học tập</h2>
          <p style="margin-bottom: 1.5rem; opacity: 0.9">Bạn mong muốn đạt được điều gì sau môn học này? Hãy viết ra bản cam kết của chính mình.</p>
          <div style="display: flex; flex-direction: column; gap: 1rem">
            <textarea id="goal-input" placeholder="Ví dụ: Nắm vững các khái niệm cơ bản về CNTT, đạt điểm A, hoặc có thể tự build được một ứng dụng nhỏ..." 
                      style="width: 100%; padding: 1rem; border-radius: 8px; border: none; color: #333; font-family: inherit; height: 80px"></textarea>
            <button id="save-goal-btn" class="btn btn-secondary" style="align-self: flex-end">Lưu mục tiêu học tập</button>
          </div>
        </div>
      `;

      document.getElementById('save-goal-btn').addEventListener('click', async () => {
        const goalStatement = document.getElementById('goal-input').value;
        if (!goalStatement || goalStatement.trim().length < 10) {
            alert('Vui lòng viết mục tiêu rõ ràng hơn một chút (ít nhất 10 ký tự)');
            return;
        }
        try {
          await api.post('/goals', { goal_statement: goalStatement });
          renderGoals(container);
        } catch (err) {
          alert(err.message || 'Lỗi khi lưu mục tiêu');
        }
      });
    } else {
      container.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--primary)">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem">
            <h2 style="color: var(--primary)">🎯 Mục tiêu môn học của tôi</h2>
            <span class="badge badge-success" style="font-size: 1rem">${goal.achievement_percent}% Hoàn thành</span>
          </div>
          <blockquote style="font-style: italic; border-left: none; padding: 0; color: var(--text-primary); font-size: 1.1rem; margin-bottom: 1.5rem">
            "${goal.goal_statement}"
          </blockquote>
          
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem">
              <label style="font-weight: bold">Tự đánh giá mức độ đạt được:</label>
              <span id="percent-display" style="font-weight: bold; color: var(--primary)">${goal.achievement_percent}%</span>
            </div>
            <input type="range" id="achievement-range" min="0" max="100" value="${goal.achievement_percent}" style="width: 100%; margin-bottom: 1rem">
            <button id="update-assess-btn" class="btn btn-primary btn-sm" style="display: block; margin-left: auto">Cập nhật đánh giá</button>
          </div>
        </div>
      `;

      const range = document.getElementById('achievement-range');
      const display = document.getElementById('percent-display');
      range.addEventListener('input', () => {
        display.innerText = range.value + '%';
      });

      document.getElementById('update-assess-btn').addEventListener('click', async () => {
        try {
          await api.post('/goals/assess', { percent: range.value });
          alert('Đã cập nhật mức độ hoàn thành!');
          renderGoals(container);
        } catch (err) {
          alert(err.message || 'Lỗi cập nhật');
        }
      });
    }
  } catch (err) {
    console.error('Goals error:', err);
    container.innerHTML = `
      <div class="alert alert-warning">
        ⚠️ Không thể tải mục tiêu học tập (Lỗi: ${err.message}). <br>
        Có thể Server đang cập nhật, vui lòng F5 lại trang sau 1 phút.
      </div>
    `;
  }
}
