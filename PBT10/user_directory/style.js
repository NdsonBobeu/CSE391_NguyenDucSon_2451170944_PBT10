// ==============================
//   USER DIRECTORY — ui.js
//   Tầng UI: chịu trách nhiệm render HTML
//   Không gọi API trực tiếp ở đây
// ==============================

// Màu avatar ngẫu nhiên theo id
const AVATAR_COLORS = [
  "#4f46e5","#e53e3e","#38a169","#d69e2e",
  "#3182ce","#805ad5","#dd6b20","#319795",
];

function getAvatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const ui = {
  userListEl: document.getElementById("user-list"),
  toastEl:    document.getElementById("toast"),
  toastTimer: null,

  // ── Render danh sách users ──
  renderUsers(users) {
    if (users.length === 0) {
      this.userListEl.innerHTML = `
        <div class="state-message">😢 Không tìm thấy user nào.</div>
      `;
      return;
    }

    this.userListEl.innerHTML = users.map(user => `
      <div class="user-card" data-id="${user.id}">
        <div class="user-avatar" style="background:${getAvatarColor(user.id)}">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div class="user-name">${user.name}</div>
        <div class="user-username">@${user.username}</div>
        <div class="user-info"><span>📧</span>${user.email}</div>
        ${user.phone ? `<div class="user-info"><span>📞</span>${user.phone}</div>` : ""}
        ${user.address?.city ? `<div class="user-info"><span>📍</span>${user.address.city}</div>` : ""}
        <div class="user-actions">
          <button class="btn btn-secondary btn-sm" onclick="handleEdit(${user.id})">✏️ Sửa</button>
          <button class="btn btn-danger btn-sm"    onclick="handleDelete(${user.id}, '${user.name}')">🗑️ Xóa</button>
        </div>
      </div>
    `).join("");
  },

  // ── Skeleton loading (hiện khi đang fetch) ──
  showLoading() {
    this.userListEl.innerHTML = Array(6).fill(`
      <div class="skeleton-card">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line" style="width:70%"></div>
        <div class="skeleton-line" style="width:45%"></div>
        <div class="skeleton-line" style="width:85%"></div>
        <div class="skeleton-line" style="width:60%"></div>
      </div>
    `).join("");
  },

  hideLoading() {
    // renderUsers() sẽ ghi đè nội dung — không cần làm gì thêm
  },

  // ── Toast notifications ──
  showSuccess(message) {
    this._showToast(message, "success");
  },

  showError(message) {
    this._showToast(message, "error");
  },

  _showToast(message, type) {
    this.toastEl.textContent = message;
    this.toastEl.className = `toast ${type} show`;

    // Tự ẩn sau 3 giây
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.className = "toast";
    }, 3000);
  },
};
