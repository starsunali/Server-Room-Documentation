'use strict';
/* Users tab — account list + add/edit/delete (admin only) */
document.addEventListener('DOMContentLoaded', function(){
  const me = Auth.require(true);
  if (!me) return;
  UI.topbar('users');
  UI.banner(document.getElementById('bannerRoot'),
    'Passwords are never shown or stored in the UI — new accounts are seeded with a temporary password.');

  const rows = document.getElementById('userRows');
  const empty = document.getElementById('emptyState');

  function render(){
    rows.innerHTML = Store.users().map(function(u){
      return '<tr data-user="' + u.id + '">' +
        '<td class="u-name">' + escapeHtml(u.name) + '</td>' +
        '<td>' + escapeHtml(u.username) + '</td>' +
        '<td><span class="pill ' + u.role + '">' + u.role.toUpperCase() + '</span></td>' +
        '<td><span class="pill ' + u.status + '">' + u.status.toUpperCase() + '</span></td>' +
        '<td class="u-mail">' + escapeHtml(u.email || '—') + '</td>' +
        '<td class="ta-r"><span class="row-actions">' +
          '<button class="btn sm" data-act="edit-user">Edit</button>' +
          '<button class="btn sm danger" data-act="del-user">Delete</button>' +
        '</span></td></tr>';
    }).join('');
    empty.hidden = Store.users().length > 0;
  }
  render();
  Store.ready(render);

  const addBtn = document.querySelector('.head-actions [data-act="add-user"]');
  if (addBtn) addBtn.addEventListener('click', function(){ userForm(null); });

  rows.addEventListener('click', function(e){
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.closest('[data-user]').getAttribute('data-user');
    if (b.getAttribute('data-act') === 'edit-user') userForm(id);
    else deleteUser(id);
  });

  function userForm(id){
    const u = id ? Store.user(id) : null;
    UI.modal({
      title: u ? 'Edit user' : 'Add user',
      sub: u ? 'Roles control which tabs are visible.' : 'A temporary password is assigned automatically.',
      body:
        '<label class="field"><span>Full name *</span><input id="usName" value="' + escapeHtml(u ? u.name : '') + '" placeholder="Sam Fields"></label>' +
        '<div class="grid-2">' +
          '<label class="field"><span>Username *</span><input id="usLogin" value="' + escapeHtml(u ? u.username : '') + '" placeholder="sam"></label>' +
          '<label class="field"><span>Email</span><input id="usMail" type="email" value="' + escapeHtml(u ? u.email : '') + '" placeholder="sam@rackflow.demo"></label>' +
        '</div>' +
        '<div class="grid-2">' +
          '<label class="field"><span>Role</span><select id="usRole">' +
            '<option value="user"' + (u && u.role === 'user' ? ' selected' : '') + '>user — dashboard only</option>' +
            '<option value="admin"' + (u && u.role === 'admin' ? ' selected' : (!u ? '' : '')) + '>admin — full access</option>' +
          '</select></label>' +
          '<label class="field"><span>Status</span><select id="usStatus">' +
            '<option value="active"' + (!u || u.status === 'active' ? ' selected' : '') + '>active</option>' +
            '<option value="inactive"' + (u && u.status === 'inactive' ? ' selected' : '') + '>inactive</option>' +
          '</select></label>' +
        '</div>' +
        '<p class="err" id="usErr" hidden></p>',
      foot: '<button class="btn ghost" data-x>Cancel</button>' +
            '<button class="btn primary" data-save>' + (u ? 'Save changes' : 'Add user') + '</button>',
      onMount: function(h){
        const err = $('#usErr', h.el);
        const fail = function(msg){ err.textContent = msg; err.hidden = false; };
        $$('input, select', h.el).forEach(function(el){ el.addEventListener('input', function(){ err.hidden = true; }); });
        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        h.el.querySelector('[data-save]').onclick = function(){
          const name = $('#usName', h.el).value.trim();
          const username = $('#usLogin', h.el).value.trim().toLowerCase();
          const email = $('#usMail', h.el).value.trim();
          const role = $('#usRole', h.el).value;
          const status = $('#usStatus', h.el).value;
          if (!name) return fail('Full name is required');
          if (!username) return fail('Username is required');
          const clash = Store.users().filter(function(x){
            return String(x.username).toLowerCase() === username && (!u || x.id !== u.id);
          })[0];
          if (clash) return fail('Username "' + username + '" is taken');
          if (u) {
            Store.updateUser(u.id, { name:name, username:username, email:email, role:role, status:status });
            UI.toast('User updated', 'success');
          } else {
            Store.addUser({ name:name, username:username, email:email, role:role, status:status });
            UI.toast('User created', 'success');
          }
          h.close();
          render();
        };
      }
    });
  }

  function deleteUser(id){
    const u = Store.user(id);
    if (!u) return;
    if (u.id === me.id) return UI.toast('You cannot delete your own account', 'error');
    const lastAdmin = u.role === 'admin' && u.status === 'active' &&
      Store.users().filter(function(x){ return x.role === 'admin' && x.status === 'active'; }).length <= 1;
    if (lastAdmin) return UI.toast('At least one active admin must remain', 'error');
    UI.confirm({
      title: 'Delete user',
      text: 'Delete <strong>' + escapeHtml(u.name) + '</strong> (<code>' + escapeHtml(u.username) +
            '</code>)? They will no longer be able to sign in.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: function(){
        Store.removeUser(id);
        render();
        UI.toast('User deleted', 'success');
      }
    });
  }
});
