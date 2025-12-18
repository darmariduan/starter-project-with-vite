class NotificationUtils {
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close" aria-label="Tutup notifikasi">&times;</button>
    `;

        document.body.appendChild(notification);

        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.hide(notification);
        });

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            this.hide(notification);
        }, 5000);

        return notification;
    }

    static hide(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    static success(message) {
        return this.show(message, 'success');
    }

    static error(message) {
        return this.show(message, 'error');
    }

    static info(message) {
        return this.show(message, 'info');
    }

    static warning(message) {
        return this.show(message, 'warning');
    }
}

export default NotificationUtils;
