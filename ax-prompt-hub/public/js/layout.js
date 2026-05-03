window.Layout = {
  currentPage() {
    const file = location.pathname.split("/").pop() || "index.html";
    const params = new URLSearchParams(location.search);
    if (file === "index.html") return "all";
    if (file === "my.html" && params.get("tab") === "saved") return "saved";
    if (file === "my.html") return "my";
    if (file === "search.html") return "category";
    if (file === "new.html" || file === "edit.html") return "new";
    return "";
  },
  mount(options) {
    const active = this.currentPage();
    const title = options && options.title ? options.title : "AX PromptHub";
    const subtitle = options && options.subtitle ? options.subtitle : "사내 프롬프트를 검색하고 공유하는 업무 허브";
    const showCreate = !options || options.showCreate !== false;

    $("body").prepend(`
      <div class="app-shell">
        <aside class="sidebar">
          <a class="brand" href="index.html">
            <span class="brand-mark">A</span>
            <span>AX PromptHub</span>
          </a>

          <nav class="side-nav">
            <div class="nav-section">MAIN</div>
            ${this.nav("all", "전체 프롬프트", "layout-dashboard", "index.html", active)}
            ${this.nav("category", "검색 / 카테고리", "search", "search.html", active)}
            ${this.nav("new", "프롬프트 등록", "file-plus-2", "new.html", active)}

            <div class="nav-section">USER</div>
            ${this.nav("my", "내 프롬프트", "user-round", "my.html", active)}
            ${this.nav("saved", "즐겨찾기", "star", "my.html?tab=saved", active)}
          </nav>

          <div class="side-footer">
            <span class="avatar">김</span>
            <div>
              <strong>김대현</strong>
              <small>기획기획팀</small>
            </div>
          </div>
        </aside>

        <section class="workspace">
          <main class="main">
            <header class="page-head">
              <div>
                <h1>${title}</h1>
                <p class="subtitle">${subtitle}</p>
              </div>
              ${showCreate ? `<a class="btn primary" href="new.html"><i data-lucide="plus"></i>프롬프트 등록</a>` : ""}
            </header>
            <div id="page-root"></div>
          </main>
        </section>
      </div>
    `);
    lucide.createIcons();
  },
  nav(key, label, icon, href, active) {
    return `<a class="nav-link ${active === key ? "active" : ""}" href="${href}">
      <span class="nav-main"><i data-lucide="${icon}"></i>${label}</span><span>+</span>
    </a>`;
  },
  toast(message) {
    $(".toast").remove();
    const $toast = $(`<div class="toast">${message}</div>`).appendTo("body");
    setTimeout(() => $toast.fadeOut(200, () => $toast.remove()), 2200);
  }
};
