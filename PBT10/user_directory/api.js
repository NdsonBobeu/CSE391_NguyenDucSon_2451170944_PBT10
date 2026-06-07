// ==============================
//   USER DIRECTORY — api.js
//   Tầng API: chịu trách nhiệm gọi HTTP
//   Tách riêng để dễ đổi API sau này
// ==============================

const api = {
  baseURL: "https://jsonplaceholder.typicode.com",

  // ── Helper dùng chung: gọi fetch + xử lý lỗi HTTP ──
  async _request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    // fetch() KHÔNG tự throw với 4xx/5xx → phải check thủ công
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // DELETE trả về body rỗng {} → parse bình thường
    return response.json();
  },

  // GET /users — Lấy tất cả users
  async getUsers() {
    return this._request("/users");
  },

  // GET /users/:id — Lấy 1 user theo id
  async getUser(id) {
    return this._request(`/users/${id}`);
  },

  // POST /users — Tạo user mới
  async createUser(data) {
    return this._request("/users", {
      method: "POST",
      body: JSON.stringify(data), // Object → JSON string bắt buộc!
    });
  },

  // PUT /users/:id — Cập nhật toàn bộ thông tin user
  async updateUser(id, data) {
    return this._request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // DELETE /users/:id — Xóa user
  async deleteUser(id) {
    return this._request(`/users/${id}`, {
      method: "DELETE",
    });
  },
};
