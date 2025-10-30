let salaryData = [];

document.addEventListener("DOMContentLoaded", () => {
  const viewBtn = document.getElementById("viewSalaryBtn");
  const searchInput = document.getElementById("searchWorker");

  viewBtn.addEventListener("click", fetchSalary);
  searchInput.addEventListener("input", filterWorker);
});

async function fetchSalary() {
  const monthInput = document.getElementById("salaryMonth").value;
  if (!monthInput) return alert("Select a month");

  const [year, month] = monthInput.split("-");
  const role = localStorage.getItem("role");
  const worker_id = localStorage.getItem("worker_id");

  const params = new URLSearchParams({ role, month, year });
  if (role === "worker") params.append("worker_id", worker_id);

  try {
    const res = await fetch(`http://localhost:3000/salary-summary?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch salary");
    salaryData = await res.json();
    renderTable(salaryData);
  } catch (err) {
    console.error(err);
    alert("Error fetching salary: " + err.message);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("salaryTableBody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = "<tr><td colspan='9'>No data found</td></tr>";
    return;
  }

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.worker_id}</td>
      <td>${r.job}</td>
      <td>${r.present_days}</td>
      <td>${r.worked_days}</td>
      <td>${r.total_hours}</td>
      <td>${r.total_overtime}</td>
      <td>${r.base_salary}</td>
      <td>${r.overtime_amount}</td>
      <td>${r.total_salary}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterWorker() {
  const search = document.getElementById("searchWorker").value.toLowerCase();
  const filtered = salaryData.filter(r => r.worker_id.toLowerCase().includes(search));
  renderTable(filtered);
}
