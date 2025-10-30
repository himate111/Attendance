// Format time helper
const formatTime = dateStr => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Convert date to YYYY-MM-DD (IST safe)
const toISTDateString = dateStr => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000;
  const ist = new Date(utc + istOffset);

  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get today in IST (YYYY-MM-DD)
const getTodayIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const ist = new Date(utc + istOffset);

  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Render table rows
const renderTable = (data) => {
  const tableBody = document.getElementById("reportTableBody");

  if (!data || data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='7'>No records found</td></tr>";
    return;
  }

  tableBody.innerHTML = "";

  data.forEach(record => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.worker_id || "-"}</td>
      <td>${record.job || "-"}</td>
      <td>${record.work_date ? toISTDateString(record.work_date) : "-"}</td>
      <td>${formatTime(record.checkin_time)}</td>
      <td>${formatTime(record.checkout_time)}</td>
      <td>${record.hours_worked !== null ? Number(record.hours_worked).toFixed(2) : "-"}</td>
      <td>${record.status || "-"}</td>
    `;
    tableBody.appendChild(tr);
  });
};

// Fetch report (supervisor can see all workers)
const fetchReport = async () => {
  try {
    const worker_id = localStorage.getItem("worker_id");
    const role = localStorage.getItem("role");

    if (!worker_id || role !== "supervisor") {
      alert("Access denied. Please login as a supervisor.");
      window.location.href = "/html/login.html";
      return;
    }

    const res = await fetch(`http://localhost:3000/report?role=supervisor`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    renderTable(data);
    return data;
  } catch (err) {
    console.error("Failed to fetch report:", err);
    document.getElementById("reportTableBody").innerHTML =
      "<tr><td colspan='7'>Failed to load report</td></tr>";
  }
};

// Filter by selected date
const filterByDate = (data, selectedDate) => {
  if (!selectedDate) {
    renderTable(data);
    return;
  }

  const filtered = data.filter(record => {
    if (!record.work_date) return false;
    return toISTDateString(record.work_date) === selectedDate;
  });

  renderTable(filtered);
};

// Init
window.addEventListener("DOMContentLoaded", async () => {
  const allData = await fetchReport();

  const reportDateInput = document.getElementById("reportDate");
  if (reportDateInput) {
    const todayIST = getTodayIST();
    reportDateInput.value = todayIST;
    filterByDate(allData || [], todayIST);
  }

  reportDateInput.addEventListener("change", (e) => {
    filterByDate(allData || [], e.target.value);
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/html/login.html";
  });
});
