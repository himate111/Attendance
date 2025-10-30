// ---------------- HELPERS ----------------
const formatDateTime = dateStr => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

const formatDate = dateStr => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
};

// ---------------- FETCH LEAVE REQUESTS ----------------
const fetchRequests = async () => {
  try {
    const role = localStorage.getItem("role");
    if (!role || role !== "admin") {
      alert("Access denied!");
      window.location.href = "/html/login.html";
      return;
    }

    const res = await fetch(`http://localhost:3000/leave-requests?role=admin`);
    if (!res.ok) throw new Error("Failed to load leave requests");

    const requests = await res.json();

    const tbody = document.querySelector("#requestsTable tbody");
    tbody.innerHTML = "";

    if (!requests.length) {
      tbody.innerHTML = "<tr><td colspan='8'>No leave requests found</td></tr>";
      return;
    }

    requests.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.worker_id}</td>
        <td>${r.reason}</td>
        <td>${formatDate(r.from_date)}</td>
        <td>${formatDate(r.to_date)}</td>
        <td>${r.status}</td>
        <td>${formatDateTime(r.request_date)}</td>
        <td>
          <button class="approve" onclick="updateRequest(${r.id}, 'Approved')">Approve</button>
          <button class="reject" onclick="updateRequest(${r.id}, 'Rejected')">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    const tbody = document.querySelector("#requestsTable tbody");
    tbody.innerHTML = "<tr><td colspan='8'>Failed to load leave requests</td></tr>";
  }
};

// ---------------- UPDATE REQUEST ----------------
const updateRequest = async (id, status) => {
  try {
    const res = await fetch(`http://localhost:3000/leave-requests/${id}?role=admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Request updated");
      fetchRequests();
    } else {
      alert(data.error || "Failed to update request");
    }
  } catch (err) {
    alert("Error updating request: " + err.message);
  }
};

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  if (!role || role !== "admin") {
    alert("Access denied!");
    window.location.href = "/html/login.html";
    return;
  }

  fetchRequests();
});
