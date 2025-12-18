import RegisterPresenter from './register-presenter';
import { ValidationUtils, AuthUtils } from '../../utils';
import Swal from 'sweetalert2';

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPresenter(this);
  }

  async render() {
    return `
      <section class="auth-section container">
        <div class="auth-card">
          <h1 class="auth-title">Buat Akun Baru</h1>
          <p class="auth-subtitle">Daftar untuk mulai berbagi cerita</p>
          
          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="name">Nama Lengkap</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Nama lengkap Anda"
                required
                autocomplete="name"
                aria-required="true"
              />
              <span class="error-message" role="alert" aria-live="polite"></span>
            </div>
            
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
                autocomplete="new-password"
                aria-required="true"
              />
              <span class="error-message" role="alert" aria-live="polite"></span>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="register-btn">
              Daftar
            </button>
          </form>
          
          <p class="auth-footer">
            Sudah punya akun? <a href="#/login">Masuk di sini</a>
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

    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Real-time validation
    nameInput.addEventListener('input', () => {
      this.validateNameField(nameInput);
    });

    emailInput.addEventListener('input', () => {
      this.validateEmailField(emailInput);
    });

    passwordInput.addEventListener('input', () => {
      this.validatePasswordField(passwordInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validate all fields
      const isNameValid = this.validateNameField(nameInput);
      const isEmailValid = this.validateEmailField(emailInput);
      const isPasswordValid = this.validatePasswordField(passwordInput);

      if (isNameValid && isEmailValid && isPasswordValid) {
        await this.presenter.register(name, email, password);
      }
    });
  }

  validateNameField(input) {
    const name = input.value.trim();

    if (!name) {
      ValidationUtils.showError(input, 'Nama harus diisi');
      return false;
    }

    if (!ValidationUtils.validateName(name)) {
      ValidationUtils.showError(input, 'Nama minimal 3 karakter');
      return false;
    }

    ValidationUtils.clearError(input);
    return true;
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
    const registerBtn = document.getElementById('register-btn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Memproses...';
  }

  hideLoading() {
    const registerBtn = document.getElementById('register-btn');
    registerBtn.disabled = false;
    registerBtn.textContent = 'Daftar';
  }

  onRegisterSuccess() {
    Swal.fire({
      icon: 'success',
      title: 'Pendaftaran Berhasil!',
      text: 'Akun Anda telah dibuat. Silakan login untuk melanjutkan.',
      confirmButtonText: 'Login Sekarang',
    }).then(() => {
      window.location.hash = '#/login';
    });
  }

  onRegisterError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Pendaftaran Gagal',
      text: message || 'Terjadi kesalahan. Silakan coba lagi.',
      confirmButtonText: 'OK',
    });
  }
}
