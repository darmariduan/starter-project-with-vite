class AuthUtils {
    static saveToken(token) {
        localStorage.setItem('token', token);
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static removeToken() {
        localStorage.removeItem('token');
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static saveUserInfo(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static getUserInfo() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static removeUserInfo() {
        localStorage.removeItem('user');
    }

    static logout() {
        this.removeToken();
        this.removeUserInfo();
        window.location.hash = '#/login';
    }
}

export default AuthUtils;
