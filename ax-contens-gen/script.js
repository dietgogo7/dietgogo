const sampleProduct = {
  productNumber: "9791168122231",
  title: "불편한 편의점 2 (양장)",
  author: "김호연",
  publisher: "나무옆의자",
  category: "국내도서 > 소설/시/희곡 > 한국소설",
  price: "15,800원",
  intro:
    "더 진해진 웃음과 감동으로 돌아온 '불편한 편의점' 두 번째 이야기. 서울역 노숙인 독고에서 다시 시작되는 따뜻한 인연과 성장의 기록.",
  tags: ["소설", "한국소설", "휴먼", "성장", "따뜻한이야기", "베스트셀러", "추천도서"],
  details:
    "서울의 작은 편의점을 배경으로 서로 다른 사연을 가진 사람들이 마주치고, 아주 평범한 말과 행동 속에서 다시 살아갈 힘을 얻는 이야기입니다.",
  tableOfContents: ["프롤로그", "ALWAYS", "홍금보 씨", "홈리스", "봄날의 편의점", "에필로그"],
};

const contentMap = {
  oneLine: {
    title: "한 줄 소개",
    text: "다시 만난 '불편한 편의점', 오늘도 우리에게 작은 위로를 건넵니다.",
  },
  recommend: {
    title: "추천 대상",
    text: "따뜻한 사람 이야기에 마음이 가는 분, 위로와 응원이 필요한 모든 분께 추천합니다.",
  },
  push: {
    title: "푸시 문구",
    text: "더 진해진 감동!\n'불편한 편의점 2'에서 당신의 하루가 조금 더 따뜻해집니다.",
  },
  sns: {
    title: "SNS 문구",
    text: "다시 돌아온 우리의 편의점.\n소소하지만 확실한 행복이 가득한 이야기\n#불편한편의점2 #따뜻한소설 #추천도서",
  },
  summary: {
    title: "상세페이지 요약",
    text: "서울의 노숙인 '독고'에서 다시 시작되는 사람들의 이야기. 더 진해진 웃음과 눈물, 그리고 성장의 순간들이 우리를 기다립니다.",
    wide: true,
  },
  faq: {
    title: "FAQ",
    text:
      "Q. 전작을 읽지 않아도 이해할 수 있나요?\nA. 네, 인물의 사연과 관계가 자연스럽게 설명되어 처음 읽는 독자도 몰입할 수 있어요.\n\nQ. 어떤 장르의 책인가요?\nA. 휴먼 소설로, 따뜻한 감동과 성장이 담긴 이야기입니다.",
    wide: true,
  },
};

const state = {
  product: sampleProduct,
  selectedTypes: ["oneLine", "recommend", "push", "sns", "summary"],
};

const typeIcons = {
  oneLine: "✏",
  recommend: "★",
  push: "⊕",
  sns: "◎",
  summary: "≡",
  faq: "?",
};

const elements = {
  lookupForm: document.querySelector("#lookupForm"),
  resetButton: document.querySelector("#resetButton"),
  apiStatus: document.querySelector("#apiStatus"),
  bookTitle: document.querySelector("#bookTitle"),
  bookAuthor: document.querySelector("#bookAuthor"),
  bookPublisher: document.querySelector("#bookPublisher"),
  bookCategory: document.querySelector("#bookCategory"),
  bookPrice: document.querySelector("#bookPrice"),
  bookIntro: document.querySelector("#bookIntro"),
  bookDescription: document.querySelector("#bookDescription"),
  bookDetails: document.querySelector("#bookDetails"),
  bookToc: document.querySelector("#bookToc"),
  tagList: document.querySelector("#tagList"),
  resultGrid: document.querySelector("#resultGrid"),
  progressSteps: document.querySelector("#progressSteps"),
  progressMessage: document.querySelector("#progressMessage"),
  generateButton: document.querySelector("#generateButton"),
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProductData(productNumber) {
  await wait(420);

  return {
    ...sampleProduct,
    productNumber,
  };

  /*
    실제 내부 API 연결 예시:
    const response = await fetch(`/internal-api/products/${encodeURIComponent(productNumber)}`);
    if (!response.ok) throw new Error("상품 정보를 불러오지 못했습니다.");
    return response.json();
  */
}

async function generateContentPackage(product, selectedTypes) {
  await wait(520);

  return selectedTypes.map((type) => ({
    type,
    ...contentMap[type],
    text: contentMap[type].text.replace("불편한 편의점 2", product.title.replace(" (양장)", "")),
  }));

  /*
    실제 LLM 프록시 연결 예시:
    const response = await fetch("/internal-api/llm/content-package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, selectedTypes }),
    });
    if (!response.ok) throw new Error("콘텐츠 생성에 실패했습니다.");
    return response.json();
  */
}

function setProgress(step) {
  const labels = [
    ["상품 조회", "완료"],
    ["프롬프트 적용", step >= 2 ? "완료" : "대기"],
    ["LLM 생성", step >= 3 ? "완료" : "대기"],
    ["결과 저장", step >= 4 ? "완료" : "대기"],
  ];

  elements.progressSteps.innerHTML = labels
    .map(([title, status], index) => {
      const stepNumber = index + 1;
      const className = stepNumber < step ? "done" : stepNumber === step ? "active" : "";
      const marker = stepNumber < step ? "✓" : stepNumber;
      return `<li class="${className}"><span>${marker}</span><strong>${title}</strong><small>${status}</small></li>`;
    })
    .join("");

  const messages = {
    1: ["상품 정보를 조회하고 있습니다.", "내부 상품 API 응답을 기다리는 중이에요."],
    2: ["프롬프트를 구성하고 있습니다.", "선택한 상품으로 최적의 템플릿을 준비 중이에요."],
    3: ["LLM 콘텐츠를 생성하고 있습니다.", "책 소개, 상세 내용, 목차를 반영해 문구를 만드는 중이에요."],
    4: ["결과가 준비되었습니다.", "복사하거나 저장해서 바로 활용할 수 있어요."],
  };

  const [title, body] = messages[step];
  elements.progressMessage.innerHTML = `<span class="${step === 4 ? "status-dot" : "spinner"}"></span><p><strong>${title}</strong>${body}</p>`;
}

function renderProduct(product) {
  elements.bookTitle.textContent = product.title;
  elements.bookAuthor.textContent = product.author;
  elements.bookPublisher.textContent = product.publisher;
  elements.bookCategory.textContent = product.category;
  elements.bookPrice.textContent = product.price;
  elements.bookIntro.textContent = product.intro;
  elements.bookDescription.textContent = product.intro;
  elements.bookDetails.textContent = product.details;
  elements.bookToc.textContent = product.tableOfContents.join(" · ");
  elements.tagList.innerHTML = product.tags.map((tag) => `<span>${tag}</span>`).join("");
}

function renderResults(results) {
  if (!results || results.length === 0) {
    elements.resultGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✦</div>
        <p>상품을 조회하고 콘텐츠 유형을 설정한 후<br><strong>LLM 콘텐츠 생성 시작</strong>을 눌러 주세요.</p>
      </div>`;
    return;
  }
  elements.resultGrid.innerHTML = results
    .map(
      (item) => `
        <article class="result-card ${item.wide ? "wide" : ""} card-type-${item.type ?? ""}">
          <header>
            <div class="card-label">
              <i class="card-icon">${typeIcons[item.type] ?? "✦"}</i>
              <h3>${item.title}</h3>
            </div>
            <span class="check">✓</span>
          </header>
          <p>${item.text}</p>
          <div class="card-actions">
            <button type="button" class="btn-copy">복사</button>
            <button type="button">재생성</button>
          </div>
        </article>
      `
    )
    .join("");
}

function getSelectedTypes() {
  return [...document.querySelectorAll(".content-types input:checked")].map((input) => input.value);
}

async function runLookup(productNumber) {
  elements.apiStatus.innerHTML = '<span class="spinner"></span>상품 API 호출 중';
  elements.generateButton.disabled = true;
  setProgress(1);

  const product = await fetchProductData(productNumber);
  state.product = product;
  renderProduct(product);

  elements.apiStatus.innerHTML = '<span class="status-dot"></span>YES24 API 연동';
  elements.generateButton.disabled = false;
  setProgress(2);
}

async function runGenerate() {
  if (!state.product) return;
  elements.generateButton.disabled = true;
  elements.generateButton.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:3px"></span> 생성 중...';
  setProgress(2);
  await wait(360);
  setProgress(3);

  const selectedTypes = getSelectedTypes();
  const results = await generateContentPackage(state.product, selectedTypes);
  renderResults(results);
  setProgress(4);

  elements.generateButton.disabled = false;
  elements.generateButton.innerHTML = '<span class="gen-icon">✦</span> LLM 콘텐츠 생성 시작';
}

elements.lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const productNumber = new FormData(event.currentTarget).get("productNumber").trim();
  if (!productNumber) return;
  await runLookup(productNumber);
});

elements.generateButton.addEventListener("click", async () => {
  await runGenerate();
});

elements.resetButton.addEventListener("click", () => {
  document.querySelector("#productNumber").value = "";
  state.product = null;
  elements.generateButton.disabled = true;
  renderResults([]);
  setProgress(1);
});

document.querySelector(".content-types").addEventListener("change", async () => {
  if (!state.product) return;
  const results = await generateContentPackage(state.product, getSelectedTypes());
  renderResults(results);
});

elements.resultGrid.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-copy");
  if (!btn) return;
  const text = btn.closest(".result-card").querySelector("p").textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "✓ 복사됨";
    setTimeout(() => { btn.textContent = "복사"; }, 1500);
  } catch (_) {}
});

renderProduct(state.product);
renderResults(state.selectedTypes.map((type) => ({ type, ...contentMap[type] })));
setProgress(2);
