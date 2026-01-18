export const SHOP_OPTIONS = [
  "三田本店",
  "目黒店",
  "仙川店",
  "新宿歌舞伎町店",
  "品川店",
  "新宿小滝橋通り店",
  "八王子野猿街道店2",
  "池袋東口店",
  "亀戸店",
  "京急川崎店",
  "府中店",
  "松戸駅前店Ⅲ",
  "めじろ台店",
  "荻窪店",
  "上野毛店",
  "京成大久保店",
  "環七一之江店",
  "相模大野店",
  "横浜関内店",
  "神田神保町店",
  "小岩店",
  "ひばりヶ丘駅前店",
  "桜台駅前店",
  "栃木街道店",
  "立川店",
  "千住大橋駅前店",
  "柏店",
  "湘南藤沢店",
  "西台駅前店",
  "中山駅前店",
  "仙台店",
  "札幌店",
  "会津若松駅前店",
  "新潟店",
  "川越店",
  "京都店",
  "越谷店",
  "前橋千代田町店",
  "千葉店",
  "大宮公園駅前店",
  "ひたちなか店",
  "一橋学園店",
  "生田店",
  "朝倉街道駅前店",
];

export const NOODLE_OPTIONS = ["半分", "少なめ", "小", "大", "自由記述"];
export const TOPPING_OPTIONS = ["なし", "少なめ", "普通", "マシ", "マシマシ", "自由記述"];

export const METRIC_LABELS = {
  noodles: "麺量",
  pork: "ブタ",
  garlic: "ニンニク",
  veg: "ヤサイ",
  fat: "アブラ",
  karame: "カラメ",
};

export const PLACEHOLDER_IMAGE =
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

const dateLabel = (date) => (date ? date : "----");

const optionButtons = (name, options, current) =>
  options
    .map(
      (label) => `
        <button
          type="button"
          class="${label === current ? "active" : ""}"
          data-option="${name}"
          data-value="${label}"
        >
          ${label}
        </button>
      `
    )
    .join("");

export const renderShopDatalist = () => `
  <datalist id="shop-list">
    ${SHOP_OPTIONS.map((shop) => `<option value="${shop}"></option>`).join("")}
  </datalist>
`;

export const renderToolbar = (searchTerm, order) => `
  <section class="section-card toolbar">
    <input
      class="input"
      data-search
      placeholder="マシやマシマシで検索"
      value="${searchTerm}"
    />
    <select class="input select" data-sort>
      <option value="new" ${order === "new" ? "selected" : ""}>新しい順</option>
      <option value="old" ${order === "old" ? "selected" : ""}>古い順</option>
    </select>
  </section>
`;

const metricChip = (name, option, custom) => {
  const label = METRIC_LABELS[name];
  const value = option === "自由記述" ? custom || "自由" : option;
  return `<span class="chip accent">${label} ${value}</span>`;
};

export const renderList = (records) => {
  if (!records.length) {
    return `
      <section class="section-card">
        <div class="empty-state">
          <h3>記録がありません</h3>
          <p>真ん中の＋から追加しましょう。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="cards-grid">
      ${records
        .map(
          (record) => `
        <article class="record-card" data-link="#/detail?type=${record.type}&id=${record.id}">
          <img
            class="record-thumb"
            src="${record.imageDataUrl || PLACEHOLDER_IMAGE}"
            alt="${record.shopName}"
          />
          <div class="record-body">
            <h3 class="record-title">${record.shopName}</h3>
            <div class="record-meta">${dateLabel(record.date)} ・ ${record.metrics.noodles.option}${
              record.metrics.noodles.option === "自由記述"
                ? "(" + (record.metrics.noodles.custom || "自由") + ")"
                : ""
            }麺</div>
            <div class="chip-group">
              ${metricChip("pork", record.metrics.pork.option, record.metrics.pork.custom)}
              ${metricChip("garlic", record.metrics.garlic.option, record.metrics.garlic.custom)}
              ${metricChip("veg", record.metrics.veg.option, record.metrics.veg.custom)}
              ${metricChip("fat", record.metrics.fat.option, record.metrics.fat.custom)}
              ${metricChip("karame", record.metrics.karame.option, record.metrics.karame.custom)}
            </div>
          </div>
        </article>
      `
        )
        .join("")}
    </section>
  `;
};

export const renderForm = (mode, record, allowPersonal) => {
  const isEdit = mode === "edit";
  return `
    <form class="section-card" data-form>
      <div class="form-section preview-box">
        <strong>画像（なくてもOK）</strong>
        <img
          class="preview-img"
          src="${record.imageDataUrl || PLACEHOLDER_IMAGE}"
          alt="プレビュー"
          data-preview
        />
        <div class="image-actions">
          <button type="button" class="btn ghost" data-image-action="rotate-left">左回転</button>
          <button type="button" class="btn ghost" data-image-action="rotate-right">右回転</button>
          <button type="button" class="btn ghost" data-image-action="crop">中央トリミング</button>
          <button type="button" class="btn ghost" data-image-action="reset">元に戻す</button>
        </div>
        <input type="file" accept="image/*" class="input" data-image-input />
      </div>

      <div class="form-section">
        <label class="metric-title">店名 *</label>
        <input
          class="input"
          name="shopName"
          list="shop-list"
          value="${record.shopName || ""}"
          required
        />
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
        <div class="metric-block">
          <p class="metric-title">${METRIC_LABELS.noodles}</p>
          <div class="segmented" data-option-group>
            ${optionButtons("noodlesOption", NOODLE_OPTIONS, record.metrics.noodles.option)}
          </div>
          <input type="hidden" name="noodlesOption" value="${record.metrics.noodles.option}" />
          <input
            class="input custom-input"
            name="noodlesCustom"
            placeholder="自由記述時はこちら"
            value="${record.metrics.noodles.custom || ""}"
          />
        </div>
        ${["pork", "garlic", "veg", "fat", "karame"]
          .map(
            (key) => `
          <div class="metric-block">
            <p class="metric-title">${METRIC_LABELS[key]}</p>
            <div class="segmented" data-option-group>
              ${optionButtons(`${key}Option`, TOPPING_OPTIONS, record.metrics[key].option)}
            </div>
            <input type="hidden" name="${key}Option" value="${record.metrics[key].option}" />
            <input
              class="input custom-input"
              name="${key}Custom"
              placeholder="自由記述時はこちら"
              value="${record.metrics[key].custom || ""}"
            />
          </div>
        `
          )
          .join("")}
      </div>

      <div class="form-section share-section">
        <label class="toggle">
          <input type="checkbox" name="shareCommunity" ${record.shareCommunity ? "checked" : ""} />
          <span>みんなの二郎に共有</span>
        </label>
        <label class="toggle ${allowPersonal ? "" : "disabled"}">
          <input type="checkbox" name="savePersonal" ${
            allowPersonal && record.savePersonal ? "checked" : ""
          } ${allowPersonal ? "" : "disabled"} />
          <span>自分の二郎にも保存</span>
        </label>
        ${
          allowPersonal
            ? ""
            : '<p class="muted-note">自分の二郎はサインイン後に保存できます。</p>'
        }
      </div>

      <div class="form-footer">
        <button class="btn primary" type="submit">保存する</button>
        ${isEdit ? "<button class=\"btn danger\" type=\"button\" data-delete>削除</button>" : ""}
      </div>
      ${renderShopDatalist()}
    </form>
  `;
};

export const renderDetail = (record) => `
  <section class="section-card">
    <img
      class="detail-hero"
      src="${record.imageDataUrl || PLACEHOLDER_IMAGE}"
      alt="${record.shopName}"
    />
    <div class="detail-header">
      <div>
        <h2 class="detail-title">${record.shopName}</h2>
        <div class="detail-date">${dateLabel(record.date)}</div>
      </div>
      <button class="btn ghost" data-link="#/edit?type=${record.type}&id=${record.id}">編集</button>
    </div>
    <p>${record.notes ? record.notes : ""}</p>
    <div class="chip-group">
      ${metricChip("noodles", record.metrics.noodles.option, record.metrics.noodles.custom)}
      ${metricChip("pork", record.metrics.pork.option, record.metrics.pork.custom)}
      ${metricChip("garlic", record.metrics.garlic.option, record.metrics.garlic.custom)}
      ${metricChip("veg", record.metrics.veg.option, record.metrics.veg.custom)}
      ${metricChip("fat", record.metrics.fat.option, record.metrics.fat.custom)}
      ${metricChip("karame", record.metrics.karame.option, record.metrics.karame.custom)}
    </div>
  </section>
`;

export const renderCommunityEmpty = (selectedShop) => `
  <section class="section-card">
    <div class="empty-state">
      <h3>${selectedShop ? "記録がありません" : "店を選択してください"}</h3>
      <p>${
        selectedShop
          ? "この店舗の最新記録を追加してみよう。"
          : "黄色い魂で、まずは一杯の舞台を決めよう。"
      }</p>
    </div>
  </section>
`;

export const renderStats = (stats) => `
  <section class="section-card stats-card">
    <h3>二郎スタッツ</h3>
    <div class="stats-grid">
      <div>
        <p class="stat-label">総杯数</p>
        <p class="stat-value">${stats.total}</p>
      </div>
      <div>
        <p class="stat-label">よく行く店</p>
        <p class="stat-value">${stats.topShop || "--"}</p>
      </div>
      <div>
        <p class="stat-label">平均麺量</p>
        <p class="stat-value">${stats.avgNoodles || "--"}</p>
      </div>
      <div>
        <p class="stat-label">マシマシ率</p>
        <p class="stat-value">${stats.mashRate || "--"}</p>
      </div>
    </div>
  </section>
`;

export const renderAuth = (mode) => `
  <div class="auth-card">
    <h2>${mode === "signup" ? "はじめまして" : "おかえりなさい"}</h2>
    <p>二郎記録を続けるため、ニックネームを入力してください。</p>
    <form data-auth-form>
      <input
        class="input"
        name="nickname"
        placeholder="ニックネーム"
        autocomplete="nickname"
        required
      />
      <button class="btn primary" type="submit">${mode === "signup" ? "サインアップ" : "サインイン"}</button>
    </form>
    <div class="auth-actions">
      <button class="btn ghost" data-auth-toggle>${mode === "signup" ? "すでにアカウントがあります" : "新しく始める"}</button>
      <button class="btn ghost" data-auth-skip>スキップ</button>
    </div>
  </div>
`;
