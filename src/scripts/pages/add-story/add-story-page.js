import AddStoryPresenter from './add-story-presenter';
import { ValidationUtils, NotificationUtils } from '../../utils';
import Swal from 'sweetalert2';
import L from 'leaflet';

export default class AddStoryPage {
    constructor() {
        this.presenter = new AddStoryPresenter(this);
        this.map = null;
        this.marker = null;
        this.selectedLat = null;
        this.selectedLon = null;
        this.imagePreview = null;
        this.mediaStream = null;
    }

    async render() {
        return `
      <section class="add-story-section container">
        <div class="add-story-header">
          <h1>Tambah Cerita Baru</h1>
          <p>Bagikan cerita menarik Anda dengan dunia</p>
        </div>

        <form id="add-story-form" class="add-story-form" novalidate>
          <div class="form-row">
            <div class="form-column">
              <div class="form-group">
                <label for="description">Deskripsi Cerita</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows="5"
                  placeholder="Ceritakan pengalaman menarik Anda (minimal 10 karakter)"
                  required
                  aria-required="true"
                ></textarea>
                <span class="error-message" role="alert" aria-live="polite"></span>
              </div>

              <div class="form-group">
                <label for="photo">Foto Cerita</label>
                <div class="photo-input-container">
                  <div class="photo-options">
                    <button type="button" id="upload-btn" class="btn btn-secondary">
                      📁 Pilih File
                    </button>
                    <button type="button" id="camera-btn" class="btn btn-secondary">
                      📷 Ambil Foto
                    </button>
                  </div>
                  <input 
                    type="file" 
                    id="photo" 
                    name="photo" 
                    accept="image/jpeg,image/jpg,image/png"
                    style="display: none;"
                    aria-label="Pilih file foto"
                  />
                </div>
                <span class="error-message" role="alert" aria-live="polite"></span>
                
                <div id="photo-preview" class="photo-preview" style="display: none;">
                  <img id="preview-image" src="" alt="Preview foto" />
                  <button type="button" id="remove-photo" class="btn-remove-photo" aria-label="Hapus foto">×</button>
                </div>

                <div id="camera-container" class="camera-container" style="display: none;">
                  <video id="camera-stream" autoplay playsinline></video>
                  <div class="camera-controls">
                    <button type="button" id="capture-btn" class="btn btn-primary">Ambil Foto</button>
                    <button type="button" id="close-camera-btn" class="btn btn-secondary">Tutup Kamera</button>
                  </div>
                  <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
              </div>

              <div class="form-group">
                <label for="location-info">Lokasi Cerita</label>
                <p class="help-text">Klik pada peta untuk memilih lokasi</p>
                <div id="location-info" class="location-info">
                  <span id="location-text">Belum ada lokasi dipilih</span>
                </div>
                <span class="error-message" role="alert" aria-live="polite"></span>
              </div>

              <button type="submit" class="btn btn-primary btn-block" id="submit-btn">
                Bagikan Cerita
              </button>
            </div>

            <div class="form-column">
              <div class="map-picker-container">
                <h2>Pilih Lokasi pada Peta</h2>
                <div id="map-picker" class="map-picker" role="region" aria-label="Pilih lokasi pada peta"></div>
              </div>
            </div>
          </div>
        </form>
      </section>
    `;
    }

    async afterRender() {
        this.initMap();
        this.setupPhotoUpload();
        this.setupCamera();
        this.setupForm();
    }

    initMap() {
        // Initialize map centered on Indonesia
        this.map = L.map('map-picker').setView([-2.5489, 118.0149], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(this.map);

        // Handle map click
        this.map.on('click', (e) => {
            this.selectLocation(e.latlng.lat, e.latlng.lng);
        });
    }

    selectLocation(lat, lon) {
        this.selectedLat = lat;
        this.selectedLon = lon;

        // Remove previous marker
        if (this.marker) {
            this.marker.remove();
        }

        // Add new marker
        this.marker = L.marker([lat, lon]).addTo(this.map);

        // Update location info
        const locationText = document.getElementById('location-text');
        locationText.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
        locationText.parentElement.classList.add('selected');

        // Clear error if any
        const locationInfo = document.getElementById('location-info');
        ValidationUtils.clearError(locationInfo);
    }

    setupPhotoUpload() {
        const photoInput = document.getElementById('photo');
        const uploadBtn = document.getElementById('upload-btn');
        const removeBtn = document.getElementById('remove-photo');
        const preview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');

        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const validation = ValidationUtils.validateFile(file);

                if (!validation.valid) {
                    ValidationUtils.showError(photoInput.parentElement, validation.message);
                    photoInput.value = '';
                    return;
                }

                this.showPhotoPreview(file);
                ValidationUtils.clearError(photoInput.parentElement);
            }
        });

        removeBtn.addEventListener('click', () => {
            this.clearPhoto();
        });
    }

    setupCamera() {
        const cameraBtn = document.getElementById('camera-btn');
        const cameraContainer = document.getElementById('camera-container');
        const cameraStream = document.getElementById('camera-stream');
        const captureBtn = document.getElementById('capture-btn');
        const closeCameraBtn = document.getElementById('close-camera-btn');
        const canvas = document.getElementById('camera-canvas');

        cameraBtn.addEventListener('click', async () => {
            try {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                });

                cameraStream.srcObject = this.mediaStream;
                cameraContainer.style.display = 'block';

                ValidationUtils.clearError(document.querySelector('.photo-input-container'));
            } catch (error) {
                NotificationUtils.error('Gagal mengakses kamera. Pastikan Anda memberikan izin kamera.');
            }
        });

        captureBtn.addEventListener('click', () => {
            const context = canvas.getContext('2d');
            canvas.width = cameraStream.videoWidth;
            canvas.height = cameraStream.videoHeight;
            context.drawImage(cameraStream, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                this.showPhotoPreview(file);
                this.closeCamera();
            }, 'image/jpeg', 0.9);
        });

        closeCameraBtn.addEventListener('click', () => {
            this.closeCamera();
        });
    }

    closeCamera() {
        const cameraContainer = document.getElementById('camera-container');
        const cameraStream = document.getElementById('camera-stream');

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        cameraStream.srcObject = null;
        cameraContainer.style.display = 'none';
    }

    showPhotoPreview(file) {
        const preview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');
        const photoInput = document.getElementById('photo');

        this.imagePreview = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Create a new FileList with the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
    }

    clearPhoto() {
        const preview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');
        const photoInput = document.getElementById('photo');

        preview.style.display = 'none';
        previewImage.src = '';
        photoInput.value = '';
        this.imagePreview = null;
    }

    setupForm() {
        const form = document.getElementById('add-story-form');
        const descriptionInput = document.getElementById('description');
        const photoInput = document.getElementById('photo');

        // Real-time validation
        descriptionInput.addEventListener('input', () => {
            this.validateDescription(descriptionInput);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const description = descriptionInput.value.trim();
            const photo = photoInput.files[0];

            // Validate all fields
            const isDescriptionValid = this.validateDescription(descriptionInput);
            const isPhotoValid = this.validatePhoto(photo);
            const isLocationValid = this.validateLocation();

            if (isDescriptionValid && isPhotoValid && isLocationValid) {
                const formData = new FormData();
                formData.append('description', description);
                formData.append('photo', photo);
                formData.append('lat', this.selectedLat);
                formData.append('lon', this.selectedLon);

                await this.presenter.addStory(formData);
            }
        });
    }

    validateDescription(input) {
        const description = input.value.trim();

        if (!description) {
            ValidationUtils.showError(input, 'Deskripsi harus diisi');
            return false;
        }

        if (!ValidationUtils.validateDescription(description)) {
            ValidationUtils.showError(input, 'Deskripsi minimal 10 karakter');
            return false;
        }

        ValidationUtils.clearError(input);
        return true;
    }

    validatePhoto(photo) {
        const photoContainer = document.querySelector('.photo-input-container');

        if (!photo) {
            ValidationUtils.showError(photoContainer, 'Foto harus dipilih');
            return false;
        }

        const validation = ValidationUtils.validateFile(photo);
        if (!validation.valid) {
            ValidationUtils.showError(photoContainer, validation.message);
            return false;
        }

        ValidationUtils.clearError(photoContainer);
        return true;
    }

    validateLocation() {
        const locationInfo = document.getElementById('location-info');

        if (!this.selectedLat || !this.selectedLon) {
            ValidationUtils.showError(locationInfo, 'Lokasi harus dipilih pada peta');
            return false;
        }

        ValidationUtils.clearError(locationInfo);
        return true;
    }

    showLoading() {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengunggah...';
    }

    hideLoading() {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bagikan Cerita';
    }

    onAddSuccess() {
        // Close camera if open
        this.closeCamera();

        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Cerita Anda telah berhasil ditambahkan',
            confirmButtonText: 'OK',
            timer: 2000,
            timerProgressBar: true,
        }).then(() => {
            window.location.hash = '#/';
        });
    }

    onAddOffline() {
        // Close camera if open
        this.closeCamera();

        Swal.fire({
            icon: 'info',
            title: 'Tersimpan untuk Nanti',
            html: `
                <p>Anda sedang offline. Cerita Anda telah disimpan dan akan dikirim otomatis saat koneksi tersedia.</p>
                <p><small>Anda akan menerima notifikasi ketika cerita berhasil dikirim.</small></p>
            `,
            confirmButtonText: 'Mengerti',
            allowOutsideClick: false,
        }).then(() => {
            window.location.hash = '#/';
        });
    }

    onAddError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal Menambahkan Cerita',
            text: message || 'Terjadi kesalahan. Silakan coba lagi.',
            confirmButtonText: 'OK',
        });
    }
}
