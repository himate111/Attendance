document.addEventListener("DOMContentLoaded", () => {
  const workerSelect = document.getElementById("workerSelect");
  const summaryDiv = document.getElementById("summaryCards");
  const noDataDiv = document.getElementById("noData");
  const ctx = document.getElementById("hoursChart").getContext("2d");
  let chartInstance;

  // ------------------ Load Workers ------------------
  async function loadWorkers() {
    try {
      const res = await fetch("/users");
      const workers = await res.json();
      console.log("Fetched workers from backend:", workers); 

      workerSelect.innerHTML = `<option value="">-- Choose Worker --</option>`;
      workers.forEach(w => {
        workerSelect.innerHTML += `<option value="${w.worker_id}">${w.worker_id} - ${w.job || ""}</option>`;
      });

      if (workers.length > 0) {
        workerSelect.value = workers[0].worker_id;
        loadPayroll(workers[0].worker_id);
      }

    } catch (err) {
      console.error("Failed to load workers:", err);
    }
  }

  // ------------------ Load Payroll ------------------
  async function loadPayroll(workerId) {
    if (!workerId) return;

    try {
      const res = await fetch(`/salary-summary?worker_id=${workerId}`);
      const result = await res.json();
      const data = result.data;

      if (!data || data.length === 0) {
        summaryDiv.innerHTML = "";
        noDataDiv.style.display = "block";
        if (chartInstance) chartInstance.destroy();
        return;
      }

      noDataDiv.style.display = "none";

      const { totalHours, totalOvertime, workedDays, totalSalary } = data[0];

      // Summary Cards
      summaryDiv.innerHTML = `
        <div class="card"><h3>Total Hours</h3><p>${totalHours} hrs</p></div>
        <div class="card"><h3>Overtime</h3><p>${totalOvertime} hrs</p></div>
        <div class="card"><h3>Worked Days</h3><p>${workedDays}</p></div>
        <div class="card"><h3>Monthly Salary</h3><p>₹${totalSalary}</p></div>
      `;

      // ------------------ Attendance Chart ------------------
      const attRes = await fetch(`/attendance/${workerId}`);
      const attData = await attRes.json();

      const labels = attData.map(r => {
        const d = new Date(r.work_date);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });
      const hours = attData.map(r => Number(r.hours_worked || 0).toFixed(2));

      if (chartInstance) chartInstance.destroy();

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Hours Worked per Day",
            data: hours,
            backgroundColor: "rgba(102, 252, 241, 0.7)",
            borderColor: "rgba(102, 252, 241, 1)",
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // ✅ Makes chart fill container height
          plugins: {
            legend: {
              labels: {
                color: "#66fcf1",
                font: { size: 16 }
              }
            },
            tooltip: {
              titleFont: { size: 14 },
              bodyFont: { size: 13 },
              backgroundColor: "rgba(0,0,0,0.7)"
            }
          },
          scales: {
            x: {
              ticks: {
                color: "#c5c6c7",
                font: { size: 14 },
                maxRotation: 45,
                minRotation: 30
              },
              grid: { color: "rgba(255,255,255,0.1)" }
            },
            y: {
              ticks: {
                color: "#c5c6c7",
                font: { size: 14 },
                stepSize: 1
              },
              grid: { color: "rgba(255,255,255,0.1)" }
            }
          },
          layout: {
            padding: { top: 20, bottom: 20, left: 10, right: 10 }
          }
        }
      });

    } catch (err) {
      console.error("Error loading payroll:", err);
    }
  }

  // ------------------ Events ------------------
  workerSelect.addEventListener("change", e => {
    loadPayroll(e.target.value);
  });

  loadWorkers();
});
