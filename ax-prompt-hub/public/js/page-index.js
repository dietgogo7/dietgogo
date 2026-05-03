$(function () {
  Layout.mount({
    title: "AX 프롬프트 공유 사이트",
    accent: "메인",
    subtitle: "사내에서 검증된 프롬프트를 검색하고 빠르게 재사용하세요."
  });

  $("#page-root").html(`
    <section class="dashboard-grid" id="dashboard-summary"></section>
    <section class="panel">
      <div class="toolbar">
        <form class="searchbox" id="search-form">
          <i data-lucide="search"></i>
          <input id="q" placeholder="프롬프트, 태그, 작성자 검색">
        </form>
        <a class="btn primary" href="new.html"><i data-lucide="plus"></i>등록</a>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab active" data-sort="popular">인기순</button>
        <button class="tab" data-sort="latest">최신순</button>
        <button class="tab" data-sort="comments">댓글순</button>
      </div>
      <div id="prompt-list"></div>
    </section>
  `);

  let sort = "popular";
  function renderDashboard(prompts) {
    const totalStars = prompts.reduce((sum, prompt) => sum + Number(prompt.starCount || 0), 0);
    const totalComments = prompts.reduce((sum, prompt) => sum + Number(prompt.commentCount || 0), 0);
    const categories = new Set(prompts.map(prompt => prompt.category)).size;
    $("#dashboard-summary").html(`
      <article class="stat-card">
        <span class="stat-icon"><i data-lucide="file-text"></i></span>
        <strong>${prompts.length}</strong>
        <span>등록 프롬프트</span>
      </article>
      <article class="stat-card">
        <span class="stat-icon youtube"><i data-lucide="star"></i></span>
        <strong>${totalStars}</strong>
        <span>누적 Star</span>
      </article>
      <article class="stat-card">
        <span class="stat-icon instagram"><i data-lucide="messages-square"></i></span>
        <strong>${totalComments}</strong>
        <span>공유 댓글</span>
      </article>
      <article class="hero-card">
        <div>
          <div class="avatar-stack">
            <span class="mini-avatar">김</span>
            <span class="mini-avatar green">이</span>
            <span class="mini-avatar blue">박</span>
            <span class="mini-avatar count">${categories}</span>
          </div>
          <h2>검증된 프롬프트를 팀 자산으로 연결하세요</h2>
          <p>검색, Star, 댓글을 통해 업무에 바로 쓸 수 있는 프롬프트를 빠르게 찾고 개선할 수 있습니다.</p>
        </div>
        <a href="search.html" class="text-link">Get Started</a>
      </article>
    `);
    lucide.createIcons();
  }

  function load() {
    PromptApi.list({ q: $("#q").val(), sort }).then(({ prompts }) => {
      renderDashboard(prompts);
      Shared.renderPromptList($("#prompt-list"), prompts);
    });
  }

  $("#search-form").on("submit", function (event) {
    event.preventDefault();
    location.href = `search.html?q=${encodeURIComponent($("#q").val())}`;
  });
  $(".tab").on("click", function () {
    $(".tab").removeClass("active");
    $(this).addClass("active");
    sort = $(this).data("sort");
    load();
  });
  Shared.bindFavorite(load);

  load();
  lucide.createIcons();
});
