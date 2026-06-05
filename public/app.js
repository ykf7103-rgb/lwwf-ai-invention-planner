const state = {
  sensors: [],
  sourceContext: {},
  lastResult: null,
  selectedSuggestion: null,
  checkedSuggestions: [],
  activeTab: "suggestions",
  workflow: "input",
  scoreResult: null,
  proposalResult: null,
  imageResult: null
};

const $ = (id) => document.getElementById(id);
const RECORD_KEY = "lwwf-ai-invention-records-v1";

const fields = {
  pass: $("teacherPass"),
  teacherName: $("teacherName"),
  theme: $("theme"),
  subject: $("subject"),
  grade: $("grade"),
  problemPreset: $("problemPreset"),
  problem: $("problem"),
  aiPreset: $("aiPreset"),
  aiWebsite: $("aiWebsite"),
  hardwarePreset: $("hardwarePreset"),
  hardware: $("hardware"),
  iotPreset: $("iotPreset"),
  iot: $("iot")
};

init();

function init() {
  fields.pass.value = sessionStorage.getItem("teacherPass") || "";
  fields.teacherName.value = localStorage.getItem("teacherName") || "";
  $("savePass").addEventListener("click", savePass);
  $("healthBtn").addEventListener("click", checkHealth);
  $("suggestBtn").addEventListener("click", suggestThemes);
  $("scoreBtn").addEventListener("click", scoreConcept);
  $("proposalBtn").addEventListener("click", buildProposal);
  $("imageBtn").addEventListener("click", generatePreviewImage);
  $("confirmBtn").addEventListener("click", confirmCurrentSelection);
  $("copyBtn").addEventListener("click", copyCurrent);
  $("downloadJsonBtn").addEventListener("click", () => downloadCurrent("json"));
  $("downloadMdBtn").addEventListener("click", () => downloadCurrent("md"));
  $("printBtn").addEventListener("click", () => window.print());
  fields.teacherName.addEventListener("change", () => localStorage.setItem("teacherName", fields.teacherName.value.trim()));
  fields.problemPreset.addEventListener("change", () => applyPreset(fields.problemPreset, fields.problem));
  fields.aiPreset.addEventListener("change", () => applyPreset(fields.aiPreset, fields.aiWebsite));
  fields.hardwarePreset.addEventListener("change", () => applyPreset(fields.hardwarePreset, fields.hardware));
  fields.iotPreset.addEventListener("change", () => applyPreset(fields.iotPreset, fields.iot));
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });
  renderEmpty();
  renderRecords();
  updateWorkflow("input");
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
  localStorage.setItem("teacherName", fields.teacherName.value.trim());
  setStatus("本次通行碼已保存。", "ok");
}

function applyPreset(select, target) {
  if (!select.value) return;
  target.value = select.value;
  setStatus("已套用下拉式選項，可再自行修改。", "ok");
}

function requireTeacherName() {
  const teacherName = fields.teacherName.value.trim();
  if (!teacherName) {
    setStatus("請先在上方輸入老師姓名，然後再生成。", "err");
    fields.teacherName.focus();
    throw new Error("Missing teacher name");
  }
  localStorage.setItem("teacherName", teacherName);
  return teacherName;
}

function getRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECORD_KEY) || "{}");
    return {
      generated: Array.isArray(parsed.generated) ? parsed.generated : [],
      confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed : []
    };
  } catch {
    return { generated: [], confirmed: [] };
  }
}

function setRecords(records) {
  const compact = {
    generated: (records.generated || []).slice(0, 60),
    confirmed: (records.confirmed || []).slice(0, 60)
  };
  localStorage.setItem(RECORD_KEY, JSON.stringify(compact));
  renderRecords();
}

function makeRecord(type, payload, confirmed = false) {
  const teacherName = fields.teacherName.value.trim() || "未填姓名";
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    teacherName,
    type,
    confirmed,
    theme: getTheme(),
    title: getResultTitle(payload),
    summary: getResultSummary(payload),
    createdAt: new Date().toISOString(),
    payload
  };
}

function saveGenerated(type, payload) {
  const records = getRecords();
  records.generated.unshift(makeRecord(type, payload, false));
  setRecords(records);
}

function confirmCurrentSelection() {
  const teacherName = requireTeacherName();
  const records = getRecords();
  const selections = state.checkedSuggestions.length ? state.checkedSuggestions : [];
  const confirmed = [];

  if (selections.length) {
    selections.forEach((item) => confirmed.push(makeRecord("已選構思", item, true)));
  } else if (state.selectedSuggestion) {
    confirmed.push(makeRecord("已套用構思", state.selectedSuggestion, true));
  } else if (state.lastResult) {
    confirmed.push(makeRecord(getResultModeName(state.lastResult), state.lastResult, true));
  }

  if (!confirmed.length) {
    setStatus("請先生成結果，並至少勾選或套用一個結果，才可以確認。", "err");
    return;
  }

  records.confirmed.unshift(...confirmed);
  setRecords(records);
  setStatus(`${teacherName} 已確認 ${confirmed.length} 個結果。`, "ok");
  activateTab("records");
}

function renderRecords() {
  const panel = $("records");
  if (!panel) return;
  const records = getRecords();
  const wrap = document.createElement("div");
  wrap.className = "recordBoard";
  wrap.appendChild(renderRecordSection("老師已確認的結果", records.confirmed, true));
  wrap.appendChild(renderRecordSection("老師曾生成的結果", records.generated, false));
  panel.replaceChildren(wrap);
}

function renderRecordSection(title, rows, confirmed) {
  const section = document.createElement("section");
  section.className = "recordSection";
  section.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "mutedText";
    empty.textContent = confirmed ? "暫時未有已確認結果。" : "暫時未有生成記錄。";
    section.appendChild(empty);
    return section;
  }
  rows.slice(0, 20).forEach((record) => {
    const card = document.createElement("article");
    card.className = `recordCard ${confirmed ? "confirmed" : ""}`;
    card.innerHTML = `
      <div>
        <p class="eyebrow">${escapeHtml(record.type || "記錄")}</p>
        <h3>${escapeHtml(record.title || "未命名結果")}</h3>
        <p>${escapeHtml(record.summary || "")}</p>
      </div>
      <ul class="metaList">
        <li><strong>老師：</strong>${escapeHtml(record.teacherName || "")}</li>
        <li><strong>主題：</strong>${escapeHtml(record.theme || "")}</li>
        <li><strong>時間：</strong>${escapeHtml(formatTime(record.createdAt))}</li>
      </ul>
    `;
    section.appendChild(card);
  });
  return section;
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
  const teacherName = requireTeacherName();
  setStatus("Alibaba/Qwen 正在搜尋及生成 10 個題目...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/suggest-themes", {
      teacherName,
      theme: getTheme(),
      subject: fields.subject.value,
      grade: fields.grade.value,
      studentNeed: fields.problem.value,
      constraints: fields.iot.value,
      preferredHardware: fields.hardware.value
    });
    state.lastResult = data;
    state.checkedSuggestions = [];
    state.selectedSuggestion = null;
    state.scoreResult = null;
    state.proposalResult = null;
    state.imageResult = null;
    setStatus(`已生成 ${Array.isArray(data.suggestions) ? data.suggestions.length : 0} 個建議。`, "ok");
    renderSuggestions(data);
    saveGenerated("建議", data);
    updateWorkflow("suggested");
    activateTab("suggestions");
  } finally {
    setBusy(false);
  }
}

async function scoreConcept() {
  const teacherName = requireTeacherName();
  if (!state.selectedSuggestion) {
    setStatus("請先在 10 個建議中按「選擇這個構思」，才可評分及改良。", "err");
    activateTab("suggestions");
    return;
  }
  setStatus("Alibaba/Qwen 正在按 100 分 rubric 評估構思...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/score-concept", {
      teacherName,
      title: state.selectedSuggestion?.title || "",
      theme: getTheme(),
      problem: fields.problem.value,
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      iot: fields.iot.value,
      materials: fields.iot.value
    });
    state.lastResult = data;
    state.scoreResult = data;
    setStatus(`評分完成：${data.totalScore ?? data.score ?? "已完成"} / 100`, "ok");
    renderScore(data);
    saveGenerated("評分", data);
    updateWorkflow("scored");
    activateTab("score");
  } finally {
    setBusy(false);
  }
}

async function buildProposal() {
  const teacherName = requireTeacherName();
  if (!state.scoreResult) {
    setStatus("請先完成「評分及改良」，才生成構思書。", "err");
    activateTab("score");
    return;
  }
  setStatus("ChatGPT 正在生成完整作品構思書...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/build-proposal", {
      teacherName,
      title: state.selectedSuggestion?.title || "",
      theme: getTheme(),
      problem: fields.problem.value,
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      iot: fields.iot.value,
      selectedSuggestion: state.selectedSuggestion,
      scoreResult: state.scoreResult
    });
    state.lastResult = data;
    state.proposalResult = data;
    setStatus("完整構思書已生成。", "ok");
    renderProposal(data);
    saveGenerated("構思書", data);
    updateWorkflow("proposal");
    activateTab("proposal");
  } finally {
    setBusy(false);
  }
}

async function generatePreviewImage() {
  const teacherName = requireTeacherName();
  if (!state.proposalResult) {
    setStatus("請先生成構思書，才生成產品預覽圖。", "err");
    activateTab("proposal");
    return;
  }
  setStatus("GPT Image 2 正在生成低品質產品預覽圖...", "busy");
  setBusy(true);
  try {
    const data = await api("/api/generate-preview-image", {
      teacherName,
      title: state.selectedSuggestion?.title || "",
      aiWebsite: fields.aiWebsite.value,
      hardware: fields.hardware.value,
      physicalObject: fields.problem.value,
      selectedSuggestion: state.selectedSuggestion
    });
    state.lastResult = data;
    state.imageResult = data;
    setStatus("產品預覽圖已生成。", "ok");
    renderImage(data);
    saveGenerated("預覽圖", data);
    updateWorkflow("image");
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
      <label class="choiceLine">
        <input type="checkbox" class="suggestionCheck">
        <span>選擇此構思作確認候選</span>
      </label>
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
      <button type="button" class="selectSuggestion">選擇這個構思</button>
    `;
    card.querySelector(".suggestionCheck").addEventListener("change", (event) => toggleSuggestionChoice(item, event.target.checked));
    card.querySelector("button").addEventListener("click", () => {
      card.querySelector(".suggestionCheck").checked = true;
      toggleSuggestionChoice(item, true);
      selectSuggestion(item);
    });
    wrap.appendChild(card);
  });
  appendSources(wrap, data.sources);
  $("suggestions").replaceChildren(wrap);
}

function toggleSuggestionChoice(item, checked) {
  const title = item.title || "";
  state.checkedSuggestions = state.checkedSuggestions.filter((row) => (row.title || "") !== title);
  if (checked) state.checkedSuggestions.push(item);
  if (state.checkedSuggestions.length && !state.selectedSuggestion) state.selectedSuggestion = state.checkedSuggestions[0];
  setStatus(`已選擇 ${state.checkedSuggestions.length} 個構思，可按「確認」。`, "ok");
}

function selectSuggestion(item) {
  state.selectedSuggestion = item;
  state.scoreResult = null;
  state.proposalResult = null;
  state.imageResult = null;
  fields.problem.value = item.problem || item.summary || fields.problem.value;
  fields.aiWebsite.value = item.aiWebsite || item.software || fields.aiWebsite.value;
  fields.hardware.value = item.hardware || item.device || fields.hardware.value;
  fields.iot.value = item.iotInteraction || item.iot || fields.iot.value;
  document.querySelectorAll(".selectSuggestion").forEach((button) => {
    button.classList.remove("selected");
    button.textContent = "選擇這個構思";
  });
  const clicked = Array.from(document.querySelectorAll(".selectSuggestion")).find((button) => button.closest(".resultCard")?.querySelector("h3")?.textContent === (item.title || ""));
  if (clicked) {
    clicked.classList.add("selected");
    clicked.textContent = "已選擇";
  }
  setStatus(`已選擇：${item.title || "建議"}。請按下一步評分及改良。`, "ok");
  updateWorkflow("selected");
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

function updateWorkflow(step) {
  state.workflow = step;
  const order = ["input", "suggested", "selected", "scored", "proposal", "image"];
  const flowOrder = ["input", "suggested", "scored", "proposal", "image"];
  const currentIndex = order.indexOf(step);
  const flowIndex = step === "selected" ? 1 : flowOrder.indexOf(step);

  $("scoreBtn").classList.toggle("hidden", step !== "selected");
  $("proposalBtn").classList.toggle("hidden", step !== "scored");
  $("imageBtn").classList.toggle("hidden", step !== "proposal");
  $("confirmBtn").classList.toggle("hidden", !(step === "proposal" || step === "image"));

  document.querySelectorAll(".flowStep").forEach((item, index) => {
    item.classList.toggle("active", index === flowIndex);
    item.classList.toggle("done", index < flowIndex && currentIndex > 0);
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

function getResultModeName(value) {
  if (!value || typeof value !== "object") return "結果";
  if (value.mode === "suggest") return "建議";
  if (value.mode === "score") return "評分";
  if (value.mode === "proposal") return "構思書";
  if (value.mode === "preview-image") return "預覽圖";
  return "結果";
}

function getResultTitle(value) {
  if (!value || typeof value !== "object") return "未命名結果";
  if (value.title) return value.title;
  if (value.proposal?.title) return value.proposal.title;
  if (Array.isArray(value.suggestions) && value.suggestions[0]?.title) return `${value.suggestions.length} 個題目建議`;
  if (value.totalScore || value.score) return `評分 ${value.totalScore ?? value.score} / 100`;
  if (value.imageUrl || value.b64Json) return "產品預覽圖";
  return getResultModeName(value);
}

function getResultSummary(value) {
  if (!value || typeof value !== "object") return "";
  if (value.problem) return value.problem;
  if (value.summary) return value.summary;
  if (value.aiWebsite) return value.aiWebsite;
  if (Array.isArray(value.suggestions)) return value.suggestions.slice(0, 3).map((item) => item.title).filter(Boolean).join("、");
  if (Array.isArray(value.improvements)) return value.improvements.slice(0, 2).join("、");
  if (value.proposal) return asText(value.proposal).slice(0, 160);
  return asText(value).slice(0, 160);
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("zh-Hant-HK", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
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
