'use strict';
/* login page — demo credentials, shake-on-error, theme toggle */
document.addEventListener('DOMContentLoaded', function(){
  if (Auth.redirectIfAuthed()) return;

  const mark = document.getElementById('brandMark');
  if (mark) mark.innerHTML = logoSvg();
  UI.theme.sync();

  const form = document.getElementById('loginForm');
  const err = document.getElementById('loginError');
  const btn = document.getElementById('signinBtn');
  const themeBtn = document.querySelector('[data-act="theme"]');
  if (themeBtn) themeBtn.addEventListener('click', function(){ UI.theme.toggle(); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    err.textContent = '';
    err.classList.remove('shake');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    Auth.login(username, password, remember).then(function(res){
      btn.disabled = false;
      btn.textContent = 'Sign in';
      if (!res.ok) {
        err.textContent = res.error || 'Sign-in failed';
        void err.offsetWidth;      /* restart the shake animation */
        err.classList.add('shake');
        return;
      }
      location.replace(res.user.role === 'admin' ? 'admin.html' : 'dashboard.html');
    });
  });
});
