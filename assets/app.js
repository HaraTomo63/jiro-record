import {
  loadCommunity,
  loadPersonal,
  upsertRecord,
  removeRecord,
  getById,
  getUser,
  setUser,
  getSkipAuth,
  setSkipAuth,
  getSelectedShop,
  setSelectedShop,
} from "./storage.js";
import { loadImageDataUrl, transformImage } from "./image.js";
import {
  renderList,
  renderForm,
  renderDetail,
  renderToolbar,
  renderShopDatalist,
  renderCommunityEmpty,
  renderStats,
  renderAuth,
  METRIC_LABELS,
  NOODLE_OPTIONS,
  TOPPING_OPTIONS,
  PLACEHOLDER_IMAGE,
} from "./ui.js";

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const modal = document.getElementById("modal");
const tabBar = document.getElementById("tab-bar");
const authOverlay = document.getElementById("auth");

let deleteTarget = null;
let imageState = null;
let authMode = "signup";

const defaultMetrics = () => ({
  noodles: { option: NOODLE_OPTIONS[2], custom: "" },
  pork: { option: TOPPING_OPTIONS[2], custom: "" },
  garlic: { option: TOPPING_OPTIONS[2], custom: "" },
  veg: { option: TOPPING_OPTIONS[2], custom: "" },
  fat: { option: TOPPING_OPTIONS[2], custom: "" },
  karame: { option: TOPPING_OPTIONS[2], custom: "" },
});

const getToday = () => new Date().toISOString().slice(0, 10);

const normalizeRecord = (record) => {
  const metrics = record.metrics || {};
  const normalized = {
    ...record,
    metrics: {
      noodles: metrics.noodles?.option
        ? metrics.noodles
        : { option: NOODLE_OPTIONS[2], custom: "" },
      pork: metrics.pork?.option ? metrics.pork : { option: TOPPING_OPTIONS[2], custom: "" },
      garlic: metrics.garlic?.option ? metrics.garlic : { option: TOPPING_OPTIONS[2], custom: "" },
      veg: metrics.veg?.option ? metrics.veg : { option: TOPPING_OPTIONS[2], custom: "" },
      fat: metrics.fat?.option ? metrics.fat : { option: TOPPING_OPTIONS[2], custom: "" },
      karame: metrics.karame?.option ? metrics.karame : { option: TOPPING_OPTIONS[2], custom: "" },
    },
    shareCommunity: record.shareCommunity ?? true,
    savePersonal: record.savePersonal ?? false,
  };
  return normalized;
};

const createRecord = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  shopName: "",
  date: getToday(),
  notes: "",
  imageDataUrl: "",
  metrics: defaultMetrics(),
  shareCommunity: true,
  savePersonal: Boolean(getUser()),
  userId: getUser()?.id || null,
});

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
};

const openModal = (payload) => {
  deleteTarget = payload;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  deleteTarget = null;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
};

const parseHash = () => {
  const hash = location.hash || "#/community";
  const [path, queryString] = hash.split("?");
  const params = new URLSearchParams(queryString || "");
  return { path, params };
};

const sortRecords = (records, order) => {
  return [...records].sort((a, b) =>
    order === "old" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  );
};

const recordSearchText = (record) => {
  const metricValues = Object.keys(METRIC_LABELS)
    .map((key) => {
      const metric = record.metrics[key];
      return `${metric.option} ${metric.custom || ""}`;
    })
    .join(" ");
  return `${metricValues} ${record.notes}`.toLowerCase();
};

const computeStats = (records) => {
  if (!records.length) {
    return { total: 0, topShop: "", avgNoodles: "", mashRate: "" };
  }
  const shopCounts = records.reduce((acc, record) => {
    acc[record.shopName] = (acc[record.shopName] || 0) + 1;
    return acc;
  }, {});
  const topShop = Object.keys(shopCounts).sort((a, b) => shopCounts[b] - shopCounts[a])[0];
  const noodleScores = {
    半分: 1,
    少なめ: 2,
    小: 3,
    大: 4,
  };
  const scored = records
    .map((record) => noodleScores[record.metrics.noodles.option])
    .filter((value) => Number.isFinite(value));
  const avgScore = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
  const avgNoodles = avgScore
    ? Object.keys(noodleScores).sort((a, b) => Math.abs(noodleScores[a] - avgScore) - Math.abs(noodleScores[b] - avgScore))[0]
    : "";
  const mashCount = records.filter((record) => record.metrics.garlic.option === "マシマシ").length;
  const mashRate = `${Math.round((mashCount / records.length) * 100)}%`;

  return {
    total: records.length,
    topShop,
    avgNoodles,
    mashRate,
  };
};

const ensureAuthOverlay = () => {
  const user = getUser();
  const skip = getSkipAuth();
  if (user || skip) {
    authOverlay.classList.remove("show");
    authOverlay.setAttribute("aria-hidden", "true");
    authOverlay.innerHTML = "";
    return;
  }
  authOverlay.classList.add("show");
  authOverlay.setAttribute("aria-hidden", "false");
  authOverlay.innerHTML = renderAuth(authMode);
};

const updateActiveTab = (tab) => {
  tabBar.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
};

const renderCommunityPage = (searchTerm = "", order = "new") => {
  const selectedShop = getSelectedShop();
  const all = loadCommunity().map(normalizeRecord);
  const filtered = selectedShop
    ? all.filter((record) => record.shopName === selectedShop)
    : [];
  const searched = filtered.filter((record) => recordSearchText(record).includes(searchTerm.toLowerCase()));
  const sorted = sortRecords(searched, order).map((record) => ({ ...record, type: "community" }));

  app.innerHTML = `
    <section class="section-card shop-filter">
      <label class="metric-title">みんなの二郎 - 店舗を選択</label>
      <input
        class="input"
        data-shop-select
        list="shop-list"
        placeholder="店を選択してください"
        value="${selectedShop}"
      />
      <p class="muted-note">共有データベースから最新の記録が見られます。</p>
      ${renderShopDatalist()}
    </section>
    ${renderToolbar(searchTerm, order)}
    ${selectedShop ? renderList(sorted) : renderCommunityEmpty(selectedShop)}
  `;
};

const renderMyPage = (searchTerm = "", order = "new") => {
  const user = getUser();
  if (!user) {
    app.innerHTML = `
      <section class="section-card">
        <div class="empty-state">
          <h3>サインインが必要です</h3>
          <p>自分の二郎はサインイン状態のみ利用できます。</p>
          <button class="btn primary" data-auth-open>サインインする</button>
        </div>
      </section>
    `;
    return;
  }
  const all = loadPersonal()
    .map(normalizeRecord)
    .filter((record) => record.userId === user.id);
  const searched = all.filter((record) => recordSearchText(record).includes(searchTerm.toLowerCase()));
  const sorted = sortRecords(searched, order).map((record) => ({ ...record, type: "personal" }));
  const stats = computeStats(sorted);
  app.innerHTML = `
    ${renderStats(stats)}
    ${renderToolbar(searchTerm, order)}
    ${renderList(sorted)}
  `;
};

const renderFormPage = (mode, record) => {
  const allowPersonal = Boolean(getUser());
  imageState = record.imageDataUrl
    ? { baseDataUrl: record.imageDataUrl, rotation: 0, crop: false }
    : null;
  app.innerHTML = renderForm(mode, record, allowPersonal);
};

const renderDetailPage = (record) => {
  app.innerHTML = renderDetail(record);
};

const route = () => {
  const { path, params } = parseHash();
  ensureAuthOverlay();

  if (path === "#/new") {
    updateActiveTab("add");
    renderFormPage("new", createRecord());
    return;
  }
  if (path === "#/edit") {
    updateActiveTab("add");
    const recordType = params.get("type") || "community";
    const record = getById(recordType === "personal" ? "personal" : "community", params.get("id"));
    if (record) {
      renderFormPage("edit", normalizeRecord(record));
      return;
    }
  }
  if (path === "#/detail") {
    const recordType = params.get("type") || "community";
    const record = getById(recordType === "personal" ? "personal" : "community", params.get("id"));
    if (record) {
      renderDetailPage({
        ...normalizeRecord(record),
        type: recordType === "personal" ? "personal" : "community",
      });
      return;
    }
  }
  if (path === "#/my") {
    updateActiveTab("my");
    renderMyPage();
    return;
  }

  updateActiveTab("community");
  renderCommunityPage();
};

const applyImageEdits = async () => {
  if (!imageState?.baseDataUrl) return;
  const preview = app.querySelector("[data-preview]");
  if (!preview) return;
  const edited = await transformImage(imageState.baseDataUrl, {
    rotation: imageState.rotation,
    crop: imageState.crop,
  });
  preview.src = edited || PLACEHOLDER_IMAGE;
  preview.dataset.value = edited || "";
};

app.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (link) {
    location.hash = link.dataset.link;
    return;
  }

  const optionButton = event.target.closest("[data-option]");
  if (optionButton) {
    const name = optionButton.dataset.option;
    const value = optionButton.dataset.value;
    const group = optionButton.closest("[data-option-group]");
    if (group) {
      group.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
      optionButton.classList.add("active");
      const hidden = group.parentElement.querySelector(`input[name="${name}"]`);
      if (hidden) hidden.value = value;
    }
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const { params } = parseHash();
    openModal({
      id: params.get("id"),
      type: params.get("type") || "community",
    });
  }

  const imageAction = event.target.closest("[data-image-action]");
  if (imageAction) {
    const action = imageAction.dataset.imageAction;
    if (!imageState?.baseDataUrl) {
      showToast("先に写真を選択してください");
      return;
    }
    if (action === "rotate-left") {
      imageState.rotation = (imageState.rotation - 90 + 360) % 360;
    }
    if (action === "rotate-right") {
      imageState.rotation = (imageState.rotation + 90) % 360;
    }
    if (action === "crop") {
      imageState.crop = !imageState.crop;
      imageAction.classList.toggle("active", imageState.crop);
    }
    if (action === "reset") {
      imageState.rotation = 0;
      imageState.crop = false;
    }
    applyImageEdits();
  }

  if (event.target.closest("[data-auth-open]")) {
    authMode = "signin";
    setSkipAuth(false);
    ensureAuthOverlay();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    const order = app.querySelector("[data-sort]")?.value || "new";
    const { path } = parseHash();
    if (path === "#/my") {
      renderMyPage(event.target.value, order);
    } else {
      renderCommunityPage(event.target.value, order);
    }
  }
  if (event.target.matches("[data-shop-select]")) {
    setSelectedShop(event.target.value);
    const order = app.querySelector("[data-sort]")?.value || "new";
    const searchTerm = app.querySelector("[data-search]")?.value || "";
    renderCommunityPage(searchTerm, order);
  }
});

app.addEventListener("change", (event) => {
  if (event.target.matches("[data-sort]")) {
    const searchTerm = app.querySelector("[data-search]")?.value || "";
    const { path } = parseHash();
    if (path === "#/my") {
      renderMyPage(searchTerm, event.target.value);
    } else {
      renderCommunityPage(searchTerm, event.target.value);
    }
  }

  if (event.target.matches("[data-image-input]")) {
    const file = event.target.files?.[0];
    if (!file) return;
    loadImageDataUrl(file).then((dataUrl) => {
      if (!dataUrl) return;
      imageState = { baseDataUrl: dataUrl, rotation: 0, crop: false };
      applyImageEdits();
    });
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.matches("[data-form]")) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const { params, path } = parseHash();
    const isEdit = path === "#/edit";
    const type = params.get("type") || "community";
    const base = isEdit
      ? getById(type === "personal" ? "personal" : "community", params.get("id"))
      : createRecord();
    if (!base) return;

    const metrics = {
      noodles: {
        option: formData.get("noodlesOption") || NOODLE_OPTIONS[2],
        custom: formData.get("noodlesCustom").trim(),
      },
      pork: {
        option: formData.get("porkOption") || TOPPING_OPTIONS[2],
        custom: formData.get("porkCustom").trim(),
      },
      garlic: {
        option: formData.get("garlicOption") || TOPPING_OPTIONS[2],
        custom: formData.get("garlicCustom").trim(),
      },
      veg: {
        option: formData.get("vegOption") || TOPPING_OPTIONS[2],
        custom: formData.get("vegCustom").trim(),
      },
      fat: {
        option: formData.get("fatOption") || TOPPING_OPTIONS[2],
        custom: formData.get("fatCustom").trim(),
      },
      karame: {
        option: formData.get("karameOption") || TOPPING_OPTIONS[2],
        custom: formData.get("karameCustom").trim(),
      },
    };

    const updated = {
      ...base,
      shopName: formData.get("shopName").trim(),
      date: formData.get("date") || getToday(),
      notes: formData.get("notes").trim(),
      imageDataUrl: app.querySelector("[data-preview]")?.dataset.value || base.imageDataUrl || "",
      metrics,
      shareCommunity: Boolean(formData.get("shareCommunity")),
      savePersonal: Boolean(formData.get("savePersonal")),
      userId: getUser()?.id || base.userId || null,
      updatedAt: new Date().toISOString(),
    };

    if (!updated.shopName) {
      showToast("店名を入力してください");
      return;
    }

    if (updated.shareCommunity) {
      upsertRecord("community", updated);
    }

    if (updated.savePersonal && getUser()) {
      upsertRecord("personal", updated);
    }

    showToast("保存しました");
    location.hash = "#/community";
  }

  if (event.target.matches("[data-auth-form]")) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const nickname = formData.get("nickname").trim();
    if (!nickname) return;
    const user = { id: nickname.toLowerCase(), name: nickname };
    setUser(user);
    ensureAuthOverlay();
    showToast(`${nickname}としてサインインしました`);
    location.hash = "#/my";
  }
});

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-modal-cancel]") || event.target === modal) {
    closeModal();
  }
  if (event.target.matches("[data-modal-confirm]")) {
    if (deleteTarget) {
      removeRecord(deleteTarget.type === "personal" ? "personal" : "community", deleteTarget.id);
      showToast("削除しました");
      closeModal();
      location.hash = deleteTarget.type === "personal" ? "#/my" : "#/community";
    }
  }
});

authOverlay.addEventListener("click", (event) => {
  if (event.target.matches("[data-auth-toggle]")) {
    authMode = authMode === "signup" ? "signin" : "signup";
    ensureAuthOverlay();
  }
  if (event.target.matches("[data-auth-skip]")) {
    setSkipAuth(true);
    ensureAuthOverlay();
  }
});

tabBar.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (!tab) return;
  const tabName = tab.dataset.tab;
  if (tabName === "add") {
    location.hash = "#/new";
    return;
  }
  location.hash = tabName === "my" ? "#/my" : "#/community";
});

window.addEventListener("hashchange", route);
window.addEventListener("load", route);
