// Get worker info from localStorage
const worker_id = localStorage.getItem("worker_id");
const role = localStorage.getItem("role");

// Redirect if not logged in or wrong role
if (!worker_id || role !== "worker") {
  alert("Access denied. Please login as a worker.");
  window.location.href = "/html/login.html";
}

// Welcome message
document.getElementById("welcomeMsg").innerText = `Welcome, Worker ${worker_id}!`;

// ---------------- HELPERS ----------------
const formatTime = dateStr => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ---------------- BUTTON STATE ----------------
const setButtonState = async () => {
  try {
    const res = await fetch(`http://localhost:3000/attendance/${worker_id}`);
    const records = await res.json();

    // Find the latest record where checkout_time is null
    const last = records
      .sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
      .find(r => !r.checkout_time);

    if (last) {
      document.getElementById("checkInBtn").disabled = true;
      document.getElementById("checkOutBtn").disabled = false;
      if (last.checkin_time) {
        document.getElementById("statusMsg").innerText =
          `Checked in at: ${formatTime(last.checkin_time)} (${last.status || "On time"})`;
      }
    } else {
      document.getElementById("checkInBtn").disabled = false;
      document.getElementById("checkOutBtn").disabled = true;
      document.getElementById("statusMsg").innerText = "";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("statusMsg").innerText = "Failed to fetch attendance data.";
  }
};

setButtonState();

// ---------------- CHECK-IN ----------------
document.getElementById("checkInBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("http://localhost:3000/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id, role }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("statusMsg").innerText =
        `Checked in at: ${formatTime(data.checkin_time)} (${data.status || "On time"})`;
      document.getElementById("checkInBtn").disabled = true;
      document.getElementById("checkOutBtn").disabled = false;
    } else {
      document.getElementById("statusMsg").innerText = data.error || "Check-in failed.";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("statusMsg").innerText = "Check-in failed. Try again.";
  }
});

// ---------------- CHECK-OUT ----------------
document.getElementById("checkOutBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("http://localhost:3000/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id, role }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("statusMsg").innerText =
        `Checked out at: ${formatTime(data.checkout_time)}, Hours worked: ${data.hours_worked || 0}`;
      document.getElementById("checkOutBtn").disabled = true;
      document.getElementById("checkInBtn").disabled = false;
    } else {
      document.getElementById("statusMsg").innerText = data.error || "Check-out failed.";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("statusMsg").innerText = "Check-out failed. Try again.";
  }
});

// ---------------- VIEW ATTENDANCE ----------------
document.getElementById("viewAttendanceBtn").addEventListener("click", () => {
  window.location.href = "/html/myattendance.html";
});

// ---------------- LOGOUT ----------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("worker_id");
  localStorage.removeItem("role");
  localStorage.removeItem("job");
  window.location.href = "/html/login.html";
});
  