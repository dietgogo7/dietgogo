$(function () {
  const isEdit = location.pathname.includes("edit.html");
  const id = Shared.query().id;
  Layout.mount({
    title: "AX 프롬프트 공유 사이트",
    accent: isEdit ? "수정" : "등록",
    subtitle: "업무에 바로 재사용할 수 있도록 핵심 정보만 입력합니다.",
    showCreate: false
  });

  $("#page-root").html(`
    <section class="form-panel">
      <h2 class="panel-title"><i data-lucide="file-plus-2"></i>${isEdit ? "프롬프트 수정" : "새 프롬프트 등록"}</h2>
      <form id="prompt-form" class="form-grid">
        <div class="field">
          <label>제목 <span id="title-count">0 / 100</span></label>
          <input id="title" maxlength="100" required placeholder="예: 주간보고 요약 프롬프트">
        </div>
        <div class="field">
          <label>한 줄 설명 <span id="summary-count">0 / 150</span></label>
          <input id="summary" maxlength="150" required placeholder="어떤 상황에서 유용한지 짧게 설명해 주세요">
        </div>
        <div class="field">
          <label>카테고리</label>
          <select id="category" required>${Shared.categories.map(item => `<option>${item}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>태그</label>
          <input id="tags" placeholder="보고서, 요약, 업무자동화처럼 쉼표로 구분">
        </div>
        <div class="field">
          <label>프롬프트 본문 <span id="body-count">0 / 5,000</span></label>
          <textarea id="body" maxlength="5000" required placeholder="지시사항, 조건, 출력 형식, 맥락을 입력하세요"></textarea>
        </div>
        <div class="field">
          <label>활용 예시</label>
          <textarea id="example" maxlength="500" placeholder="예상 활용 상황이나 결과 예시를 입력하세요"></textarea>
        </div>
        <div class="field">
          <label>작성자</label>
          <input id="authorName" value="김대현">
        </div>
        <div class="field">
          <label>부서</label>
          <input id="authorTeam" value="기획기획팀">
        </div>
        <div class="form-actions">
          <a class="btn ghost" href="index.html">취소</a>
          <button type="button" class="btn" id="draft">임시저장</button>
          <button class="btn primary">${isEdit ? "수정하기" : "등록하기"}</button>
        </div>
      </form>
    </section>
  `);

  function updateCounts() {
    $("#title-count").text(`${$("#title").val().length} / 100`);
    $("#summary-count").text(`${$("#summary").val().length} / 150`);
    $("#body-count").text(`${$("#body").val().length.toLocaleString()} / 5,000`);
  }

  $(document).on("input", "#title,#summary,#body", updateCounts);
  $("#draft").on("click", () => Layout.toast("임시저장 동작이 확인되었습니다."));
  $("#prompt-form").on("submit", function (event) {
    event.preventDefault();
    const payload = Shared.collectForm();
    const request = isEdit ? PromptApi.update(id, payload) : PromptApi.create(payload);
    request.then(({ prompt }) => {
      Layout.toast(isEdit ? "수정했습니다." : "등록했습니다.");
      setTimeout(() => location.href = `detail.html?id=${prompt.id}`, 500);
    }).catch(xhr => {
      const message = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "저장 중 오류가 발생했습니다.";
      Layout.toast(message);
    });
  });

  if (isEdit && id) {
    PromptApi.get(id).then(({ prompt }) => {
      Shared.fillForm(prompt);
      updateCounts();
    });
  } else {
    updateCounts();
  }
  lucide.createIcons();
});
