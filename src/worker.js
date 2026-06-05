const PROJECT_KEY = "ai-invention-planner";
const PROXY_BASE = "https://lwwf-ai-proxy.lwwfaiteams.workers.dev";

const rubric = [
  { key: "realProblem", label: "真實問題", max: 20 },
  { key: "aiWebsite", label: "AI網站功能", max: 20 },
  { key: "hardwareIot", label: "Micro:bit/感測器/IoT", max: 20 },
  { key: "feasibility", label: "可製作性", max: 20 },
  { key: "showcase", label: "展示及比賽潛力", max: 20 }
];

const sourceContext = {
  meetingDate: "2026-06-05",
  schoolDirection: [
    "延續 AI INFINITY 作校本 AI 發展方向",
    "建立教師共享、學生作品展示、比賽證據保存及網站維護流程",
    "強化 AI 倫理、資料私隱、作品版權、AI 生成內容檢核及學生使用指引",
    "啟潛堂以真實問題、Micro:bit/感測器、Vibe Coding、AI 生成工具作主軸",
    "作品由原型製作延伸至比賽及公開展示，並安排匯報及問答練習"
  ],
  exhibitionWorks: [
    { rank: 1, title: "轉角守護者", votes: 54, summary: "防撞器主題，適合延伸為安全感測與提醒系統。" },
    { rank: 2, title: "AI 植物守護神", votes: 48, summary: "Micro:bit 智能盆栽結合 Vibe Coding 網站，支援補水、補光、保濕、散熱、AI 安全守衛。" },
    { rank: 3, title: "AI 中華文化試身室", votes: 45, summary: "以 AI 與中華服飾為橋梁，連結科技與文化。" },
    { rank: 4, title: "悅讀新體驗：智能圖書推廣APP", votes: 39, summary: "AI 摘要、朗讀、閱讀回饋與圖書推廣。" },
    { rank: 5, title: "友愛同盟-有男有女", votes: 37, summary: "反欺凌與關愛文化推廣。" },
    { rank: 6, title: "數學漫畫變身器", votes: 33, summary: "將數學文字題轉為四格漫畫、長棒圖與解題步驟。" },
    { rank: 7, title: "友愛同盟- The Boys", votes: 27, summary: "反欺凌與守護同學文化。" },
    { rank: 8, title: "夢幻花園", votes: 24, summary: "模型造景，可延伸為環境感測或互動燈光。" },
    { rank: 9, title: "友愛同盟 - 信憶", votes: 20, summary: "反欺凌與校園關愛。" },
    { rank: 10, title: "叢林公園及水上樂園", votes: 15, summary: "模型場景，可延伸為水位、溫度、燈光或人流互動。" },
    { rank: 11, title: "親子樂園", votes: 12, summary: "親子場景模型，可延伸為安全與排隊互動。" },
    { rank: 12, title: "花花公園", votes: 11, summary: "花卉主題模型，可結合光線、濕度與生態提示。" },
    { rank: 13, title: "笑臉樂園", votes: 7, summary: "遊樂園模型，可加入情緒、聲音或距離觸發。" }
  ],
  competitions: [
    "學生創新大賽",
    "全港青少年 STEAM 科技大賽",
    "國民身份認同應用程式設計比賽",
    "AI短視頻、AI有聲書、AI繪畫及應用程式設計比賽",
    "機甲、無人機、編程、數理及科學幻想畫活動"
  ]
};

const sensorCatalog = [
  {
    id: "microbit-built-in",
    name: "micro:bit 內置感測器",
    type: "主控板/內置感測",
    worksWith: ["micro:bit"],
    senses: ["溫度", "光線", "聲音", "加速度", "方向", "觸摸"],
    teacherUses: ["環境記錄", "搖晃觸發", "方向導航", "聲音提醒", "簡易 IoT 資料收集"],
    sourceTitle: "micro:bit Sensors",
    sourceUrl: "https://microbit.org/get-started/features/sensors/"
  },
  {
    id: "robotbit",
    name: "KittenBot Robotbit",
    type: "micro:bit 機械人擴展板",
    worksWith: ["micro:bit", "Robotbit"],
    senses: ["外接感測器", "馬達", "舵機", "RGB燈", "蜂鳴器"],
    teacherUses: ["推動模型移動", "舵機開關", "互動裝置", "燈光提示", "機械結構原型"],
    sourceTitle: "KittenBot Robotbit Robotics Expansion Board",
    sourceUrl: "https://www.kittenbot.cc/products/robotbit-robotics-expansion-board-for-micro-bit"
  },
  {
    id: "iobit",
    name: "KittenBot IOBit",
    type: "micro:bit IO 擴展板",
    worksWith: ["micro:bit", "KittenBot"],
    senses: ["3-pin 感測器", "5V/3.3V 模組", "蜂鳴器", "耳機輸出"],
    teacherUses: ["連接更多感測器", "安全接線", "聲音提示", "快速課堂原型"],
    sourceTitle: "KittenBot IOBit Documentation",
    sourceUrl: "https://kittenbot-doc-en.readthedocs.io/en/latest/shield/IObit/iobit.html"
  },
  {
    id: "koi-camera",
    name: "KittenBot KOI AI Camera",
    type: "AI 視覺/語音模組",
    worksWith: ["micro:bit", "KittenBot", "Arduino"],
    senses: ["人臉", "物件分類", "顏色", "QR Code", "語音", "MQTT IoT"],
    teacherUses: ["垃圾分類", "人流辨識", "特定物件識別", "語音控制", "AIoT 展示"],
    sourceTitle: "KittenBot KOI AI Camera",
    sourceUrl: "https://kittenbot-doc-en.readthedocs.io/en/latest/modules/KOI/index.html"
  },
  {
    id: "sugar-tof",
    name: "KittenBot Sugar ToF Distance Module",
    type: "距離感測器",
    worksWith: ["micro:bit", "KittenBot", "Robotbit"],
    senses: ["精準距離", "接近偵測"],
    teacherUses: ["防撞提示", "門口人流", "手勢觸發", "互動樂器", "安全距離提醒"],
    sourceTitle: "KittenBot Sugar ToF Distance Module",
    sourceUrl: "https://www.kittenbot.cc/products/kittenbot-sugar-module-for-microbit-arduino-projects-tof-distance-sensor"
  }
];

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return preflight();
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health" && request.method === "GET") return handleHealth(request, env);
      if (url.pathname === "/api/sensor-catalog" && request.method === "GET") return json({ sensors: sensorCatalog, rubric, sourceContext });
      if (url.pathname === "/api/source-context" && request.method === "GET") return json({ sourceContext, rubric });

      if (url.pathname === "/api/suggest-themes" && request.method === "POST") return requireTeacher(request, env, () => handleSuggest(request, env));
      if (url.pathname === "/api/score-concept" && request.method === "POST") return requireTeacher(request, env, () => handleScore(request, env));
      if (url.pathname === "/api/build-proposal" && request.method === "POST") return requireTeacher(request, env, () => handleProposal(request, env));
      if (url.pathname === "/api/generate-preview-image" && request.method === "POST") return requireTeacher(request, env, () => handlePreviewImage(request, env));

      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ error: "Not found", path: url.pathname }, 404);
    } catch (error) {
      return json({ error: getErrorMessage(error, "Request failed") }, 500);
    }
  }
};

async function handleHealth(request, env) {
  const proxy = await callProxy(env, "/health", null, "GET", false).catch((error) => ({
    ok: false,
    status: 0,
    body: { error: getErrorMessage(error, "Proxy unavailable") }
  }));

  return json({
    ok: true,
    service: "lwwf-ai-invention-planner",
    project: PROJECT_KEY,
    teacherAuthConfigured: Boolean(env.TEACHER_PW),
    proxyConfigured: Boolean(env.LWWF_PROXY_TOKEN),
    proxy
  });
}

async function handleSuggest(request, env) {
  const body = await readBody(request);
  const payload = {
    mode: "suggest",
    theme: clean(body.theme, 80),
    grade: clean(body.grade, 20),
    subject: clean(body.subject, 80),
    studentNeed: clean(body.studentNeed, 320),
    constraints: clean(body.constraints, 320),
    preferredHardware: clean(body.preferredHardware, 120),
    sourceContext,
    sensorCatalog,
    rubric
  };
  if (!payload.theme) return json({ error: "請先選擇或輸入主題。" }, 400);
  const proxy = await callProxy(env, "/v1/invention/alibaba-research", payload);
  return json({ ...proxy.body, proxyStatus: proxy.status }, proxy.status);
}

async function handleScore(request, env) {
  const body = await readBody(request);
  const payload = {
    mode: "score",
    title: clean(body.title, 100),
    theme: clean(body.theme, 80),
    problem: clean(body.problem, 500),
    aiWebsite: clean(body.aiWebsite, 700),
    hardware: clean(body.hardware, 700),
    iot: clean(body.iot, 500),
    materials: clean(body.materials, 500),
    sourceContext,
    sensorCatalog,
    rubric
  };
  if (!payload.title && !payload.problem) return json({ error: "請先輸入作品名稱或想解決的問題。" }, 400);
  const proxy = await callProxy(env, "/v1/invention/alibaba-research", payload);
  return json({ ...proxy.body, proxyStatus: proxy.status }, proxy.status);
}

async function handleProposal(request, env) {
  const body = await readBody(request);
  const concept = {
    title: clean(body.title, 100),
    theme: clean(body.theme, 80),
    problem: clean(body.problem, 500),
    aiWebsite: clean(body.aiWebsite, 900),
    hardware: clean(body.hardware, 900),
    iot: clean(body.iot, 700),
    scoreResult: body.scoreResult || null,
    selectedSuggestion: body.selectedSuggestion || null
  };
  if (!concept.title && !concept.problem && !concept.selectedSuggestion) {
    return json({ error: "請先輸入或選擇一個作品構思。" }, 400);
  }

  const messages = [
    {
      role: "system",
      content: [
        "你是香港小學 AI/STEAM 發明品課程顧問。",
        "請用繁體中文，為老師產出可直接帶學生開展的完整作品構思書。",
        "必須同時包含 AI 網站軟件部分、micro:bit/Robotbit/KittenBot 硬件部分、IoT 互動、AI 功能、製作步驟、展示講稿和比賽賣點。",
        "不要要求使用付費前端秘密值；不要收集學生個人資料。",
        "Return only valid JSON."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ concept, sourceContext, sensorCatalog, rubric })
    }
  ];

  const proxy = await callProxy(env, "/v1/chat/completions", {
    model: env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.35
  });
  const content = proxy.body?.choices?.[0]?.message?.content;
  const parsed = parseJson(content) || { raw: content };
  return json({
    mode: "proposal",
    generatedFrom: "chatgpt",
    model: proxy.body?.model || env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    proposal: parsed
  }, proxy.status);
}

async function handlePreviewImage(request, env) {
  const body = await readBody(request);
  const title = clean(body.title || body.selectedSuggestion?.title, 100);
  const aiWebsite = clean(body.aiWebsite || body.selectedSuggestion?.aiWebsite, 600);
  const hardware = clean(body.hardware || body.selectedSuggestion?.hardware, 600);
  const physical = clean(body.physicalObject || body.problem || body.selectedSuggestion?.problem, 500);
  if (!title && !hardware && !physical) return json({ error: "請先選擇或輸入作品構思。" }, 400);

  const prompt = [
    "Create a realistic concept preview image for a Hong Kong primary school STEAM invention project.",
    "No text, no logo, no watermark, no human faces.",
    `Project title: ${title || "AI STEAM invention"}.`,
    `AI website software part: ${aiWebsite || "a laptop web dashboard with AI analysis and teacher-friendly controls"}.`,
    `Hardware part: ${hardware || "micro:bit with Robotbit or KittenBot sensor modules"}.`,
    `Physical object or scene: ${physical || "a classroom prototype model with cardboard, wires, LEDs and sensors"}.`,
    "The image must clearly include a laptop web interface, a micro:bit-style board, Robotbit or KittenBot sensor modules, wires, and a physical prototype object.",
    "Style: bright, practical, realistic classroom maker table product photo, low-cost school materials, clean composition, inspectable details."
  ].join(" ");

  const proxy = await callProxy(env, "/v1/images/generations", {
    model: env.IMAGE_MODEL || "gpt-image-2",
    prompt,
    size: env.IMAGE_SIZE || "1024x1024",
    quality: env.IMAGE_QUALITY || "low",
    n: 1
  });
  const first = proxy.body?.data?.[0] || {};
  return json({
    mode: "preview-image",
    generatedFrom: "gpt-image-2",
    quality: env.IMAGE_QUALITY || "low",
    prompt,
    imageUrl: first.url || null,
    b64Json: first.b64_json || null,
    raw: proxy.body
  }, proxy.status);
}

async function callProxy(env, path, body = null, method = "POST", auth = true) {
  const base = env.AI_PROXY_BASE || PROXY_BASE;
  const target = new URL(path, base);
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    if (!env.LWWF_PROXY_TOKEN) throw new Error("LWWF_PROXY_TOKEN is not configured");
    headers["X-LWWF-Auth"] = env.LWWF_PROXY_TOKEN;
    headers["X-LWWF-Project"] = env.LWWF_PROJECT || PROJECT_KEY;
  }
  const init = {
    method,
    headers,
    body: body == null || method === "GET" ? undefined : JSON.stringify(body)
  };
  const request = new Request(target.toString(), init);
  const response = env.AI_PROXY ? await env.AI_PROXY.fetch(request) : await fetch(request);
  const payload = await readJsonOrText(response);
  return { ok: response.ok, status: response.status, body: payload };
}

async function requireTeacher(request, env, next) {
  const configured = clean(env.TEACHER_PW, 200);
  if (!configured) return json({ error: "TEACHER_PW is not configured" }, 500);
  const provided = clean(request.headers.get("X-Teacher-Pass") || request.headers.get("x-lwwf-pass"), 200);
  if (!provided || !timingSafeEqual(provided, configured)) return json({ error: "Unauthorized" }, 401);
  return next();
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function readJsonOrText(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  const text = String(value).trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function clean(value, max = 260) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(String(a));
  const right = new TextEncoder().encode(String(b));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function preflight() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Teacher-Pass, x-lwwf-pass",
    "Access-Control-Max-Age": "86400"
  };
}
