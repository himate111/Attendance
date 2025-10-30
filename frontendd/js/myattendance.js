const worker_id = localStorage.getItem("worker_id");
const role = localStorage.getItem("role");

if (!worker_id || role !== "worker") {
  alert("Access denied. Please login as a worker.");
  window.location.href = "/html/login.html";
}

// ---------------- DATE & TIME FORMATTERS ----------------
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
};

// ---------------- CALCULATE HOURS ----------------
const calculateHoursAndStatus = (checkin, checkout, storedHours, storedStatus) => {
  if (!checkin || !checkout) {
    return { hours: storedHours || "-", status: storedStatus || "-" };
  }
  const checkinTime = new Date(checkin);
  const checkoutTime = new Date(checkout);
  const diffMs = checkoutTime - checkinTime;
  if (diffMs < 0) return { hours: "0.00", status: "Late" };

  const hoursWorked = (diffMs / (1000 * 60 * 60)).toFixed(2);
  const status = hoursWorked >= 8 ? "On time" : "Late";

  return { hours: hoursWorked, status };
};

// ---------------- RENDER ATTENDANCE TABLE ----------------
const renderTable = (data) => {
  const tableBody = document.getElementById("attendanceTableBody");
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='7'>No records found</td></tr>";
    return;
  }

  data.forEach((record) => {
    const { hours, status } = calculateHoursAndStatus(
      record.checkin_time,
      record.checkout_time,
      record.hours_worked,
      record.status
    );

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.worker_id}</td>
      <td>${record.job || "-"}</td>
      <td>${formatDate(record.work_date)}</td>
      <td>${formatTime(record.checkin_time)}</td>
      <td>${formatTime(record.checkout_time)}</td>
      <td>${hours}</td>
      <td class="${status.toLowerCase().replace(" ", "-")}">${status}</td>
    `;
    tableBody.appendChild(tr);
  });
};

// ---------------- FETCH ATTENDANCE ----------------
const fetchAttendance = async () => {
  try {
    const res = await fetch(`http://localhost:3000/attendance/${worker_id}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    renderTable(data);
  } catch (err) {
    console.error(err);
    document.getElementById("attendanceTableBody").innerHTML =
      "<tr><td colspan='7'>Failed to load records</td></tr>";
  }
};

// ---------------- LEAVE REQUEST ----------------
const leaveBtn = document.getElementById("takeLeaveBtn");
const leaveModal = document.getElementById("leaveModal");
const closeModal = document.getElementById("closeModal");
const submitLeave = document.getElementById("submitLeave");

leaveBtn.addEventListener("click", () => (leaveModal.style.display = "block"));
closeModal.addEventListener("click", () => (leaveModal.style.display = "none"));

submitLeave.addEventListener("click", async () => {
  const reason = document.getElementById("reason").value;
  const from_date = document.getElementById("fromDate").value;
  const to_date = document.getElementById("toDate").value;

  if (!reason || !from_date || !to_date) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/leave-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id, reason, from_date, to_date }),
    });
    const data = await res.json();
    alert(data.message);
    leaveModal.style.display = "none";

    // clear form
    document.getElementById("reason").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
  } catch (err) {
    console.error(err);
    alert("Failed to submit leave request.");
  }
});

// Back button
document.getElementById("backBtn").addEventListener("click", () => window.history.back());

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target == leaveModal) leaveModal.style.display = "none";
});

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", fetchAttendance);
