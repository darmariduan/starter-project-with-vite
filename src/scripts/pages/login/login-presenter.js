import StoryAPI from '../../data/api';
import { AuthUtils } from '../../utils';

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
}

export default LoginPresenter;
