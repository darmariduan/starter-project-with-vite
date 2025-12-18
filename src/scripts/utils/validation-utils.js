class ValidationUtils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password && password.length >= 8;
    }

    static validateName(name) {
        return name && name.trim().length >= 3;
    }

    static validateDescription(description) {
        return description && description.trim().length >= 10;
    }

    static validateFile(file) {
        if (!file) return false;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 1 * 1024 * 1024; // 1MB

        if (!validTypes.includes(file.type)) {
            return { valid: false, message: 'File harus berformat JPEG, JPG, atau PNG' };
        }

        if (file.size > maxSize) {
            return { valid: false, message: 'Ukuran file maksimal 1MB' };
        }

        return { valid: true };
    }

    static showError(element, message) {
        const errorElement = element.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        element.classList.add('error');
    }

    static clearError(element) {
        const errorElement = element.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        element.classList.remove('error');
    }
}

export default ValidationUtils;
