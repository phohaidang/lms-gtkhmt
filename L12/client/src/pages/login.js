import { api, setToken, setUser, isLoggedIn } from '../api.js';
import { navigate } from '../router.js';

export function renderLogin(app) {
  if (isLoggedIn()) {
    navigate('/dashboard');
    return;
  }

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon">🎓</div>
          <h1>LMS Hub</h1>
          <p>Giới thiệu Khoa học máy tính — BAF737</p>
        </div>

        <div id="auth-error" class="alert alert-danger" style="display:none"></div>

        <form id="auth-form">
          <div class="form-group">
            <label class="form-label">Email trường</label>
            <input type="email" class="form-input" name="email" placeholder="mssv@hub.edu.vn" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" class="form-input" name="password" placeholder="Mật khẩu của bạn" required>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="auth-submit">
            🔐 Đăng nhập
          </button>
        </form>

        <div class="auth-toggle" style="font-size: 0.85rem; color: var(--text-secondary)">
          Quên mật khẩu? Vui lòng liên hệ Giảng viên.
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('auth-form');
  const errorEl = document.getElementById('auth-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('auth-submit');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';
    errorEl.style.display = 'none';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const result = await api.post('/auth/login', data);
      setToken(result.token);
      setUser(result.user);
      navigate('/dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = '🔐 Đăng nhập';
    }
  });
}
