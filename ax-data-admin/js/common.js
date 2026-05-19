/* ============================================================
   AX DataHub - Common Module
   Layout, Auth, Sidebar, Utilities
   ============================================================ */

const App = (function () {
  'use strict';

  const BASE_PATH = (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute('src') || '';
      if (src.includes('common.js')) {
        return src.replace(/js\/common\.js.*$/, '');
      }
    }
    return '../';
  })();

  function resolveDataPath(relativePath) {
    return BASE_PATH + relativePath;
  }

  // --- Auth ---
  const Auth = {
    currentUser: null,

    init() {
      const stored = sessionStorage.getItem('ax_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    },

    login(user) {
      this.currentUser = user;
      sessionStorage.setItem('ax_user', JSON.stringify(user));
    },

    logout() {
      this.currentUser = null;
      sessionStorage.removeItem('ax_user');
      window.location.href = resolvePagePath('login.html');
    },

    check() {
      if (!this.currentUser) {
        window.location.href = resolvePagePath('login.html');
        return false;
      }
      return true;
    },

    getInitials(name) {
      if (!name) return 'U';
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
  };

  function resolvePagePath(page) {
    const current = window.location.pathname;
    if (current.includes('/pages/')) {
      return page;
    }
    return 'pages/' + page;
  }

  // --- Data Loader ---
  async function loadJSON(path) {
    try {
      const response = await fetch(resolveDataPath(path));
      if (!response.ok) throw new Error('Failed to load ' + path);
      return await response.json();
    } catch (err) {
      console.error('Data load error:', err);
      return null;
    }
  }

  // --- Theme ---
  const Theme = {
    init() {
      const saved = localStorage.getItem('ax_theme') || 'light';
      this.apply(saved);
    },

    apply(theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('ax_theme', theme);
    },

    toggle() {
      const isDark = document.documentElement.classList.contains('dark');
      this.apply(isDark ? 'light' : 'dark');
      this.updateIcon();
    },

    updateIcon() {
      const btn = document.getElementById('theme-toggle');
      if (!btn) return;
      const isDark = document.documentElement.classList.contains('dark');
      btn.innerHTML = isDark ? Icons.sun : Icons.moon;
    }
  };

  // --- Sidebar ---
  const Sidebar = {
    collapsed: false,
    mobileOpen: false,

    menuData: [
      {
        group: '일반',
        items: [
          { title: '홈', icon: 'home', url: 'home.html' },
          { title: '리포트 카탈로그', icon: 'fileText', url: 'report-catalog.html' },
        ]
      },
      {
        group: '관리',
        items: [
          { title: '메뉴 관리', icon: 'menuTree', url: 'menu-management.html' },
          { title: '필드 매핑/마스킹', icon: 'columns', url: 'field-mapping.html' },
          { title: '권한 관리', icon: 'shield', url: 'permission-management.html' },
        ]
      },
      {
        group: '운영',
        items: [
          { title: '스케줄 리포트', icon: 'calendar', url: 'schedule-report.html' },
          { title: '요청사항 게시판', icon: 'bell', url: 'request-board.html' },
        ]
      },
    ],

    init() {
      const saved = localStorage.getItem('ax_sidebar_collapsed');
      if (saved === 'true') this.collapsed = true;
    },

    toggle() {
      this.collapsed = !this.collapsed;
      localStorage.setItem('ax_sidebar_collapsed', this.collapsed);
      const el = document.getElementById('sidebar');
      if (el) el.classList.toggle('collapsed', this.collapsed);
    },

    toggleMobile() {
      this.mobileOpen = !this.mobileOpen;
      const el = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (el) el.classList.toggle('mobile-open', this.mobileOpen);
      if (backdrop) backdrop.classList.toggle('show', this.mobileOpen);
    },

    getCurrentPage() {
      const path = window.location.pathname;
      const parts = path.split('/');
      return parts[parts.length - 1] || 'home.html';
    },

    render() {
      const currentPage = this.getCurrentPage();
      const user = Auth.currentUser || { name: 'Admin', email: 'admin@yes24.com', department: 'IT' };

      let menuHTML = '';
      this.menuData.forEach(function (group) {
        menuHTML += '<div class="sidebar-group">';
        menuHTML += '<div class="sidebar-group-label">' + group.group + '</div>';
        menuHTML += '<ul class="sidebar-menu">';
        group.items.forEach(function (item) {
          const isActive = currentPage === item.url;
          const iconSvg = Icons[item.icon] || '';

          if (item.children) {
            const hasActiveChild = item.children.some(function (c) { return currentPage === c.url; });
            menuHTML += '<li class="nav-item' + (hasActiveChild ? ' open' : '') + '">';
            menuHTML += '<button class="nav-item-btn' + (hasActiveChild ? ' active' : '') + '" onclick="App.Sidebar.toggleSubmenu(this)">';
            menuHTML += '<span class="nav-icon">' + iconSvg + '</span>';
            menuHTML += '<span class="nav-item-text">' + item.title + '</span>';
            if (item.badge) menuHTML += '<span class="nav-badge">' + item.badge + '</span>';
            menuHTML += '<span class="nav-chevron">' + Icons.chevronRight + '</span>';
            menuHTML += '</button>';
            menuHTML += '<ul class="nav-submenu">';
            item.children.forEach(function (child) {
              const childActive = currentPage === child.url;
              menuHTML += '<li class="nav-item">';
              menuHTML += '<a class="nav-item-btn' + (childActive ? ' active' : '') + '" href="' + child.url + '">';
              menuHTML += '<span class="nav-item-text">' + child.title + '</span>';
              menuHTML += '</a></li>';
            });
            menuHTML += '</ul></li>';
          } else {
            menuHTML += '<li class="nav-item">';
            menuHTML += '<a class="nav-item-btn' + (isActive ? ' active' : '') + '" href="' + item.url + '">';
            menuHTML += '<span class="nav-icon">' + iconSvg + '</span>';
            menuHTML += '<span class="nav-item-text">' + item.title + '</span>';
            if (item.badge) menuHTML += '<span class="nav-badge">' + item.badge + '</span>';
            menuHTML += '</a></li>';
          }
        });
        menuHTML += '</ul></div>';
      });

      return '<aside id="sidebar" class="sidebar' + (this.collapsed ? ' collapsed' : '') + '">' +
        '<div class="sidebar-header">' +
          '<div class="logo-icon">AX</div>' +
          '<span class="logo-text">DataHub</span>' +
        '</div>' +
        '<nav class="sidebar-content">' + menuHTML + '</nav>' +
        '<div class="sidebar-footer">' +
          '<button class="user-btn" onclick="App.Sidebar.toggleUserMenu(event)">' +
            '<div class="user-avatar">' + Auth.getInitials(user.name) + '</div>' +
            '<div class="user-info">' +
              '<div class="user-name">' + user.name + '</div>' +
              '<div class="user-email">' + user.email + '</div>' +
            '</div>' +
          '</button>' +
        '</div>' +
      '</aside>';
    },

    toggleSubmenu(btn) {
      const navItem = btn.closest('.nav-item');
      if (navItem) navItem.classList.toggle('open');
    },

    toggleUserMenu(e) {
      e.stopPropagation();
      const existing = document.querySelector('.sidebar-user-dropdown');
      if (existing) {
        existing.remove();
        return;
      }
      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown-menu open sidebar-user-dropdown';
      dropdown.style.cssText = 'position:fixed;bottom:60px;left:12px;z-index:60;';
      dropdown.innerHTML =
        '<button class="dropdown-item" onclick="window.location.href=\'home.html\'">' + Icons.settings + ' 설정</button>' +
        '<div class="dropdown-separator"></div>' +
        '<button class="dropdown-item" onclick="App.Auth.logout()">' + Icons.logOut + ' 로그아웃</button>';
      document.body.appendChild(dropdown);
      setTimeout(function () {
        document.addEventListener('click', function handler() {
          dropdown.remove();
          document.removeEventListener('click', handler);
        });
      }, 0);
    }
  };

  // --- Layout Renderer ---
  function renderLayout(options) {
    options = options || {};
    const pageTitle = options.title || 'AX DataHub';
    const pageSubtitle = options.subtitle || '';
    const breadcrumbs = options.breadcrumbs || [];
    const headerActions = options.headerActions || '';

    Auth.init();
    Theme.init();
    Sidebar.init();

    const currentPage = Sidebar.getCurrentPage();
    if (currentPage !== 'login.html' && !Auth.currentUser) {
      Auth.check();
      return;
    }

    let breadcrumbHTML = '';
    if (breadcrumbs.length > 0) {
      breadcrumbHTML = '<nav class="breadcrumb">';
      breadcrumbs.forEach(function (bc, i) {
        if (i > 0) breadcrumbHTML += '<span class="breadcrumb-separator">/</span>';
        if (i === breadcrumbs.length - 1) {
          breadcrumbHTML += '<span class="current">' + bc.label + '</span>';
        } else {
          breadcrumbHTML += '<a href="' + (bc.url || '#') + '">' + bc.label + '</a>';
        }
      });
      breadcrumbHTML += '</nav>';
    }

    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML =
      '<div class="app-layout">' +
        '<div id="sidebar-backdrop" class="sidebar-backdrop" onclick="App.Sidebar.toggleMobile()"></div>' +
        Sidebar.render() +
        '<div class="main-wrapper">' +
          '<header class="top-header" id="top-header">' +
            '<button class="sidebar-toggle" onclick="App.Sidebar.toggle()" data-tooltip="사이드바 토글">' + Icons.panelLeft + '</button>' +
            '<div class="header-separator"></div>' +
            '<div class="header-title-area">' +
              '<h2>' + pageTitle + '</h2>' +
              (pageSubtitle ? '<p>' + pageSubtitle + '</p>' : '') +
            '</div>' +
            '<div class="header-actions">' +
              headerActions +
              '<button class="btn btn-ghost btn-icon btn-sm" id="theme-toggle" onclick="App.Theme.toggle()" data-tooltip="테마 변경">' +
                (document.documentElement.classList.contains('dark') ? Icons.sun : Icons.moon) +
              '</button>' +
            '</div>' +
          '</header>' +
          '<main class="page-content" id="page-main">' +
            breadcrumbHTML +
            '<div id="page-body"></div>' +
          '</main>' +
        '</div>' +
      '</div>' +
      '<div class="toast-container" id="toast-container"></div>';

    // Scroll shadow on header
    window.addEventListener('scroll', function () {
      const header = document.getElementById('top-header');
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 10);
      }
    });

    // Mobile sidebar toggle
    const toggleBtn = appEl.querySelector('.sidebar-toggle');
    if (toggleBtn && window.innerWidth <= 768) {
      toggleBtn.onclick = function () { Sidebar.toggleMobile(); };
    }
  }

  // --- Toast ---
  function showToast(message, type) {
    type = type || 'default';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = {
      success: Icons.check,
      error: Icons.alertCircle,
      warning: Icons.alertCircle,
      default: Icons.bell
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (iconMap[type] || iconMap.default) + '</span>' +
      '<span>' + message + '</span>' +
      '<button class="modal-close" onclick="this.parentElement.remove()">' + Icons.x + '</button>';

    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }

  // --- DataTable ---
  function renderDataTable(config) {
    const columns = config.columns || [];
    const data = config.data || [];
    const pageSize = config.pageSize || 10;
    const searchable = config.searchable !== false;
    const onAction = config.onAction || null;

    let currentPage = 1;
    let filteredData = data.slice();
    let sortCol = null;
    let sortDir = 'asc';
    let searchTerm = '';

    function getPageData() {
      const start = (currentPage - 1) * pageSize;
      return filteredData.slice(start, start + pageSize);
    }

    function totalPages() {
      return Math.max(1, Math.ceil(filteredData.length / pageSize));
    }

    function applySearch() {
      if (!searchTerm) {
        filteredData = data.slice();
      } else {
        const term = searchTerm.toLowerCase();
        filteredData = data.filter(function (row) {
          return columns.some(function (col) {
            const val = row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
          });
        });
      }
      applySorting();
      currentPage = 1;
    }

    function applySorting() {
      if (!sortCol) return;
      filteredData.sort(function (a, b) {
        const va = a[sortCol] == null ? '' : a[sortCol];
        const vb = b[sortCol] == null ? '' : b[sortCol];
        let cmp = 0;
        if (typeof va === 'number' && typeof vb === 'number') {
          cmp = va - vb;
        } else {
          cmp = String(va).localeCompare(String(vb), 'ko');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    function render() {
      const container = document.getElementById(config.containerId);
      if (!container) return;

      let html = '';

      // Toolbar
      if (searchable || config.toolbarExtra) {
        html += '<div class="table-toolbar">';
        html += '<div class="toolbar-left">';
        if (searchable) {
          html += '<div class="search-input-wrapper">' +
            '<span class="search-icon">' + Icons.search + '</span>' +
            '<input type="text" class="form-input" placeholder="검색..." id="' + config.containerId + '-search" value="' + searchTerm + '">' +
          '</div>';
        }
        if (config.filterHTML) {
          html += config.filterHTML;
        }
        html += '</div>';
        html += '<div class="toolbar-right">';
        if (config.toolbarExtra) html += config.toolbarExtra;
        html += '</div>';
        html += '</div>';
      }

      // Table
      html += '<div class="data-table-wrapper">';
      html += '<table class="data-table">';
      html += '<thead><tr>';
      columns.forEach(function (col) {
        const isSorted = sortCol === col.key;
        const cls = col.sortable ? ' class="sortable' + (isSorted ? ' sorted' : '') + '"' : '';
        const sortIcon = col.sortable ?
          '<span class="sort-icon">' + (isSorted ? (sortDir === 'asc' ? Icons.arrowUp : Icons.arrowDown) : Icons.arrowUpDown) + '</span>' : '';
        html += '<th' + cls + ' data-key="' + col.key + '"' + (col.width ? ' style="width:' + col.width + '"' : '') + '>' + col.label + sortIcon + '</th>';
      });
      html += '</tr></thead>';
      html += '<tbody>';

      const pageData = getPageData();
      if (pageData.length === 0) {
        html += '<tr><td colspan="' + columns.length + '">';
        html += '<div class="empty-state"><p>데이터가 없습니다.</p></div>';
        html += '</td></tr>';
      } else {
        pageData.forEach(function (row, idx) {
          html += '<tr>';
          columns.forEach(function (col) {
            let cellVal = row[col.key];
            if (col.render) {
              cellVal = col.render(cellVal, row, idx);
            } else if (cellVal == null) {
              cellVal = '-';
            }
            html += '<td>' + cellVal + '</td>';
          });
          html += '</tr>';
        });
      }
      html += '</tbody></table></div>';

      // Pagination
      const tp = totalPages();
      html += '<div class="pagination">';
      html += '<span class="pagination-info">총 ' + filteredData.length + '건 중 ' +
        ((currentPage - 1) * pageSize + 1) + '-' + Math.min(currentPage * pageSize, filteredData.length) + '</span>';
      html += '<div class="pagination-controls">';
      html += '<button class="pagination-btn" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '>' + Icons.chevronLeft + '</button>';

      const pages = getPageNumbers(currentPage, tp);
      pages.forEach(function (p) {
        if (p === '...') {
          html += '<span class="pagination-btn" style="border:none;cursor:default;">...</span>';
        } else {
          html += '<button class="pagination-btn' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
      });

      html += '<button class="pagination-btn" data-page="next" ' + (currentPage >= tp ? 'disabled' : '') + '>' + Icons.chevronRight + '</button>';
      html += '</div></div>';

      container.innerHTML = html;

      // Bind events
      const searchInput = container.querySelector('#' + config.containerId + '-search');
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          searchTerm = e.target.value;
          applySearch();
          render();
        });
      }

      container.querySelectorAll('.data-table th.sortable').forEach(function (th) {
        th.addEventListener('click', function () {
          const key = this.getAttribute('data-key');
          if (sortCol === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortCol = key;
            sortDir = 'asc';
          }
          applySorting();
          render();
        });
      });

      container.querySelectorAll('.pagination-btn[data-page]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const p = this.getAttribute('data-page');
          if (p === 'prev') currentPage = Math.max(1, currentPage - 1);
          else if (p === 'next') currentPage = Math.min(tp, currentPage + 1);
          else currentPage = parseInt(p, 10);
          render();
        });
      });

      if (onAction) {
        container.querySelectorAll('[data-action]').forEach(function (el) {
          el.addEventListener('click', function (e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            const rowIdx = parseInt(this.getAttribute('data-row'), 10);
            const rowData = pageData[rowIdx];
            onAction(action, rowData, rowIdx);
          });
        });
      }
    }

    render();
    return { render: render, refresh: function (newData) { data.splice(0); Array.prototype.push.apply(data, newData); applySearch(); render(); } };
  }

  function getPageNumbers(current, total) {
    if (total <= 7) {
      var arr = [];
      for (var i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  // --- Modal ---
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('open');
  }

  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('open');
  }

  // --- Tab Navigation ---
  function initTabs(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return;

    container.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        container.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        container.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var tabContent = container.querySelector('#' + target);
        if (tabContent) tabContent.classList.add('active');
      });
    });
  }

  // --- Badge Renderer ---
  function renderBadge(text, type) {
    type = type || 'secondary';
    return '<span class="badge badge-' + type + '">' + text + '</span>';
  }

  function renderStatusBadge(status) {
    var map = {
      'active': { text: '활성', type: 'success' },
      'inactive': { text: '비활성', type: 'secondary' },
      'success': { text: '성공', type: 'success' },
      'failed': { text: '실패', type: 'destructive' },
      'pending': { text: '대기', type: 'warning' },
      'running': { text: '실행중', type: 'default' },
      'enabled': { text: '사용', type: 'success' },
      'disabled': { text: '미사용', type: 'secondary' },
      'scheduled': { text: '예약', type: 'default' },
      'completed': { text: '완료', type: 'success' },
    };
    var info = map[status] || { text: status, type: 'outline' };
    return renderBadge(info.text, info.type);
  }

  // --- Stat Card ---
  function renderStatCard(title, value, change, icon) {
    var changeClass = '';
    var changeText = '';
    if (change != null) {
      changeClass = change >= 0 ? 'positive' : 'negative';
      changeText = (change >= 0 ? '+' : '') + change + '%';
    }
    var iconSvg = Icons[icon] || Icons.barChart;

    return '<div class="card stat-card">' +
      '<div class="card-header">' +
        '<span class="card-title">' + title + '</span>' +
        '<span class="stat-icon">' + iconSvg + '</span>' +
      '</div>' +
      '<div class="card-content">' +
        '<div class="stat-value">' + value + '</div>' +
        (change != null ? '<div class="stat-change ' + changeClass + '">' + changeText + ' 전월 대비</div>' : '') +
      '</div>' +
    '</div>';
  }

  // --- Format Utilities ---
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    return formatDate(dateStr) + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }

  function formatNumber(num) {
    if (num == null) return '-';
    return Number(num).toLocaleString('ko-KR');
  }

  // --- Masking Utilities ---
  function maskName(name) {
    if (!name || name.length < 2) return '*';
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }

  function maskEmail(email) {
    if (!email) return '-';
    var parts = email.split('@');
    if (parts.length !== 2) return '***';
    var local = parts[0];
    var masked = local.length > 2 ? local.substring(0, 2) + '***' : '***';
    return masked + '@' + parts[1];
  }

  function maskPhone(phone) {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // --- Public API ---
  return {
    Auth: Auth,
    Theme: Theme,
    Sidebar: Sidebar,
    loadJSON: loadJSON,
    renderLayout: renderLayout,
    renderDataTable: renderDataTable,
    renderStatCard: renderStatCard,
    renderBadge: renderBadge,
    renderStatusBadge: renderStatusBadge,
    openModal: openModal,
    closeModal: closeModal,
    initTabs: initTabs,
    showToast: showToast,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatNumber: formatNumber,
    maskName: maskName,
    maskEmail: maskEmail,
    maskPhone: maskPhone,
    resolveDataPath: resolveDataPath,
  };
})();
