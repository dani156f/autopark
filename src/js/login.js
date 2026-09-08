const form = document.getElementById("login-form");
const codeInput = document.getElementById("code");
const errorEl = document.getElementById("login-error");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl?.classList.add("hidden");

  const code = codeInput.value.trim();
  if (!code) return;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    if (errorEl) {
      errorEl.textContent = "Invalid invitation code.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  const { redirect } = await res.json();
  window.location.href = redirect || "/index.html";
});
