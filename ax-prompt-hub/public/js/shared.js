window.Shared = {
  categories: ["업무 일반", "보고·분석", "기획·전략", "마케팅", "영업·고객", "개발"],
  formatDate(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  },
  iconFor(category) {
    const map = {
      "업무 일반": "briefcase-business",
      "보고·분석": "file-chart-column",
      "기획·전략": "calendar-days",
      "마케팅": "megaphone",
      "영업·고객": "user-round",
      "개발": "code-2"
    };
    return map[category] || "file-text";
  },
  colorFor(index) {
    return ["#1b84ff", "#50cd89", "#f1416c", "#ffc700", "#7239ea", "#009ef7"][index % 6];
  },
  query() {
    return Object.fromEntries(new URLSearchParams(location.search).entries());
  },
  tagsHtml(tags) {
    return (tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
  },
  favoriteButton(prompt) {
    return `<button class="icon-btn favorite-btn ${prompt.saved ? "active" : ""}" data-id="${prompt.id}" title="즐겨찾기">
      <i data-lucide="star"></i>
    </button>`;
  },
  promptRow(prompt, index, showActions) {
    const actions = showActions
      ? `<div class="action-menu">
          ${this.favoriteButton(prompt)}
          <button class="icon-btn js-edit" data-id="${prompt.id}" title="수정"><i data-lucide="pencil"></i></button>
          <button class="icon-btn js-delete" data-id="${prompt.id}" title="삭제"><i data-lucide="trash-2"></i></button>
        </div>`
      : `<div class="action-menu">
          ${this.favoriteButton(prompt)}
          <a class="btn compact" href="detail.html?id=${prompt.id}">바로보기</a>
        </div>`;
    return `
      <article class="prompt-row">
        <span class="circle-icon" style="background:${this.colorFor(index)}"><i data-lucide="${this.iconFor(prompt.category)}"></i></span>
        <a class="prompt-main" href="detail.html?id=${prompt.id}">
          <h3>${prompt.title}</h3>
          <p>${prompt.summary}</p>
          <div class="meta">${prompt.authorName} · ${prompt.category} · ${this.tagsHtml(prompt.tags)}</div>
        </a>
        <span class="date-col">${this.formatDate(prompt.createdAt)}</span>
        <span class="metrics"><span>★ ${prompt.starCount}</span><span>댓글 ${prompt.commentCount}</span></span>
        ${actions}
      </article>
    `;
  },
  renderPromptList($target, prompts, options) {
    if (!prompts.length) {
      $target.html(`<div class="empty">조건에 맞는 프롬프트가 없습니다.</div>`);
      lucide.createIcons();
      return;
    }
    $target.html(`<div class="prompt-list">${prompts.map((prompt, index) => this.promptRow(prompt, index, options && options.actions)).join("")}</div>`);
    lucide.createIcons();
  },
  bindFavorite(handler) {
    $(document).off("click.favorite").on("click.favorite", ".favorite-btn", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const id = $(this).data("id");
      PromptApi.toggleStar(id).then(({ prompt }) => {
        Layout.toast(prompt.saved ? "즐겨찾기에 추가했습니다." : "즐겨찾기에서 제거했습니다.");
        handler && handler(prompt);
      });
    });
  },
  collectForm() {
    return {
      title: $("#title").val(),
      summary: $("#summary").val(),
      category: $("#category").val(),
      tags: $("#tags").val().split(",").map(tag => tag.trim()).filter(Boolean),
      body: $("#body").val(),
      example: $("#example").val(),
      authorName: $("#authorName").val(),
      authorTeam: $("#authorTeam").val()
    };
  },
  fillForm(prompt) {
    $("#title").val(prompt.title);
    $("#summary").val(prompt.summary);
    $("#category").val(prompt.category);
    $("#tags").val((prompt.tags || []).join(", "));
    $("#body").val(prompt.body);
    $("#example").val(prompt.example);
    $("#authorName").val(prompt.authorName);
    $("#authorTeam").val(prompt.authorTeam);
  }
};
