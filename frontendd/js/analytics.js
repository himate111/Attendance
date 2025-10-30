document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/analytics");
    const data = await res.json();

    if (!data.labels || !data.labels.length) {
      document.querySelector(".analytics-container").innerHTML =
        "<h3 style='color:#66fcf1;text-align:center;'>No attendance data available yet.</h3>";
      return;
    }

    // Update summary cards
    document.getElementById("totalHours").innerText = data.totalHours.toFixed(2) || 0;
    document.getElementById("totalLate").innerText = data.totalLate || 0;
    document.getElementById("totalCheckins").innerText = data.totalCheckins || 0;

    const ctx1 = document.getElementById("hoursChart").getContext("2d");
    const ctx2 = document.getElementById("lateChart").getContext("2d");
    const ctx3 = document.getElementById("checkinChart").getContext("2d");

    // ✅ Clean & safe date labels
    const formattedLabels = data.labels.map(dateStr => {
      if (!dateStr || dateStr === "Unknown") return "Unknown";
      const d = new Date(dateStr);
      if (isNaN(d)) return "Unknown";
      return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    });

    // ✅ Hours Worked (Bar Chart)
    new Chart(ctx1, {
      type: "bar",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: "Hours Worked",
            data: data.hoursPerDay,
            backgroundColor: "rgba(102,252,241,0.6)",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        aspectRatio: 2.2,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            color: "#66fcf1",
            font: { size: 16, weight: "bold" }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#c5c6c7",
              autoSkip: true,
              maxRotation: 0,
              font: { size: 12 }
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: "#c5c6c7" },
            grid: { color: "#1f2833" }
          }
        }
      }
    });

    // ✅ Late vs On-Time (Pie Chart)
    new Chart(ctx2, {
      type: "pie",
      data: {
        labels: ["On Time", "Late"],
        datasets: [
          {
            data: [data.totalCheckins - data.totalLate, data.totalLate],
            backgroundColor: ["#45a29e", "#c3073f"]
          }
        ]
      },
      options: {
        responsive: true,
        aspectRatio: 1.2,
        plugins: {
          legend: { position: "bottom", labels: { color: "#c5c6c7" } }
        }
      }
    });

    // ✅ Check-ins Trend (Line Chart)
    new Chart(ctx3, {
      type: "line",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: "Check-ins per Day",
            data: data.checkinsPerDay,
            borderColor: "#66fcf1",
            backgroundColor: "rgba(102,252,241,0.2)",
            pointBackgroundColor: "#66fcf1",
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        aspectRatio: 2,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            color: "#66fcf1",
            font: { size: 16, weight: "bold" }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#c5c6c7",
              autoSkip: true,
              maxRotation: 0
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: "#c5c6c7" },
            grid: { color: "#1f2833" }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error loading analytics:", err);
  }
});
