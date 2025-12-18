import StoryAPI from '../../data/api';
import { AuthUtils } from '../../utils';

class RegisterPresenter {
    constructor(view) {
        this.view = view;
    }

    async register(name, email, password) {
        try {
            this.view.showLoading();

            const response = await StoryAPI.register({ name, email, password });

            if (response.error === false) {
                this.view.onRegisterSuccess();
            } else {
                this.view.onRegisterError(response.message);
            }
        } catch (error) {
            this.view.onRegisterError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }
}

export default RegisterPresenter;
