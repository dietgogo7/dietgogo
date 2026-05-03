$(function () {
  Layout.mount({
    title: "AX 프롬프트 공유 사이트",
    accent: "상세",
    subtitle: "프롬프트 본문과 활용 예시, 댓글을 한 화면에서 확인합니다.",
    showCreate: false
  });

  const id = Shared.query().id;
  if (!id) {
    $("#page-root").html(`<div class="empty">프롬프트 ID가 없습니다.</div>`);
    return;
  }

  function renderComments(prompt) {
    const comments = prompt.comments || [];
    if (!comments.length) return `<div class="empty">첫 댓글을 남겨보세요.</div>`;
    return comments.map(comment => `
      <article class="comment">
        <span class="avatar">${comment.authorName.slice(0, 1)}</span>
        <div>
          <strong>${comment.authorName}</strong>
          <span class="meta">${comment.authorTeam} · ${Shared.formatDate(comment.createdAt)}</span>
          <p>${comment.content}</p>
        </div>
        <span>좋아요 ${comment.likeCount}</span>
      </article>
    `).join("");
  }

  function render(prompt) {
    $("#page-root").html(`
      <section class="panel detail-card">
        <div class="detail-head">
          <span class="circle-icon"><i data-lucide="${Shared.iconFor(prompt.category)}"></i></span>
          <div>
            <h2>${prompt.title}</h2>
            <div class="meta">${prompt.authorName} · ${prompt.authorTeam} · ${Shared.formatDate(prompt.createdAt)}</div>
            <div class="meta" style="margin-top:10px">${Shared.tagsHtml(prompt.tags)}</div>
          </div>
          <div class="detail-actions">
            <button class="btn js-star ${prompt.saved ? "active-favorite" : ""}">
              <i data-lucide="star"></i>${prompt.saved ? "즐겨찾기 해제" : "즐겨찾기"} ${prompt.starCount}
            </button>
            <a class="btn" href="edit.html?id=${prompt.id}"><i data-lucide="pencil"></i>수정</a>
          </div>
        </div>
        <section class="detail-section">
          <h3 class="section-title">사용 목적</h3>
          <p>${prompt.summary}</p>
        </section>
        <section class="detail-section">
          <h3 class="section-title">프롬프트 본문</h3>
          <div class="prompt-body">${prompt.body}</div>
          <button class="btn" id="copy-body" style="margin-top:12px"><i data-lucide="copy"></i>본문 복사</button>
        </section>
        <section class="detail-section">
          <h3 class="section-title">활용 예시</h3>
          <p>${prompt.example || "등록된 활용 예시가 없습니다."}</p>
        </section>
        <section class="detail-section">
          <h3 class="section-title">댓글 (${prompt.commentCount})</h3>
          <div id="comments">${renderComments(prompt)}</div>
          <form class="comment-form" id="comment-form">
            <input id="comment" placeholder="댓글을 입력하세요">
            <button class="btn primary">등록</button>
          </form>
        </section>
      </section>
    `);
    lucide.createIcons();
  }

  function load() {
    PromptApi.get(id).then(({ prompt }) => render(prompt));
  }

  $(document).on("click", ".js-star", function () {
    PromptApi.toggleStar(id).then(({ prompt }) => {
      render(prompt);
      Layout.toast(prompt.saved ? "즐겨찾기에 추가했습니다." : "즐겨찾기에서 제거했습니다.");
    });
  });
  $(document).on("click", "#copy-body", function () {
    navigator.clipboard.writeText($(".prompt-body").text()).then(() => Layout.toast("본문을 복사했습니다."));
  });
  $(document).on("submit", "#comment-form", function (event) {
    event.preventDefault();
    PromptApi.addComment(id, $("#comment").val()).then(({ prompt }) => {
      render(prompt);
      Layout.toast("댓글을 등록했습니다.");
    });
  });

  load();
});
