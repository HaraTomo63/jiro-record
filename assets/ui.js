const LEVELS = [
  "なし",
  "少なめ",
  "普通",
  "マシ",
  "マシマシ",
  "限界",
];

const METRIC_LABELS = {
  noodles: "麺量",
  pork: "ブタ",
  garlic: "ニンニク",
  veg: "ヤサイ",
  fat: "アブラ",
  karame: "カラメ",
};

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#2c2c2c" />
          <stop offset="100%" stop-color="#111" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect x="40" y="40" width="720" height="420" rx="32" fill="#1b1b1b" />
      <text x="50%" y="50%" text-anchor="middle" fill="#ffd600" font-size="42" font-family="sans-serif">No Photo</text>
    </svg>
  `);

const metricButtons = (name, value = 2) =>
  LEVELS.map(
    (label, index) => `
      <button
        type="button"
        class="${index === value ? "active" : ""}"
        data-metric="${name}"
        data-value="${index}"
      >
        ${label}
      </button>
    `
  ).join("");

const metricChip = (name, value) => {
  const label = LEVELS[value] ?? "-";
  return `<span class="chip accent">${METRIC_LABELS[name]} ${label}</span>`;
};

const dateLabel = (date) => (date ? date : "----");

export const renderList = (records) => {
  if (!records.length) {
    return `
      <section class="section-card">
        <div class="empty-state">
          <h3>記録がありません</h3>
          <p>右下の＋から追加しましょう。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="cards-grid">
      ${records
        .map(
          (record) => `
        <article class="record-card" data-link="#/detail?id=${record.id}">
          <img
            class="record-thumb"
            src="${record.imageDataUrl || PLACEHOLDER}"
            alt="${record.shopName}"
          />
          <div class="record-body">
            <h3 class="record-title">${record.shopName}</h3>
            <div class="record-meta">${dateLabel(record.date)} ・ ${LEVELS[record.metrics.noodles]}麺</div>
            <div class="chip-group">
              ${metricChip("pork", record.metrics.pork)}
              ${metricChip("garlic", record.metrics.garlic)}
              ${metricChip("veg", record.metrics.veg)}
              ${metricChip("fat", record.metrics.fat)}
              ${metricChip("karame", record.metrics.karame)}
            </div>
          </div>
        </article>
      `
        )
        .join("")}
    </section>
  `;
};

export const renderForm = (mode, record) => {
  const isEdit = mode === "edit";
  return `
    <form class="section-card" data-form>
      <div class="form-section preview-box">
        <strong>画像</strong>
        <img
          class="preview-img"
          src="${record.imageDataUrl || PLACEHOLDER}"
          alt="プレビュー"
          data-preview
        />
        <input type="file" accept="image/*" class="input" data-image-input />
      </div>

      <div class="form-section">
        <label class="metric-title">店名 *</label>
        <input class="input" name="shopName" value="${record.shopName || ""}" required />
      </div>

      <div class="form-section">
        <label class="metric-title">日付</label>
        <input class="input" type="date" name="date" value="${record.date || ""}" />
      </div>

      <div class="form-section">
        <label class="metric-title">メモ</label>
        <textarea class="input" name="notes" rows="3">${record.notes || ""}</textarea>
      </div>

      <div class="form-section metric-grid">
        ${Object.keys(METRIC_LABELS)
          .map(
            (key) => `
          <div class="metric-block">
            <p class="metric-title">${METRIC_LABELS[key]}</p>
            <div class="segmented" data-metric-group>
              ${metricButtons(key, record.metrics[key])}
            </div>
            <input type="hidden" name="${key}" value="${record.metrics[key]}" />
          </div>
        `
          )
          .join("")}
      </div>

      <div class="form-footer">
        <button class="btn primary" type="submit">保存する</button>
        ${isEdit ? "<button class=\"btn danger\" type=\"button\" data-delete>削除</button>" : ""}
      </div>
    </form>
  `;
};

export const renderDetail = (record) => `
  <section class="section-card">
    <img
      class="detail-hero"
      src="${record.imageDataUrl || PLACEHOLDER}"
      alt="${record.shopName}"
    />
    <div class="detail-header">
      <div>
        <h2 class="detail-title">${record.shopName}</h2>
        <div class="detail-date">${dateLabel(record.date)}</div>
      </div>
      <button class="btn ghost" data-link="#/edit?id=${record.id}">編集</button>
    </div>
    <p>${record.notes ? record.notes : ""}</p>
    <div class="chip-group">
      ${metricChip("noodles", record.metrics.noodles)}
      ${metricChip("pork", record.metrics.pork)}
      ${metricChip("garlic", record.metrics.garlic)}
      ${metricChip("veg", record.metrics.veg)}
      ${metricChip("fat", record.metrics.fat)}
      ${metricChip("karame", record.metrics.karame)}
    </div>
  </section>
`;

export const LEVEL_LABELS = LEVELS;
export const METRIC_KEYS = Object.keys(METRIC_LABELS);
export const PLACEHOLDER_IMAGE = PLACEHOLDER;
