import FavoritesModel from './favorites-model';

class FavoritesPresenter {
    constructor(view) {
        this.view = view;
        this.model = FavoritesModel;
    }

    async loadFavorites() {
        try {
            this.view.showLoading();
            const favorites = await this.model.getFavorites();
            this.view.displayFavorites(favorites);
        } catch (error) {
            this.view.showError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }

    async removeFavorite(storyId) {
        try {
            await this.model.removeFavorite(storyId);
            this.view.onRemoveSuccess();
            await this.loadFavorites();
        } catch (error) {
            this.view.onRemoveError(error.message);
        }
    }

    async searchFavorites(query) {
        try {
            this.view.showLoading();
            const results = await this.model.searchFavorites(query);
            this.view.displayFavorites(results);
        } catch (error) {
            this.view.showError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }

    async sortFavorites(sortBy) {
        try {
            this.view.showLoading();
            const sorted = await this.model.sortFavorites(sortBy);
            this.view.displayFavorites(sorted);
        } catch (error) {
            this.view.showError(error.message);
        } finally {
            this.view.hideLoading();
        }
    }
}

export default FavoritesPresenter;
