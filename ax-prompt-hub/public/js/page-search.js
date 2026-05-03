$(function () {
  Layout.mount({
    title: "AX 프롬프트 공유 사이트",
    accent: "검색",
    subtitle: "키워드, 카테고리, 태그로 필요한 프롬프트를 빠르게 찾습니다."
  });

  $("#page-root").html(`
    <section class="panel">
      <form class="toolbar" id="search-form">
        <label class="searchbox">
          <i data-lucide="search"></i>
          <input id="q" placeholder="검색어 입력">
        </label>
        <button class="btn primary">검색</button>
      </form>
      <div class="filters">
        <select id="category"><option value="">전체 카테고리</option>${Shared.categories.map(item => `<option>${item}</option>`).join("")}</select>
        <select id="tag"><option value="">전체 태그</option></select>
        <select id="sort">
          <option value="popular">인기순</option>
          <option value="latest">최신순</option>
          <option value="comments">댓글순</option>
        </select>
        <button class="btn" id="reset" type="button">초기화</button>
      </div>
      <div class="category-layout">
        <aside class="filter-box">
          <h3 class="section-title">카테고리</h3>
          <div id="category-list"></div>
          <h3 class="section-title" style="margin-top:22px">태그</h3>
          <div id="tag-list"></div>
        </aside>
        <section>
          <h2 class="panel-title">검색 결과 <span id="result-count">(0)</span></h2>
          <div id="result-list"></div>
        </section>
      </div>
    </section>
  `);

  const params = Shared.query();
  $("#q").val(params.q || "");

  function buildFilters(prompts) {
    const tags = [...new Set(prompts.flatMap(item => item.tags || []))].sort();
    $("#tag").append(tags.map(tag => `<option>${tag}</option>`).join(""));
    $("#category-list").html(Shared.categories.map(category => {
      const count = prompts.filter(item => item.category === category).length;
      return `<button class="filter-item js-category" data-value="${category}"><span>${category}</span><span>${count}</span></button>`;
    }).join(""));
    $("#tag-list").html(tags.slice(0, 10).map(tag => {
      const count = prompts.filter(item => (item.tags || []).includes(tag)).length;
      return `<button class="filter-item js-tag" data-value="${tag}"><span>${tag}</span><span>${count}</span></button>`;
    }).join(""));
  }

  function load() {
    PromptApi.list({
      q: $("#q").val(),
      category: $("#category").val(),
      tag: $("#tag").val(),
      sort: $("#sort").val()
    }).then(({ prompts }) => {
      $("#result-count").text(`(${prompts.length})`);
      Shared.renderPromptList($("#result-list"), prompts);
    });
  }

  PromptApi.list().then(({ prompts }) => {
    buildFilters(prompts);
    load();
  });
  $("#search-form").on("submit", function (event) {
    event.preventDefault();
    load();
  });
  $("#category,#tag,#sort").on("change", load);
  $("#reset").on("click", function () {
    $("#q,#category,#tag").val("");
    $("#sort").val("popular");
    load();
  });
  $(document).on("click", ".js-category", function () {
    $("#category").val($(this).data("value"));
    load();
  });
  $(document).on("click", ".js-tag", function () {
    $("#tag").val($(this).data("value"));
    load();
  });
  Shared.bindFavorite(load);

  lucide.createIcons();
});
