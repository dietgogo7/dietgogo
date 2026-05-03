import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const dataFile = path.join(root, "data", "prompts.json");
const port = Number(process.env.PORT || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function normalizePrompt(input, previous = {}) {
  const now = new Date().toISOString();
  return {
    id: previous.id || `p-${Date.now()}`,
    title: String(input.title || "").trim(),
    summary: String(input.summary || "").trim(),
    category: String(input.category || "").trim(),
    tags: Array.isArray(input.tags) ? input.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
    body: String(input.body || "").trim(),
    example: String(input.example || "").trim(),
    authorName: String(input.authorName || previous.authorName || "김대현").trim(),
    authorTeam: String(input.authorTeam || previous.authorTeam || "기획기획팀").trim(),
    createdAt: previous.createdAt || now,
    updatedAt: now,
    starCount: Number(input.starCount ?? previous.starCount ?? 0),
    commentCount: Number(input.commentCount ?? previous.commentCount ?? 0),
    starred: Boolean(input.starred ?? previous.starred ?? false),
    saved: Boolean(input.saved ?? previous.saved ?? false),
    comments: Array.isArray(input.comments) ? input.comments : previous.comments || []
  };
}

async function handleApi(req, res, url) {
  const data = readData();
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[2];

  if (url.pathname === "/api/prompts" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const category = url.searchParams.get("category") || "";
    const tag = url.searchParams.get("tag") || "";
    const sort = url.searchParams.get("sort") || "popular";
    let prompts = data.prompts.slice();

    if (q) {
      prompts = prompts.filter(prompt =>
        [prompt.title, prompt.summary, prompt.authorName, prompt.category, prompt.body, ...(prompt.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (category) prompts = prompts.filter(prompt => prompt.category === category);
    if (tag) prompts = prompts.filter(prompt => (prompt.tags || []).includes(tag));

    prompts.sort((a, b) => {
      if (sort === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "comments") return (b.commentCount || 0) - (a.commentCount || 0);
      return (b.starCount || 0) - (a.starCount || 0);
    });
    return sendJson(res, 200, { prompts });
  }

  if (url.pathname === "/api/prompts" && req.method === "POST") {
    const body = await readBody(req);
    const prompt = normalizePrompt(body);
    if (!prompt.title || !prompt.summary || !prompt.category || !prompt.body) {
      return sendJson(res, 400, { message: "필수 항목을 입력해주세요." });
    }
    data.prompts.unshift(prompt);
    writeData(data);
    return sendJson(res, 201, { prompt });
  }

  if (parts[0] === "api" && parts[1] === "prompts" && id && req.method === "GET") {
    const prompt = data.prompts.find(item => item.id === id);
    if (!prompt) return sendJson(res, 404, { message: "프롬프트를 찾을 수 없습니다." });
    return sendJson(res, 200, { prompt });
  }

  if (parts[0] === "api" && parts[1] === "prompts" && id && req.method === "PUT") {
    const index = data.prompts.findIndex(item => item.id === id);
    if (index === -1) return sendJson(res, 404, { message: "프롬프트를 찾을 수 없습니다." });
    const body = await readBody(req);
    const prompt = normalizePrompt(body, data.prompts[index]);
    if (!prompt.title || !prompt.summary || !prompt.category || !prompt.body) {
      return sendJson(res, 400, { message: "필수 항목을 입력해주세요." });
    }
    data.prompts[index] = prompt;
    writeData(data);
    return sendJson(res, 200, { prompt });
  }

  if (parts[0] === "api" && parts[1] === "prompts" && id && req.method === "DELETE") {
    const before = data.prompts.length;
    data.prompts = data.prompts.filter(item => item.id !== id);
    if (before === data.prompts.length) return sendJson(res, 404, { message: "프롬프트를 찾을 수 없습니다." });
    writeData(data);
    return sendJson(res, 200, { ok: true });
  }

  if (parts[0] === "api" && parts[1] === "prompts" && parts[3] === "star" && req.method === "POST") {
    const prompt = data.prompts.find(item => item.id === id);
    if (!prompt) return sendJson(res, 404, { message: "프롬프트를 찾을 수 없습니다." });
    prompt.starred = !prompt.starred;
    prompt.saved = prompt.starred;
    prompt.starCount = Math.max(0, (prompt.starCount || 0) + (prompt.starred ? 1 : -1));
    writeData(data);
    return sendJson(res, 200, { prompt });
  }

  if (parts[0] === "api" && parts[1] === "prompts" && parts[3] === "comments" && req.method === "POST") {
    const prompt = data.prompts.find(item => item.id === id);
    if (!prompt) return sendJson(res, 404, { message: "프롬프트를 찾을 수 없습니다." });
    const body = await readBody(req);
    const content = String(body.content || "").trim();
    if (!content) return sendJson(res, 400, { message: "댓글을 입력해주세요." });
    prompt.comments = prompt.comments || [];
    prompt.comments.unshift({
      id: `c-${Date.now()}`,
      authorName: body.authorName || "이수연",
      authorTeam: body.authorTeam || "마케팅팀",
      content,
      createdAt: new Date().toISOString(),
      likeCount: 0
    });
    prompt.commentCount = prompt.comments.length;
    writeData(data);
    return sendJson(res, 201, { prompt });
  }

  return sendJson(res, 404, { message: "API 경로를 찾을 수 없습니다." });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/pages/index.html";
  const requested = path.normalize(path.join(publicDir, pathname));
  if (!requested.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  const filePath = fs.existsSync(requested) && fs.statSync(requested).isDirectory()
    ? path.join(requested, "index.html")
    : requested;
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url).catch(error => sendJson(res, 500, { message: error.message }));
    return;
  }
  serveStatic(req, res, url);
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try another port, for example: PORT=4174 npm start`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, () => {
  console.log(`AX PromptHub running at http://localhost:${port}`);
});
