(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('loginError');
  var errorMsg = document.getElementById('loginErrorMsg');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    errorBox.style.display = 'none';

    App.loadJSON('data/users.json').then(function (result) {
      if (!result || !result.users) {
        showError('사용자 데이터를 불러올 수 없습니다.');
        return;
      }
      var user = result.users.find(function (u) {
        return u.email === email && u.password === password;
      });
      if (user) {
        App.Auth.login({
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
          position: user.position
        });
        window.location.href = 'home.html';
      } else {
        showError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    });
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.style.display = 'flex';
  }
})();
