import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const FAVORITES_STORE = 'favorites';
const PENDING_STORIES_STORE = 'pending-stories';

class DatabaseHelper {
    static async openDatabase() {
        return openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create favorites store
                if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
                    const favoriteStore = db.createObjectStore(FAVORITES_STORE, { keyPath: 'id' });
                    favoriteStore.createIndex('createdAt', 'createdAt', { unique: false });
                    favoriteStore.createIndex('name', 'name', { unique: false });
                }

                // Create pending stories store for offline sync
                if (!db.objectStoreNames.contains(PENDING_STORIES_STORE)) {
                    const pendingStore = db.createObjectStore(PENDING_STORIES_STORE, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            },
        });
    }

    // ===== FAVORITES OPERATIONS =====
    static async addToFavorites(story) {
        const db = await this.openDatabase();
        return db.put(FAVORITES_STORE, {
            ...story,
            favoritedAt: new Date().toISOString(),
        });
    }

    static async removeFromFavorites(storyId) {
        const db = await this.openDatabase();
        return db.delete(FAVORITES_STORE, storyId);
    }

    static async getAllFavorites() {
        const db = await this.openDatabase();
        return db.getAll(FAVORITES_STORE);
    }

    static async isFavorite(storyId) {
        const db = await this.openDatabase();
        const story = await db.get(FAVORITES_STORE, storyId);
        return !!story;
    }

    static async searchFavorites(query) {
        const allFavorites = await this.getAllFavorites();
        const lowerQuery = query.toLowerCase();

        return allFavorites.filter(story =>
            story.name.toLowerCase().includes(lowerQuery) ||
            story.description.toLowerCase().includes(lowerQuery)
        );
    }

    static async sortFavorites(sortBy = 'newest') {
        const allFavorites = await this.getAllFavorites();

        switch (sortBy) {
            case 'newest':
                return allFavorites.sort((a, b) =>
                    new Date(b.favoritedAt) - new Date(a.favoritedAt)
                );
            case 'oldest':
                return allFavorites.sort((a, b) =>
                    new Date(a.favoritedAt) - new Date(b.favoritedAt)
                );
            case 'name':
                return allFavorites.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
            default:
                return allFavorites;
        }
    }

    // ===== PENDING STORIES OPERATIONS (for offline sync) =====
    static async addPendingStory(storyData) {
        const db = await this.openDatabase();
        return db.add(PENDING_STORIES_STORE, {
            ...storyData,
            timestamp: new Date().toISOString(),
        });
    }

    static async getAllPendingStories() {
        const db = await this.openDatabase();
        return db.getAll(PENDING_STORIES_STORE);
    }

    static async removePendingStory(id) {
        const db = await this.openDatabase();
        return db.delete(PENDING_STORIES_STORE, id);
    }

    static async clearPendingStories() {
        const db = await this.openDatabase();
        const tx = db.transaction(PENDING_STORIES_STORE, 'readwrite');
        await tx.objectStore(PENDING_STORIES_STORE).clear();
        await tx.done;
    }
}

export default DatabaseHelper;
