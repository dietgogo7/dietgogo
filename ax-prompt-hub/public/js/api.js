const PROMPT_STORAGE_KEY = "ax-prompt-hub-prompts-v1";
const PROMPT_DATA_URL = "../data/prompts.json";

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function apiResolve(payload) {
  const deferred = $.Deferred();
  setTimeout(() => deferred.resolve(cloneData(payload)), 0);
  return deferred.promise();
}

function apiReject(message) {
  const deferred = $.Deferred();
  setTimeout(() => deferred.reject({ responseJSON: { message } }), 0);
  return deferred.promise();
}

function normalizePrompt(input, previous) {
  const now = new Date().toISOString();
  return {
    id: previous && previous.id ? previous.id : `p-${Date.now()}`,
    title: String(input.title || "").trim(),
    summary: String(input.summary || "").trim(),
    category: String(input.category || "").trim(),
    tags: Array.isArray(input.tags) ? input.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
    body: String(input.body || "").trim(),
    example: String(input.example || "").trim(),
    authorName: String(input.authorName || (previous && previous.authorName) || "김대현").trim(),
    authorTeam: String(input.authorTeam || (previous && previous.authorTeam) || "기획기획팀").trim(),
    createdAt: previous && previous.createdAt ? previous.createdAt : now,
    updatedAt: now,
    starCount: Number(input.starCount ?? (previous && previous.starCount) ?? 0),
    commentCount: Number(input.commentCount ?? (previous && previous.commentCount) ?? 0),
    starred: Boolean(input.starred ?? (previous && previous.starred) ?? false),
    saved: Boolean(input.saved ?? (previous && previous.saved) ?? false),
    comments: Array.isArray(input.comments) ? input.comments : (previous && previous.comments) || []
  };
}

function readStoredPrompts() {
  const stored = localStorage.getItem(PROMPT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function writeStoredPrompts(prompts) {
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
}

function loadPrompts() {
  const stored = readStoredPrompts();
  if (stored) return apiResolve(stored);

  return $.getJSON(PROMPT_DATA_URL).then(data => {
    const prompts = data.prompts || [];
    writeStoredPrompts(prompts);
    return cloneData(prompts);
  });
}

function saveAndReturn(prompts, payload) {
  writeStoredPrompts(prompts);
  return apiResolve(payload);
}

window.PromptApi = {
  list(params) {
    const options = params || {};
    return loadPrompts().then(prompts => {
      const q = String(options.q || "").toLowerCase();
      const category = options.category || "";
      const tag = options.tag || "";
      const sort = options.sort || "popular";
      let rows = prompts.slice();

      if (q) {
        rows = rows.filter(prompt =>
          [prompt.title, prompt.summary, prompt.authorName, prompt.category, prompt.body, ...(prompt.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }
      if (category) rows = rows.filter(prompt => prompt.category === category);
      if (tag) rows = rows.filter(prompt => (prompt.tags || []).includes(tag));

      rows.sort((a, b) => {
        if (sort === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "comments") return (b.commentCount || 0) - (a.commentCount || 0);
        return (b.starCount || 0) - (a.starCount || 0);
      });

      return { prompts: cloneData(rows) };
    });
  },
  get(id) {
    return loadPrompts().then(prompts => {
      const prompt = prompts.find(item => item.id === id);
      if (!prompt) return $.Deferred().reject({ responseJSON: { message: "프롬프트를 찾을 수 없습니다." } }).promise();
      return { prompt: cloneData(prompt) };
    });
  },
  create(payload) {
    return loadPrompts().then(prompts => {
      const prompt = normalizePrompt(payload || {});
      if (!prompt.title || !prompt.summary || !prompt.category || !prompt.body) {
        return apiReject("필수 항목을 입력해주세요.");
      }
      prompts.unshift(prompt);
      return saveAndReturn(prompts, { prompt });
    });
  },
  update(id, payload) {
    return loadPrompts().then(prompts => {
      const index = prompts.findIndex(item => item.id === id);
      if (index === -1) return apiReject("프롬프트를 찾을 수 없습니다.");
      const prompt = normalizePrompt(payload || {}, prompts[index]);
      if (!prompt.title || !prompt.summary || !prompt.category || !prompt.body) {
        return apiReject("필수 항목을 입력해주세요.");
      }
      prompts[index] = prompt;
      return saveAndReturn(prompts, { prompt });
    });
  },
  remove(id) {
    return loadPrompts().then(prompts => {
      const next = prompts.filter(item => item.id !== id);
      if (next.length === prompts.length) return apiReject("프롬프트를 찾을 수 없습니다.");
      return saveAndReturn(next, { ok: true });
    });
  },
  toggleStar(id) {
    return loadPrompts().then(prompts => {
      const prompt = prompts.find(item => item.id === id);
      if (!prompt) return apiReject("프롬프트를 찾을 수 없습니다.");
      prompt.saved = !prompt.saved;
      prompt.starred = prompt.saved;
      prompt.starCount = Math.max(0, Number(prompt.starCount || 0) + (prompt.saved ? 1 : -1));
      return saveAndReturn(prompts, { prompt });
    });
  },
  addComment(id, content) {
    return loadPrompts().then(prompts => {
      const prompt = prompts.find(item => item.id === id);
      const comment = String(content || "").trim();
      if (!prompt) return apiReject("프롬프트를 찾을 수 없습니다.");
      if (!comment) return apiReject("댓글을 입력해주세요.");
      prompt.comments = prompt.comments || [];
      prompt.comments.unshift({
        id: `c-${Date.now()}`,
        authorName: "이수연",
        authorTeam: "마케팅팀",
        content: comment,
        createdAt: new Date().toISOString(),
        likeCount: 0
      });
      prompt.commentCount = prompt.comments.length;
      return saveAndReturn(prompts, { prompt });
    });
  },
  reset() {
    localStorage.removeItem(PROMPT_STORAGE_KEY);
    return loadPrompts().then(prompts => ({ prompts }));
  }
};
