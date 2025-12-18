import StoryAPI from '../../data/api';
import DatabaseHelper from '../../utils/database-helper';

class AddStoryPresenter {
    constructor(view) {
        this.view = view;
    }

    async addStory(formData) {
        try {
            this.view.showLoading();

            // Check if online
            if (!navigator.onLine) {
                // Save to pending queue for background sync
                await this.saveForLater(formData);
                this.view.onAddOffline();
                return;
            }

            const response = await StoryAPI.addStory(formData);

            if (response.error === false) {
                this.view.onAddSuccess();
            } else {
                this.view.onAddError(response.message);
            }
        } catch (error) {
            // If fetch fails (network error), try saving for later
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                await this.saveForLater(formData);
                this.view.onAddOffline();
            } else {
                this.view.onAddError(error.message);
            }
        } finally {
            this.view.hideLoading();
        }
    }

    async saveForLater(formData) {
        try {
            // Convert FormData to object for IndexedDB storage
            const storyData = {
                description: formData.get('description'),
                lat: parseFloat(formData.get('lat')),
                lon: parseFloat(formData.get('lon')),
                timestamp: Date.now(),
            };

            // Convert photo to base64 for storage
            const photoFile = formData.get('photo');
            if (photoFile) {
                const base64Photo = await this.fileToBase64(photoFile);
                storyData.photo = base64Photo;
                storyData.photoName = photoFile.name;
                storyData.photoType = photoFile.type;
            }

            await DatabaseHelper.addPendingStory(storyData);

            // Register sync event
            if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-stories');
            }
        } catch (error) {
            console.error('Error saving story for later:', error);
            throw error;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export default AddStoryPresenter;
