import HomePresenter from './home-presenter';
import { showFormattedDate } from '../../utils';
import DatabaseHelper from '../../utils/database-helper';
import Swal from 'sweetalert2';
import L from 'leaflet';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.map = null;
    this.markers = [];
    this.stories = [];
    this.activeMarkerId = null;
  }

  async render() {
    return `
      <section class="home-section container">
        <div class="home-header">
          <h1>Jelajahi Cerita dari Seluruh Dunia</h1>
          <p>Temukan dan bagikan cerita menarik dari berbagai lokasi</p>
        </div>

        <div class="home-content">
          <div class="stories-section">
            <h2>Daftar Cerita</h2>
            <div id="stories-list" class="stories-list">
              <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
              </div>
            </div>
          </div>

          <div class="map-section">
            <h2>Peta Lokasi</h2>
            <div id="map" class="map-container" role="region" aria-label="Peta lokasi cerita"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.initMap();
    await this.presenter.loadStories();
  }

  initMap() {
    // Initialize map centered on Indonesia
    this.map = L.map('map').setView([-2.5489, 118.0149], 5);

    // Define base layers (tile layers)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19,
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
      maxZoom: 17,
    });

    // Add default layer
    streetLayer.addTo(this.map);

    // Layer control
    const baseMaps = {
      "Peta Jalan": streetLayer,
      "Satelit": satelliteLayer,
      "Topografi": topoLayer,
    };

    L.control.layers(baseMaps).addTo(this.map);
  }

  displayStories(stories) {
    this.stories = stories;
    const storiesList = document.getElementById('stories-list');

    if (!stories || stories.length === 0) {
      storiesList.innerHTML = `
        <div class="empty-state">
          <p>Belum ada cerita. Jadilah yang pertama berbagi cerita!</p>
          <a href="#/add-story" class="btn btn-primary">Tambah Cerita</a>
        </div>
      `;
      return;
    }

    storiesList.innerHTML = stories.map((story, index) => `
      <article class="story-card" data-story-id="${story.id}" data-index="${index}" tabindex="0" role="article">
        <button 
          class="favorite-btn" 
          data-story-id="${story.id}"
          aria-label="Tambah ke favorit"
          title="Tambah ke favorit"
        >
          <i class="far fa-heart" data-story-id="${story.id}"></i>
        </button>
        <img 
          src="${story.photoUrl}" 
          alt="Foto cerita ${story.name}"
          class="story-image"
          loading="lazy"
        />
        <div class="story-content">
          <h3 class="story-title">${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            <span class="story-author"><i class="fas fa-user"></i> ${story.name}</span>
            <span class="story-date"><i class="fas fa-calendar-alt"></i> ${showFormattedDate(story.createdAt)}</span>
          </div>
        </div>
      </article>
    `).join('');

    // Update favorite button states
    this.updateFavoriteStates();

    // Add markers to map
    this.addMarkersToMap(stories);

    // Add click listeners to story cards
    this.setupStoryCardListeners();
  }

  addMarkersToMap(stories) {
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add markers for each story with location
    stories.forEach((story, index) => {
      if (story.lat && story.lon) {
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-pin" data-index="${index}">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        const marker = L.marker([story.lat, story.lon], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(`
            <div class="marker-popup">
              <img src="${story.photoUrl}" alt="Foto cerita ${story.name}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
              <h4 style="margin: 0 0 8px 0;">${story.name}</h4>
              <p style="margin: 0; font-size: 14px;">${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            </div>
          `);

        marker.storyIndex = index;
        marker.storyId = story.id;

        marker.on('click', () => {
          this.highlightStory(index);
        });

        this.markers.push(marker);
      }
    });
  }

  setupStoryCardListeners() {
    const storyCards = document.querySelectorAll('.story-card');

    storyCards.forEach((card) => {
      const index = parseInt(card.dataset.index);

      // Click listener
      card.addEventListener('click', (e) => {
        // Ignore clicks on favorite button
        if (e.target.closest('.favorite-btn')) {
          return;
        }
        this.highlightStory(index);
        this.focusOnMarker(index);
      });

      // Keyboard listener
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.highlightStory(index);
          this.focusOnMarker(index);
        }
      });
    });

    // Setup favorite button listeners
    this.setupFavoriteListeners();
  }

  setupFavoriteListeners() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.dataset.storyId;
        await this.toggleFavorite(storyId);
      });
    });
  }

  async toggleFavorite(storyId) {
    try {
      const story = this.stories.find(s => s.id === storyId);
      if (!story) return;

      const isFavorite = await DatabaseHelper.isFavorite(storyId);
      const button = document.querySelector(`.favorite-btn[data-story-id="${storyId}"]`);
      const icon = button?.querySelector('i');

      if (!icon) return;

      if (isFavorite) {
        // Remove from favorites
        await DatabaseHelper.removeFromFavorites(storyId);
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.setAttribute('aria-label', 'Tambah ke favorit');
        button.setAttribute('title', 'Tambah ke favorit');

        Swal.fire({
          icon: 'info',
          title: 'Dihapus dari Favorit',
          text: `"${story.name}" telah dihapus dari favorit`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        // Add to favorites
        await DatabaseHelper.addToFavorites(story);
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.setAttribute('aria-label', 'Hapus dari favorit');
        button.setAttribute('title', 'Hapus dari favorit');

        Swal.fire({
          icon: 'success',
          title: 'Ditambahkan ke Favorit',
          text: `"${story.name}" telah ditambahkan ke favorit`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Tidak dapat memperbarui favorit. Silakan coba lagi.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    }
  }

  async updateFavoriteStates() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    for (const button of favoriteButtons) {
      const storyId = button.dataset.storyId;
      const isFavorite = await DatabaseHelper.isFavorite(storyId);
      const icon = button.querySelector('i');

      if (isFavorite) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.setAttribute('aria-label', 'Hapus dari favorit');
        button.setAttribute('title', 'Hapus dari favorit');
      }
    }
  }

  highlightStory(index) {
    // Remove previous highlight
    document.querySelectorAll('.story-card').forEach(card => {
      card.classList.remove('active');
    });

    document.querySelectorAll('.marker-pin').forEach(pin => {
      pin.classList.remove('active');
    });

    // Add highlight to selected story
    const selectedCard = document.querySelector(`[data-index="${index}"]`);
    if (selectedCard && selectedCard.classList.contains('story-card')) {
      selectedCard.classList.add('active');
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Highlight marker
    const markerPin = document.querySelector(`.marker-pin[data-index="${index}"]`);
    if (markerPin) {
      markerPin.classList.add('active');
    }

    this.activeMarkerId = index;
  }

  focusOnMarker(index) {
    const marker = this.markers[index];
    if (marker) {
      this.map.setView(marker.getLatLng(), 13, { animate: true });
      marker.openPopup();
    }
  }

  showLoading() {
    // Loading skeleton already shown in initial render
  }

  hideLoading() {
    // Will be replaced by actual content
  }

  showError(message) {
    const storiesList = document.getElementById('stories-list');
    storiesList.innerHTML = `
      <div class="error-state">
        <p>❌ ${message}</p>
        <button onclick="location.reload()" class="btn btn-secondary">Coba Lagi</button>
      </div>
    `;

    Swal.fire({
      icon: 'error',
      title: 'Terjadi Kesalahan',
      text: message,
      confirmButtonText: 'OK',
    });
  }
}

