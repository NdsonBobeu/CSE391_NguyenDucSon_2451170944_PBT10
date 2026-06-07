// ==============================
//   WEATHER APP — app.js
//   API: Open-Meteo (miễn phí, không cần key)
//        + Geocoding API để tìm lat/lon từ tên thành phố
// ==============================

// ── DOM Elements ──
const cityInput     = document.getElementById("city-input");
const searchBtn     = document.getElementById("search-btn");
const resultArea    = document.getElementById("result-area");
const historySection= document.getElementById("history-section");
const historyList   = document.getElementById("history-list");

// ── LocalStorage key ──
const HISTORY_KEY = "weather_history";

// ── Biến lưu thành phố đang tìm (dùng khi retry) ──
let lastCity = "";

// ============================================================
//  BƯỚC 1: Lấy tọa độ (lat, lon) từ tên thành phố
//  Dùng Open-Meteo Geocoding API (miễn phí)
// ============================================================
async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=vi&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding lỗi: HTTP ${response.status}`);
  }

  const data = await response.json();

  // Nếu không tìm thấy kết quả nào
  if (!data.results || data.results.length === 0) {
    throw new Error(`Không tìm thấy thành phố "${cityName}". Hãy thử tên tiếng Anh!`);
  }

  // Trả về thông tin city đầu tiên tìm được
  const city = data.results[0];
  return {
    name:      city.name,
    country:   city.country,
    latitude:  city.latitude,
    longitude: city.longitude,
  };
}

// ============================================================
//  BƯỚC 2: Lấy thời tiết từ lat/lon
//  Dùng Open-Meteo Forecast API (miễn phí)
// ============================================================
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API lỗi: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ============================================================
//  Helper: Chuyển weather_code → mô tả + icon
// ============================================================
function getWeatherInfo(code) {
  const map = {
    0:  { desc: "Trời quang đãng",         icon: "☀️" },
    1:  { desc: "Chủ yếu quang đãng",      icon: "🌤️" },
    2:  { desc: "Có mây rải rác",           icon: "⛅" },
    3:  { desc: "Nhiều mây",                icon: "☁️" },
    45: { desc: "Có sương mù",              icon: "🌫️" },
    48: { desc: "Sương mù đóng băng",       icon: "🌫️" },
    51: { desc: "Mưa phùn nhẹ",             icon: "🌦️" },
    53: { desc: "Mưa phùn vừa",             icon: "🌦️" },
    55: { desc: "Mưa phùn dày",             icon: "🌧️" },
    61: { desc: "Mưa nhỏ",                  icon: "🌧️" },
    63: { desc: "Mưa vừa",                  icon: "🌧️" },
    65: { desc: "Mưa to",                   icon: "🌧️" },
    71: { desc: "Tuyết nhẹ",               icon: "🌨️" },
    73: { desc: "Tuyết vừa",               icon: "❄️" },
    75: { desc: "Tuyết dày",               icon: "❄️" },
    80: { desc: "Mưa rào nhẹ",             icon: "🌦️" },
    81: { desc: "Mưa rào vừa",             icon: "🌧️" },
    82: { desc: "Mưa rào nặng",            icon: "⛈️" },
    95: { desc: "Giông bão",               icon: "⛈️" },
    99: { desc: "Giông bão kèm mưa đá",    icon: "⛈️" },
  };
  return map[code] ?? { desc: "Không xác định", icon: "🌡️" };
}

// ============================================================
//  UI — Hiển thị 3 states
// ============================================================

// STATE 1: LOADING
function showLoading() {
  resultArea.innerHTML = `
    <div class="loading-card">
      <div class="spinner"></div>
      <p>⏳ Đang tải thời tiết...</p>
    </div>
  `;
}

// STATE 2: SUCCESS
function showWeather(cityInfo, weatherData) {
  const cw       = weatherData.current_weather;
  const hourly   = weatherData.hourly;
  const info     = getWeatherInfo(cw.weathercode);

  // Lấy độ ẩm của giờ hiện tại (index 0)
  const humidity = hourly.relativehumidity_2m[0];
  const wind     = cw.windspeed;

  resultArea.innerHTML = `
    <div class="weather-card">
      <div class="weather-city">📍 ${cityInfo.name}, ${cityInfo.country}</div>
      <div class="weather-temp-row">
        <span class="weather-temp">${Math.round(cw.temperature)}°C</span>
        <span class="weather-icon">${info.icon}</span>
      </div>
      <div class="weather-desc">${info.desc}</div>
      <div class="weather-details">
        <div class="detail-box">
          <div class="detail-label">💧 Độ ẩm</div>
          <div class="detail-value">${humidity}%</div>
        </div>
        <div class="detail-box">
          <div class="detail-label">💨 Gió</div>
          <div class="detail-value">${wind} km/h</div>
        </div>
      </div>
    </div>
  `;
}

// STATE 3: ERROR
function showError(message) {
  resultArea.innerHTML = `
    <div class="error-card">
      <div class="error-icon">❌</div>
      <p>${message}</p>
      <button class="retry-btn" onclick="searchWeather('${lastCity}')">🔄 Thử lại</button>
    </div>
  `;
}

// ============================================================
//  LocalStorage — Lưu & hiển thị lịch sử
// ============================================================

function getHistory() {
  // Đọc từ localStorage, nếu chưa có thì trả về mảng rỗng
  return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
}

function saveToHistory(cityName) {
  let history = getHistory();

  // Xóa nếu thành phố đã có trong lịch sử (tránh trùng)
  history = history.filter(c => c.toLowerCase() !== cityName.toLowerCase());

  // Thêm vào đầu mảng
  history.unshift(cityName);

  // Chỉ giữ tối đa 5 thành phố gần nhất
  history = history.slice(0, 5);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historySection.style.display = "none";
    return;
  }

  historySection.style.display = "block";
  historyList.innerHTML = history.map(city => `
    <button class="history-chip" onclick="searchWeather('${city}')">
      ${city}
    </button>
  `).join("");
}

// ============================================================
//  HÀM CHÍNH: Tìm kiếm thời tiết
// ============================================================
async function searchWeather(cityName) {
  // Nếu không truyền city → lấy từ input
  if (!cityName) {
    cityName = cityInput.value.trim();
  }

  if (!cityName) {
    alert("Vui lòng nhập tên thành phố!");
    return;
  }

  lastCity = cityName;
  cityInput.value = cityName;

  // 1. Hiện LOADING state
  showLoading();

  try {
    // 2. Gọi Geocoding API để lấy lat/lon
    const cityInfo = await geocodeCity(cityName);

    // 3. Gọi Weather API với lat/lon vừa tìm được
    const weatherData = await fetchWeather(cityInfo.latitude, cityInfo.longitude);

    // 4. Hiện SUCCESS state
    showWeather(cityInfo, weatherData);

    // 5. Lưu vào lịch sử
    saveToHistory(cityInfo.name);
    renderHistory();

  } catch (error) {
    // 6. Hiện ERROR state nếu có lỗi
    console.error("Lỗi khi lấy thời tiết:", error);
    showError(error.message);
  }
}

// ============================================================
//  Event Listeners
// ============================================================

// Click nút Tìm
searchBtn.addEventListener("click", () => searchWeather());

// Nhấn Enter trong input
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchWeather();
});

// ============================================================
//  Khởi động app
// ============================================================
renderHistory(); // Hiện lịch sử đã lưu từ trước

// Tự động tìm Hà Nội khi mở lần đầu
searchWeather("Hanoi");
