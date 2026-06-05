const state = {
  sensors: [],
  sourceContext: {},
  lastResult: null,
  selectedSuggestion: null,
  activeTab: "suggestions"
};

const $ = (id) => document.getElementById(id);

const fields = {
  pass: $("teacherPass"),
  theme: $("theme"),
  subject: $("subject"),
  grade: $("grade"),
  problem: $("problem"),
  aiWebsite: $("aiWebsite"),
  hardware: $("hardware"),
  iot: $("iot")
};

init();

function init() {
  fields.pass.value = sessionStorage.getItem("teacherPass") || "";
  $("savePass").addEventListener("click", savePass);
  $("healthBtn").addEventListener("click", checkHealth);
  $("suggestBtn").addEventListener("click", suggestThemes);
  $("scoreBtn").addEventListener("click", scoreConcept);
  $("proposalBtn").addEventListener("click", buildProposal);
  $("imageBtn").addEventListener("click", generatePreviewImage);
  $("copyBtn").addEventListener("click", copyCurrent);
  $("downloadJsonBtn").addEventListener("click", () => downloadCurrent("json"));
  $("downloadMdBtn").addEventListener("click", () => downloadCurrent("md"));
  $("printBtn").addEventListener("click", () => window.print());
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });
  renderEmpty();
  loadCatalog();
}

async function loadCatalog() {
  const data = await api("/api/sensor-catalog", null, false, "GET");
  state.sensors = data.sensors || [];
  state.sourceContext = data.sourceContext || {};
  renderSensors(data);
}

function savePass() {
  sessionStorage.setItem("teacherPass", fields.pass.value);
  setStatus("本次通行碼已保存。", "ok");
}

async function checkHealth() {
  setStatus("正在檢查網站及 AI proxy 狀態...", "busy");
  const data = await api("/api/health", null, false, "GET");
  state.lastResult = data;
  setStatus(data.proxyConfigured ? "網站可運作，AI proxy 已設定。" : "網站可運作，但 AI proxy token 未設定。", data.proxyConfigured ? "ok" : "err");
  renderJson("proposal", data);
  activateTab("proposal");
}

async function suggestThemes() {
  setStatus("Alibaba/Qwen 正在搜尋及生成 10 個題目...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/suggest-themes", {
      theme: getTheme(),
      subject: fields.subject.value,
      grade: fields.grade.value,
      studentNeed: fields.problem.value,
      constraints: fields.iot.value,
      preferredHardware: fields.hardware.value
    });
    state.lastResult = data;
    setStatus(`已生成 ${Array.isArray(data.suggestions) ? data.suggestions.length : 0} 個建議。`, "ok");
    renderSuggestions(data);
    activateTab("suggestions");
  } finally {
    setBusy(false);
  }
}

async function scoreConcept() {
  setStatus("Alibaba/Qwen 正在按 100 分 rubric 評估構思...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/score-concept", {
      title: state.selectedSuggestion?.title || "",
      theme: getTheme(),
      problem: fields.problem.value,
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      iot: fields.iot.value,
      materials: fields.iot.value
    });
    state.lastResult = data;
    setStatus(`評分完成：${data.totalScore ?? data.score ?? "已完成"} / 100`, "ok");
    renderScore(data);
    activateTab("score");
  } finally {
    setBusy(false);
  }
}

async function buildProposal() {
  setStatus("ChatGPT 正在生成完整作品構思書...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/build-proposal", {
      title: state.selectedSuggestion?.title || "",
      theme: getTheme(),
      problem: fields.problem.value,
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      iot: fields.iot.value,
      selectedSuggestion: state.selectedSuggestion,
      scoreResult: state.lastResult?.mode === "score" ? state.lastResult : null
    });
    state.lastResult = data;
    setStatus("完整構思書已生成。", "ok");
    renderProposal(data);
    activateTab("proposal");
  } finally {
    setBusy(false);
  }
}

async function generatePreviewImage() {
  setStatus("GPT Image 2 正在生成低品質產品預覽圖...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/generate-preview-image", {
      title: state.selectedSuggestion?.title || "",
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      physicalObject: fields.problem.value,
      selectedSuggestion: state.selectedSuggestion
    });
    state.lastResult = data;
    setStatus("產品預覽圖已生成。", "ok");
    renderImage(data);
    activateTab("image");
  } finally {
    setBusy(false);
  }
}

async function api(path, body, auth = true, method = "POST") {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const pass = fields.pass.value.trim();
    if (!pass) {
      setStatus("請先輸入教師通行碼。", "err");
      throw new Error("Missing teacher password");
    }
    sessionStorage.setItem("teacherPass", pass);
    headers["X-Teacher-Pass"] = pass;
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body == null || method === "GET" ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || `HTTP ${response.status}`;
    setStatus(message, "err");
    throw new Error(message);
  }
  return data;
}

function getTheme() {
  return fields.theme.value === "其他" ? (fields.subject.value || "跨科AI發明") : fields.theme.value;
}

function renderEmpty() {
  const template = $("emptyTemplate").content.cloneNode(true);
  $("suggestions").replaceChildren(template);
}

function renderSuggestions(data) {
  const rows = Array.isArray(data.suggestions) ? data.suggestions : [];
  if (!rows.length) {
    renderJson("suggestions", data);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "suggestionGrid";
  rows.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "resultCard";
    card.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(item.title || `建議 ${index + 1}`)}</h3>
          <p>${escapeHtml(item.problem || item.summary || "")}</p>
        </div>
        <div class="scorePill">${escapeHtml(String(item.score ?? item.totalScore ?? "-"))}</div>
      </header>
      <ul class="metaList">
        <li><strong>AI網站：</strong>${escapeHtml(item.aiWebsite || item.software || "")}</li>
        <li><strong>硬件：</strong>${escapeHtml(item.hardware || item.device || "")}</li>
        <li><strong>IoT互動：</strong>${escapeHtml(item.iotInteraction || item.iot || "")}</li>
        <li><strong>材料：</strong>${escapeHtml(asText(item.materials))}</li>
        <li><strong>可行步驟：</strong>${escapeHtml(asText(item.makingSteps || item.steps))}</li>
      </ul>
      <button type="button" class="selectSuggestion">套用到表單</button>
    `;
    card.querySelector("button").addEventListener("click", () => selectSuggestion(item));
    wrap.appendChild(card);
  });
  appendSources(wrap, data.sources);
  $("suggestions").replaceChildren(wrap);
}

function selectSuggestion(item) {
  state.selectedSuggestion = item;
  fields.problem.value = item.problem || item.summary || fields.problem.value;
  fields.aiWebsite.value = item.aiWebsite || item.software || fields.aiWebsite.value;
  fields.hardware.value = item.hardware || item.device || fields.hardware.value;
  fields.iot.value = item.iotInteraction || item.iot || fields.iot.value;
  setStatus(`已套用：${item.title || "建議"}`, "ok");
}

function renderScore(data) {
  const box = document.createElement("div");
  box.className = "scoreBox";
  const breakdown = data.breakdown || data.scoreBreakdown || {};
  const total = data.totalScore ?? data.score ?? Object.values(breakdown).reduce((sum, value) => sum + Number(value || 0), 0);
  box.innerHTML = `<h3>總分：${escapeHtml(String(total))} / 100</h3>`;
  const bars = document.createElement("div");
  bars.className = "scoreBars";
  [
    ["realProblem", "真實問題"],
    ["aiWebsite", "AI網站功能"],
    ["hardwareIot", "Micro:bit/IoT"],
    ["feasibility", "可製作性"],
    ["showcase", "展示/比賽"]
  ].forEach(([key, label]) => {
    const value = Number(breakdown[key] ?? breakdown[label] ?? 0);
    const row = document.createElement("div");
    row.className = "scoreRow";
    row.innerHTML = `<span>${label}</span><div class="bar"><span style="width:${Math.max(0, Math.min(100, value / 20 * 100))}%"></span></div><strong>${value}</strong>`;
    bars.appendChild(row);
  });
  box.appendChild(bars);
  box.appendChild(renderListBlock("優點", data.strengths));
  box.appendChild(renderListBlock("改良建議", data.improvements || data.suggestions));
  box.appendChild(renderListBlock("安全與私隱", data.privacySafety || data.safety));
  appendSources(box, data.sources);
  $("score").replaceChildren(box);
}

function renderProposal(data) {
  const proposal = data.proposal || data;
  const box = document.createElement("div");
  box.className = "proposalBox markdown";
  box.textContent = toMarkdown(proposal);
  $("proposal").replaceChildren(box);
}

function renderImage(data) {
  const box = document.createElement("div");
  box.className = "imageBox";
  const imageSrc = data.imageUrl || (data.b64Json ? `data:image/png;base64,${data.b64Json}` : "");
  if (imageSrc) {
    box.innerHTML = `<img src="${imageSrc}" alt="產品預覽圖"><p>模型：${escapeHtml(data.generatedFrom || "gpt-image-2")}；品質：${escapeHtml(data.quality || "low")}</p>`;
  } else {
    box.textContent = "未能取得圖片，請稍後再試。";
  }
  $("image").replaceChildren(box);
}

function renderSensors(data) {
  const panel = $("sensors");
  const strip = document.createElement("div");
  strip.className = "hardwareStrip";
  strip.innerHTML = `
    <img src="/assets/ai-plant-guardian-button.png" alt="">
    <img src="/assets/math-comic-studio-button.png" alt="">
    <img src="/assets/ai-invention-showcase-button.png" alt="">
  `;
  const grid = document.createElement("div");
  grid.className = "sensorGrid";
  (data.sensors || []).forEach((sensor) => {
    const card = document.createElement("article");
    card.className = "resultCard";
    card.innerHTML = `
      <h3>${escapeHtml(sensor.name)}</h3>
      <ul class="metaList">
        <li><strong>類型：</strong>${escapeHtml(sensor.type)}</li>
        <li><strong>可感測：</strong>${escapeHtml(asText(sensor.senses))}</li>
        <li><strong>用途：</strong>${escapeHtml(asText(sensor.teacherUses))}</li>
        <li><a href="${escapeHtml(sensor.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sensor.sourceTitle)}</a></li>
      </ul>
    `;
    grid.appendChild(card);
  });
  panel.replaceChildren(strip, grid);
}

function renderJson(tabId, data) {
  const pre = document.createElement("pre");
  pre.className = "proposalBox markdown";
  pre.textContent = JSON.stringify(data, null, 2);
  $(tabId).replaceChildren(pre);
}

function renderListBlock(title, items) {
  const section = document.createElement("section");
  const list = Array.isArray(items) ? items : (items ? [items] : []);
  section.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
  const ul = document.createElement("ul");
  ul.className = "metaList";
  list.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = asText(item);
    ul.appendChild(li);
  });
  section.appendChild(ul);
  return section;
}

function appendSources(parent, sources) {
  const rows = Array.isArray(sources) ? sources : [];
  if (!rows.length) return;
  const box = document.createElement("div");
  box.className = "sourceList";
  box.innerHTML = "<strong>參考來源</strong>";
  rows.forEach((source) => {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = source.url || "#";
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = source.title || source.url || "來源";
    p.appendChild(a);
    box.appendChild(p);
  });
  parent.appendChild(box);
}

function activateTab(id) {
  state.activeTab = id;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === id));
  document.querySelectorAll(".tabPanel").forEach((panel) => panel.classList.toggle("active", panel.id === id));
}

function setStatus(message, kind = "") {
  const status = $("status");
  status.textContent = message;
  status.className = `statusLine ${kind}`.trim();
}

function setBusy(busy) {
  ["suggestBtn", "scoreBtn", "proposalBtn", "imageBtn"].forEach((id) => {
    $(id).disabled = busy;
  });
}

async function copyCurrent() {
  const text = currentText();
  await navigator.clipboard.writeText(text);
  setStatus("已複製目前結果。", "ok");
}

function downloadCurrent(type) {
  const data = type === "json" ? JSON.stringify(state.lastResult || {}, null, 2) : currentText();
  const blob = new Blob([data], { type: type === "json" ? "application/json" : "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-invention-${new Date().toISOString().slice(0, 10)}.${type}`;
  a.click();
  URL.revokeObjectURL(url);
}

function currentText() {
  const panel = $(state.activeTab);
  return panel?.innerText?.trim() || JSON.stringify(state.lastResult || {}, null, 2);
}

function toMarkdown(value, depth = 0) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => `- ${toMarkdown(item, depth + 1)}`).join("\n");
  return Object.entries(value).map(([key, item]) => {
    const title = key.replace(/([A-Z])/g, " $1").trim();
    const prefix = depth === 0 ? `## ${title}` : `**${title}**`;
    return `${prefix}\n${toMarkdown(item, depth + 1)}`;
  }).join("\n\n");
}

function asText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("、");
  if (value && typeof value === "object") return Object.values(value).filter(Boolean).join("、");
  return String(value || "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
