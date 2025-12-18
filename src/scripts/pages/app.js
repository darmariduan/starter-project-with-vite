import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { AuthUtils } from '../utils';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupAuthUI();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  #setupAuthUI() {
    this.#updateNavigation();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', () => {
      this.#updateNavigation();
    });
  }

  #updateNavigation() {
    const navList = document.getElementById('nav-list');
    const isAuthenticated = AuthUtils.isAuthenticated();

    if (isAuthenticated) {
      const user = AuthUtils.getUserInfo();
      navList.innerHTML = `
        <li><a href="#/"><i class="fas fa-home"></i> Beranda</a></li>
        <li><a href="#/add-story"><i class="fas fa-plus-circle"></i> Tambah Cerita</a></li>
        <li><a href="#/favorites"><i class="fas fa-heart"></i> Favorit</a></li>
        <li><a href="#/settings"><i class="fas fa-cog"></i> Pengaturan</a></li>
        <li><a href="#/about"><i class="fas fa-info-circle"></i> Tentang</a></li>
        <li><button id="logout-btn" class="nav-logout-btn"><i class="fas fa-sign-out-alt"></i> Keluar</button></li>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      logoutBtn.addEventListener('click', () => {
        AuthUtils.logout();
      });
    } else {
      navList.innerHTML = `
        <li><a href="#/login"><i class="fas fa-sign-in-alt"></i> Masuk</a></li>
        <li><a href="#/register"><i class="fas fa-user-plus"></i> Daftar</a></li>
        <li><a href="#/about"><i class="fas fa-info-circle"></i> Tentang</a></li>
      `;
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      window.location.hash = '#/';
      return;
    }

    // Auth guard
    const publicRoutes = ['/login', '/register', '/about'];
    const isAuthenticated = AuthUtils.isAuthenticated();

    if (!isAuthenticated && !publicRoutes.includes(url)) {
      window.location.hash = '#/login';
      return;
    }

    // Use View Transition API if available
    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#updateNavigation();
      }).finished;
    } else {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#updateNavigation();
    }
  }
}

export default App;
