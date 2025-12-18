import Swal from 'sweetalert2';
import NotificationHelper from '../../utils/notification-helper';
import CONFIG from '../../config';

export default class SettingsPage {
    constructor() {
        this.swRegistration = null;
    }

    async render() {
        return `
      <section class="settings-section container">
        <div class="settings-header">
          <h1><i class="fas fa-cog"></i> Pengaturan</h1>
          <p>Kelola preferensi aplikasi Anda</p>
        </div>

        <div class="settings-content">
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-bell"></i>
              <h2>Notifikasi Push</h2>
            </div>
            <div class="settings-card-body">
              <p>Terima notifikasi saat ada cerita baru yang ditambahkan</p>
              
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Status Notifikasi</strong>
                  <span id="notification-status" class="status-badge">Memeriksa...</span>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Aktifkan Notifikasi Push</strong>
                  <p class="setting-description">Dapatkan notifikasi real-time untuk cerita baru</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="push-toggle" aria-label="Toggle notifikasi push">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-mobile-alt"></i>
              <h2>Progressive Web App</h2>
            </div>
            <div class="settings-card-body">
              <p>Install aplikasi di perangkat Anda untuk pengalaman yang lebih baik</p>
              
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Status Instalasi</strong>
                  <span id="install-status" class="status-badge">Memeriksa...</span>
                </div>
              </div>

              <div class="setting-item">
                <button id="install-button" class="btn btn-primary" style="display: none;">
                  <i class="fas fa-download"></i> Install Aplikasi
                </button>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-sync-alt"></i>
              <h2>Sinkronisasi Data</h2>
            </div>
            <div class="settings-card-body">
              <p>Kelola data offline dan sinkronisasi</p>
              
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Status Koneksi</strong>
                  <span id="connection-status" class="status-badge">Online</span>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Data Pending</strong>
                  <span id="pending-count">0 cerita menunggu sinkronisasi</span>
                </div>
                <button id="sync-button" class="btn btn-secondary">
                  <i class="fas fa-sync"></i> Sinkronkan Sekarang
                </button>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="settings-card-header">
              <i class="fas fa-database"></i>
              <h2>Penyimpanan</h2>
            </div>
            <div class="settings-card-body">
              <p>Informasi tentang penyimpanan aplikasi</p>
              
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Cache</strong>
                  <span id="cache-size">Menghitung...</span>
                </div>
                <button id="clear-cache-button" class="btn btn-danger">
                  <i class="fas fa-trash"></i> Bersihkan Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    }

    async afterRender() {
        await this.init();
        this.setupEventListeners();
        this.updateStatus();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            this.swRegistration = await navigator.serviceWorker.ready;
        }
    }

    setupEventListeners() {
        const pushToggle = document.getElementById('push-toggle');
        const installButton = document.getElementById('install-button');
        const syncButton = document.getElementById('sync-button');
        const clearCacheButton = document.getElementById('clear-cache-button');

        // Push notification toggle
        pushToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await this.enablePushNotifications();
            } else {
                await this.disablePushNotifications();
            }
        });

        // Install button
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'inline-flex';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: 'Aplikasi berhasil diinstall',
                        timer: 2000,
                    });
                }
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });

        // Sync button
        syncButton.addEventListener('click', async () => {
            await this.syncPendingData();
        });

        // Clear cache button
        clearCacheButton.addEventListener('click', async () => {
            const result = await Swal.fire({
                title: 'Bersihkan Cache?',
                text: 'Semua data cache akan dihapus. Aplikasi mungkin perlu memuat ulang data.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Ya, Bersihkan!',
                cancelButtonText: 'Batal',
            });

            if (result.isConfirmed) {
                await this.clearCache();
            }
        });

        // Listen for online/offline events
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }

    async updateStatus() {
        // Check notification permission
        await this.updateNotificationStatus();

        // Check install status
        this.updateInstallStatus();

        // Update connection status
        this.updateConnectionStatus();

        // Update cache size
        await this.updateCacheSize();

        // Update pending count
        await this.updatePendingCount();
    }

    async updateNotificationStatus() {
        const statusBadge = document.getElementById('notification-status');
        const pushToggle = document.getElementById('push-toggle');

        if (!('Notification' in window)) {
            statusBadge.textContent = 'Tidak Didukung';
            statusBadge.className = 'status-badge status-error';
            pushToggle.disabled = true;
            return;
        }

        const permission = Notification.permission;
        const isSubscribed = NotificationHelper.getSubscriptionState();

        switch (permission) {
            case 'granted':
                statusBadge.textContent = isSubscribed ? 'Aktif' : 'Diizinkan';
                statusBadge.className = `status-badge status-success`;
                pushToggle.checked = isSubscribed;
                break;
            case 'denied':
                statusBadge.textContent = 'Ditolak';
                statusBadge.className = 'status-badge status-error';
                pushToggle.disabled = true;
                break;
            default:
                statusBadge.textContent = 'Belum Diatur';
                statusBadge.className = 'status-badge status-warning';
        }
    }

    updateInstallStatus() {
        const statusBadge = document.getElementById('install-status');

        if (window.matchMedia('(display-mode: standalone)').matches) {
            statusBadge.textContent = 'Terinstall';
            statusBadge.className = 'status-badge status-success';
        } else {
            statusBadge.textContent = 'Belum Terinstall';
            statusBadge.className = 'status-badge status-warning';
        }
    }

    updateConnectionStatus() {
        const statusBadge = document.getElementById('connection-status');

        if (navigator.onLine) {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'status-badge status-success';
        } else {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'status-badge status-error';
        }
    }

    async updateCacheSize() {
        const cacheSize = document.getElementById('cache-size');

        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const { usage } = await navigator.storage.estimate();
            const sizeInMB = (usage / (1024 * 1024)).toFixed(2);
            cacheSize.textContent = `${sizeInMB} MB digunakan`;
        } else {
            cacheSize.textContent = 'Tidak tersedia';
        }
    }

    async updatePendingCount() {
        const DatabaseHelper = (await import('../../utils/database-helper')).default;
        const pending = await DatabaseHelper.getAllPendingStories();
        const countSpan = document.getElementById('pending-count');
        countSpan.textContent = `${pending.length} cerita menunggu sinkronisasi`;
    }

    async enablePushNotifications() {
        try {
            const hasPermission = await NotificationHelper.requestPermission();

            if (!hasPermission) {
                Swal.fire({
                    icon: 'error',
                    title: 'Izin Ditolak',
                    text: 'Silakan aktifkan notifikasi di pengaturan browser Anda',
                });
                document.getElementById('push-toggle').checked = false;
                return;
            }

            const subscription = await NotificationHelper.subscribeToPush(
                this.swRegistration,
                CONFIG.VAPID_PUBLIC_KEY
            );

            NotificationHelper.saveSubscriptionState(true);
            await this.updateNotificationStatus();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Notifikasi push telah diaktifkan',
                timer: 2000,
            });
        } catch (error) {
            console.error('Failed to enable push:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal mengaktifkan notifikasi push',
            });
            document.getElementById('push-toggle').checked = false;
        }
    }

    async disablePushNotifications() {
        try {
            await NotificationHelper.unsubscribeFromPush(this.swRegistration);
            NotificationHelper.saveSubscriptionState(false);
            await this.updateNotificationStatus();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Notifikasi push telah dinonaktifkan',
                timer: 2000,
            });
        } catch (error) {
            console.error('Failed to disable push:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal menonaktifkan notifikasi push',
            });
            document.getElementById('push-toggle').checked = true;
        }
    }

    async syncPendingData() {
        try {
            const DatabaseHelper = (await import('../../utils/database-helper')).default;
            const StoryAPI = (await import('../../data/api')).default;

            const pendingStories = await DatabaseHelper.getAllPendingStories();

            if (pendingStories.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Tidak Ada Data',
                    text: 'Tidak ada cerita yang perlu disinkronkan',
                });
                return;
            }

            const loadingSwal = Swal.fire({
                title: 'Menyinkronkan...',
                text: `Mengunggah ${pendingStories.length} cerita`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            let successCount = 0;
            for (const story of pendingStories) {
                try {
                    await StoryAPI.addStory(story.formData);
                    await DatabaseHelper.removePendingStory(story.id);
                    successCount++;
                } catch (error) {
                    console.error('Failed to sync story:', error);
                }
            }

            loadingSwal.close();

            await this.updatePendingCount();

            Swal.fire({
                icon: 'success',
                title: 'Sinkronisasi Selesai!',
                text: `${successCount} dari ${pendingStories.length} cerita berhasil disinkronkan`,
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal menyinkronkan data',
            });
        }
    }

    async clearCache() {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));

            await this.updateCacheSize();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Cache berhasil dibersihkan',
                timer: 2000,
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal membersihkan cache',
            });
        }
    }
}
