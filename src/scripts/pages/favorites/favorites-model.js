import DatabaseHelper from '../../utils/database-helper';

class FavoritesModel {
    static async getFavorites() {
        return await DatabaseHelper.getAllFavorites();
    }

    static async addFavorite(story) {
        return await DatabaseHelper.addToFavorites(story);
    }

    static async removeFavorite(storyId) {
        return await DatabaseHelper.removeFromFavorites(storyId);
    }

    static async isFavorite(storyId) {
        return await DatabaseHelper.isFavorite(storyId);
    }

    static async searchFavorites(query) {
        return await DatabaseHelper.searchFavorites(query);
    }

    static async sortFavorites(sortBy) {
        return await DatabaseHelper.sortFavorites(sortBy);
    }
}

export default FavoritesModel;
