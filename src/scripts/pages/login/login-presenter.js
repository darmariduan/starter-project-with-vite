import StoryAPI from '../../data/api';
import { AuthUtils } from '../../utils';
import NotificationHelper from '../../utils/notification-helper';

class LoginPresenter {
    constructor(view) {
        this.view = view;
    }

    async login(email, password) {
        try {
            this.view.showLoading();

            const response = await StoryAPI.login({ email, password });

            if (response.error === false) {
                AuthUtils.saveToken(response.loginResult.token);
                AuthUtils.saveUserInfo({
                    userId: response.loginResult.userId,
                    name: response.loginResult.name,
                });

                // Auto-subscribe to push notification after successful login
                await this.setupPushNotification();

                this.view.onLoginSuccess();
            } else {
                this.view.onLoginError(response.message);
            }
        } catch (error) {
            this.view.onLoginError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }

    async setupPushNotification() {
        try {
            // Check if service worker and push notification supported
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Push notifications not supported');
                return;
            }

            // Request notification permission
            const permission = await NotificationHelper.requestPermission();
            if (!permission) {
                console.log('Notification permission denied');
                return;
            }

            // Wait for service worker to be ready
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // VAPID public key dari Dicoding
                const vapidPublicKey = 'BCt_M2oRCTdq13poSzXpHPCIy2f0VUJBKLJJBxALu-z6hKM5KDECDNq5OKCgKv0kRUWo0kgZLa9KJOA3U85r2Ok';

                // Subscribe to push
                subscription = await NotificationHelper.subscribeToPush(registration, vapidPublicKey);
                console.log('✅ Created new push subscription');
            }

            // Send subscription to API
            const success = await NotificationHelper.subscribeToAPI(subscription);

            if (success) {
                console.log('✅ Push notification setup completed');

                // Show welcome notification
                registration.showNotification('Welcome to Story App! 👋', {
                    body: 'Anda akan menerima notifikasi untuk story baru',
                    icon: `${import.meta.env.BASE_URL}icons/icon-192x192.png`,
                    badge: `${import.meta.env.BASE_URL}icons/icon-72x72.png`,
                    vibrate: [200, 100, 200],
                    tag: 'welcome-notification',
                });
            }
        } catch (error) {
            console.error('❌ Error setting up push notification:', error);
        }
    }
}

export default LoginPresenter;
