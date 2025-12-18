export default class AboutPage {
  async render() {
    return `
      <section class="about-section container">
        <div class="about-header">
          <h1>Tentang Story App</h1>
          <p class="about-subtitle">Berbagi cerita, menyatukan dunia</p>
        </div>

        <div class="about-content">
          <article class="about-card">
            <h2>Apa itu Story App?</h2>
            <p>
              Story App adalah platform berbagi cerita yang memungkinkan Anda untuk membagikan 
              pengalaman menarik dari berbagai lokasi di seluruh dunia. Dengan fitur peta interaktif, 
              Anda dapat melihat di mana cerita-cerita tersebut terjadi.
            </p>
          </article>

          <article class="about-card">
            <h2>Fitur Utama</h2>
            <ul class="features-list">
              <li>
                <strong>📖 Berbagi Cerita</strong>
                <p>Bagikan pengalaman menarik Anda dengan foto dan deskripsi</p>
              </li>
              <li>
                <strong>🗺️ Peta Interaktif</strong>
                <p>Lihat lokasi cerita pada peta digital dengan berbagai layer</p>
              </li>
              <li>
                <strong>📷 Ambil Foto Langsung</strong>
                <p>Gunakan kamera untuk mengambil foto cerita secara langsung</p>
              </li>
              <li>
                <strong>🌍 Jelajahi Cerita</strong>
                <p>Temukan cerita menarik dari berbagai lokasi di dunia</p>
              </li>
            </ul>
          </article>

          <article class="about-card">
            <h2>Teknologi yang Digunakan</h2>
            <ul class="tech-list">
              <li>Vite - Build tool modern</li>
              <li>Leaflet - Library peta interaktif</li>
              <li>Story API - Backend service</li>
              <li>View Transition API - Animasi perpindahan halaman</li>
            </ul>
          </article>

          <article class="about-card">
            <h2>Kontak</h2>
            <p>
              Untuk pertanyaan atau masukan, silakan hubungi kami melalui:
            </p>
            <p>
              📧 Email: <a href="mailto:info@storyapp.com">info@storyapp.com</a>
            </p>
          </article>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // No specific logic needed for about page
  }
}
