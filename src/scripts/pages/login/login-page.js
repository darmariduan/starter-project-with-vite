import LoginPresenter from './login-presenter';
import { ValidationUtils, AuthUtils } from '../../utils';
import Swal from 'sweetalert2';

export default class LoginPage {
  constructor() {
    this.presenter = new LoginPresenter(this);
  }

  async render() {
    return `
      <section class="auth-section container">
        <div class="auth-card">
          <h1 class="auth-title">Masuk ke Akun</h1>
          <p class="auth-subtitle">Masuk untuk berbagi cerita Anda</p>
          
          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="contoh@email.com"
                required
                autocomplete="email"
                aria-required="true"
              />
              <span class="error-message" role="alert" aria-live="polite"></span>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Minimal 8 karakter"
                required
                autocomplete="current-password"
                aria-required="true"
              />
              <span class="error-message" role="alert" aria-live="polite"></span>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="login-btn">
              Masuk
            </button>
          </form>
          
          <p class="auth-footer">
            Belum punya akun? <a href="#/register">Daftar di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Redirect if already logged in
    if (AuthUtils.isAuthenticated()) {
      window.location.hash = '#/';
      return;
    }

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');

    // Real-time validation
    emailInput.addEventListener('input', () => {
      this.validateEmailField(emailInput);
    });

    passwordInput.addEventListener('input', () => {
      this.validatePasswordField(passwordInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validate all fields
      const isEmailValid = this.validateEmailField(emailInput);
      const isPasswordValid = this.validatePasswordField(passwordInput);

      if (isEmailValid && isPasswordValid) {
        await this.presenter.login(email, password);
      }
    });
  }

  validateEmailField(input) {
    const email = input.value.trim();

    if (!email) {
      ValidationUtils.showError(input, 'Email harus diisi');
      return false;
    }

    if (!ValidationUtils.validateEmail(email)) {
      ValidationUtils.showError(input, 'Format email tidak valid');
      return false;
    }

    ValidationUtils.clearError(input);
    return true;
  }

  validatePasswordField(input) {
    const password = input.value;

    if (!password) {
      ValidationUtils.showError(input, 'Password harus diisi');
      return false;
    }

    if (!ValidationUtils.validatePassword(password)) {
      ValidationUtils.showError(input, 'Password minimal 8 karakter');
      return false;
    }

    ValidationUtils.clearError(input);
    return true;
  }

  showLoading() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Memproses...';
  }

  hideLoading() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Masuk';
  }

  onLoginSuccess() {
    Swal.fire({
      icon: 'success',
      title: 'Berhasil Masuk!',
      text: 'Selamat datang kembali',
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true,
    }).then(() => {
      window.location.hash = '#/';
    });
  }

  onLoginError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal Masuk',
      text: message || 'Email atau password salah. Silakan coba lagi.',
      confirmButtonText: 'OK',
    });
  }
}
