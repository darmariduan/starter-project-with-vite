class NotificationHelper {
    static async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    static async subscribeToPush(registration, vapidPublicKey) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
            });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            throw error;
        }
    }

    /**
     * Subscribe push notification ke API Dicoding
     * @param {PushSubscription} subscription - Push subscription object
     * @returns {Promise<boolean>} Success status
     */
    static async subscribeToAPI(subscription) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No token found, cannot subscribe to API');
                return false;
            }

            const subscriptionJSON = subscription.toJSON();

            const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    endpoint: subscriptionJSON.endpoint,
                    keys: {
                        p256dh: subscriptionJSON.keys.p256dh,
                        auth: subscriptionJSON.keys.auth,
                    },
                }),
            });

            const result = await response.json();

            if (result.error === false) {
                console.log('✅ Successfully subscribed to push API:', result.message);
                this.saveSubscriptionState(true);
                return true;
            } else {
                console.error('❌ Failed to subscribe to push API:', result.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error subscribing to push API:', error);
            return false;
        }
    }

    static async unsubscribeFromPush(registration) {
        try {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to unsubscribe from push:', error);
            throw error;
        }
    }

    static async getCurrentSubscription(registration) {
        return await registration.pushManager.getSubscription();
    }

    static urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    static saveSubscriptionState(isSubscribed) {
        localStorage.setItem('push-subscription-enabled', isSubscribed);
    }

    static getSubscriptionState() {
        return localStorage.getItem('push-subscription-enabled') === 'true';
    }
}

export default NotificationHelper;
