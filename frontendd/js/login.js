document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // --- Get input values ---
  const worker_id = document.getElementById("workerId").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  // --- Basic validation ---
  if (!worker_id || !password) {
    errorMsg.innerText = "Please enter Worker ID and Password";
    return;
  }

  try {
    // --- Send login request to backend ---
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id, password }),
    });

    const data = await res.json();

    // --- Success ---
    if (res.ok && data.success) {
      // Store session info
      localStorage.setItem("worker_id", data.worker_id);
      localStorage.setItem("role", data.role);
      localStorage.setItem("job", data.job);
      localStorage.setItem("email", data.email);

      const role = data.role ? data.role.toLowerCase() : "";

      // --- Redirect by role ---
      if (role === "admin") {
        window.location.href = "/html/admin.html";
      } else if (role === "supervisor") {
        window.location.href = "/html/supervisor.html";
      } else if (role === "worker") {
        window.location.href = "/html/checkin.html";
      } else {
        errorMsg.innerText = "Unknown role. Please contact the administrator.";
      }

    } else {
      // --- Failed login ---
      errorMsg.innerText = data.error || "Invalid credentials";
    }
  } catch (err) {
    console.error("Login error:", err);
    errorMsg.innerText = "Server error. Please try again.";
  }
});
