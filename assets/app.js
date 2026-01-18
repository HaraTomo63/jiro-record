import { loadAll, upsert, remove, getById } from "./storage.js";
import { compressImage } from "./image.js";
import {
  renderList,
  renderForm,
  renderDetail,
  LEVEL_LABELS,
  METRIC_KEYS,
  PLACEHOLDER_IMAGE,
} from "./ui.js";

const app = document.getElementById("app");
const fab = document.getElementById("fab");
const toast = document.getElementById("toast");
const modal = document.getElementById("modal");

let deleteTargetId = null;

const defaultMetrics = () =>
  METRIC_KEYS.reduce((acc, key) => ({ ...acc, [key]: 2 }), {});

const getToday = () => new Date().toISOString().slice(0, 10);

const createRecord = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  shopName: "",
  date: getToday(),
  notes: "",
  imageDataUrl: "",
  metrics: defaultMetrics(),
});

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
};

const openModal = (id) => {
  deleteTargetId = id;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  deleteTargetId = null;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

const parseHash = () => {
  const hash = location.hash || "#/list";
  const [path, queryString] = hash.split("?");
  const params = new URLSearchParams(queryString || "");
  return { path, params };
};

const sortRecords = (records, order) => {
  const sorted = [...records].sort((a, b) =>
    order === "old" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  );
  return sorted;
};

const renderToolbar = (searchTerm, order) => `
  <section class="section-card toolbar">
    <input class="input" data-search placeholder="店名やメモで検索" value="${searchTerm}" />
    <select class="input select" data-sort>
      <option value="new" ${order === "new" ? "selected" : ""}>新しい順</option>
      <option value="old" ${order === "old" ? "selected" : ""}>古い順</option>
    </select>
  </section>
`;

const renderListPage = (searchTerm = "", order = "new") => {
  const allRecords = loadAll();
  const filtered = allRecords.filter((record) => {
    const target = `${record.shopName} ${record.notes}`.toLowerCase();
    return target.includes(searchTerm.toLowerCase());
  });
  const sorted = sortRecords(filtered, order);
  app.innerHTML = `${renderToolbar(searchTerm, order)}${renderList(sorted)}`;
  fab.style.display = "block";
};

const renderFormPage = (mode, record) => {
  app.innerHTML = renderForm(mode, record);
  fab.style.display = "none";
};

const renderDetailPage = (record) => {
  app.innerHTML = renderDetail(record);
  fab.style.display = "none";
};

const route = () => {
  const { path, params } = parseHash();
  if (path === "#/new") {
    renderFormPage("new", createRecord());
    return;
  }
  if (path === "#/edit") {
    const record = getById(params.get("id"));
    if (record) {
      renderFormPage("edit", record);
      return;
    }
  }
  if (path === "#/detail") {
    const record = getById(params.get("id"));
    if (record) {
      renderDetailPage(record);
      return;
    }
  }
  renderListPage();
};

const updateMetricUI = (button) => {
  const metric = button.dataset.metric;
  const value = button.dataset.value;
  const group = button.closest("[data-metric-group]");
  if (!group || metric === undefined) return;

  group.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  const hidden = group.parentElement.querySelector(`input[name="${metric}"]`);
  if (hidden) {
    hidden.value = value;
  }
};

const handleImageChange = async (input) => {
  const file = input.files?.[0];
  if (!file) return;
  const preview = app.querySelector("[data-preview]");
  preview.src = PLACEHOLDER_IMAGE;
  const compressed = await compressImage(file);
  if (compressed) {
    preview.src = compressed;
    preview.dataset.value = compressed;
  }
};

app.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (link) {
    location.hash = link.dataset.link;
    return;
  }

  const metricButton = event.target.closest("[data-metric]");
  if (metricButton) {
    updateMetricUI(metricButton);
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const { params } = parseHash();
    openModal(params.get("id"));
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    const order = app.querySelector("[data-sort]")?.value || "new";
    renderListPage(event.target.value, order);
  }
});

app.addEventListener("change", (event) => {
  if (event.target.matches("[data-sort]")) {
    const searchTerm = app.querySelector("[data-search]")?.value || "";
    renderListPage(searchTerm, event.target.value);
  }
  if (event.target.matches("[data-image-input]")) {
    handleImageChange(event.target);
  }
});

app.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-form]")) return;
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const { params, path } = parseHash();
  const isEdit = path === "#/edit";
  const base = isEdit ? getById(params.get("id")) : createRecord();
  if (!base) return;

  const metrics = METRIC_KEYS.reduce((acc, key) => {
    const value = Number(formData.get(key));
    return { ...acc, [key]: Number.isFinite(value) ? value : 2 };
  }, {});

  const updated = {
    ...base,
    shopName: formData.get("shopName").trim(),
    date: formData.get("date") || getToday(),
    notes: formData.get("notes").trim(),
    imageDataUrl: app.querySelector("[data-preview]")?.dataset.value || base.imageDataUrl || "",
    metrics,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.shopName) {
    showToast("店名を入力してください");
    return;
  }

  upsert(updated);
  showToast("保存しました");
  location.hash = "#/list";
});

fab.addEventListener("click", () => {
  location.hash = "#/new";
});

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-modal-cancel]") || event.target === modal) {
    closeModal();
  }
  if (event.target.matches("[data-modal-confirm]")) {
    if (deleteTargetId) {
      remove(deleteTargetId);
      showToast("削除しました");
      closeModal();
      location.hash = "#/list";
    }
  }
});

window.addEventListener("hashchange", route);
window.addEventListener("load", route);
