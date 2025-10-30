// ---------------- HELPERS ----------------
const formatTime = dateStr => {
  if (!dateStr) return "-";
  const d = new Date(dateStr); 
  return d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit" // Added seconds in display
  });
};

// Get IST datetime for MySQL
function formatDateTimeForMySQL(date) {
  const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.toISOString().slice(0, 19).replace("T", " ");
}

const toISTDateString = dateStr => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); 
};

const getTodayIST = () => {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

// ---------------- CALCULATE HOURS WORKED ----------------
const computeHoursWorked = (checkin, checkout) => {
  if (!checkin || !checkout) return null;

  let start = new Date(checkin).getTime();
  let end = new Date(checkout).getTime();
  let diff = end - start;
  if (diff < 0) diff = 0;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { hours, minutes, seconds };
};

const formatDuration = duration => {
  if (!duration) return "-";
  return `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`;
};

// ---------------- DETERMINE ATTENDANCE STATUS ----------------
const getAttendanceClass = record => {
  if (!record.checkin_time) return "pending";
  if (!record.checkout_time) return "pending";

  const [startHour, startMinute] = record.shift_start ? record.shift_start.split(":").map(Number) : [9, 0];
  const [endHour, endMinute] = record.shift_end ? record.shift_end.split(":").map(Number) : [17, 0];

  const shiftStart = new Date(toISTDateString(record.work_date) + "T00:00:00");
  shiftStart.setHours(startHour, startMinute, 0, 0);

  const shiftEnd = new Date(toISTDateString(record.work_date) + "T00:00:00");
  shiftEnd.setHours(endHour, endMinute, 0, 0);

  const checkin = new Date(record.checkin_time);
  const checkout = new Date(record.checkout_time);

  if (checkin > shiftStart) return "late";
  if (checkout < shiftEnd) return "early";
  return "on-time";
};

// ---------------- DAILY RECORD CLEANUP ----------------
const getDailyRecords = data => {
  const map = {};
  data.forEach(r => {
    const dateKey = toISTDateString(r.work_date) + r.worker_id;
    if (!map[dateKey]) map[dateKey] = { ...r };
    else {
      if (r.checkin_time && (!map[dateKey].checkin_time || new Date(r.checkin_time) < new Date(map[dateKey].checkin_time))) {
        map[dateKey].checkin_time = r.checkin_time;
        map[dateKey].status = r.status;
      }
      if (r.checkout_time && (!map[dateKey].checkout_time || new Date(r.checkout_time) > new Date(map[dateKey].checkout_time))) {
        map[dateKey].checkout_time = r.checkout_time;
      }
    }
  });
  return Object.values(map).sort((a, b) => new Date(b.work_date) - new Date(a.work_date));
};

// ---------------- GLOBALS ----------------
let allData = [];
let hoursChartInstance, lateChartInstance, trendChartInstance;

// ---------------- TABLE RENDER ----------------
const renderTable = data => {
  const tableBody = document.getElementById("reportTableBody");
  const filteredData = getDailyRecords(data);

  if (!filteredData.length) {
    tableBody.innerHTML = "<tr><td colspan='7'>No records found</td></tr>";
    return;
  }

  tableBody.innerHTML = "";
  filteredData.forEach(record => {
    const tr = document.createElement("tr");
    const cls = getAttendanceClass(record);
    tr.classList.add(cls);

    const duration = computeHoursWorked(record.checkin_time, record.checkout_time);
    const hoursDisplay = formatDuration(duration);

    let statusDisplay = "Pending";
    if (record.checkin_time && record.checkout_time) {
      statusDisplay = cls === "late" ? "Late" : cls === "early" ? "Early" : "On-Time";
    }

    tr.innerHTML = `
      <td>${record.worker_id || "-"}</td>
      <td>${record.job || "-"}</td>
      <td>${record.work_date ? toISTDateString(record.work_date) : "-"}</td>
      <td>${formatTime(record.checkin_time)}</td>
      <td>${formatTime(record.checkout_time)}</td>
      <td>${hoursDisplay}</td>
      <td>${statusDisplay}</td>
    `;
    tableBody.appendChild(tr);
  });
};

// ---------------- FETCH REPORT ----------------
const fetchReport = async () => {
  try {
    const role = localStorage.getItem("role");
    let query = role === "worker" ? new URLSearchParams({ role, worker_id: localStorage.getItem("worker_id") }) : new URLSearchParams({ role });
    const res = await fetch(`http://localhost:3000/report?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    allData = await res.json();
    renderTable(allData);
    renderAnalytics(allData);
  } catch (err) {
    console.error(err);
    document.getElementById("reportTableBody").innerHTML = "<tr><td colspan='7'>Failed to load report</td></tr>";
  }
};

// ---------------- FILTER BY DATE ----------------
const filterByDate = selectedDate => {
  if (!selectedDate) return renderTable(allData);
  const filtered = allData.filter(r => r.work_date && toISTDateString(r.work_date) === selectedDate);
  renderTable(filtered);
  renderAnalytics(filtered);
};

// ---------------- USER MANAGEMENT ----------------
const fetchUsers = async () => {
  const role = localStorage.getItem("role");
  const res = await fetch(`http://localhost:3000/users?role=${role}`);
  const users = await res.json();
  renderUsers(users);
};

const renderUsers = users => {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.worker_id}</td>
      <td>${u.worker_id}</td>
      <td>${u.role}</td>
      <td><button onclick="deleteUser('${u.worker_id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
};

const addUser = async ({ name, password, role }) => {
  try {
    const res = await fetch(`http://localhost:3000/users?role=admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id: name, password, role })
    });
    if (!res.ok) throw new Error("Failed to add user");
    await res.json();
    fetchUsers();
  } catch (err) {
    alert(err.message);
  }
};

const deleteUser = async id => {
  try {
    const res = await fetch(`http://localhost:3000/users/${id}?role=admin`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user");
    await res.json();
    fetchUsers();
  } catch (err) {
    alert(err.message);
  }
};

// ---------------- LEAVE REQUESTS ----------------
const fetchRequests = async () => {
  try {
    const res = await fetch("http://localhost:3000/leave-requests?role=admin");
    if (!res.ok) throw new Error("Failed to load");
    const requests = await res.json();

    const tbody = document.querySelector("#requestsTable tbody");
    tbody.innerHTML = "";

    requests.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.id}</td>
        <td>${r.worker_id}</td>
        <td>${r.reason || "-"}</td>
        <td>${r.from_date || "-"}</td>
        <td>${r.to_date || "-"}</td>
        <td>${r.status || "-"}</td>
        <td>
          <button onclick="updateRequest(${r.id}, 'Approved')">Approve</button>
          <button onclick="updateRequest(${r.id}, 'Rejected')">Reject</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load leave requests");
  }
};

const updateRequest = async (id, status) => {
  try {
    const res = await fetch(`http://localhost:3000/leave-requests/${id}?role=admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchRequests();
    } else {
      alert(data.error || "Failed to update request");
    }
  } catch (err) {
    alert("Error updating request: " + err.message);
  }
};

// ---------------- ANALYTICS ----------------
const renderAnalytics = data => {
  const dailyData = getDailyRecords(data);
  const workerLabels = [...new Set(dailyData.map(r => r.worker_id))];

  const hoursMap = {};
  dailyData.forEach(r => {
    const hrs = computeHoursWorked(r.checkin_time, r.checkout_time);
    if (hrs !== null) hoursMap[r.worker_id] = (hoursMap[r.worker_id] || 0) + ((hrs.hours || 0) + (hrs.minutes || 0)/60 + (hrs.seconds || 0)/3600);
  });
  const totalHours = workerLabels.map(w => hoursMap[w] || 0);

  if (hoursChartInstance) hoursChartInstance.destroy();
  const hoursCtx = document.getElementById("hoursChart").getContext("2d");
  hoursChartInstance = new Chart(hoursCtx, {
    type: "bar",
    data: { labels: workerLabels, datasets: [{ label: "Total Hours", data: totalHours, backgroundColor: "blue" }] }
  });

  const lateMap = {};
  dailyData.forEach(r => {
    const cls = getAttendanceClass(r);
    if (cls === "late") lateMap[r.worker_id] = (lateMap[r.worker_id] || 0) + 1;
  });
  const lateCounts = workerLabels.map(w => lateMap[w] || 0);

  if (lateChartInstance) lateChartInstance.destroy();
  const lateCtx = document.getElementById("lateChart").getContext("2d");
  lateChartInstance = new Chart(lateCtx, {
    type: "bar",
    data: { labels: workerLabels, datasets: [{ label: "Late Arrivals", data: lateCounts, backgroundColor: "red" }] }
  });

  const trendMap = {};
  dailyData.forEach(r => {
    const day = toISTDateString(r.work_date);
    trendMap[day] = (trendMap[day] || 0) + 1;
  });
  const trendLabels = Object.keys(trendMap);
  const trendCounts = Object.values(trendMap);

  if (trendChartInstance) trendChartInstance.destroy();
  const trendCtx = document.getElementById("trendChart").getContext("2d");
  trendChartInstance = new Chart(trendCtx, {
    type: "line",
    data: { labels: trendLabels, datasets: [{ label: "Check-ins", data: trendCounts, fill: false, borderColor: "green" }] }
  });
};

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  if (!role || (role !== "admin" && role !== "supervisor")) {
    alert("Access denied!");
    window.location.href = "/html/login.html";
    return;
  }

  const reportDateInput = document.getElementById("reportDate");
  if (reportDateInput) {
    reportDateInput.value = getTodayIST();
    reportDateInput.addEventListener("change", e => filterByDate(e.target.value));
  }

  fetchReport();

  if (role === "admin") {
    if (document.getElementById("userManagement")) {
      document.getElementById("userManagement").style.display = "block";
      fetchUsers();
    }

    if (document.getElementById("addUserForm")) {
      document.getElementById("addUserForm").addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const userRole = document.getElementById("roleSelect").value;
        addUser({ name, password, role: userRole });
        e.target.reset();
      });
    }

    if (document.getElementById("requestsTable")) fetchRequests();
  }

  if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("worker_id");
      localStorage.removeItem("role");
      window.location.href = "/html/login.html";
    });
  }
});
