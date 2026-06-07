// ==============================
//   USER DIRECTORY — app.js
//   Logic chính: kết nối api.js + ui.js
// ==============================

// ── State cục bộ: lưu toàn bộ users đang hiển thị ──
let allUsers = [];        // Tất cả users từ API
let filteredUsers = [];   // Users sau khi lọc (search)

// ── DOM Elements ──
const searchInput   = document.getElementById("search-input");
const addBtn        = document.getElementById("add-btn");
const modalOverlay  = document.getElementById("modal-overlay");
const modalClose    = document.getElementById("modal-close");
const modalTitle    = document.getElementById("modal-title");
const cancelBtn     = document.getElementById("cancel-btn");
const saveBtn       = document.getElementById("save-btn");
const confirmOverlay= document.getElementById("confirm-overlay");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmOk     = document.getElementById("confirm-ok");
const confirmMsg    = document.getElementById("confirm-msg");

// Form fields
const formId       = document.getElementById("form-id");
const formName     = document.getElementById("form-name");
const formUsername = document.getElementById("form-username");
const formEmail    = document.getElementById("form-email");
const formPhone    = document.getElementById("form-phone");
const formCity     = document.getElementById("form-city");
const formWebsite  = document.getElementById("form-website");

// ── Xóa form ──
function clearForm() {
  formId.value = "";
  formName.value = "";
  formUsername.value = "";
  formEmail.value = "";
  formPhone.value = "";
  formCity.value = "";
  formWebsite.value = "";
}

// ── Mở modal ──
function openModal(title) {
  modalTitle.textContent = title;
  modalOverlay.classList.remove("hidden");
  formName.focus();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  clearForm();
}

// ── Đọc data từ form ──
function getFormData() {
  return {
    name:     formName.value.trim(),
    username: formUsername.value.trim(),
    email:    formEmail.value.trim(),
    phone:    formPhone.value.trim(),
    website:  formWebsite.value.trim(),
    address:  { city: formCity.value.trim() },
  };
}

// ── Validate form cơ bản ──
function validateForm(data) {
  if (!data.name)     { alert("Vui lòng nhập Tên!"); return false; }
  if (!data.username) { alert("Vui lòng nhập Username!"); return false; }
  if (!data.email)    { alert("Vui lòng nhập Email!"); return false; }
  return true;
}

// ============================================================
//  READ — Tải danh sách users khi mở app
// ============================================================
async function loadUsers() {
  ui.showLoading();

  try {
    allUsers = await api.getUsers();
    filteredUsers = [...allUsers];
    ui.renderUsers(filteredUsers);
  } catch (error) {
    console.error("Lỗi tải users:", error);
    ui.showError("❌ Không tải được danh sách! Kiểm tra kết nối mạng.");
    ui.userListEl.innerHTML = `<div class="state-message">❌ ${error.message}</div>`;
  }
}

// ============================================================
//  SEARCH — Lọc client-side (không gọi API lại)
// ============================================================
function handleSearch() {
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword) {
    filteredUsers = [...allUsers];
  } else {
    filteredUsers = allUsers.filter(u =>
      u.name.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword) ||
      u.username.toLowerCase().includes(keyword)
    );
  }

  ui.renderUsers(filteredUsers);
}

// ============================================================
//  CREATE — Mở form rỗng, POST lên API
// ============================================================
function handleAddClick() {
  clearForm();
  openModal("➕ Thêm user mới");
}

async function handleCreate(data) {
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Đang lưu...";

    const newUser = await api.createUser(data);

    // JSONPlaceholder trả về id=11 (giả lập)
    // Tạo id giả để không trùng với existing users
    newUser.id = Date.now();

    // Thêm vào local state (không reload trang)
    allUsers.unshift(newUser);
    filteredUsers = [...allUsers];
    ui.renderUsers(filteredUsers);

    closeModal();
    ui.showSuccess("✅ Đã thêm user mới!");
  } catch (error) {
    console.error("Lỗi tạo user:", error);
    ui.showError(`❌ Tạo user thất bại: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Lưu";
  }
}

// ============================================================
//  UPDATE — Điền form sẵn data cũ, PUT lên API
// ============================================================
function handleEdit(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  // Điền form với data hiện tại
  formId.value       = user.id;
  formName.value     = user.name;
  formUsername.value = user.username;
  formEmail.value    = user.email;
  formPhone.value    = user.phone || "";
  formCity.value     = user.address?.city || "";
  formWebsite.value  = user.website || "";

  openModal("✏️ Sửa thông tin user");
}

async function handleUpdate(userId, data) {
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Đang lưu...";

    await api.updateUser(userId, data);

    // Cập nhật local state
    const idx = allUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      allUsers[idx] = { ...allUsers[idx], ...data };
    }
    filteredUsers = [...allUsers];
    ui.renderUsers(filteredUsers);

    closeModal();
    ui.showSuccess("✅ Đã cập nhật thông tin!");
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    ui.showError(`❌ Cập nhật thất bại: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Lưu";
  }
}

// ============================================================
//  DELETE — Confirm dialog → DELETE API → Xóa khỏi UI
// ============================================================
let pendingDeleteId = null;

function handleDelete(userId, userName) {
  pendingDeleteId = userId;
  confirmMsg.textContent = `Bạn có chắc muốn xóa "${userName}" không?`;
  confirmOverlay.classList.remove("hidden");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;

  try {
    confirmOk.disabled = true;
    confirmOk.textContent = "⏳ Đang xóa...";

    await api.deleteUser(pendingDeleteId);

    // Xóa khỏi local state
    allUsers = allUsers.filter(u => u.id !== pendingDeleteId);
    filteredUsers = [...allUsers];
    ui.renderUsers(filteredUsers);

    confirmOverlay.classList.add("hidden");
    pendingDeleteId = null;
    ui.showSuccess("🗑️ Đã xóa user!");
  } catch (error) {
    console.error("Lỗi xóa:", error);
    ui.showError(`❌ Xóa thất bại: ${error.message}`);
  } finally {
    confirmOk.disabled = false;
    confirmOk.textContent = "🗑️ Xóa";
  }
}

// ============================================================
//  Event Listeners
// ============================================================

// Tìm kiếm (lọc real-time khi gõ)
searchInput.addEventListener("input", handleSearch);

// Nút "Thêm user"
addBtn.addEventListener("click", handleAddClick);

// Đóng modal
modalClose.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// Đóng modal khi click ra ngoài
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Lưu form (CREATE hoặc UPDATE tùy có id hay không)
saveBtn.addEventListener("click", () => {
  const data = getFormData();
  if (!validateForm(data)) return;

  const id = formId.value;
  if (id) {
    handleUpdate(Number(id), data); // Có id → UPDATE
  } else {
    handleCreate(data);             // Không có id → CREATE
  }
});

// Confirm xóa
confirmOk.addEventListener("click", confirmDelete);
confirmCancel.addEventListener("click", () => {
  confirmOverlay.classList.add("hidden");
  pendingDeleteId = null;
});

// ── Khởi động app ──
loadUsers();
