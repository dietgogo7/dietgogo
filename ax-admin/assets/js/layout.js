/**
 * AX Data Admin — Layout Manager (Metronic Light style)
 * DOM을 동적으로 재구성: app-wrapper(col) → topnav + app-body(row) → sidebar + main-area
 * 각 페이지 HTML 파일은 수정 없이 그대로 유지됩니다.
 */
const AXLayout = (() => {

  /* ===== Nav Configuration ===== */
  const NAV_SECTIONS = [
    {
      label: 'REPORTS',
      items: [
        { id: 'home',           label: '홈',             icon: 'bi-house-fill',         href: 'home.html' },
        { id: 'report-catalog', label: '리포트 카탈로그', icon: 'bi-journal-richtext',    href: 'report-catalog.html' },
        { id: 'report-view',    label: '리포트 조회',     icon: 'bi-bar-chart-fill',      href: 'report-view.html' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { id: 'menu-manage',   label: '메뉴 관리',       icon: 'bi-grid-fill',           href: 'menu-manage.html' },
        { id: 'permission',    label: '권한 관리',        icon: 'bi-shield-lock-fill',    href: 'permission.html' },
        { id: 'schedule',      label: '스케줄 리포트',    icon: 'bi-calendar-event-fill', href: 'schedule.html' },
        { id: 'field-mapping', label: '필드 매핑',        icon: 'bi-table',               href: 'field-mapping.html' },
      ]
    }
  ];

  const TOPNAV_LINKS = [
    { label: '홈',    href: 'home.html',    ids: ['home'] },
    { label: '리포트', href: 'report-catalog.html', ids: ['report-catalog', 'report-view'] },
    { label: '관리',  href: 'menu-manage.html', ids: ['menu-manage','permission','schedule','field-mapping'] },
    { label: '도움말', href: '#', ids: [] },
  ];

  function resolveHref(href, fromRoot) {
    return fromRoot ? 'pages/' + href : href;
  }

  /* ===== Top Navbar ===== */
  function renderTopNav(opts) {
    const { activeMenu = '', fromRoot = false } = opts;
    const homeHref = fromRoot ? 'pages/home.html' : 'home.html';

    const links = TOPNAV_LINKS.map(l => {
      const active = l.ids.includes(activeMenu) ? 'active' : '';
      return `<a href="${resolveHref(l.href, fromRoot)}" class="topnav-link ${active}">${l.label}</a>`;
    }).join('');

    return `
      <header class="top-navbar" id="layout-topnav">
        <button class="topnav-toggle" id="sidebarToggle"><i class="bi bi-list"></i></button>
        <a href="${fromRoot ? 'pages/home.html' : 'home.html'}" class="topnav-logo">
          <div class="logo-mark">AX</div>
          <span class="logo-text">Data Admin</span>
        </a>
        <nav class="topnav-links">${links}</nav>
        <div class="topnav-right">
          <button class="topnav-icon-btn" title="검색"><i class="bi bi-search"></i></button>
          <button class="topnav-icon-btn" title="알림">
            <i class="bi bi-bell"></i>
            <span class="topnav-badge"></span>
          </button>
          <button class="topnav-icon-btn" title="메시지"><i class="bi bi-chat-dots"></i></button>
          <button class="topnav-icon-btn" title="앱"><i class="bi bi-grid-3x3-gap-fill"></i></button>
          <div class="topnav-avatar" title="홍길동 — admin">홍</div>
        </div>
      </header>`;
  }

  /* ===== Sidebar ===== */
  function renderSidebar(activeMenu, fromRoot) {
    const sectionsHtml = NAV_SECTIONS.map(sec => {
      const items = sec.items.map(item => {
        const active = item.id === activeMenu ? 'active' : '';
        return `
          <li class="nav-item ${active}">
            <a href="${resolveHref(item.href, fromRoot)}" class="nav-link">
              <i class="bi ${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          </li>`;
      }).join('');
      return `
        <div class="nav-section-label">${sec.label}</div>
        <ul class="nav-list">${items}</ul>`;
    }).join('');

    return `
      <aside class="sidebar" id="sidebarEl">
        <div class="sidebar-inner">${sectionsHtml}</div>
        <div class="sidebar-footer">
          <ul class="nav-list">
            <li class="nav-item">
              <a href="${fromRoot ? 'index.html' : '../index.html'}" class="nav-link">
                <i class="bi bi-box-arrow-left"></i>
                <span>로그아웃</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>`;
  }

  /* ===== Sub-header (breadcrumb) ===== */
  function renderSubHeader() {
    return `<div class="sub-header"><nav class="breadcrumb-nav" id="breadcrumbNav"></nav></div>`;
  }

  /* ===== Breadcrumb ===== */
  function setBreadcrumb(items) {
    const html = items.map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) return `<span class="breadcrumb-item active">${item.label}</span>`;
      return `<a href="${item.href || '#'}" class="breadcrumb-item">${item.label}</a>`;
    }).join('<span class="breadcrumb-sep"><i class="bi bi-chevron-right" style="font-size:10px"></i></span>');
    $('#breadcrumbNav').html(html);
  }

  /* ===== DOM Restructure ===== */
  function restructureDOM(opts) {
    const fromRoot = opts.fromRoot || false;

    /* Already restructured guard */
    if ($('.app-body').length) {
      $('#layout-topnav').replaceWith(renderTopNav(opts));
      $('#sidebarEl').replaceWith(renderSidebar(opts.activeMenu, fromRoot));
      return;
    }

    /* 1. Inject top navbar before app-wrapper children */
    const $wrapper = $('.app-wrapper');
    $wrapper.prepend(renderTopNav(opts));

    /* 2. Wrap existing #layout-sidebar + .main-area in .app-body */
    const $sidebar  = $('#layout-sidebar');
    const $mainArea = $('.main-area');

    $sidebar.add($mainArea).wrapAll('<div class="app-body"></div>');

    /* 3. Replace #layout-sidebar placeholder with real sidebar */
    $sidebar.replaceWith(renderSidebar(opts.activeMenu, fromRoot));

    /* 4. Replace #layout-header placeholder with sub-header (breadcrumb bar) */
    $('#layout-header').replaceWith(renderSubHeader());
  }

  /* ===== Toast ===== */
  function injectToast() {
    if (!$('#toastContainer').length) {
      $('body').append('<div class="toast-container" id="toastContainer"></div>');
    }
  }

  /* ===== Events ===== */
  function bindEvents() {
    $(document).off('click', '#sidebarToggle').on('click', '#sidebarToggle', () => {
      $('body').toggleClass('sidebar-collapsed');
    });
  }

  /* ===== Public API ===== */
  function init(opts = {}) {
    restructureDOM(opts);
    bindEvents();
    injectToast();
    if (opts.breadcrumb) setBreadcrumb(opts.breadcrumb);
  }

  return { init, setBreadcrumb };
})();

/* ===== Data path helper ===== */
function dataPath(file) {
  const inPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
  return (inPages ? '../data/' : 'data/') + file;
}
