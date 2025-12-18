import StoryAPI from '../../data/api';

class HomePresenter {
    constructor(view) {
        this.view = view;
    }

    async loadStories() {
        try {
            this.view.showLoading();

            const response = await StoryAPI.getStoriesWithLocation();

            if (response.error === false) {
                this.view.displayStories(response.listStory);
            } else {
                this.view.showError(response.message);
            }
        } catch (error) {
            this.view.showError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }
}

export default HomePresenter;
