const messageBox = document.getElementById("message");
const tableBody = document.getElementById("usersTableBody");

// Load all users
function loadUsers() {
  fetch("/users")
    .then(res => res.json())
    .then(users => {
      if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No users found</td></tr>`;
        return;
      }

      tableBody.innerHTML = users.map(u => `
        <tr>
          <td>${u.worker_id}</td>
          <td>${u.role || "worker"}</td>
          <td>${u.job || "-"}</td>
          <td>${u.email || "-"}</td>
          <td><button class="delete-btn" onclick="deleteUser('${u.worker_id}')">Delete</button></td>
        </tr>
      `).join("");
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error loading users</td></tr>`;
    });
}

// Add new user
function addUser() {
  const worker_id = document.getElementById("worker_id").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const job = document.getElementById("job").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!worker_id || !password || !role) {
    showMessage("⚠️ Worker ID, Password, and Role are required.", "error");
    return;
  }

  fetch(`/users?role=admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker_id, password, role, job, email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage("✅ User added successfully!", "success");
        clearForm();
        loadUsers();
      } else {
        showMessage("❌ " + (data.error || "Failed to add user."), "error");
      }
    })
    .catch(err => {
      console.error(err);
      showMessage("❌ Network error while adding user.", "error");
    });
}

// Delete user
function deleteUser(worker_id) {
  if (!confirm(`Are you sure you want to delete ${worker_id}?`)) return;

  fetch(`/users/${worker_id}?role=admin`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage("🗑️ User deleted successfully.", "success");
        loadUsers();
      } else {
        showMessage("❌ " + (data.error || "Failed to delete user."), "error");
      }
    })
    .catch(err => {
      console.error(err);
      showMessage("❌ Network error while deleting user.", "error");
    });
}

// Helper: show message
function showMessage(msg, type) {
  messageBox.style.color = type === "success" ? "#00e676" : "#ff5252";
  messageBox.textContent = msg;
  setTimeout(() => (messageBox.textContent = ""), 4000);
}

// Helper: clear form
function clearForm() {
  document.getElementById("worker_id").value = "";
  document.getElementById("password").value = "";
  document.getElementById("role").value = "";
  document.getElementById("job").value = "";
  document.getElementById("email").value = "";
}

// Initial load
loadUsers();
