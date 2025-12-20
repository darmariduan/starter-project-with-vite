import StoryAPI from '../../data/api';
import DatabaseHelper from '../../utils/database-helper';
import NotificationHelper from '../../utils/notification-helper';

class AddStoryPresenter {
    constructor(view) {
        this.view = view;
    }

    async addStory(formData) {
        try {
            this.view.showLoading();

            // Check if online
            if (!navigator.onLine) {
                // Save to pending queue for background sync
                await this.saveForLater(formData);
                this.view.onAddOffline();
                return;
            }

            const response = await StoryAPI.addStory(formData);

            if (response.error === false) {
                this.view.onAddSuccess();

                // Trigger push notification setelah berhasil menambahkan story
                await this.sendNotificationAfterAddStory();
            } else {
                this.view.onAddError(response.message);
            }
        } catch (error) {
            // If fetch fails (network error), try saving for later
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                await this.saveForLater(formData);
                this.view.onAddOffline();
            } else {
                this.view.onAddError(error.message);
            }
        } finally {
            this.view.hideLoading();
        }
    }

    async sendNotificationAfterAddStory() {
        try {
            // Cek apakah service worker sudah registered
            if (!('serviceWorker' in navigator)) {
                console.log('Service Worker not supported');
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            // Cek permission notifikasi
            if (Notification.permission !== 'granted') {
                console.log('Notification permission not granted');
                return;
            }

            // Cek apakah sudah subscribe
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                console.log('No push subscription found');
                return;
            }

            // Kirim notifikasi lokal sebagai feedback
            registration.showNotification('Story Berhasil Ditambahkan! 🎉', {
                body: 'Cerita Anda telah berhasil dibagikan. Terima kasih!',
                icon: `${import.meta.env.BASE_URL}icons/icon-192x192.png`,
                badge: `${import.meta.env.BASE_URL}icons/icon-72x72.png`,
                vibrate: [200, 100, 200],
                tag: 'story-added',
                requireInteraction: false,
                data: {
                    url: `${import.meta.env.BASE_URL}#/`,
                },
            });

            console.log('✅ Notification sent after adding story');
        } catch (error) {
            console.error('❌ Error sending notification:', error);
        }
    }

    async saveForLater(formData) {
        try {
            // Convert FormData to object for IndexedDB storage
            const storyData = {
                description: formData.get('description'),
                lat: parseFloat(formData.get('lat')),
                lon: parseFloat(formData.get('lon')),
                timestamp: Date.now(),
            };

            // Convert photo to base64 for storage
            const photoFile = formData.get('photo');
            if (photoFile) {
                const base64Photo = await this.fileToBase64(photoFile);
                storyData.photo = base64Photo;
                storyData.photoName = photoFile.name;
                storyData.photoType = photoFile.type;
            }

            await DatabaseHelper.addPendingStory(storyData);

            // Register sync event
            if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-stories');
            }
        } catch (error) {
            console.error('Error saving story for later:', error);
            throw error;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export default AddStoryPresenter;
