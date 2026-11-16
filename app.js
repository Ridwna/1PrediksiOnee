/**
 * XAUUSD News Impact & Execution Terminal - Application Engine
 * High Performance Reactive State & Analysis Core
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const TerminalState = {
  theme: localStorage.getItem('xau_theme') || 'dark',
  activeTab: 'cpi', // 'ppi' | 'cpi' | 'nfp'
  testAlertActive: false,
  soundEnabled: true,
  searchQuery: '',
  selectedCategory: 'all',

  // Simulator Inputs
  inputs: {
    ppi: {
      corePpiMoM: { actual: 0.3, forecast: 0.2, previous: 0.1, label: 'Core PPI m/m (Fokus Utama)', unit: '%' },
      headlinePpiMoM: { actual: 0.4, forecast: 0.3, previous: 0.2, label: 'Headline PPI m/m', unit: '%' },
      headlinePpiYoY: { actual: 2.4, forecast: 2.2, previous: 2.1, label: 'Headline PPI y/y', unit: '%' }
    },
    cpi: {
      coreCpiMoM: { actual: 0.4, forecast: 0.2, previous: 0.2, label: 'Core CPI m/m (Fokus Utama - High Impact)', unit: '%' },
      coreCpiYoY: { actual: 3.3, forecast: 3.1, previous: 3.2, label: 'Core CPI y/y', unit: '%' },
      headlineCpiMoM: { actual: 0.4, forecast: 0.2, previous: 0.2, label: 'Headline CPI m/m', unit: '%' }
    },
    nfp: {
      payrolls: { actual: 220, forecast: 160, previous: 150, label: 'Non-Farm Payrolls (NFP)', unit: 'K' },
      wagesMoM: { actual: 0.4, forecast: 0.3, previous: 0.3, label: 'Average Hourly Earnings (Upah) m/m', unit: '%' },
      unemployment: { actual: 4.0, forecast: 4.2, previous: 4.2, label: 'Unemployment Rate (Pengangguran)', unit: '%', inverted: true }
    }
  },

  // Computed analysis result
  analysis: null,
  compositeAnalysis: null,

  // AI Chat History
  chatMessages: [
    {
      sender: 'ai',
      time: 'Just now',
      text: `Halo Trader! Saya adalah **AI Trading Copilot**. Saya memantau input simulator Anda secara real-time. Anda bisa memilih skenario berita di simulator atau klik salah satu Quick Prompt di bawah untuk analisis makro & eksekusi instan.`
    }
  ]
};

// ==========================================
// 2. AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playAlert() {
    if (!TerminalState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-grade institutional dual-chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(329.63, now); // E4

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio FX error', e);
    }
  }

  playClick() {
    if (!TerminalState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft luxury acoustic pop (tactile mechanical click)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now); // F#6
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// ==========================================
// 3. DST & LIVE MARKET CLOCK (WIB UTC+7)
// ==========================================
function isUSDST(date) {
  // US DST starts on second Sunday in March and ends on first Sunday in November
  const year = date.getUTCFullYear();
  
  // 2nd Sunday in March
  const marchFirst = new Date(Date.UTC(year, 2, 1));
  const marchFirstDay = marchFirst.getUTCDay();
  const secondSundayMarch = 1 + ((7 - marchFirstDay) % 7) + 7;
  const dstStart = new Date(Date.UTC(year, 2, secondSundayMarch, 7, 0, 0)); // 2am EST = 7am UTC

  // 1st Sunday in November
  const novFirst = new Date(Date.UTC(year, 10, 1));
  const novFirstDay = novFirst.getUTCDay();
  const firstSundayNov = 1 + ((7 - novFirstDay) % 7);
  const dstEnd = new Date(Date.UTC(year, 10, firstSundayNov, 6, 0, 0)); // 2am EDT = 6am UTC

  const nowUTC = date.getTime();
  return nowUTC >= dstStart.getTime() && nowUTC < dstEnd.getTime();
}

function updateMarketClock() {
  const now = new Date();
  
  // Calculate WIB Time (UTC+7)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (3600000 * 7));

  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');
  const seconds = String(wibDate.getSeconds()).padStart(2, '0');

  const clockEl = document.getElementById('liveClockWIB');
  if (clockEl) {
    clockEl.textContent = `${hours}:${minutes}:${seconds} WIB`;
  }

  // Days in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dateSubEl = document.getElementById('liveDateWIB');
  if (dateSubEl) {
    dateSubEl.textContent = `${dayNames[wibDate.getDay()]}, ${wibDate.getDate()} ${monthNames[wibDate.getMonth()]} ${wibDate.getFullYear()}`;
  }

  // DST Analysis
  const dstActive = isUSDST(now);
  const dstBadge = document.getElementById('dstBadge');
  const releaseScheduleInfo = document.getElementById('releaseScheduleInfo');

  const releaseHour = dstActive ? 19 : 20;
  const releaseMinute = 30;

  if (dstBadge) {
    if (dstActive) {
      dstBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-mint animate-pulse inline-block mr-1.5"></span> DST Aktif (EDT)`;
      dstBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-pine text-mint border border-forest';
    } else {
      dstBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-sage inline-block mr-1.5"></span> Standard Time (EST)`;
      dstBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-pine text-sage border border-forest';
    }
  }

  if (releaseScheduleInfo) {
    releaseScheduleInfo.textContent = `Jadwal Rilis Berita AS: ${releaseHour}:${String(releaseMinute).padStart(2, '0')} WIB`;
  }

  // Countdown Calculation
  const targetRelease = new Date(wibDate);
  targetRelease.setHours(releaseHour, releaseMinute, 0, 0);

  let diffMs = targetRelease.getTime() - wibDate.getTime();
  
  // If today's release passed, target tomorrow's release for countdown
  if (diffMs < - (5 * 60 * 1000)) { 
    targetRelease.setDate(targetRelease.getDate() + 1);
    diffMs = targetRelease.getTime() - wibDate.getTime();
  }

  const countdownEl = document.getElementById('newsCountdown');
  const alertBanner = document.getElementById('volatilityAlertBanner');

  // Check if currently inside 0 - 5 minutes post release (or test mode active)
  const isPostReleaseWindow = (diffMs <= 0 && diffMs >= - (5 * 60 * 1000)) || TerminalState.testAlertActive;

  if (isPostReleaseWindow) {
    if (countdownEl) {
      const elapsedSec = Math.floor(Math.abs(diffMs) / 1000);
      const elM = Math.floor(elapsedSec / 60);
      const elS = elapsedSec % 60;
      countdownEl.innerHTML = `<span class="text-[#2FA36A] font-bold animate-pulse">POST-RELEASE +${elM}m ${elS}s</span>`;
    }
    if (alertBanner) {
      alertBanner.classList.remove('hidden');
    }
  } else {
    if (alertBanner) {
      alertBanner.classList.add('hidden');
    }
    if (countdownEl) {
      const totalSec = Math.floor(diffMs / 1000);
      const ch = Math.floor(totalSec / 3600);
      const cm = Math.floor((totalSec % 3600) / 60);
      const cs = totalSec % 60;
      countdownEl.innerHTML = `<span class="font-mono text-[#D8E6DF] font-bold">T-${String(ch).padStart(2,'0')}h ${String(cm).padStart(2,'0')}m ${String(cs).padStart(2,'0')}s</span>`;
    }
  }
}

// ==========================================
// 4. CALCULATION & FUNDAMENTAL ENGINE
// ==========================================

// Helper to compute individual scores for CPI, PPI, or NFP
function calculateMetricScore(tabKey) {
  const tabData = TerminalState.inputs[tabKey];
  let score = 0; // -100 (Dovish / Bullish Gold) to +100 (Hawkish / Bearish Gold)
  let breakdown = [];
  let isMixed = false;

  if (tabKey === 'cpi') {
    const coreMoMDev = tabData.coreCpiMoM.actual - tabData.coreCpiMoM.forecast;
    const coreYoYDev = tabData.coreCpiYoY.actual - tabData.coreCpiYoY.forecast;
    const headMoMDev = tabData.headlineCpiMoM.actual - tabData.headlineCpiMoM.forecast;

    const coreMoMScore = (coreMoMDev / 0.1) * 50; // 0.1% dev = 50 pts
    const coreYoYScore = (coreYoYDev / 0.1) * 30;
    const headMoMScore = (headMoMDev / 0.1) * 20;

    score = coreMoMScore + coreYoYScore + headMoMScore;

    breakdown.push({
      name: 'Core CPI m/m (Fokus)',
      dev: coreMoMDev,
      unit: '%',
      impact: coreMoMDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: coreMoMDev < 0
    });
    breakdown.push({
      name: 'Core CPI y/y',
      dev: coreYoYDev,
      unit: '%',
      impact: coreYoYDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: coreYoYDev < 0
    });
    breakdown.push({
      name: 'Headline CPI m/m',
      dev: headMoMDev,
      unit: '%',
      impact: headMoMDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: headMoMDev < 0
    });

  } else if (tabKey === 'ppi') {
    const coreMoMDev = tabData.corePpiMoM.actual - tabData.corePpiMoM.forecast;
    const headMoMDev = tabData.headlinePpiMoM.actual - tabData.headlinePpiMoM.forecast;
    const headYoYDev = tabData.headlinePpiYoY.actual - tabData.headlinePpiYoY.forecast;

    const coreMoMScore = (coreMoMDev / 0.1) * 50;
    const headMoMScore = (headMoMDev / 0.1) * 30;
    const headYoYScore = (headYoYDev / 0.1) * 20;

    score = coreMoMScore + headMoMScore + headYoYScore;

    breakdown.push({
      name: 'Core PPI m/m (Fokus)',
      dev: coreMoMDev,
      unit: '%',
      impact: coreMoMDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: coreMoMDev < 0
    });
    breakdown.push({
      name: 'Headline PPI m/m',
      dev: headMoMDev,
      unit: '%',
      impact: headMoMDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: headMoMDev < 0
    });
    breakdown.push({
      name: 'Headline PPI y/y',
      dev: headYoYDev,
      unit: '%',
      impact: headYoYDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: headYoYDev < 0
    });

  } else if (tabKey === 'nfp') {
    const nfpDev = tabData.payrolls.actual - tabData.payrolls.forecast;
    const wageDev = tabData.wagesMoM.actual - tabData.wagesMoM.forecast;
    const unempDev = tabData.unemployment.forecast - tabData.unemployment.actual; // Lower unemp = positive USD

    const nfpScore = (nfpDev / 30) * 40;
    const wageScore = (wageDev / 0.1) * 35;
    const unempScore = (unempDev / 0.1) * 25;

    score = nfpScore + wageScore + unempScore;

    const nfpBullUSD = nfpDev >= 20;
    const nfpBearUSD = nfpDev <= -20;
    const unempBearUSD = unempDev <= -0.15;
    const unempBullUSD = unempDev >= 0.15;

    if ((nfpBullUSD && unempBearUSD) || (nfpBearUSD && unempBullUSD)) {
      isMixed = true;
    }

    breakdown.push({
      name: 'Non-Farm Payrolls',
      dev: nfpDev,
      unit: 'K',
      impact: nfpDev >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)',
      favorsGold: nfpDev < 0
    });
    breakdown.push({
      name: 'Rata-Rata Upah (Wages)',
      dev: wageDev,
      unit: '%',
      impact: wageDev >= 0 ? 'Upah Naik (Sell)' : 'Upah Turun (Buy)',
      favorsGold: wageDev < 0
    });
    breakdown.push({
      name: 'Tingkat Pengangguran',
      dev: tabData.unemployment.actual - tabData.unemployment.forecast,
      unit: '%',
      impact: unempDev >= 0 ? 'Pasar Ketat (Sell)' : 'Pasar Longgar (Buy)',
      favorsGold: unempDev < 0
    });
  }

  return { score, breakdown, isMixed };
}

function calculateSignals() {
  const currentTab = TerminalState.activeTab;

  // 1. Calculate Individual Scores
  const cpiResult = calculateMetricScore('cpi');
  const nfpResult = calculateMetricScore('nfp');
  const ppiResult = calculateMetricScore('ppi');

  // 2. Calculate Composite Macro Confluence Index (CPI 40% + NFP 35% + PPI 25%)
  const compositeScore = (0.40 * cpiResult.score) + (0.35 * nfpResult.score) + (0.25 * ppiResult.score);

  // Macro Regime Detection (Strict SELL or BUY)
  let regime = '';
  let regimeClass = '';
  let compositeSignal = '';
  let compositeSignalClass = '';
  let synthesisText = '';

  const isInflationHot = cpiResult.score > 10 || ppiResult.score > 10;
  const isInflationCool = cpiResult.score < -10 && ppiResult.score < -10;
  const isLaborHot = nfpResult.score > 10;
  const isLaborWeak = nfpResult.score < -10;

  if (isInflationHot && isLaborWeak) {
    regime = '⚠️ STAGFLATION REGIME (INFLASI TINGGI + EKONOMI MELEMAH)';
    regimeClass = 'bg-pine text-mint border border-mint font-bold';
    compositeSignal = 'BUY XAUUSD (SAFE-HAVEN STAGFLATION)';
    compositeSignalClass = 'badge-buy';
    synthesisText = `**Risiko Stagflasi**: Inflasi (CPI/PPI) melonjak tinggi sementara pasar tenaga kerja (NFP) melemah drastis. Emas menjadi aset lindung nilai utama; dorongan **BUY XAUUSD** mendominasi pasar.`;
  } else if (isLaborHot && isInflationCool) {
    regime = '🕊️ GOLDILOCKS EXPANSION (PERTUMBUHAN KUAT, INFLASI DINGIN)';
    regimeClass = 'bg-forest/70 text-sage border border-forest font-bold';
    compositeSignal = 'SELL XAUUSD (BEARISH EXPANSION)';
    compositeSignalClass = 'badge-sell';
    synthesisText = `**Rezim Goldilocks**: Pasar tenaga kerja solid dan ekonomi tumbuh sehat. Modal beralih ke aset berisiko (equities), menekan harga Emas; sinyal eksekusi **SELL XAUUSD**.`;
  } else if (compositeScore >= 30) {
    regime = '🔥 OVERHEATING / ULTRA HAWKISH FED';
    regimeClass = 'bg-forest text-sage border border-mint font-bold';
    compositeSignal = 'STRONG SELL XAUUSD (MAX BEARISH GOLD)';
    compositeSignalClass = 'badge-sell';
    synthesisText = `**Overheating Makro AS**: Ketiga pilar (CPI, NFP, PPI) secara kompak rilis melampaui forecast. The Fed dipaksa bersikap sangat Hawkish, suku bunga bertahan tinggi, menekan **XAUUSD dalam tren SELL masif**.`;
  } else if (compositeScore <= -30) {
    regime = '❄️ DISINFLATIONARY PIVOT (FED RATE CUTS)';
    regimeClass = 'bg-pine text-mint border border-mint font-bold';
    compositeSignal = 'STRONG BUY XAUUSD (MAX BULLISH GOLD)';
    compositeSignalClass = 'badge-buy';
    synthesisText = `**Pendinginan Total Makro AS**: Seluruh indikator inflasi produsen (PPI), inflasi konsumen (CPI), dan pasar tenaga kerja (NFP) kompak mendingin. The Fed memiliki legitimasi penuh memangkas suku bunga, memicu reli **BUY XAUUSD masif**.`;
  } else if (compositeScore >= 0) {
    regime = '📈 HAWKISH BIAS (RESILIENT US ECONOMY)';
    regimeClass = 'bg-forest/70 text-sage border border-forest font-bold';
    compositeSignal = 'SELL XAUUSD (BEARISH)';
    compositeSignalClass = 'badge-sell';
    synthesisText = `**Bias Hawkish AS**: Agregat data ekonomi AS positif/resisten mendukung penguatan USD. Tekanan jual mendominasi XAUUSD; fokus pada posisi **SELL XAUUSD**.`;
  } else {
    regime = '📉 DOVISH BIAS (COOLING US ECONOMY)';
    regimeClass = 'bg-pine text-mint border border-forest font-bold';
    compositeSignal = 'BUY XAUUSD (BULLISH)';
    compositeSignalClass = 'badge-buy';
    synthesisText = `**Bias Dovish AS**: Agregat data ekonomi AS melambat dan menekan USD. Emas mendapatkan dorongan momentum naik; fokus pada posisi **BUY XAUUSD**.`;
  }

  // Composite Gauge Needle value (SELL: 8..44 | BUY: 56..92)
  let compositeMeterVal = compositeScore >= 0
    ? Math.max(8, Math.round(44 - (compositeScore / 2.2)))
    : Math.min(92, Math.round(56 + (Math.abs(compositeScore) / 2.2)));
  if (isInflationHot && isLaborWeak) {
    compositeMeterVal = 78; // Stagflation is Gold Bullish
  }
  const compositeConfidence = Math.min(98, Math.max(55, Math.round(55 + Math.abs(compositeScore) / 2)));

  TerminalState.compositeAnalysis = {
    cpiScore: cpiResult.score,
    nfpScore: nfpResult.score,
    ppiScore: ppiResult.score,
    compositeScore,
    regime,
    regimeClass,
    signal: compositeSignal,
    signalClass: compositeSignalClass,
    meterValue: compositeMeterVal,
    strengthPercent: compositeConfidence,
    synthesisText
  };

  // 3. Calculate Specific Tab Output (or use composite summary if activeTab === 'composite')
  let activeScore = 0;
  let breakdown = [];
  let isMixed = false;

  if (currentTab === 'composite') {
    activeScore = compositeScore;
    breakdown = [
      { name: 'CPI (Konsumen - 40%)', dev: cpiResult.score, unit: ' pts', impact: cpiResult.score >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)', favorsGold: cpiResult.score < 0 },
      { name: 'NFP (Tenaga Kerja - 35%)', dev: nfpResult.score, unit: ' pts', impact: nfpResult.score >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)', favorsGold: nfpResult.score < 0 },
      { name: 'PPI (Produsen - 25%)', dev: ppiResult.score, unit: ' pts', impact: ppiResult.score >= 0 ? 'Hawkish (Sell)' : 'Dovish (Buy)', favorsGold: ppiResult.score < 0 }
    ];
  } else if (currentTab === 'cpi') {
    activeScore = cpiResult.score;
    breakdown = cpiResult.breakdown;
    isMixed = cpiResult.isMixed;
  } else if (currentTab === 'ppi') {
    activeScore = ppiResult.score;
    breakdown = ppiResult.breakdown;
    isMixed = ppiResult.isMixed;
  } else if (currentTab === 'nfp') {
    activeScore = nfpResult.score;
    breakdown = nfpResult.breakdown;
    isMixed = nfpResult.isMixed;
  }

  // Determine Single / Active Signal & Strength (Strict SELL or BUY)
  let signal = '';
  let signalClass = '';
  let badgeClass = '';
  let meterValue = 50;
  let strengthPercent = 50;
  let rationale = '';
  let executionAdvice = '';

  if (activeScore >= 35) {
    signal = currentTab === 'composite' ? 'STRONG SELL XAUUSD (MAX BEARISH)' : 'STRONG SELL XAUUSD (MAX BEARISH)';
    signalClass = 'text-[var(--text-primary)] font-bold';
    badgeClass = 'badge-sell';
    strengthPercent = Math.min(98, Math.round(78 + (activeScore / 4.5)));
    meterValue = Math.max(8, Math.round(40 - (activeScore / 3)));
    rationale = currentTab === 'composite'
      ? `Agregat seluruh pilar data AS rilis **JAUH LEBIH KUAT DARI FORECAST**. Mengonfirmasi siklus suku bunga tinggi The Fed, menekan XAUUSD dalam tren SELL agresif.`
      : `Data AS rilis **JAUH LEBIH KUAT DARI FORECAST**. Tekanan inflasi/ketenagakerjaan yang tinggi mendorong ekspektasi suku bunga The Fed tetap ketat (*Hawkish Fed*). Dollar AS (USD) terdorong menguat tajam, menekan harga Emas.`;
    executionAdvice = `Fokus eksekusi **SELL ON PULLBACK** saat harga retest area supply/resistance M5 pasca penurunan impulsif pertama. Stop Loss di atas high lonjakan rilis berita. Target estimasi: 150 - 300 pips.`;
  } else if (activeScore >= 0) {
    signal = currentTab === 'composite' ? 'SELL XAUUSD (BEARISH)' : 'SELL XAUUSD (BEARISH)';
    signalClass = 'text-[var(--text-primary)] font-bold';
    badgeClass = 'badge-sell';
    strengthPercent = Math.min(79, Math.round(56 + (activeScore / 2.5)));
    meterValue = Math.max(16, Math.round(44 - (activeScore / 3)));
    rationale = isMixed
      ? `Terdeteksi rilis data kombinasi (*mixed*), namun bobot komponen utama condong **LEBIH HAWKISH**. Sinyal terkonfirmasi adalah **SELL XAUUSD**.`
      : `Data AS rilis melampaui forecast konsensus. Penguatan USD memberikan tekanan jual dominan bagi XAUUSD.`;
    executionAdvice = `Peluang eksekusi **SELL** valid. Tunggu penutupan candle 5 menit untuk konfirmasi rejection area resistance sebelum entry. Disiplin batasi risiko. Target estimasi: 80 - 150 pips.`;
  } else if (activeScore <= -35) {
    signal = currentTab === 'composite' ? 'STRONG BUY XAUUSD (MAX BULLISH)' : 'STRONG BUY XAUUSD (MAX BULLISH)';
    signalClass = 'text-mint font-bold';
    badgeClass = 'badge-buy';
    strengthPercent = Math.min(98, Math.round(78 + (Math.abs(activeScore) / 4.5)));
    meterValue = Math.min(92, Math.round(60 + (Math.abs(activeScore) / 3)));
    rationale = currentTab === 'composite'
      ? `Agregat seluruh pilar data AS rilis **JAUH LEBIH BURUK DARI FORECAST**. Mengonfirmasi siklus pemangkasan suku bunga The Fed (*Dovish Pivot*), memicu reli BUY masif XAUUSD.`
      : `Data AS rilis **JAUH LEBIH BURUK DARI FORECAST (COOL / MISS)**. Tekanan inflasi yang mereda atau data tenaga kerja yang mendingin membuka peluang pemangkasan suku bunga The Fed (*Dovish Pivot*). USD melemah drastis, memicu reli BUY masif pada Emas.`;
    executionAdvice = `Fokus eksekusi **BUY ON DIP** di area demand/support M5 setelah lonjakan reli awal mereda. Pasang Stop Loss di bawah low ayunan rilis berita. Target estimasi: 150 - 350 pips.`;
  } else {
    // activeScore < 0
    signal = currentTab === 'composite' ? 'BUY XAUUSD (BULLISH)' : 'BUY XAUUSD (BULLISH)';
    signalClass = 'text-mint font-bold';
    badgeClass = 'badge-buy';
    strengthPercent = Math.min(79, Math.round(56 + (Math.abs(activeScore) / 2.5)));
    meterValue = Math.min(84, Math.round(56 + (Math.abs(activeScore) / 3)));
    rationale = isMixed
      ? `Terdeteksi rilis data kombinasi (*mixed*), namun bobot komponen utama condong **LEBIH DOVISH**. Sinyal terkonfirmasi adalah **BUY XAUUSD**.`
      : `Data AS rilis di bawah forecast konsensus. Pelemahan USD membuka dorongan momentum beli bullish bagi XAUUSD.`;
    executionAdvice = `Peluang eksekusi **BUY** valid. Ambil posisi saat harga pullback ke level support terdekat pasca lonjakan awal. Target estimasi: 80 - 150 pips.`;
  }

  TerminalState.analysis = {
    tab: currentTab,
    signal,
    signalClass,
    badgeClass,
    meterValue,
    strengthPercent,
    totalDeviation: activeScore,
    breakdown,
    rationale,
    executionAdvice,
    isMixed
  };

  renderSimulatorOutput();
  renderCompositeOutput();
}

// ==========================================
// 5. DOM RENDERING ENGINE
// ==========================================
function renderInputs() {
  const currentTab = TerminalState.activeTab;
  const container = document.getElementById('simulatorInputFields');
  if (!container) return;

  if (currentTab === 'composite') {
    // Render all 3 sections side-by-side in a responsive grid
    let compositeHtml = '<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">';
    
    const subTabs = [
      { key: 'cpi', title: '🔥 CPI (Konsumen - Bobot 40%)', border: 'border-[var(--border-color)] bg-[var(--bg-surface)]' },
      { key: 'nfp', title: '💼 NFP (Tenaga Kerja - Bobot 35%)', border: 'border-[var(--border-color)] bg-[var(--bg-surface)]' },
      { key: 'ppi', title: '🏭 PPI (Produsen - Bobot 25%)', border: 'border-[var(--border-color)] bg-[var(--bg-surface)]' }
    ];

    subTabs.forEach(group => {
      compositeHtml += `
        <div class="p-3 rounded-xl border ${group.border} flex flex-col gap-2.5">
          <div class="font-bold text-xs text-mint flex items-center justify-between pb-1.5 border-b border-[var(--border-color)]">
            <span>${group.title}</span>
          </div>
      `;

      const tabData = TerminalState.inputs[group.key];
      Object.keys(tabData).forEach(key => {
        const item = tabData[key];
        const isMain = key.toLowerCase().includes('core') || key === 'payrolls';
        const dev = (item.actual - item.forecast).toFixed(2);
        const devNum = parseFloat(dev);
        const devColor = devNum > 0 ? 'text-[var(--text-primary)] font-bold' : devNum < 0 ? 'text-mint font-bold' : 'text-[var(--text-muted)]';
        const devSign = devNum > 0 ? '+' : '';
        const stepVal = key === 'payrolls' ? '5' : '0.1';

        compositeHtml += `
          <div class="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-mint/50 transition">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] font-semibold text-[var(--text-primary)] truncate ${isMain ? 'text-mint font-bold' : ''}">
                ${isMain ? '★ ' : ''}${item.label}
              </span>
              <span class="text-[10px] font-mono font-bold ${devColor}">${devSign}${dev}${item.unit}</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <div>
                <span class="text-[9px] text-[var(--text-muted)] block mb-0.5">Actual</span>
                <div class="flex items-center gap-0.5">
                  <button type="button" class="stepper-btn" data-step="-1" data-tab="${group.key}" data-field="${key}" data-type="actual" title="Kurangi">-</button>
                  <input type="number" step="${stepVal}" value="${item.actual}" data-tab="${group.key}" data-field="${key}" data-type="actual" class="sim-input terminal-input py-1 px-1 text-[11px] font-bold text-center text-[var(--text-primary)] min-w-0" />
                  <button type="button" class="stepper-btn" data-step="1" data-tab="${group.key}" data-field="${key}" data-type="actual" title="Tambah">+</button>
                </div>
              </div>
              <div>
                <span class="text-[9px] text-[var(--text-muted)] block mb-0.5">Fcst</span>
                <div class="flex items-center gap-0.5">
                  <button type="button" class="stepper-btn" data-step="-1" data-tab="${group.key}" data-field="${key}" data-type="forecast" title="Kurangi">-</button>
                  <input type="number" step="${stepVal}" value="${item.forecast}" data-tab="${group.key}" data-field="${key}" data-type="forecast" class="sim-input terminal-input py-1 px-1 text-[11px] text-center text-[var(--text-primary)] min-w-0" />
                  <button type="button" class="stepper-btn" data-step="1" data-tab="${group.key}" data-field="${key}" data-type="forecast" title="Tambah">+</button>
                </div>
              </div>
              <div>
                <span class="text-[9px] text-[var(--text-muted)] block mb-0.5">Prev</span>
                <div class="flex items-center gap-0.5">
                  <button type="button" class="stepper-btn" data-step="-1" data-tab="${group.key}" data-field="${key}" data-type="previous" title="Kurangi">-</button>
                  <input type="number" step="${stepVal}" value="${item.previous}" data-tab="${group.key}" data-field="${key}" data-type="previous" class="sim-input terminal-input py-1 px-1 text-[11px] text-center text-[var(--text-muted)] min-w-0" />
                  <button type="button" class="stepper-btn" data-step="1" data-tab="${group.key}" data-field="${key}" data-type="previous" title="Tambah">+</button>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      compositeHtml += `</div>`;
    });

    compositeHtml += '</div>';
    container.innerHTML = compositeHtml;

  } else {
    // Single Tab View
    const tabData = TerminalState.inputs[currentTab];
    let html = '';

    Object.keys(tabData).forEach(key => {
      const item = tabData[key];
      const isMain = key.toLowerCase().includes('core') || key === 'payrolls';
      const dev = (item.actual - item.forecast).toFixed(2);
      const devNum = parseFloat(dev);
      const devColor = devNum > 0 ? 'text-[var(--text-primary)] font-bold' : devNum < 0 ? 'text-mint font-bold' : 'text-[var(--text-muted)]';
      const devSign = devNum > 0 ? '+' : '';
      const stepVal = key === 'payrolls' ? '5' : '0.1';

      html += `
        <div class="sim-input-row ${isMain ? 'is-main' : ''}">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold ${isMain ? 'text-mint font-bold' : 'text-[var(--text-primary)]'} flex items-center gap-1.5">
              ${isMain ? '<span class="px-1.5 py-0.5 rounded text-[10px] bg-forest text-white font-bold">FOKUS UTAMA</span>' : ''}
              ${item.label}
            </label>
            <span class="text-xs font-mono font-bold ${devColor}">
              Deviasi: ${devSign}${dev}${item.unit}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span class="block text-[11px] text-[var(--text-muted)] mb-1">Actual (Rilis Resmi)</span>
              <div class="flex items-center gap-1">
                <button type="button" class="stepper-btn" data-step="-1" data-tab="${currentTab}" data-field="${key}" data-type="actual" title="Kurangi">-</button>
                <input type="number" step="${stepVal}" value="${item.actual}" data-tab="${currentTab}" data-field="${key}" data-type="actual" class="sim-input terminal-input py-1.5 px-2 text-sm font-bold text-center text-[var(--text-primary)] flex-1 min-w-0" />
                <button type="button" class="stepper-btn" data-step="1" data-tab="${currentTab}" data-field="${key}" data-type="actual" title="Tambah">+</button>
              </div>
            </div>
            <div>
              <span class="block text-[11px] text-[var(--text-muted)] mb-1">Forecast (Konsensus)</span>
              <div class="flex items-center gap-1">
                <button type="button" class="stepper-btn" data-step="-1" data-tab="${currentTab}" data-field="${key}" data-type="forecast" title="Kurangi">-</button>
                <input type="number" step="${stepVal}" value="${item.forecast}" data-tab="${currentTab}" data-field="${key}" data-type="forecast" class="sim-input terminal-input py-1.5 px-2 text-sm text-center text-[var(--text-primary)] flex-1 min-w-0" />
                <button type="button" class="stepper-btn" data-step="1" data-tab="${currentTab}" data-field="${key}" data-type="forecast" title="Tambah">+</button>
              </div>
            </div>
            <div>
              <span class="block text-[11px] text-[var(--text-muted)] mb-1">Previous (Bulan Lalu)</span>
              <div class="flex items-center gap-1">
                <button type="button" class="stepper-btn" data-step="-1" data-tab="${currentTab}" data-field="${key}" data-type="previous" title="Kurangi">-</button>
                <input type="number" step="${stepVal}" value="${item.previous}" data-tab="${currentTab}" data-field="${key}" data-type="previous" class="sim-input terminal-input py-1.5 px-2 text-sm text-center text-[var(--text-muted)] flex-1 min-w-0" />
                <button type="button" class="stepper-btn" data-step="1" data-tab="${currentTab}" data-field="${key}" data-type="previous" title="Tambah">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Add event listeners for dynamic typing updates
  container.querySelectorAll('.sim-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const tab = e.target.getAttribute('data-tab');
      const field = e.target.getAttribute('data-field');
      const type = e.target.getAttribute('data-type');
      const val = parseFloat(e.target.value) || 0;

      TerminalState.inputs[tab][field][type] = val;
      calculateSignals();
    });
  });

  // Add event listeners for tactile micro-stepper buttons (+/-)
  container.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      const field = btn.getAttribute('data-field');
      const type = btn.getAttribute('data-type');
      const dir = parseFloat(btn.getAttribute('data-step')) || 1;
      const stepVal = field === 'payrolls' ? 10 : 0.1;

      const currentVal = TerminalState.inputs[tab][field][type];
      let newVal = currentVal + (dir * stepVal);
      if (field === 'payrolls') {
        newVal = Math.round(newVal);
      } else {
        newVal = parseFloat(newVal.toFixed(2));
      }

      TerminalState.inputs[tab][field][type] = newVal;
      sfx.playClick();
      renderInputs();
      calculateSignals();
    });
  });
}

function renderSimulatorOutput() {
  const analysis = TerminalState.analysis;
  if (!analysis) return;

  // Signal Title & Badge
  const signalBadge = document.getElementById('signalBadge');
  const signalMeterVal = document.getElementById('signalMeterVal');
  const signalMeterSub = document.getElementById('signalMeterSub');
  const signalMeterDesc = document.getElementById('signalMeterDesc');
  const rationaleText = document.getElementById('rationaleText');
  const executionAdviceText = document.getElementById('executionAdviceText');
  const anomalyWarning = document.getElementById('anomalyWarning');

  if (signalBadge) {
    signalBadge.textContent = analysis.signal;
    signalBadge.className = `px-3.5 py-1.5 rounded-md font-mono font-bold text-sm tracking-wide ${analysis.badgeClass}`;
  }

  if (signalMeterVal) {
    if (analysis.meterValue < 50) {
      signalMeterVal.textContent = 'SELL (BEARISH)';
      signalMeterVal.className = 'text-xl font-mono font-bold text-[var(--text-primary)]';
    } else {
      signalMeterVal.textContent = 'BUY (BULLISH)';
      signalMeterVal.className = 'text-xl font-mono font-bold text-mint';
    }
  }

  if (signalMeterSub) {
    signalMeterSub.textContent = `Confidence Score: ${analysis.strengthPercent}%`;
  }

  if (signalMeterDesc) {
    if (analysis.meterValue < 50) {
      signalMeterDesc.textContent = 'Sinyal Eksekusi: SELL XAUUSD (Tekanan Bearish)';
      signalMeterDesc.className = 'text-xs text-[var(--text-primary)] font-semibold';
    } else {
      signalMeterDesc.textContent = 'Sinyal Eksekusi: BUY XAUUSD (Dorongan Bullish)';
      signalMeterDesc.className = 'text-xs text-mint font-semibold';
    }
  }

  // Draw Gauge Meter
  drawGaugeMeter(analysis.meterValue);

  // Rationale & Advice
  if (rationaleText) {
    rationaleText.innerHTML = analysis.rationale.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  if (executionAdviceText) {
    executionAdviceText.innerHTML = analysis.executionAdvice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // Update Dynamic Component Breakdown Checklist (Strict SELL or BUY)
  const checklistContainer = document.getElementById('componentChecklist');
  if (checklistContainer && analysis.breakdown) {
    checklistContainer.innerHTML = analysis.breakdown.map(item => {
      const isFavorsGold = item.favorsGold;
      const cardColor = isFavorsGold
        ? 'border-mint/50 bg-pine text-mint'
        : 'border-forest bg-forest/20 text-[var(--text-primary)]';
      const icon = isFavorsGold ? '▲ BUY' : '▼ SELL';
      const sign = item.dev > 0 ? '+' : '';

      return `
        <div class="p-2.5 rounded-lg border ${cardColor} flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-[var(--text-primary)] truncate">${item.name}</span>
          <div class="flex items-center justify-between mt-1.5">
            <span class="font-bold text-xs font-mono">${sign}${item.dev.toFixed(2)}${item.unit}</span>
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/25">${icon} ${item.impact}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Render Master Composite Output (NFP + CPI + PPI combined)
function renderCompositeOutput() {
  const comp = TerminalState.compositeAnalysis;
  if (!comp) return;

  const regimeBadge = document.getElementById('compositeRegimeBadge');
  const meterValEl = document.getElementById('compositeMeterVal');
  const meterSubEl = document.getElementById('compositeMeterSub');
  const signalBadge = document.getElementById('compositeSignalBadge');
  const synthesisText = document.getElementById('compositeSynthesisText');

  if (regimeBadge) {
    regimeBadge.textContent = comp.regime;
    regimeBadge.className = `regime-badge ${comp.regimeClass}`;
  }

  if (meterValEl) {
    if (comp.meterValue < 50) {
      meterValEl.textContent = 'SELL (BEARISH)';
      meterValEl.className = 'text-xl font-mono font-bold text-[var(--text-primary)]';
    } else {
      meterValEl.textContent = 'BUY (BULLISH)';
      meterValEl.className = 'text-xl font-mono font-bold text-mint';
    }
  }

  if (meterSubEl) {
    meterSubEl.textContent = `Keyakinan Sinyal: ${comp.strengthPercent}%`;
  }

  if (signalBadge) {
    signalBadge.textContent = comp.signal;
    signalBadge.className = `mt-2 font-mono text-xs px-3 py-1 rounded-md font-bold ${comp.signalClass}`;
  }

  if (synthesisText) {
    synthesisText.innerHTML = comp.synthesisText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // Draw Master Composite Speedometer Gauge (No Neutral)
  drawGauge('compositeGaugeCanvas', comp.meterValue, 'SELL XAUUSD', 'BUY XAUUSD');

  // Update 3 Pillar Bars (Strict SELL or BUY)
  function updatePillar(score, valElId, barElId) {
    const valEl = document.getElementById(valElId);
    const barEl = document.getElementById(barElId);
    if (!valEl || !barEl) return;

    const sign = score > 0 ? '+' : '';
    const status = score >= 0 ? 'Hawkish (Sell Emas)' : 'Dovish (Buy Emas)';
    valEl.textContent = `${sign}${score.toFixed(1)} pts (${status})`;

    // Map -60..+60 to 10%..90%
    const normalizedWidth = Math.min(95, Math.max(5, Math.round(50 + (score / 1.2))));
    barEl.style.width = `${normalizedWidth}%`;

    if (score >= 0) {
      valEl.className = 'font-mono text-xs font-bold text-[var(--text-primary)]';
      barEl.className = 'pillar-bar-fill bg-[#135C3A]';
    } else {
      valEl.className = 'font-mono text-xs font-bold text-mint';
      barEl.className = 'pillar-bar-fill bg-[#2FA36A]';
    }
  }

  updatePillar(comp.cpiScore, 'cpiPillarVal', 'cpiPillarBar');
  updatePillar(comp.nfpScore, 'nfpPillarVal', 'nfpPillarBar');
  updatePillar(comp.ppiScore, 'ppiPillarVal', 'ppiPillarBar');
}

// ==========================================
// 6. GAUGE METER CANVAS DRAWING (REUSABLE)
// ==========================================
function drawGauge(canvasId, value, leftLabel = 'SELL XAUUSD', rightLabel = 'BUY XAUUSD') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height - 20;
  const radius = width * 0.42;

  // Track Background Arc (Clean Neutral Dark Groove)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
  ctx.lineWidth = 14;
  ctx.strokeStyle = TerminalState.theme === 'dark' ? '#14181D' : '#E3ECE7';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Subtle Track Outer Border
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
  ctx.lineWidth = 16;
  ctx.strokeStyle = TerminalState.theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dual-Zone Arc: SELL (#135C3A) vs BUY (#2FA36A) - ZERO NEUTRAL
  const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
  gradient.addColorStop(0, '#135C3A');       // SELL Bearish Zone
  gradient.addColorStop(0.48, '#135C3A');
  gradient.addColorStop(0.52, '#2FA36A');    // BUY Bullish Zone
  gradient.addColorStop(1, '#2FA36A');

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
  ctx.lineWidth = 10;
  ctx.strokeStyle = gradient;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center Threshold Line (50% dividing line)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 6);
  ctx.lineTo(centerX, centerY - radius + 6);
  ctx.lineWidth = 2;
  ctx.strokeStyle = TerminalState.theme === 'dark' ? 'rgba(216, 230, 223, 0.4)' : '#135C3A';
  ctx.stroke();

  // Calculate Needle Angle
  const angle = Math.PI + (value / 100) * Math.PI;

  // Needle Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  // Draw Needle Line (Sage Frosted White in Dark Mode)
  const needleLength = radius * 0.85;
  const needleTipX = centerX + needleLength * Math.cos(angle);
  const needleTipY = centerY + needleLength * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(needleTipX, needleTipY);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = TerminalState.theme === 'dark' ? '#D8E6DF' : '#070708';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center Pivot: Luxury Emerald with Sage Core
  ctx.beginPath();
  ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#0B2A1A';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2FA36A';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#D8E6DF';
  ctx.fill();
  ctx.restore();

  // Dual Labels: Strict SELL on Left, BUY on Right (NO NEUTRAL)
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillStyle = TerminalState.theme === 'dark' ? '#D8E6DF' : '#135C3A';
  ctx.fillText(leftLabel, centerX - radius + 4, centerY + 16);

  ctx.fillStyle = '#2FA36A';
  ctx.fillText(rightLabel, centerX + radius - 76, centerY + 16);
}

function drawGaugeMeter(value) {
  drawGauge('signalGaugeCanvas', value, 'SELL XAUUSD', 'BUY XAUUSD');
}

// ==========================================
// 7. PRESETS HANDLER
// ==========================================
const PRESETS = {
  cpi: {
    hot: {
      title: 'CPI Hot (Hawkish)',
      inputs: {
        coreCpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
        coreCpiYoY: { actual: 3.5, forecast: 3.2, previous: 3.2 },
        headlineCpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 }
      }
    },
    cool: {
      title: 'CPI Cool (Dovish Surge)',
      inputs: {
        coreCpiMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
        coreCpiYoY: { actual: 2.9, forecast: 3.2, previous: 3.2 },
        headlineCpiMoM: { actual: 0.0, forecast: 0.2, previous: 0.2 }
      }
    },
    inline: {
      title: 'CPI In-Line (Konsensus)',
      inputs: {
        coreCpiMoM: { actual: 0.2, forecast: 0.2, previous: 0.2 },
        coreCpiYoY: { actual: 3.1, forecast: 3.1, previous: 3.1 },
        headlineCpiMoM: { actual: 0.2, forecast: 0.2, previous: 0.2 }
      }
    }
  },
  ppi: {
    hot: {
      title: 'PPI Produsen Melonjak',
      inputs: {
        corePpiMoM: { actual: 0.4, forecast: 0.2, previous: 0.1 },
        headlinePpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
        headlinePpiYoY: { actual: 2.6, forecast: 2.3, previous: 2.2 }
      }
    },
    cool: {
      title: 'PPI Mendingin Tajam',
      inputs: {
        corePpiMoM: { actual: 0.0, forecast: 0.2, previous: 0.2 },
        headlinePpiMoM: { actual: -0.1, forecast: 0.2, previous: 0.2 },
        headlinePpiYoY: { actual: 1.9, forecast: 2.3, previous: 2.3 }
      }
    }
  },
  nfp: {
    strong: {
      title: 'NFP Kuat & Pengangguran Turun',
      inputs: {
        payrolls: { actual: 255, forecast: 165, previous: 150 },
        wagesMoM: { actual: 0.4, forecast: 0.3, previous: 0.3 },
        unemployment: { actual: 3.9, forecast: 4.1, previous: 4.1 }
      }
    },
    weak: {
      title: 'NFP Lemah & Pengangguran Naik',
      inputs: {
        payrolls: { actual: 110, forecast: 175, previous: 180 },
        wagesMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
        unemployment: { actual: 4.4, forecast: 4.1, previous: 4.1 }
      }
    },
    mixed: {
      title: 'NFP Mixed Data Conflict',
      inputs: {
        payrolls: { actual: 240, forecast: 170, previous: 160 },
        wagesMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
        unemployment: { actual: 4.4, forecast: 4.1, previous: 4.1 }
      }
    }
  },
  composite: {
    triple_hot: {
      title: '🔥 Triple Hawkish Overheating (Dump Gold)',
      data: {
        cpi: {
          coreCpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
          coreCpiYoY: { actual: 3.5, forecast: 3.2, previous: 3.2 },
          headlineCpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 }
        },
        nfp: {
          payrolls: { actual: 260, forecast: 160, previous: 150 },
          wagesMoM: { actual: 0.4, forecast: 0.3, previous: 0.3 },
          unemployment: { actual: 3.9, forecast: 4.1, previous: 4.1 }
        },
        ppi: {
          corePpiMoM: { actual: 0.4, forecast: 0.2, previous: 0.1 },
          headlinePpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
          headlinePpiYoY: { actual: 2.6, forecast: 2.3, previous: 2.2 }
        }
      }
    },
    triple_cool: {
      title: '❄️ Triple Dovish Pivot (Surge Gold)',
      data: {
        cpi: {
          coreCpiMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
          coreCpiYoY: { actual: 2.8, forecast: 3.2, previous: 3.2 },
          headlineCpiMoM: { actual: 0.0, forecast: 0.2, previous: 0.2 }
        },
        nfp: {
          payrolls: { actual: 105, forecast: 175, previous: 180 },
          wagesMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
          unemployment: { actual: 4.5, forecast: 4.1, previous: 4.1 }
        },
        ppi: {
          corePpiMoM: { actual: 0.0, forecast: 0.2, previous: 0.2 },
          headlinePpiMoM: { actual: -0.1, forecast: 0.2, previous: 0.2 },
          headlinePpiYoY: { actual: 1.8, forecast: 2.3, previous: 2.3 }
        }
      }
    },
    stagflation: {
      title: '⚠️ Stagflation Squeeze (High CPI + Weak Jobs)',
      data: {
        cpi: {
          coreCpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
          coreCpiYoY: { actual: 3.6, forecast: 3.2, previous: 3.2 },
          headlineCpiMoM: { actual: 0.6, forecast: 0.2, previous: 0.2 }
        },
        nfp: {
          payrolls: { actual: 85, forecast: 180, previous: 170 },
          wagesMoM: { actual: 0.2, forecast: 0.3, previous: 0.3 },
          unemployment: { actual: 4.6, forecast: 4.1, previous: 4.1 }
        },
        ppi: {
          corePpiMoM: { actual: 0.5, forecast: 0.2, previous: 0.2 },
          headlinePpiMoM: { actual: 0.6, forecast: 0.2, previous: 0.2 },
          headlinePpiYoY: { actual: 2.8, forecast: 2.3, previous: 2.3 }
        }
      }
    },
    goldilocks: {
      title: '🕊️ Goldilocks Expansion (Strong Jobs + Low CPI)',
      data: {
        cpi: {
          coreCpiMoM: { actual: 0.1, forecast: 0.3, previous: 0.3 },
          coreCpiYoY: { actual: 2.9, forecast: 3.2, previous: 3.2 },
          headlineCpiMoM: { actual: 0.1, forecast: 0.2, previous: 0.2 }
        },
        nfp: {
          payrolls: { actual: 250, forecast: 160, previous: 150 },
          wagesMoM: { actual: 0.2, forecast: 0.3, previous: 0.3 },
          unemployment: { actual: 4.0, forecast: 4.2, previous: 4.2 }
        },
        ppi: {
          corePpiMoM: { actual: 0.1, forecast: 0.2, previous: 0.2 },
          headlinePpiMoM: { actual: 0.0, forecast: 0.2, previous: 0.2 },
          headlinePpiYoY: { actual: 2.0, forecast: 2.3, previous: 2.3 }
        }
      }
    }
  }
};

function applyPreset(presetKey) {
  sfx.playClick();
  const currentTab = TerminalState.activeTab;
  const preset = PRESETS[currentTab]?.[presetKey];
  if (!preset) return;

  if (currentTab === 'composite' && preset.data) {
    ['cpi', 'nfp', 'ppi'].forEach(subTab => {
      const subInputs = preset.data[subTab];
      Object.keys(subInputs).forEach(key => {
        TerminalState.inputs[subTab][key].actual = subInputs[key].actual;
        TerminalState.inputs[subTab][key].forecast = subInputs[key].forecast;
        TerminalState.inputs[subTab][key].previous = subInputs[key].previous;
      });
    });
  } else if (preset.inputs) {
    Object.keys(preset.inputs).forEach(key => {
      TerminalState.inputs[currentTab][key].actual = preset.inputs[key].actual;
      TerminalState.inputs[currentTab][key].forecast = preset.inputs[key].forecast;
      TerminalState.inputs[currentTab][key].previous = preset.inputs[key].previous;
    });
  }

  renderInputs();
  calculateSignals();

  // Inform AI Copilot
  addAiSystemNote(`Trader memuat skenario: "${preset.title}". Sinyal terhitung otomatis.`);
}

// ==========================================
// 8. INTERACTIVE CHEAT SHEET / MATRIX
// ==========================================
const CHEAT_SHEET_DATA = [
  {
    event: 'CPI (Consumer Price Index)',
    sub: 'Core CPI m/m & y/y',
    category: 'inflation',
    schedule: 'Bulanan (Minggu ke-2), 19:30/20:30 WIB',
    focus: 'Core CPI m/m (Menghilangkan komponen volatil energi & pangan). Konsensus deviasi 0.1% sudah memicu pergerakan masif.',
    actualAbove: '🔥 SELL XAUUSD / USD Kuat. The Fed hawkish/tahan suku bunga tinggi. Range: 150 - 350 pips.',
    actualBelow: '🚀 BUY XAUUSD / USD Melemah. Tekanan inflasi turun, ekspektasi rate cut meningkat. Range: 150 - 400 pips.',
    trapNote: 'Waspada spike bolak-balik 30 detik pertama. Seringkali algoritma memicu fakeout sebelum arah tren sebenarnya berjalan.'
  },
  {
    event: 'NFP (Non-Farm Payrolls)',
    sub: 'Jobs, Wages & Unemployment',
    category: 'labor',
    schedule: 'Jumat Pertama Tiap Bulan, 19:30/20:30 WIB',
    focus: 'Kombinasi 3 data: Jumlah Payrolls (K), Tingkat Upah (% m/m), dan Unemployment Rate (%).',
    actualAbove: '📉 SELL XAUUSD jika Payrolls & Upah naik serta Unemployment turun. Pasar tenaga kerja terlalu panas.',
    actualBelow: '📈 BUY XAUUSD jika Payrolls & Upah anjlok serta Unemployment naik tajam. Tanda resesi/pendinginan ekonomi.',
    trapNote: 'Hati-hati jika data bertentangan (misal NFP naik tapi Unemployment ikut naik)! Akan terjadi whipsaw parah, no trade zone.'
  },
  {
    event: 'PPI (Producer Price Index)',
    sub: 'Core PPI m/m',
    category: 'inflation',
    schedule: 'Bulanan (Sehari sebelum/setelah CPI), 19:30/20:30 WIB',
    focus: 'Indikator awal inflasi tingkat produsen (leading indicator sebelum diteruskan ke harga konsumen CPI).',
    actualAbove: '🔻 SELL XAUUSD / USD Kuat. Biaya produksi naik mengindikasikan CPI bulan depan berpotensi tinggi.',
    actualBelow: '🟢 BUY XAUUSD / USD Lemah. Tekanan biaya pabrik mereda mengonfirmasi disinflasi.',
    trapNote: 'Volatilitas PPI sedikit di bawah CPI, namun jika terjadi deviasi ekstrim (>0.3%), dampaknya setara CPI.'
  }
];

function renderCheatSheet() {
  const container = document.getElementById('cheatSheetTableBody');
  if (!container) return;

  const query = TerminalState.searchQuery.toLowerCase();
  const cat = TerminalState.selectedCategory;

  const filtered = CHEAT_SHEET_DATA.filter(item => {
    const matchCat = cat === 'all' || item.category === cat;
    const matchQuery = item.event.toLowerCase().includes(query) ||
      item.focus.toLowerCase().includes(query) ||
      item.actualAbove.toLowerCase().includes(query) ||
      item.actualBelow.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-sage/70">Tidak ada data rilis berita yang sesuai dengan filter pencarian.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(row => {
    html += `
      <tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition group">
        <td class="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
          <div class="text-sm font-bold text-mint">${row.event}</div>
          <div class="text-xs text-[var(--text-muted)]">${row.sub}</div>
          <div class="text-[11px] text-[var(--text-muted)] mt-1">${row.schedule}</div>
        </td>
        <td class="py-3.5 px-4 text-xs text-[var(--text-secondary)] max-w-xs">
          ${row.focus}
        </td>
        <td class="py-3.5 px-4 text-xs text-[var(--text-primary)] bg-[#135C3A]/20 group-hover:bg-[#135C3A]/35 transition max-w-xs font-mono">
          ${row.actualAbove}
        </td>
        <td class="py-3.5 px-4 text-xs text-mint bg-mint/10 group-hover:bg-mint/15 transition max-w-xs font-mono">
          ${row.actualBelow}
        </td>
        <td class="py-3.5 px-4 text-xs text-[var(--text-primary)] max-w-xs">
          <div class="p-2 rounded bg-pine border border-forest">
            ${row.trapNote}
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

// ==========================================
// 9. AI TRADING ASSISTANT (COPILOT)
// ==========================================
function addAiMessage(text, isUser = false) {
  const chatContainer = document.getElementById('aiChatMessages');
  if (!chatContainer) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  TerminalState.chatMessages.push({
    sender: isUser ? 'user' : 'ai',
    time: timeStr,
    text: text
  });

  const msgDiv = document.createElement('div');
  msgDiv.className = `p-3 text-xs leading-relaxed transition ${isUser ? 'chat-msg-user ml-6 self-end' : 'chat-msg-ai mr-6 self-start'}`;

  // Formatter for markdown-like bold and bullet points
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n- /g, '<br/>• ');

  msgDiv.innerHTML = `
    <div class="flex items-center justify-between mb-1 text-[10px] opacity-70">
      <span class="font-bold uppercase tracking-wider">${isUser ? 'Trader' : '🤖 AI Copilot'}</span>
      <span>${timeStr}</span>
    </div>
    <div>${formatted}</div>
  `;

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addAiSystemNote(note) {
  const chatContainer = document.getElementById('aiChatMessages');
  if (!chatContainer) return;

  const noteDiv = document.createElement('div');
  noteDiv.className = 'chat-system-note';
  noteDiv.textContent = `ℹ️ ${note}`;
  chatContainer.appendChild(noteDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleUserPrompt(promptText) {
  sfx.playClick();
  addAiMessage(promptText, true);

  // Show typing indicator
  const chatContainer = document.getElementById('aiChatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'aiTypingIndicator';
  typingDiv.className = 'p-2 text-[11px] text-[#2FA36A] italic font-mono animate-pulse';
  typingDiv.textContent = 'AI Copilot sedang menganalisis matriks pasar...';
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  setTimeout(() => {
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.remove();

    generateAiResponse(promptText);
  }, 600);
}

function generateAiResponse(promptText) {
  const currentTab = TerminalState.activeTab.toUpperCase();
  const analysis = TerminalState.analysis;
  const q = promptText.toLowerCase();

  let response = '';

  if (q.includes('komposit') || q.includes('gabungan') || q.includes('all-in-one') || q.includes('nfp cpi ppi')) {
    const comp = TerminalState.compositeAnalysis;
    response = `**Analisis Komposit Makro AS Gabungan (NFP + CPI + PPI):**\n` +
      `- **Rezim Makro Terdeteksi:** ${comp ? comp.regime : 'Memuat...'}\n` +
      `- **Sinyal Agregat XAUUSD:** ${comp ? comp.signal : 'Memuat...'} (Skor Keyakinan: ${comp ? comp.strengthPercent : 50}%)\n` +
      `- **Kontribusi 3 Pilar Makroekonomi:**\n` +
      `  • **CPI Konsumen (Bobot 40%):** ${comp && comp.cpiScore > 0 ? '+' : ''}${comp ? comp.cpiScore.toFixed(1) : 0} pts (${comp && comp.cpiScore >= 0 ? 'Hawkish/Tekan Emas (SELL)' : 'Dovish/Bantu Emas (BUY)'})\n` +
      `  • **NFP Tenaga Kerja (Bobot 35%):** ${comp && comp.nfpScore > 0 ? '+' : ''}${comp ? comp.nfpScore.toFixed(1) : 0} pts (${comp && comp.nfpScore >= 0 ? 'Hawkish/Tekan Emas (SELL)' : 'Dovish/Bantu Emas (BUY)'})\n` +
      `  • **PPI Produsen (Bobot 25%):** ${comp && comp.ppiScore > 0 ? '+' : ''}${comp ? comp.ppiScore.toFixed(1) : 0} pts (${comp && comp.ppiScore >= 0 ? 'Hawkish/Tekan Emas (SELL)' : 'Dovish/Bantu Emas (BUY)'})\n\n` +
      `- **Sintesis Makro & Transmisi The Fed:**\n` +
      `  ${comp ? comp.synthesisText : ''}\n\n` +
      `*Implikasi Eksekusi:* Indikator agregat ini menjadi acuan utama bias mingguan/bulanan. Ketika ketiga rilis searah (*Triple Alignment*), probabilitas keberhasilan swing trading XAUUSD mencapai di atas 85%.`;

  } else if (q.includes('input saat ini') || q.includes('analisis skenario') || q.includes('data saat ini')) {
    const breakdownSummary = analysis.breakdown
      ? analysis.breakdown.map(b => `${b.name}: ${b.dev > 0 ? '+' : ''}${b.dev.toFixed(2)}${b.unit} (${b.impact})`).join(', ')
      : '-';

    response = `**Analisis Input Terminal Aktif (${currentTab}):**\n` +
      `- **Sinyal Terdeteksi:** ${analysis.signal} (Kekuatan: ${analysis.strengthPercent}%)\n` +
      `- **Rincian Komponen:** ${breakdownSummary}\n` +
      `- **Logika Makro:** ${analysis.rationale}\n` +
      `- **Rekomendasi Eksekusi:** ${analysis.executionAdvice}\n` +
      `*Peringatan Risiko:* Jangan masuk posisi market order pada menit ke 0-5 pasca rilis! Tunggu spread kembali ke rata-rata normal (10-25 points).`;

  } else if (q.includes('mixed data') || q.includes('skenario nfp')) {
    response = `**Protokol Skenario NFP Mixed Data:**\n` +
      `1. **Karakteristik:** Terjadi ketika jumlah NFP rilis melonjak tinggi (>200k), tetapi angka Unemployment Rate justru naik (misal dari 4.0% ke 4.3%), atau Average Hourly Earnings mendingin drastis.\n` +
      `2. **Dampak pada Emas:** Algoritma HFT (High-Frequency Trading) akan menembakkan order berlawanan dalam hitungan milidetik. Menghasilkan *wick candle* ekstrim di kedua sisi (atas dan bawah) tanpa kelanjutan tren.\n` +
      `3. **Tindakan Trader Bijak:** Jangan mencoba menebak arah (*NO TRADE*). Tunggu pembentukan Support/Resistance valid di chart M15 setelah menit ke-20 pasca rilis.`;

  } else if (q.includes('spread') || q.includes('melebar')) {
    response = `**Mengapa Spread Emas Melebar Tajam Saat Rilis Berita?**\n` +
      `- **Penarikan Likuiditas (Liquidity Pullback):** Menjelang rilis high impact (CPI/NFP), institusi besar (Tier-1 Liquidity Providers seperti JPMorgan, Deutsche Bank) menarik order limit di orderbook untuk menghindari kerugian volatilitas tak terduga.\n` +
      `- **Kesenjangan Bid-Ask:** Karena tipisnya volume yang tersedia di buku order, selisih harga beli (Ask) dan harga jual (Bid) bisa melebar dari normalnya $0.15 - $0.25 menjadi $2.00 - $5.00+ (20-50 pips)!\n` +
      `- **Bahaya:** Jika Anda memasang *Stop Loss* ketat atau masuk menggunakan *Market Order*, slippage akan sangat parah dan Anda berisiko terkena Stop Out instan.`;

  } else if (q.includes('dxy') || q.includes('us10y') || q.includes('konfirmasi')) {
    response = `**Cara Konfirmasi Arah DXY dan US10Y Yield:**\n` +
      `- **Korelasi Terbalik Emas & DXY:** Emas dihargakan dalam USD. Jika DXY naik menembus resistance M5 secara agresif, probabilitas SELL XAUUSD mencapai 85%+.\n` +
      `- **Peran US10Y Yield:** Emas tidak memberikan dividen/bunga (*zero-yield asset*). Ketika obligasi AS (US10Y) melonjak, investor institusi lebih memilih memegang surat utang AS, menekan harga Emas.\n` +
      `- **Aturan Emas Confluence:** Masuk posisi HANYA jika DXY dan US10Y bergerak serempak mengonfirmasi deviasi data ekonomi AS. Jika salah satu divergensi (misal DXY naik tapi Yield turun), kurangi ukuran lot sebesar 50%.`;

  } else if (q.includes('pasca 5 menit') || q.includes('strategi entry') || q.includes('risk')) {
    response = `**Strategi Eksekusi Pasca 5 Menit (Golden Rule):**\n` +
      `1. **Menit 0 - 5 (Zona Terlarang):** Biarkan pasar liar melampiaskan spread blowout dan menyapu *stop-hunter*.\n` +
      `2. **Menit 5 - 15 (Fase Retracement):** Amati apakah candle M5 pertama ditutup dengan body tebal searah deviasi data fundamental.\n` +
      `3. **Entry Optimal:** Pasang *Limit Order* pada level Fibonacci 38.2% - 50% atau retest level Support-Become-Resistance (SBR) terdekat.\n` +
      `4. **Stop Loss & Target:** SL 35-50 pips di luar level ekstrem rilis berita. Target minimal 1:2 atau 1:3 Risk-to-Reward.`;

  } else {
    // Contextual macroeconomic response
    response = `Mengenai pertanyaan Anda terkait **"${promptText}"**:\n` +
      `Dalam trading institusional XAUUSD, data ekonomi AS merupakan katalis utama ekspektasi suku bunga Fed Funds Rate. Saat ini terminal berada dalam mode **${currentTab}** dengan sinyal **${analysis.signal}**.\n\n` +
      `Pastikan selalu mengecek status revisi data sebelumnya dan jangan pernah mengambil risiko lebih dari 1-2% modal per transaksi saat sesi rilis berita.`;
  }

  addAiMessage(response, false);
}

// ==========================================
// 10. INITIALIZATION & EVENT BINDINGS
// ==========================================
function initApp() {
  // 1. Theme Setup
  const themeToggle = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeToggleIcon');

  function applyTheme(t) {
    TerminalState.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('xau_theme', t);
    if (themeIcon) {
      themeIcon.textContent = t === 'dark' ? '☀️' : '🌙';
    }
    // Redraw gauge on theme change for appropriate colors
    if (TerminalState.analysis) {
      drawGaugeMeter(TerminalState.analysis.meterValue);
    }
    if (TerminalState.compositeAnalysis) {
      drawGauge('compositeGaugeCanvas', TerminalState.compositeAnalysis.meterValue, 'SELL XAUUSD', 'BUY XAUUSD');
    }
    renderInputs();
  }

  applyTheme(TerminalState.theme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      sfx.playClick();
      applyTheme(TerminalState.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // 2. Sound Toggle
  const soundToggle = document.getElementById('soundToggleBtn');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      TerminalState.soundEnabled = !TerminalState.soundEnabled;
      soundToggle.textContent = TerminalState.soundEnabled ? '🔊 Audio ON' : '🔇 Audio OFF';
      soundToggle.className = TerminalState.soundEnabled ?
        'px-2.5 py-1 text-xs rounded border border-forest text-mint bg-pine font-bold' :
        'px-2.5 py-1 text-xs rounded border border-forest text-[var(--text-muted)] bg-[var(--bg-input)]';
      if (TerminalState.soundEnabled) sfx.playClick();
    });
  }

  // 3. Tab Switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sfx.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      TerminalState.activeTab = target;

      renderPresetButtons();
      renderInputs();
      calculateSignals();
      addAiSystemNote(`Trader beralih ke instrumen berita: **${target.toUpperCase()}**.`);
    });
  });

  // 4. Preset Button Generation
  renderPresetButtons();

  // 6. Test Volatility Alert Toggle
  const testAlertBtn = document.getElementById('testAlertBtn');
  if (testAlertBtn) {
    testAlertBtn.addEventListener('click', () => {
      TerminalState.testAlertActive = !TerminalState.testAlertActive;
      if (TerminalState.testAlertActive) {
        testAlertBtn.textContent = 'Matikan Uji Alert';
        testAlertBtn.classList.add('bg-[#135C3A]', 'text-[#D8E6DF]', 'border-[#2FA36A]');
        sfx.playAlert();
      } else {
        testAlertBtn.textContent = 'Simulasi Uji Alert';
        testAlertBtn.classList.remove('bg-[#135C3A]', 'text-[#D8E6DF]', 'border-[#2FA36A]');
      }
      updateMarketClock();
    });
  }

  // 7. Cheat Sheet Search & Filter
  const searchInput = document.getElementById('cheatSheetSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      TerminalState.searchQuery = e.target.value;
      renderCheatSheet();
    });
  }

  const categoryBtns = document.querySelectorAll('.cheat-cat-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playClick();
      categoryBtns.forEach(b => b.classList.remove('bg-[#135C3A]', 'text-[#D8E6DF]', 'border-[#2FA36A]'));
      btn.classList.add('bg-[#135C3A]', 'text-[#D8E6DF]', 'border-[#2FA36A]');
      TerminalState.selectedCategory = btn.getAttribute('data-category');
      renderCheatSheet();
    });
  });

  // 8. AI Chat Handlers
  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');

  if (aiChatSend && aiChatInput) {
    aiChatSend.addEventListener('click', () => {
      const q = aiChatInput.value.trim();
      if (q) {
        handleUserPrompt(q);
        aiChatInput.value = '';
      }
    });

    aiChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = aiChatInput.value.trim();
        if (q) {
          handleUserPrompt(q);
          aiChatInput.value = '';
        }
      }
    });
  }

  // Quick Prompt Pills
  document.querySelectorAll('.ai-quick-prompt').forEach(pill => {
    pill.addEventListener('click', () => {
      const prompt = pill.getAttribute('data-prompt');
      handleUserPrompt(prompt);
    });
  });

  // Mobile Copilot Drawer Toggle
  const toggleCopilotMobileBtn = document.getElementById('toggleCopilotMobileBtn');
  const aiCopilotSidebar = document.getElementById('aiCopilotSidebar');
  const closeCopilotMobileBtn = document.getElementById('closeCopilotMobileBtn');

  if (toggleCopilotMobileBtn && aiCopilotSidebar) {
    toggleCopilotMobileBtn.addEventListener('click', () => {
      aiCopilotSidebar.classList.toggle('hidden');
      aiCopilotSidebar.classList.toggle('fixed');
      aiCopilotSidebar.classList.toggle('inset-0');
      aiCopilotSidebar.classList.toggle('z-50');
      aiCopilotSidebar.classList.toggle('p-4');
      aiCopilotSidebar.classList.toggle('bg-black/80');
    });
  }

  if (closeCopilotMobileBtn && aiCopilotSidebar) {
    closeCopilotMobileBtn.addEventListener('click', () => {
      aiCopilotSidebar.classList.add('hidden');
      aiCopilotSidebar.classList.remove('fixed', 'inset-0', 'z-50', 'p-4', 'bg-black/80');
    });
  }

  // 9. Initial Renders
  renderInputs();
  calculateSignals();
  renderCheatSheet();

  // 10. Clock Timer Loop (every 1 second)
  setInterval(updateMarketClock, 1000);
  updateMarketClock();
}

function renderPresetButtons() {
  const container = document.getElementById('presetButtonsContainer');
  if (!container) return;

  const currentTab = TerminalState.activeTab;
  const presets = PRESETS[currentTab];
  if (!presets) {
    container.innerHTML = '';
    return;
  }

  let html = '<span class="text-xs text-[var(--text-muted)] font-semibold self-center mr-1">Preset Cepat:</span>';
  Object.keys(presets).forEach(key => {
    const item = presets[key];
    html += `
      <button onclick="applyPreset('${key}')" class="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-mint hover:bg-mint/15 hover:text-mint text-[var(--text-primary)] font-medium transition cursor-pointer shadow-sm">
        ${item.title}
      </button>
    `;
  });

  container.innerHTML = html;
}

// Global expose for inline onclick
window.applyPreset = applyPreset;

// Run on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
