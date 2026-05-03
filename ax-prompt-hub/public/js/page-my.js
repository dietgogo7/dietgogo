$(function () {
  const initialTab = Shared.query().tab === "saved" ? "saved" : "mine";
  Layout.mount({
    title: "AX 프롬프트 공유 사이트",
    accent: "내 목록",
    subtitle: "내가 작성한 프롬프트와 즐겨찾기한 프롬프트를 관리합니다.",
    showCreate: false
  });

  $("#page-root").html(`
    <section class="panel">
      <div class="summary-grid">
        <div class="summary-card">
          <span class="circle-icon"><i data-lucide="file-text"></i></span>
          <div>내 프롬프트<strong id="mine-count">0</strong></div>
        </div>
        <div class="summary-card">
          <span class="circle-icon"><i data-lucide="star"></i></span>
          <div>즐겨찾기<strong id="saved-count">0</strong></div>
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${initialTab === "mine" ? "active" : ""}" data-tab="mine">내 프롬프트</button>
        <button class="tab ${initialTab === "saved" ? "active" : ""}" data-tab="saved">즐겨찾기</button>
      </div>
      <div id="my-list"></div>
    </section>
  `);

  let tab = initialTab;
  let cache = [];

  function paint() {
    $("#mine-count").text(cache.filter(item => item.authorName === "김대현").length);
    $("#saved-count").text(cache.filter(item => item.saved).length);
    const rows = tab === "mine"
      ? cache.filter(item => item.authorName === "김대현")
      : cache.filter(item => item.saved);
    Shared.renderPromptList($("#my-list"), rows, { actions: tab === "mine" });
  }

  function load() {
    PromptApi.list({ sort: "latest" }).then(({ prompts }) => {
      cache = prompts;
      paint();
    });
  }

  $(".tab").on("click", function () {
    $(".tab").removeClass("active");
    $(this).addClass("active");
    tab = $(this).data("tab");
    history.replaceState(null, "", tab === "saved" ? "my.html?tab=saved" : "my.html");
    paint();
  });
  $(document).on("click", ".js-edit", function () {
    location.href = `edit.html?id=${$(this).data("id")}`;
  });
  $(document).on("click", ".js-delete", function () {
    if (!confirm("이 프롬프트를 삭제할까요?")) return;
    PromptApi.remove($(this).data("id")).then(() => {
      Layout.toast("삭제했습니다.");
      load();
    });
  });
  Shared.bindFavorite(load);

  load();
  lucide.createIcons();
});
