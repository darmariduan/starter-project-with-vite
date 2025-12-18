import FavoritesPresenter from './favorites-presenter';
import { showFormattedDate } from '../../utils';
import Swal from 'sweetalert2';

export default class FavoritesPage {
    constructor() {
        this.presenter = new FavoritesPresenter(this);
        this.currentSort = 'newest';
    }

    async render() {
        return `
      <section class="favorites-section container">
        <div class="favorites-header">
          <h1><i class="fas fa-heart"></i> Cerita Favorit Saya</h1>
          <p>Koleksi cerita yang telah Anda simpan untuk dibaca nanti</p>
        </div>

        <h2 class="visually-hidden">Kontrol Pencarian dan Pengurutan</h2>
        <div class="favorites-controls">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="search" 
              id="search-favorites" 
              placeholder="Cari cerita favorit..."
              aria-label="Cari cerita favorit"
            />
          </div>

          <div class="sort-box">
            <label for="sort-favorites">
              <i class="fas fa-sort"></i> Urutkan:
            </label>
            <select id="sort-favorites" aria-label="Urutkan cerita">
              <option value="newest">Terbaru Ditambahkan</option>
              <option value="oldest">Terlama Ditambahkan</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>
        </div>

        <div id="favorites-list" class="favorites-list">
          <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        </div>
      </section>
    `;
    }

    async afterRender() {
        await this.presenter.loadFavorites();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-favorites');
        const sortSelect = document.getElementById('sort-favorites');

        // Search with debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query) {
                    this.presenter.searchFavorites(query);
                } else {
                    this.presenter.loadFavorites();
                }
            }, 300);
        });

        // Sort
        sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.presenter.sortFavorites(this.currentSort);
        });
    }

    displayFavorites(favorites) {
        const favoritesList = document.getElementById('favorites-list');

        if (!favorites || favorites.length === 0) {
            favoritesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-heart-broken" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
          <p>Belum ada cerita favorit.</p>
          <p>Mulai tambahkan cerita favorit Anda dari halaman beranda!</p>
          <a href="#/" class="btn btn-primary">
            <i class="fas fa-home"></i> Ke Beranda
          </a>
        </div>
      `;
            return;
        }

        favoritesList.innerHTML = favorites.map((story) => `
      <article class="favorite-card" data-story-id="${story.id}">
        <img 
          src="${story.photoUrl}" 
          alt="Foto cerita ${story.name}"
          class="favorite-image"
          loading="lazy"
        />
        <div class="favorite-content">
          <h2 class="favorite-title">${story.name}</h2>
          <p class="favorite-description">${story.description}</p>
          <div class="favorite-meta">
            <span class="favorite-date">
              <i class="fas fa-calendar-alt"></i> ${showFormattedDate(story.createdAt)}
            </span>
            <span class="favorite-saved">
              <i class="fas fa-heart"></i> Disimpan ${showFormattedDate(story.favoritedAt)}
            </span>
          </div>
          <div class="favorite-actions">
            <button 
              class="btn btn-danger btn-remove-favorite" 
              data-story-id="${story.id}"
              aria-label="Hapus dari favorit"
            >
              <i class="fas fa-trash-alt"></i> Hapus dari Favorit
            </button>
          </div>
        </div>
      </article>
    `).join('');

        // Add event listeners for remove buttons
        document.querySelectorAll('.btn-remove-favorite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const storyId = e.currentTarget.dataset.storyId;

                const result = await Swal.fire({
                    title: 'Hapus dari Favorit?',
                    text: 'Cerita ini akan dihapus dari daftar favorit Anda',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Ya, Hapus!',
                    cancelButtonText: 'Batal',
                });

                if (result.isConfirmed) {
                    await this.presenter.removeFavorite(storyId);
                }
            });
        });
    }

    showLoading() {
        // Loading skeleton already shown
    }

    hideLoading() {
        // Will be replaced by actual content
    }

    showError(message) {
        const favoritesList = document.getElementById('favorites-list');
        favoritesList.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--error-color); margin-bottom: 1rem;"></i>
        <p>❌ ${message}</p>
        <button onclick="location.reload()" class="btn btn-secondary">
          <i class="fas fa-redo"></i> Coba Lagi
        </button>
      </div>
    `;
    }

    onRemoveSuccess() {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Cerita telah dihapus dari favorit',
            timer: 2000,
            showConfirmButton: false,
        });
    }

    onRemoveError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: message || 'Gagal menghapus dari favorit',
            confirmButtonColor: '#2563eb',
        });
    }
}
