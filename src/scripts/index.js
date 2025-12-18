// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import 'sweetalert2/dist/sweetalert2.min.css';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      // Support untuk GitHub Pages dengan base path
      const swPath = import.meta.env.BASE_URL + 'sw.js';
      const swScope = import.meta.env.BASE_URL;

      const registration = await navigator.serviceWorker.register(swPath, {
        scope: swScope,
      });
      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Handle install prompt
  let deferredPrompt;
  const installPrompt = document.getElementById('install-prompt');
  const installButton = document.getElementById('install-prompt-button');
  const installClose = document.getElementById('install-prompt-close');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install prompt after 3 seconds
    setTimeout(() => {
      if (installPrompt) {
        installPrompt.style.display = 'block';
      }
    }, 3000);
  });

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;

      if (installPrompt) {
        installPrompt.style.display = 'none';
      }
    });
  }

  if (installClose) {
    installClose.addEventListener('click', () => {
      if (installPrompt) {
        installPrompt.style.display = 'none';
      }
    });
  }

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'SYNC_PENDING_STORIES') {
      console.log('Received sync request from service worker');
      await syncPendingStories();
    }
  });

  // Function to sync pending stories
  async function syncPendingStories() {
    try {
      const DatabaseHelper = (await import('./utils/database-helper')).default;
      const StoryAPI = (await import('./data/api')).default;
      const Swal = (await import('sweetalert2')).default;

      const pendingStories = await DatabaseHelper.getAllPendingStories();

      if (pendingStories.length === 0) {
        return;
      }

      console.log(`Syncing ${pendingStories.length} pending stories...`);
      let successCount = 0;
      let failCount = 0;

      for (const story of pendingStories) {
        try {
          // Convert back to FormData
          const formData = new FormData();
          formData.append('description', story.description);
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);

          // Convert base64 back to File
          if (story.photo) {
            const response = await fetch(story.photo);
            const blob = await response.blob();
            const file = new File([blob], story.photoName || 'photo.jpg', {
              type: story.photoType || 'image/jpeg',
            });
            formData.append('photo', file);
          }

          const result = await StoryAPI.addStory(formData);

          if (result.error === false) {
            await DatabaseHelper.removePendingStory(story.id);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Failed to sync story:', error);
          failCount++;
        }
      }

      // Show notification
      if (successCount > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Sinkronisasi Berhasil!',
          text: `${successCount} cerita berhasil dikirim`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        // Refresh current page if on home
        if (window.location.hash === '#/' || window.location.hash === '') {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }

      if (failCount > 0) {
        console.warn(`${failCount} stories failed to sync`);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('App is online');
    // Trigger background sync if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if ('sync' in registration) {
          registration.sync.register('sync-stories');
        } else {
          // Fallback: sync immediately
          syncPendingStories();
        }
      });
    }
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
  });
});

