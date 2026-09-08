const form = document.getElementById("vehicle-form");
const licenseInput = document.getElementById("license");
const phoneInput = document.getElementById("phone");
const formError = document.getElementById("form-error");
const formSuccess = document.getElementById("form-success");
const list = document.getElementById("vehicle-list");
const emptyState = document.getElementById("empty-state");
const logoutBtn = document.getElementById("logout");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderVehicles(vehicles) {
  list.innerHTML = "";
  emptyState.classList.toggle("hidden", vehicles.length > 0);
  for (const vehicle of vehicles) {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between px-4 py-3";
    li.innerHTML = `
      <div>
        <p class="font-medium text-black">License: ${escapeHtml(vehicle.license)}</p>
        <p class="text-sm text-slate-500">Phone: ${escapeHtml(vehicle.phone || "No phone number")}</p>
        <p class="text-xs ${vehicle.active ? "text-green-500" : "text-gray-400"}">Status: ${vehicle.active ? "Active" : "Disabled"}</p>
      </div>
      <div class="flex gap-2">
        <button data-id="${vehicle.id}" data-active="${vehicle.active}" class="toggle-btn rounded-lg px-4 py-2 text-sm cursor-pointer ${vehicle.active ? "bg-gray-200 hover:bg-gray-300" : "bg-green-500 text-white hover:bg-green-600"}">
          ${vehicle.active ? "Disable" : "Activate"}
        </button>
        <button data-id="${vehicle.id}" class="delete-btn text-white rounded-lg px-4 py-2 text-sm bg-red-400 hover:bg-red-500 cursor-pointer">
          Remove
        </button>
      </div>
    `;
    list.appendChild(li);
  }
}

async function loadVehicles() {
  const res = await fetch("/api/vehicles", { credentials: "same-origin" });
  if (res.status === 401) {
    window.location.href = "/login.html";
    return;
  }
  renderVehicles(await res.json());
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.classList.add("hidden");
  formSuccess.classList.add("hidden");
  const license = licenseInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!license) return;

  const res = await fetch("/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ license, phone }),
  });

  if (res.status === 401) {
    window.location.href = "/login.html";
    return;
  }

  if (!res.ok) {
    formError.textContent = "Could not add vehicle. Please try again.";
    formError.classList.remove("hidden");
    return;
  }

  licenseInput.value = "";
  phoneInput.value = "";
  formSuccess.textContent = "Vehicle added.";
  formSuccess.classList.remove("hidden");
  loadVehicles();
});

list.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    if (!confirm("Are you sure you want to remove this vehicle?")) return;
    await fetch(`/api/vehicles/${deleteBtn.dataset.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    loadVehicles();
    return;
  }

  const toggleBtn = e.target.closest(".toggle-btn");
  if (toggleBtn) {
    const isActive = toggleBtn.dataset.active === "true";
    await fetch(`/api/vehicles/${toggleBtn.dataset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ active: !isActive }),
    });
    loadVehicles();
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  window.location.href = "/login.html";
});

loadVehicles();
