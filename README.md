# XAUUSD News Impact & Execution Terminal

Aplikasi web modern, interaktif, dan komprehensif yang dirancang khusus untuk trader institusional dan retail dalam menganalisis dampak fundamental dari rilis data ekonomi Amerika Serikat (**CPI, PPI, dan NFP**) terhadap pasangan **XAUUSD (Emas)**.

---

## 🌟 Fitur Utama & Modul Aplikasi

### 1. Desain Institusional & Theme Engine
- **Luxury Emerald & Obsidian Institutional Dark Mode:** Mengadopsi palet 5-warna premium institusional:
  - `#070708`: Deep Obsidian Canvas (latar belakang gelap pekat tanpa pantulan menyilaukan).
  - `#0B2A1A`: Deep Pine Forest (permukaan kartu *frosted glassmorphism* mewah).
  - `#135C3A`: Jade Forest Green (border pembatas kartu & elemen struktural).
  - `#2FA36A`: Radiant Mint / Jade Green (aksen utama, tombol interaktif, indikator BUY XAUUSD).
  - `#D8E6DF`: Sage Frosted White (tipografi utama dengan rasio kontras lembut yang nyaman untuk mata trader).
- **Tactile Micro-Stepper UX:** Setiap input simulator dilengkapi tombol stepper mikro (`-` dan `+`) yang responsif dengan efek suara mekanikal lembut (*acoustic chime*) untuk kemudahan penyesuaian angka.
- **Theme Switcher:** Toggle instan **Dark Mode / Light Mode** di navbar dengan transisi CSS yang mulus (*smooth transition*).
- **Responsif Penuh:** Tata letak multi-kolom di desktop, adaptif di tablet, dan drawer modal khusus di perangkat mobile.

### 2. Live Market Clock (WIB UTC+7) & DST Indicator
- **Jam Real-time WIB:** Menampilkan waktu WIB presisi per detik beserta tanggal lokal Indonesia.
- **Deteksi Otomatis Daylight Saving Time (DST):**
  - **19:30 WIB:** Berlaku pada periode *Daylight Saving Time* (Maret – November).
  - **20:30 WIB:** Berlaku pada periode *Standard Time* (November – Maret).
- **Hitung Mundur Sesi Rilis:** Timer dinamis menuju rilis berita AS berikutnya.
- **High Volatility & Wide Spread Zone Alert:** Peringatan visual beranimasi merah berkedip saat berada di rentang 0 – 5 menit pasca rilis (lengkap dengan tombol **Simulasi Uji Alert** untuk pengujian langsung kapan saja).
- **Audio Synthesizer (Web Audio API):** Efek suara peringatan volatilitas dan klik tanpa perlu file audio eksternal.

### 3. Interactive News Simulator (Core Engine)
- **Tab 1: CPI (Consumer Price Index - High Impact)**
  - Parameter: *Core CPI m/m* (Fokus Utama), *Core CPI y/y*, dan *Headline CPI m/m*.
- **Tab 2: NFP (Non-Farm Payrolls & Ketenagakerjaan)**
  - Parameter: *Non-Farm Payrolls (K)*, *Average Hourly Earnings (% m/m)*, dan *Unemployment Rate (% - Logika Terbalik)*.
  - Dilengkapi algoritma **Mixed Data Conflict Detection** jika terjadi pertentangan antara penambahan lapangan kerja dan kenaikan pengangguran.
- **Tab 3: PPI (Producer Price Index - Inflasi Produsen)**
  - Parameter: *Core PPI m/m* (Fokus Utama), *Headline PPI m/m*, dan *Headline PPI y/y*.
- **Tab 4: Gabungan (All-in-One: CPI + NFP + PPI)**
  - Tampilan terpadu 3 kolom yang memungkinkan pengaturan simultan seluruh pilar data ekonomi AS dalam satu layar.
- **Preset Skenario Cepat:** Tombol 1-klik untuk memuat skenario historis (misal: *CPI Hot*, *NFP Strong*, *Triple Hawkish Overheating*, *Triple Dovish Pivot*, *Stagflation Squeeze*, *Goldilocks Expansion*).
- **Kalkulasi Deviasi Real-time:** Perhitungan terbobot langsung dari data deviasi aktual vs forecast.

### 4. Indikator Komposit Makro AS Gabungan (All-in-One: NFP + CPI + PPI)
- **Macro Composite Confluence Index (MCCI):** Menghitung sintesis terbobot 3 pilar utama:
  $$\text{Composite Score} = (0.40 \times \text{CPI}) + (0.35 \times \text{NFP}) + (0.25 \times \text{PPI})$$
- **Deteksi Rezim Makroekonomi Institusional:**
  - `🔥 OVERHEATING / ULTRA HAWKISH FED`: Triple Hot $\implies$ Tekanan jual masif pada XAUUSD.
  - `❄️ DISINFLATIONARY PIVOT (FED RATE CUTS)`: Triple Cool $\implies$ Reli beli masif pada XAUUSD.
  - `⚠️ STAGFLATION REGIME`: Inflasi tinggi (CPI/PPI) + Pelemahan tenaga kerja (NFP) $\implies$ Emas menjadi safe-haven bid (Bullish).
  - `🕊️ GOLDILOCKS EXPANSION`: Tenaga kerja kuat + Inflasi dingin $\implies$ Range-bound / Moderate Sell.
  - `⚖️ BALANCED / DIVERGENSI REGIME`: Data bertentangan $\implies$ Rekomendasi No Trade.
- **Pillar Breakdown Bars:** Visualisasi kontribusi masing-masing pilar data dengan progress bar dinamis dan indikator warna.
- **Master Composite Speedometer:** Gauge meter radial khusus untuk sentimen agregat makro.

### 4. Output Sinyal Otomatis & Gauge Meter
- **Gauge Meter Visual:** Visualisasi kurva jarum dinamis berbasis HTML5 Canvas dengan gradien warna sinyal.
- **Signal Strength Meter:** Skor keyakinan sinyal (0% – 100%).
- **Sinyal Institusional:** `STRONG SELL`, `SELL`, `WAIT & SEE / NO TRADE`, `BUY`, dan `STRONG BUY`.
- **Confluence Verification Checklist:** Pemeriksaan real-time apakah arah deviasi fundamental didukung oleh DXY, US10Y, dan revisi sebelumnya.
- **Deteksi Anomali Korelasi:** Peringatan otomatis jika arah DXY/Yield bertentangan dengan data (indikasi *spike trap* / manipulasi likuiditas).
- **Panduan Eksekusi Taktis:** Saran entry (*pullback*, *retest*), jarak Stop Loss, dan target pips.

### 5. Matriks Rangkuman Cepat (Cheat Sheet Interaktif)
- Tabel ringkasan dampak CPI, PPI, dan NFP dengan live search dan filter kategori (*Inflasi* / *Ketenagakerjaan*).
- **3 Kartu Poin Kunci Eksekusi:**
  1. *Alur Logika Transmisi Fundamental:* Data AS $\to$ Ekspektasi The Fed $\to$ DXY & Yield $\to$ Emas.
  2. *Panduan Jam Rilis WIB & DST:* Penjelasan zona waktu musim panas vs musim dingin.
  3. *Protokol Buffer 5 Menit:* Aturan emas larangan *market order* instan saat pelebaran *spread*.

### 6. AI Trading Assistant (Copilot)
- Panel chat pintar di sisi kanan (desktop) atau floating drawer (mobile).
- Terkoneksi langsung dengan simulator: AI membaca angka *Actual*, *Forecast*, *Previous*, deviasi, status DXY, dan sinyal yang aktif secara instan.
- **Quick Prompts Cepat:**
  - *"Analisis data input saat ini"*
  - *"Analisis skenario NFP mixed data"*
  - *"Kenapa spread melebar saat rilis CPI?"*
  - *"Cara konfirmasi arah DXY dan US10Y"*
  - *"Strategi entry pasca 5 menit"*
- Input chat bebas: Trader dapat menanyakan berbagai skenario makroekonomi dalam Bahasa Indonesia profesional.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bersifat *zero-dependency* untuk server dan dapat langsung dijalankan:

### Opsi 1: Menjalankan dengan Node.js (Rekomendasi)
```bash
npm start
```
Buka browser dan akses:
```
http://localhost:3000
```

### Opsi 2: Buka Langsung File HTML
Anda juga dapat langsung membuka file [index.html](file:///d:/1PrediksiOnee/index.html) di browser mana pun (Chrome, Edge, Firefox, Safari) tanpa perlu menginstal dependensi tambahan.

---

## 📁 Struktur File Proyek
```
d:\1PrediksiOnee\
├── index.html        # Struktur antarmuka terminal utama
├── styles.css        # Tema institusional, glassmorphism, & animasi
├── app.js            # Core engine analisis, kalkulasi deviasi, DST, & AI Copilot
├── server.js         # HTTP server ringan (Node.js built-in)
├── package.json      # Konfigurasi proyek & skrip start
└── README.md         # Dokumentasi lengkap aplikasi
```
