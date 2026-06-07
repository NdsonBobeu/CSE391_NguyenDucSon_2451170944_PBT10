// ==============================
//   INFINITE GALLERY — app.js
//   API: Lorem Picsum (ảnh ngẫu nhiên đẹp, miễn phí)
//   Kỹ thuật: IntersectionObserver (lazy load + infinite scroll)
// ==============================

// ── DOM Elements ──
const galleryEl      = document.getElementById("gallery");
const loadTriggerEl  = document.getElementById("load-trigger");
const loadIndicator  = document.getElementById("load-indicator");
const lightboxEl     = document.getElementById("lightbox");
const lightboxImg    = document.getElementById("lightbox-img");
const lightboxInfo   = document.getElementById("lightbox-info");
const lightboxClose  = document.getElementById("lightbox-close");

// ── State ──
let currentPage  = 1;
const LIMIT      = 20;       // Số ảnh mỗi lần load
let isLoading    = false;    // Tránh gọi API 2 lần cùng lúc
let hasMore      = true;     // Còn ảnh để load không

// ============================================================
//  Gọi API lấy danh sách ảnh (Lorem Picsum)
// ============================================================
async function fetchPhotos(page) {
  const url = `https://picsum.photos/v2/list?page=${page}&limit=${LIMIT}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API lỗi: HTTP ${response.status}`);
  }

  const photos = await response.json();
  return photos;
}

// ============================================================
//  Render ảnh vào gallery
// ============================================================
function renderPhotos(photos) {
  photos.forEach(photo => {
    const item = document.createElement("div");
    item.className = "photo-item";
    item.dataset.id = photo.id;

    // Dùng ảnh nhỏ (400px) để grid, ảnh lớn (full) cho lightbox
    const thumbUrl = `https://picsum.photos/id/${photo.id}/400/400`;
    const fullUrl  = `https://picsum.photos/id/${photo.id}/1200/900`;

    item.innerHTML = `
      <img
        data-src="${thumbUrl}"
        data-full="${fullUrl}"
        data-author="${photo.author}"
        alt="Photo by ${photo.author}"
      />
      <div class="overlay">
        <span class="overlay-title">📷 ${photo.author}</span>
      </div>
    `;

    // Click → mở lightbox
    item.addEventListener("click", () => {
      openLightbox(fullUrl, photo.author, photo.id);
    });

    galleryEl.appendChild(item);

    // Theo dõi ảnh này để lazy-load khi vào viewport
    lazyObserver.observe(item.querySelector("img"));
  });
}

// ============================================================
//  LOAD thêm ảnh (gọi API + render)
// ============================================================
async function loadMorePhotos() {
  if (isLoading || !hasMore) return;  // Guard clause

  isLoading = true;
  loadIndicator.classList.remove("hidden");  // Hiện "Đang tải..."

  try {
    const photos = await fetchPhotos(currentPage);

    if (photos.length === 0) {
      // Hết ảnh rồi
      hasMore = false;
      loadIndicator.innerHTML = "<span>✅ Đã tải hết ảnh!</span>";
      return;
    }

    renderPhotos(photos);
    currentPage++;

  } catch (error) {
    console.error("Lỗi load ảnh:", error);
    loadIndicator.innerHTML = `<span>❌ Lỗi: ${error.message}</span>`;
  } finally {
    isLoading = false;
    if (hasMore) {
      loadIndicator.classList.add("hidden");
    }
  }
}

// ============================================================
//  IntersectionObserver 1: LAZY LOADING ảnh
//  Ảnh chỉ load khi xuất hiện trong viewport
// ============================================================
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;

      if (src) {
        img.src = src;  // Gán src → trình duyệt bắt đầu download ảnh

        // Khi ảnh load xong → thêm class .loaded (fade in)
        img.onload = () => img.classList.add("loaded");

        // Đã load rồi → ngừng theo dõi
        lazyObserver.unobserve(img);
      }
    }
  });
}, {
  rootMargin: "100px",  // Bắt đầu load sớm 100px trước khi vào viewport
});

// ============================================================
//  IntersectionObserver 2: INFINITE SCROLL
//  Khi #load-trigger xuất hiện ở cuối trang → load thêm
// ============================================================
const scrollObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMorePhotos();  // Tự động gọi khi user scroll gần cuối
  }
}, {
  rootMargin: "200px",  // Bắt đầu load sớm 200px trước khi chạm đáy
});

// Bắt đầu theo dõi phần tử trigger
scrollObserver.observe(loadTriggerEl);

// ============================================================
//  LIGHTBOX — Hiện ảnh lớn khi click
// ============================================================
function openLightbox(fullUrl, author, id) {
  lightboxImg.src = fullUrl;
  lightboxImg.alt = `Photo by ${author}`;
  lightboxInfo.textContent = `📷 ${author} · #${id}`;
  lightboxEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";  // Ngăn scroll khi mở lightbox
}

function closeLightbox() {
  lightboxEl.classList.add("hidden");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

// Đóng lightbox
lightboxClose.addEventListener("click", closeLightbox);
lightboxEl.addEventListener("click", (e) => {
  if (e.target === lightboxEl) closeLightbox();  // Click ra ngoài → đóng
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();  // Nhấn Esc → đóng
});

// ============================================================
//  Khởi động: Load 20 ảnh đầu tiên
// ============================================================
loadMorePhotos();
