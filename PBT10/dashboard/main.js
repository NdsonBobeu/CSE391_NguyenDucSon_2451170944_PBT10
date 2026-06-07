// ==============================
//   MULTI-API DASHBOARD — app.js
//   Gọi SONG SONG 4 APIs dùng Promise.allSettled
//   Mỗi widget có trạng thái riêng: loading/success/error
// ==============================

// ── DOM Elements ──
const refreshBtn  = document.getElementById("refresh-btn");
const loadTimeEl  = document.getElementById("load-time");

// Widget body elements
const weatherBody = document.getElementById("weather-body");
const usersBody   = document.getElementById("users-body");
const countryBody = document.getElementById("country-body");
const postsBody   = document.getElementById("posts-body");

// ============================================================
//  HELPER: Tạo skeleton loading cho 1 widget
// ============================================================
function showWidgetLoading(bodyEl, lines = 4) {
  bodyEl.innerHTML = Array(lines).fill(0).map((_, i) => `
    <div class="skeleton-block" style="width:${[90, 60, 75, 45][i % 4]}%"></div>
  `).join("");
}

// ============================================================
//  HELPER: Hiện lỗi cho 1 widget
// ============================================================
function showWidgetError(bodyEl, message) {
  bodyEl.innerHTML = `
    <div class="widget-error">
      ❌ ${message}
    </div>
  `;
}

// ============================================================
//  WEATHER WIDGET: Open-Meteo API (Hà Nội)
// ============================================================
async function fetchWeather() {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=21.03&longitude=105.85&current_weather=true&hourly=relativehumidity_2m&timezone=Asia/Bangkok&forecast_days=1"
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getWeatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  return "⛈️";
}

function renderWeather(data) {
  const cw       = data.current_weather;
  const humidity = data.hourly.relativehumidity_2m[0];
  const emoji    = getWeatherEmoji(cw.weathercode);

  weatherBody.innerHTML = `
    <div class="weather-main">
      <span class="weather-temp-big">${Math.round(cw.temperature)}°</span>
      <div>
        <span class="weather-emoji">${emoji}</span>
        <div class="weather-desc-text">Hà Nội, Việt Nam</div>
      </div>
    </div>
    <div class="weather-stats">
      <span class="stat-pill">💧 Độ ẩm: ${humidity}%</span>
      <span class="stat-pill">💨 Gió: ${cw.windspeed} km/h</span>
      <span class="stat-pill">🕐 ${new Date().toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit"})}</span>
    </div>
  `;
}

// ============================================================
//  USERS WIDGET: Random User API
// ============================================================
async function fetchUsers() {
  const res = await fetch("https://randomuser.me/api/?results=4&nat=us,gb,fr,au");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const AVATAR_COLORS = ["#58a6ff","#3fb950","#d29922","#f85149","#bc8cff"];

function renderUsers(data) {
  const users = data.results;
  usersBody.innerHTML = `
    <div class="user-mini-list">
      ${users.map((u, i) => `
        <div class="user-mini">
          <div class="user-mini-avatar" style="background:${AVATAR_COLORS[i % 5]}">
            ${u.name.first.charAt(0)}
          </div>
          <div class="user-mini-info">
            <div class="user-mini-name">${u.name.first} ${u.name.last}</div>
            <div class="user-mini-email">${u.email}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================================
//  COUNTRY WIDGET: REST Countries API (Vietnam)
// ============================================================
async function fetchCountry() {
  const res = await fetch("https://restcountries.com/v3.1/alpha/vn");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderCountry(data) {
  const country  = data[0];
  const pop      = (country.population / 1_000_000).toFixed(1);
  const area     = country.area.toLocaleString("vi-VN");
  const capital  = country.capital?.[0] ?? "N/A";
  const region   = country.region;
  const currency = Object.values(country.currencies)?.[0]?.name ?? "N/A";
  const lang     = Object.values(country.languages)?.[0] ?? "N/A";
  const timezone = country.timezones?.[0] ?? "N/A";
  const borders  = (country.borders ?? []).join(", ") || "Không có";

  countryBody.innerHTML = `
    <div class="country-grid">
      <div class="country-stat">
        <div class="country-stat-label">🏙️ Thủ đô</div>
        <div class="country-stat-value">${capital}</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">👥 Dân số</div>
        <div class="country-stat-value">${pop}M người</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">🗺️ Diện tích</div>
        <div class="country-stat-value">${area} km²</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">🌏 Khu vực</div>
        <div class="country-stat-value">${region}</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">💰 Tiền tệ</div>
        <div class="country-stat-value">${currency}</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">🗣️ Ngôn ngữ</div>
        <div class="country-stat-value">${lang}</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">🕐 Timezone</div>
        <div class="country-stat-value">${timezone}</div>
      </div>
      <div class="country-stat">
        <div class="country-stat-label">🗾 Giáp biên</div>
        <div class="country-stat-value">${borders}</div>
      </div>
    </div>
  `;
}

// ============================================================
//  POSTS WIDGET: JSONPlaceholder
// ============================================================
async function fetchPosts() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderPosts(posts) {
  postsBody.innerHTML = `
    <div class="posts-list">
      ${posts.map(post => `
        <div class="post-item">
          <div class="post-title">${post.title}</div>
          <div class="post-body">${post.body}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================================
//  HÀM CHÍNH: Load tất cả widgets SONG SONG
//  Dùng Promise.allSettled — 1 API lỗi không ảnh hưởng widget khác
// ============================================================
async function loadDashboard() {
  const startTime = Date.now();
  loadTimeEl.textContent = "";
  refreshBtn.disabled = true;
  refreshBtn.textContent = "⏳ Đang tải...";

  // Hiện skeleton loading cho TẤT CẢ widgets
  showWidgetLoading(weatherBody, 3);
  showWidgetLoading(usersBody, 4);
  showWidgetLoading(countryBody, 3);
  showWidgetLoading(postsBody, 5);

  // Gọi 4 APIs CÙNG LÚC (song song)
  // Promise.allSettled: đợi tất cả xong dù pass hay fail
  const results = await Promise.allSettled([
    fetchWeather(),   // index 0
    fetchUsers(),     // index 1
    fetchCountry(),   // index 2
    fetchPosts(),     // index 3
  ]);

  // Xử lý từng kết quả độc lập
  const [weatherResult, usersResult, countryResult, postsResult] = results;

  // Widget 0: Weather
  if (weatherResult.status === "fulfilled") {
    renderWeather(weatherResult.value);
  } else {
    showWidgetError(weatherBody, `Weather: ${weatherResult.reason.message}`);
  }

  // Widget 1: Users
  if (usersResult.status === "fulfilled") {
    renderUsers(usersResult.value);
  } else {
    showWidgetError(usersBody, `Users: ${usersResult.reason.message}`);
  }

  // Widget 2: Country
  if (countryResult.status === "fulfilled") {
    renderCountry(countryResult.value);
  } else {
    showWidgetError(countryBody, `Country: ${countryResult.reason.message}`);
  }

  // Widget 3: Posts
  if (postsResult.status === "fulfilled") {
    renderPosts(postsResult.value);
  } else {
    showWidgetError(postsBody, `Posts: ${postsResult.reason.message}`);
  }

  // Hiện thời gian fetch
  const elapsed = Date.now() - startTime;
  loadTimeEl.textContent = `✅ Tải xong trong ${elapsed}ms`;
  console.log(`Dashboard loaded in ${elapsed}ms`);

  refreshBtn.disabled = false;
  refreshBtn.textContent = "🔄 Refresh All";
}

// ── Nút Refresh All ──
refreshBtn.addEventListener("click", loadDashboard);

// ── Khởi động ──
loadDashboard();
