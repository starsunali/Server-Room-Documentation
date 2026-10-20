'use strict';
/* =====================================================================
   RackFlow core — Icons · Store · Auth · UI
   All data access is isolated behind Store/Auth so only this file gets
   replaced by a real PHP/API layer later (see README "PHP migration map").
   ===================================================================== */

/* ---------------- tiny helpers ---------------- */
function escapeHtml(v){
  return String(v === null || v === undefined ? '' : v)
    .replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}
function $(sel, root){ return (root || document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function uid(p){ return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function clamp(n, lo, hi){ return Math.min(hi, Math.max(lo, n)); }
function debounce(fn, ms){
  let t;
  return function(){
    const a = arguments, c = this;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(c, a); }, ms);
  };
}

/* ---------------- inline SVG sprite (defined in JS) ---------------- */
const ICONS = {
  logo: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2"/><path d="M7 8.4h10M7 12h10M7 15.6h5.6"/><circle cx="16.6" cy="15.6" r="1.4" fill="currentColor" stroke="none"/>',
  router: '<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M6.6 17h.01M10.2 17h.01"/><path d="M12 11.5V4.2"/><path d="M8.6 7.6 12 4.2l3.4 3.4"/>',
  switch: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M6.2 11.4h3.2M6.2 14h6"/><path d="M13.6 11.6h4.2"/><path d="M15.8 9.9 17.8 11.6 15.8 13.3"/>',
  firewall: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9.5h18M3 14.5h18M9 4.5v5M15 9.5v5M9 14.5v5"/>',
  server: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  storage: '<rect x="3" y="4.5" width="18" height="6" rx="2"/><rect x="3" y="13.5" width="18" height="6" rx="2"/><circle cx="7" cy="7.5" r=".9"/><circle cx="7" cy="16.5" r=".9"/><path d="M15.5 7.5h2.5M15.5 16.5h2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.5M12 18.9v2.5M2.6 12h2.5M18.9 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
  moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"/>'
};
function icon(name, cls){
  return '<svg class="glyph ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}
function logoSvg(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.logo + '</svg>';
}
const KIND_ICON = { Router:'router', Switch:'switch', Firewall:'firewall', Server:'server', Storage:'storage' };
const DEVICE_KINDS = ['Router','Switch','Firewall','Server','Storage'];

/* ---------------- seed data ---------------- */
const SEED_USERS = [
  { id:'u-admin', name:'Alex Admin',  username:'admin', email:'admin@rackflow.demo', role:'admin', status:'active',   pass:'admin' },
  { id:'u-liam',  name:'Liam Carter', username:'liam',  email:'liam@rackflow.demo',  role:'user',  status:'active',   pass:'user' },
  { id:'u-noor',  name:'Noor Haddad', username:'noor',  email:'noor@rackflow.demo',  role:'user',  status:'active',   pass:'user' },
  { id:'u-yuki',  name:'Yuki Tanaka', username:'yuki',  email:'yuki@rackflow.demo',  role:'user',  status:'active',   pass:'user' },
  { id:'u-diego', name:'Diego Ruiz',  username:'diego', email:'diego@rackflow.demo', role:'user',  status:'inactive', pass:'user' }
];
const SEED_RACKS = [
  { id:'rk-core',    name:'Core Rack A',    site:'DC-1', units:42, accent:'#22d3ee' },
  { id:'rk-edge',    name:'Edge Rack B',    site:'DC-1', units:24, accent:'#3b82f6' },
  { id:'rk-compute', name:'Compute Rack C', site:'DC-2', units:12, accent:'#a855f7' }
];
const SEED_DEVICES = [
  { id:'dv-fw1',  rackId:'rk-core', kind:'Firewall', name:'Edge Firewall fw1', ip:'10.20.0.1',  start:42, height:1, ports:['WAN 1','LAN 1','LAN 2'] },
  { id:'dv-rtr1', rackId:'rk-core', kind:'Router',   name:'Border Router rtr1', ip:'10.20.0.2', start:41, height:1, ports:['xe-0/0/0','xe-0/0/1'] },
  { id:'dv-cs1',  rackId:'rk-core', kind:'Switch',   name:'Core Switch cs1',    ip:'10.20.0.3', start:39, height:2, ports:['RJ45 1','RJ45 2','RJ45 3','RJ45 4'] },
  { id:'dv-srv1', rackId:'rk-core', kind:'Server',   name:'Control Node srv1',  ip:'10.20.0.11', start:35, height:4, ports:['ETH 1','ETH 2'] },
  { id:'dv-srv2', rackId:'rk-core', kind:'Server',   name:'API Node srv2',      ip:'10.20.0.12', start:31, height:4, ports:['ETH 1','ETH 2'] },
  { id:'dv-st1',  rackId:'rk-core', kind:'Storage',  name:'SAN Storage st1',    ip:'10.20.0.21', start:27, height:4, ports:['FC 1','FC 2'] },
  { id:'dv-sw2',  rackId:'rk-edge', kind:'Switch',   name:'Access Switch sw2',  ip:'10.20.1.3', start:24, height:1, ports:['RJ45 1','RJ45 2','RJ45 3'] },
  { id:'dv-fw2',  rackId:'rk-edge', kind:'Firewall', name:'Branch Firewall fw2', ip:'10.20.1.1', start:23, height:1, ports:['WAN 1','LAN 1'] },
  { id:'dv-rtr2', rackId:'rk-edge', kind:'Router',   name:'Edge Router rtr2',   ip:'10.20.1.2', start:21, height:2, ports:['ge-0/0/0','ge-0/0/1'] },
  { id:'dv-nas',  rackId:'rk-edge', kind:'Storage',  name:'Backup NAS nas1',    ip:'10.20.1.31', start:17, height:4, ports:['ETH 1','ETH 2'] },
  { id:'dv-gpu1', rackId:'rk-compute', kind:'Server', name:'GPU Node gpu1',     ip:'10.20.2.11', start:8,  height:4, ports:['ETH 1','ETH 2'] },
  { id:'dv-cmp1', rackId:'rk-compute', kind:'Server', name:'Compute Node cmp1', ip:'10.20.2.12', start:4,  height:4, ports:['ETH 1','ETH 2'] },
  { id:'dv-sw3',  rackId:'rk-compute', kind:'Switch', name:'Top-of-Rack sw3',   ip:'10.20.2.3', start:12, height:1, ports:['RJ45 1','RJ45 2','RJ45 3'] }
];
const SEED_CONNS = [
  { id:'cn-1', aDev:'dv-fw1',  aPort:'WAN 1',   bDev:'dv-rtr1', bPort:'xe-0/0/0' },
  { id:'cn-2', aDev:'dv-fw1',  aPort:'LAN 1',   bDev:'dv-cs1',  bPort:'RJ45 1' },
  { id:'cn-3', aDev:'dv-rtr1', aPort:'xe-0/0/1', bDev:'dv-cs1', bPort:'RJ45 2' },
  { id:'cn-4', aDev:'dv-cs1',  aPort:'RJ45 3',  bDev:'dv-srv1', bPort:'ETH 1' },
  { id:'cn-5', aDev:'dv-cs1',  aPort:'RJ45 4',  bDev:'dv-srv2', bPort:'ETH 1' },
  { id:'cn-6', aDev:'dv-srv1', aPort:'ETH 2',   bDev:'dv-st1',  bPort:'FC 1' },
  { id:'cn-7', aDev:'dv-sw2',  aPort:'RJ45 1',  bDev:'dv-fw2',  bPort:'LAN 1' },
  { id:'cn-8', aDev:'dv-fw2',  aPort:'WAN 1',   bDev:'dv-rtr2', bPort:'ge-0/0/0' },
  { id:'cn-9', aDev:'dv-sw3',  aPort:'RJ45 1',  bDev:'dv-gpu1', bPort:'ETH 1' },
  { id:'cn-10', aDev:'dv-sw2', aPort:'RJ45 3',  bDev:'dv-sw3',  bPort:'RJ45 2' }
];

/* ---------------- Store (swap this layer for PHP later) ---------------- */
const Store = (function(){
  const KEY  = 'rackflow.data.v1';
  const API  = '/api/state';
  let db = null;
  /* 'local' = browser storage only (static hosting / file://)
     'server' = JSON file DB (server/serve.ps1) is the source of truth */
  let mode = 'local';
  let settled = false;
  let readyCbs = [];
  const clone = function(o){ return JSON.parse(JSON.stringify(o)); };

  function fresh(){
    return { v:1, racks:clone(SEED_RACKS), devices:clone(SEED_DEVICES), conns:clone(SEED_CONNS), users:clone(SEED_USERS) };
  }
  function valid(d){ return !!(d && Array.isArray(d.racks) && Array.isArray(d.users)); }

  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch(e){ /* quota / private mode */ }
    if (mode === 'server') push();
  }
  function hydrate(d){
    if (!Array.isArray(d.devices)) d.devices = [];
    if (!Array.isArray(d.conns))  d.conns  = [];
    db = d;
    persist();
  }
  /* run after the database handshake settles (immediately in local mode) */
  function ready(cb){
    if (settled) { setTimeout(function(){ cb(); }, 0); }
    else readyCbs.push(cb);
  }
  function settle(){
    if (settled) return;
    settled = true;
    readyCbs.forEach(function(cb){ try { cb(); } catch(e){} });
    readyCbs = [];
  }
  /* debounced write so rapid mutations coalesce into one file write */
  let pushTimer = null;
  function push(){
    if (typeof fetch !== 'function') return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function(){
      fetch(API, { method:'POST', headers:{'Content-Type':'application/json'},
                   body: JSON.stringify(db) })
        .then(function(res){ if (!res.ok) mode = 'local'; })
        .catch(function(){ mode = 'local'; });
    }, 250);
  }
  /* upgrade to the file DB when the bundled server is running; stay local otherwise */
  function connect(){
    /* file:// can never host the API — skip the probe so the console stays clean */
    if (typeof fetch !== 'function' || location.protocol === 'file:'){ settle(); return; }
    fetch(API, { cache:'no-store' }).then(function(res){
      if (res.status === 404){ mode = 'server'; push(); return; }  // server up, no DB file yet -> bootstrap it
      if (!res.ok) throw new Error('offline');
      if ((res.headers.get('content-type') || '').indexOf('json') < 0) throw new Error('not json');
      return res.json().then(function(remote){
        if (!valid(remote)) throw new Error('bad payload');
        mode = 'server';
        hydrate(remote);   // the file DB wins over localStorage
      });
    }).catch(function(){ mode = 'local'; }).then(settle, settle);
  }
  function init(){
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ d = null; }
    if (!valid(d)) d = fresh();
    hydrate(d);
    connect();
    return db;
  }

  const racks   = function(){ return db.racks; };
  const devices = function(){ return db.devices; };
  const conns   = function(){ return db.conns; };
  const users   = function(){ return db.users; };
  const rack    = function(id){ return db.racks.filter(function(r){ return r.id === id; })[0] || null; };
  const device  = function(id){ return db.devices.filter(function(d){ return d.id === id; })[0] || null; };
  const user    = function(id){ return db.users.filter(function(u){ return u.id === id; })[0] || null; };
  const devicesIn = function(rackId){ return db.devices.filter(function(d){ return d.rackId === rackId; }); };
  const connsFor  = function(devId){ return db.conns.filter(function(c){ return c.aDev === devId || c.bDev === devId; }); };

  function parsePorts(v){
    if (Array.isArray(v)) return v.slice();
    return String(v || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  }
  function rackTop(rackId){
    return devicesIn(rackId).reduce(function(m, d){ return Math.max(m, d.start + d.height - 1); }, 0);
  }
  function overlaps(rackId, start, height, skipId){
    return devicesIn(rackId).some(function(d){
      return d.id !== skipId && start < d.start + d.height && d.start < start + height;
    });
  }
  function firstFreeUnit(rackId){
    const r = rack(rackId);
    if (!r) return 1;
    const busy = {};
    devicesIn(rackId).forEach(function(d){
      for (let u = d.start; u < d.start + d.height; u++) busy[u] = true;
    });
    for (let u = 1; u <= r.units; u++) if (!busy[u]) return u;
    return 1;
  }

  function addRack(o){
    const r = {
      id: uid('rk'),
      name: String(o.name || '').trim() || 'Untitled rack',
      site: String(o.site || '').trim() || 'DC-1',
      units: clamp(parseInt(o.units, 10) || 42, 1, 60),
      accent: o.accent || '#22d3ee'
    };
    db.racks.push(r); persist(); return r;
  }
  function updateRack(id, patch){
    const r = rack(id); if (!r) return null;
    Object.assign(r, patch); persist(); return r;
  }
  function removeRack(id){
    const gone = devicesIn(id).map(function(d){ return d.id; });
    db.devices = db.devices.filter(function(d){ return d.rackId !== id; });
    db.conns = db.conns.filter(function(c){ return gone.indexOf(c.aDev) < 0 && gone.indexOf(c.bDev) < 0; });
    db.racks = db.racks.filter(function(r){ return r.id !== id; });
    persist();
  }

  function addDevice(o){
    const d = {
      id: uid('dv'),
      rackId: o.rackId,
      kind: DEVICE_KINDS.indexOf(o.kind) >= 0 ? o.kind : 'Server',
      name: String(o.name || '').trim() || 'Unnamed device',
      ip: String(o.ip || '').trim(),
      start: clamp(parseInt(o.start, 10) || 1, 1, 60),
      height: clamp(parseInt(o.height, 10) || 1, 1, 60),
      ports: parsePorts(o.ports)
    };
    db.devices.push(d); persist(); return d;
  }
  function updateDevice(id, patch){
    const d = device(id); if (!d) return null;
    if (patch.ports !== undefined) patch.ports = parsePorts(patch.ports);
    Object.assign(d, patch); persist(); return d;
  }
  function removeDevice(id){
    db.devices = db.devices.filter(function(d){ return d.id !== id; });
    db.conns = db.conns.filter(function(c){ return c.aDev !== id && c.bDev !== id; });
    persist();
  }

  function addConn(aDev, aPort, bDev, bPort){
    const dup = db.conns.filter(function(c){
      return c.aDev === aDev && c.aPort === aPort && c.bDev === bDev && c.bPort === bPort;
    })[0];
    if (dup) return null;
    const c = { id: uid('cn'), aDev: aDev, aPort: aPort, bDev: bDev, bPort: bPort };
    db.conns.push(c); persist(); return c;
  }
  function removeConn(id){
    db.conns = db.conns.filter(function(c){ return c.id !== id; });
    persist();
  }

  function addUser(o){
    const u = {
      id: uid('u'),
      name: String(o.name || '').trim() || 'Unnamed user',
      username: String(o.username || '').trim().toLowerCase(),
      email: String(o.email || '').trim(),
      role: o.role === 'admin' ? 'admin' : 'user',
      status: o.status === 'inactive' ? 'inactive' : 'active',
      pass: 'user' /* set at creation/reset only — never shown in the UI */
    };
    db.users.push(u); persist(); return u;
  }
  function updateUser(id, patch){
    const u = user(id); if (!u) return null;
    if (patch.role !== undefined) patch.role = patch.role === 'admin' ? 'admin' : 'user';
    if (patch.status !== undefined) patch.status = patch.status === 'inactive' ? 'inactive' : 'active';
    delete patch.pass;
    Object.assign(u, patch); persist(); return u;
  }
  function removeUser(id){
    db.users = db.users.filter(function(u){ return u.id !== id; });
    persist();
  }

  return {
    init:init, persist:persist, ready:ready,
    mode:function(){ return mode; },
    racks:racks, devices:devices, conns:conns, users:users,
    rack:rack, device:device, user:user,
    devicesIn:devicesIn, connsFor:connsFor,
    addRack:addRack, updateRack:updateRack, removeRack:removeRack,
    addDevice:addDevice, updateDevice:updateDevice, removeDevice:removeDevice,
    addConn:addConn, removeConn:removeConn,
    addUser:addUser, updateUser:updateUser, removeUser:removeUser,
    firstFreeUnit:firstFreeUnit, overlaps:overlaps, rackTop:rackTop, parsePorts:parsePorts
  };
})();

/* ---------------- Auth (mock, sessionStorage backed) ---------------- */
const Auth = {
  SKEY: 'rackflow.session',
  RKEY: 'rackflow.remember',
  _me: null,

  pub: function(u){
    return { id:u.id, username:u.username, name:u.name, email:u.email, role:u.role, status:u.status };
  },
  login: function(username, password, remember){
    return new Promise(function(resolve){
      setTimeout(function(){
        const un = String(username || '').trim().toLowerCase();
        const pw = String(password || '');
        const u = Store.users().filter(function(x){ return String(x.username).toLowerCase() === un; })[0];
        if (!u) return resolve({ ok:false, error:'No account matches that username' });
        if (u.pass !== pw) return resolve({ ok:false, error:'Incorrect password' });
        if (u.status !== 'active') return resolve({ ok:false, error:'Account is inactive — ask an administrator to activate it' });
        const pub = Auth.pub(u);
        try {
          if (remember) { localStorage.setItem(Auth.RKEY, JSON.stringify(pub)); sessionStorage.removeItem(Auth.SKEY); }
          else { sessionStorage.setItem(Auth.SKEY, JSON.stringify(pub)); localStorage.removeItem(Auth.RKEY); }
        } catch(e){}
        Auth._me = pub;
        resolve({ ok:true, user:pub });
      }, 320);
    });
  },
  current: function(){
    if (Auth._me) return Auth._me;
    let raw = null;
    try { raw = sessionStorage.getItem(Auth.SKEY) || localStorage.getItem(Auth.RKEY); } catch(e){}
    if (raw) { try { Auth._me = JSON.parse(raw); } catch(e){ Auth._me = null; } }
    return Auth._me;
  },
  isAdmin: function(){ const u = Auth.current(); return !!u && u.role === 'admin'; },
  logout: function(){
    Auth._me = null;
    try { sessionStorage.removeItem(Auth.SKEY); localStorage.removeItem(Auth.RKEY); } catch(e){}
    location.replace('index.html');
  },
  /* called at the top of every page's DOMContentLoaded */
  require: function(adminOnly){
    const u = Auth.current();
    if (!u) { location.replace('index.html'); return null; }
    if (adminOnly && u.role !== 'admin') { location.replace('dashboard.html'); return null; }
    return u;
  },
  redirectIfAuthed: function(){
    const u = Auth.current();
    if (u) { location.replace(u.role === 'admin' ? 'admin.html' : 'dashboard.html'); return true; }
    return false;
  },
  /* UI-only mock — no backend round trip */
  changePassword: function(current, next, confirm){
    if (!current || !next || !confirm) return { ok:false, error:'Fill in every field' };
    if (next !== confirm) return { ok:false, error:'Do not match' };
    return { ok:true };
  }
};

/* ---------------- UI: theme · toast · banner · modal · topbar · racks ---------------- */
const UI = {
  _stack: [],

  theme: {
    get: function(){ return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; },
    set: function(t){
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('rackflow.theme', t); } catch(e){}
      UI.theme.sync();
    },
    toggle: function(){ UI.theme.set(UI.theme.get() === 'light' ? 'dark' : 'light'); },
    sync: function(){
      const dark = UI.theme.get() === 'dark';
      $$('.theme-btn').forEach(function(b){
        /* not class "glyph": theme buttons are chrome, never rack content */
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (dark ? ICONS.sun : ICONS.moon) + '</svg>';
        b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      });
    }
  },

  toast: function(msg, type){
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.textContent = String(msg);
    root.appendChild(t);
    setTimeout(function(){
      t.classList.add('out');
      setTimeout(function(){ t.remove(); }, 320);
    }, 2600);
  },

  banner: function(root, html){
    if (!root) return;
    root.innerHTML = '<div class="banner"><b>Demo</b><span>' + html + '</span>' +
      '<button class="icon-btn" aria-label="Dismiss banner">×</button></div>';
    const btn = root.querySelector('button');
    if (btn) btn.onclick = function(){ root.innerHTML = ''; };
  },

  /* ---- modals: Esc + backdrop close, stack aware ---- */
  modal: function(opts){
    opts = opts || {};
    const root = document.getElementById('modalRoot') || document.body;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + escapeHtml(opts.title || 'Dialog') + '">' +
        '<div class="modal-head"><div><h2>' + escapeHtml(opts.title || '') + '</h2>' +
          (opts.sub ? '<p>' + escapeHtml(opts.sub) + '</p>' : '') + '</div>' +
          '<button class="icon-btn" data-close aria-label="Close dialog">×</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') +
      '</div>';
    const prevFocus = document.activeElement;
    root.appendChild(ov);

    const handle = {
      el: ov,
      close: function(){
        const i = UI._stack.indexOf(handle);
        if (i >= 0) UI._stack.splice(i, 1);
        ov.remove();
        if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch(e){} }
      }
    };
    UI._stack.push(handle);
    ov.addEventListener('mousedown', function(e){ if (e.target === ov) handle.close(); });
    ov.querySelector('[data-close]').addEventListener('click', handle.close);
    const f = ov.querySelector('input, select, textarea, .btn.primary, .btn.danger');
    if (f) setTimeout(function(){ try { f.focus(); } catch(e){} }, 40);
    if (opts.onMount) opts.onMount(handle);
    return handle;
  },

  confirm: function(o){
    o = o || {};
    return UI.modal({
      title: o.title || 'Are you sure?',
      body: '<p class="confirm-text">' + o.text + '</p>',
      foot: '<button class="btn ghost" data-x>Cancel</button>' +
            '<button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-ok>' + escapeHtml(o.confirmLabel || 'Confirm') + '</button>',
      onMount: function(h){
        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        h.el.querySelector('[data-ok]').onclick = function(){ h.close(); if (o.onConfirm) o.onConfirm(); };
      }
    });
  },

  /* ---- profile dropdown + change password ---- */
  dropdownOpen: function(){ const d = $('.dropdown'); return !!d && !d.hidden; },
  closeDropdown: function(){
    const d = $('.dropdown'), b = $('[data-act="profile"]');
    if (d) d.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
  },
  toggleDropdown: function(){
    const d = $('.dropdown'), b = $('[data-act="profile"]');
    if (!d) return;
    d.hidden = !d.hidden;
    if (b) b.setAttribute('aria-expanded', d.hidden ? 'false' : 'true');
  },
  changePassword: function(){
    UI.modal({
      title: 'Change password',
      sub: 'Demo only — nothing leaves this browser.',
      body:
        '<label class="field"><span>Current password</span><input type="password" id="cpCur" autocomplete="current-password"></label>' +
        '<div class="grid-2">' +
          '<label class="field"><span>New password</span><input type="password" id="cpNew" autocomplete="new-password"></label>' +
          '<label class="field"><span>Confirm new password</span><input type="password" id="cpCf" autocomplete="new-password"></label>' +
        '</div>',
      foot: '<button class="btn ghost" data-x>Cancel</button><button class="btn primary" data-ok>Update password</button>',
      onMount: function(h){
        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        h.el.querySelector('[data-ok]').onclick = function(){
          const res = Auth.changePassword($('#cpCur', h.el).value, $('#cpNew', h.el).value, $('#cpCf', h.el).value);
          if (!res.ok) { UI.toast(res.error, 'error'); return; }
          h.close();
          UI.toast('Password updated (demo)', 'success');
        };
      }
    });
  },

  topbar: function(active){
    const el = document.getElementById('topbar');
    if (!el) return;
    const u = Auth.current();
    if (!u) return;
    const admin = u.role === 'admin';
    const tabs = admin
      ? [['users','Users','users.html'], ['admin','Racks','admin.html'], ['dashboard','Dashboard','dashboard.html']]
      : [['dashboard','Dashboard','dashboard.html']];
    const initial = String(u.name || u.username || '?').trim().charAt(0).toUpperCase();

    el.className = 'topbar';
    el.innerHTML =
      '<a class="brand-mini" href="' + (admin ? 'admin.html' : 'dashboard.html') + '">' +
        '<span class="logo-mark">' + logoSvg() + '</span><b>RackFlow</b>' +
        '<span class="role-tag">' + escapeHtml(u.role) + '</span></a>' +
      '<nav class="tabs" aria-label="Sections">' +
        tabs.map(function(t){
          const on = t[0] === active;
          return '<a class="tab' + (on ? ' active' : '') + '" href="' + t[2] + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
        }).join('') +
      '</nav>' +
      '<span class="tb-spacer"></span>' +
      '<div class="tb-right">' +
        '<button class="theme-btn" data-act="theme" aria-label="Toggle color theme"></button>' +
        '<div class="profile-wrap">' +
          '<button class="profile-btn" data-act="profile" aria-haspopup="true" aria-expanded="false">' +
            '<span class="avatar">' + escapeHtml(initial) + '</span>' +
            '<span class="pname">' + escapeHtml(u.name) + '</span></button>' +
          '<div class="dropdown" hidden>' +
            '<div class="dd-head"><b>' + escapeHtml(u.name) + '</b><span>' + escapeHtml(u.email || u.username) + '</span></div>' +
            '<button class="dd-item" data-act="change-pass">Change password</button>' +
            '<button class="dd-item danger" data-act="signout">Sign out</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    el.addEventListener('click', function(e){
      const b = e.target.closest('[data-act]');
      if (!b || !el.contains(b)) return;
      const act = b.getAttribute('data-act');
      if (act === 'theme') UI.theme.toggle();
      else if (act === 'profile') UI.toggleDropdown();
      else if (act === 'change-pass') { UI.closeDropdown(); UI.changePassword(); }
      else if (act === 'signout') Auth.logout();
    });
    UI.theme.sync();
  },

  /* ---- rack renderer: compact (list/dashboard) + detailed (zoom) ---- */
  rackCard: function(rack, o){
    o = o || {};
    const admin = !!o.admin;
    const detailed = !!o.detailed;
    const clickable = o.clickable !== false && !admin;
    const all = Store.devicesIn(rack.id);
    const shown = typeof o.filter === 'function' ? all.filter(o.filter) : all;
    const accent = escapeHtml(rack.accent || '#22d3ee');

    const rail = [];
    for (let u = rack.units; u >= 1; u--) {
      rail.push('<div class="rail-unit' + (u % 5 === 0 ? ' mark' : '') + '">' + u + '</div>');
    }

    const panels = shown.map(function(d){
      const top = (rack.units - d.start - d.height + 1) / rack.units * 100;
      const h = d.height / rack.units * 100;
      const st = 'top:' + top.toFixed(4) + '%;height:' + h.toFixed(4) + '%;--accent:' + accent;
      const t = ' title="' + escapeHtml(d.name + ' · ' + d.kind + (d.ip ? ' · ' + d.ip : '')) + '"';
      if (detailed) {
        return '<div class="dev-panel detailed' + (o.selected === d.id ? ' selected' : '') + '" style="' + st + '"' + t +
          ' data-act="zoom-dev" data-dev="' + d.id + '" role="button" tabindex="0">' +
          '<span class="dp-line">' + icon(KIND_ICON[d.kind] || 'server') +
          '<b>' + escapeHtml(d.name) + '</b><span class="ip">' + escapeHtml(d.ip || 'no ip') + '</span></span></div>';
      }
      let acts = '';
      if (admin) {
        acts = '<span class="dev-actions">' +
          '<button class="btn" data-act="conn" data-dev="' + d.id + '">Connections</button>' +
          '<button class="btn" data-act="edit-dev" data-dev="' + d.id + '">Edit</button>' +
          '<button class="btn danger" data-act="del-dev" data-dev="' + d.id + '">Delete</button>' +
          '</span>';
      }
      const attrs = clickable
        ? ' data-act="zoom-dev" data-dev="' + d.id + '" role="button" tabindex="0"'
        : '';
      return '<div class="dev-panel" style="' + st + '"' + t + attrs + '>' +
        '<span class="dp-main"><span class="dp-id">' + escapeHtml(d.name) + '</span>' +
        '<span class="dp-meta">' + escapeHtml(d.kind) + ' · ' + escapeHtml(d.ip || 'no ip') + '</span></span>' +
        acts + '</div>';
    }).join('');

    let head = '<header class="rack-head"><div style="min-width:0">' +
      '<h3 class="rack-name">' + escapeHtml(rack.name) + '</h3>' +
      '<p class="rack-meta">' + escapeHtml(rack.site) + ' · ' + rack.units + 'U · ' + all.length + ' devices</p></div>';
    if (admin) {
      head += '<div class="rack-actions">' +
        '<button class="btn sm" data-act="edit-rack">Edit</button>' +
        '<button class="btn sm primary" data-act="add-device">Add device</button></div>';
    }
    head += '</header>';

    return '<section class="rack-card' + (detailed ? ' detailed' : '') + '" data-rack="' + rack.id + '" style="--accent:' + accent + '">' +
      head +
      '<div class="rack-body"><div class="unit-rail">' + rail.join('') + '</div>' +
      '<div class="device-plane">' + (shown.length ? '' : '<div class="plane-hint">Empty rack</div>') + panels + '</div>' +
      '</div></section>';
  },

  renderRacks: function(container, opts){
    const racks = Store.racks();
    container.innerHTML = racks.map(function(r){ return UI.rackCard(r, opts); }).join('');
  },

  /* ---- full-screen zoom overlay (dashboard) ---- */
  zoom: function(rackId, devId){
    const root = document.getElementById('zoomRoot');
    const rack = Store.rack(rackId);
    if (!root || !rack) return;
    let selected = devId || null;

    function render(){
      const sel = selected ? Store.device(selected) : null;
      let connsHtml = '';
      if (sel) {
        const list = Store.connsFor(sel.id);
        const rows = list.map(function(c){
          const mine = c.aDev === sel.id;
          const myPort = mine ? c.aPort : c.bPort;
          const other = Store.device(mine ? c.bDev : c.aDev);
          const otherPort = mine ? c.bPort : c.aPort;
          return '<li class="port-row"><span class="port-dot"></span>' +
            '<span class="pr-a">' + escapeHtml(myPort) + '</span><span class="arr">→</span>' +
            '<span class="pr-dev">' + escapeHtml(other ? other.name : 'Unknown device') + '</span>' +
            '<span class="arr">→</span><span class="pr-b">' + escapeHtml(otherPort) + '</span></li>';
        }).join('');
        connsHtml =
          '<div class="conn-card"><div class="conn-head"><b>Connections — ' + escapeHtml(sel.name) +
          '<span class="badge">' + list.length + ' LINK' + (list.length === 1 ? '' : 'S') + '</span></b>' +
          '<span class="rack-meta">' + escapeHtml(sel.kind) + ' · ' + escapeHtml(sel.ip || 'no ip') + '</span></div>' +
          (list.length
            ? '<ul class="port-list">' + rows + '</ul>'
            : '<p class="conn-empty">No links yet for this device — add them from Racks → Connections.</p>') +
          '</div>';
      }
      root.innerHTML =
        '<div class="zoom" data-zoom>' +
          '<div class="zoom-panel" role="dialog" aria-modal="true" aria-label="' + escapeHtml(rack.name) + ' zoom">' +
            '<div class="zoom-head"><div><h2>' + escapeHtml(rack.name) + '</h2>' +
              '<p>' + escapeHtml(rack.site) + ' · ' + rack.units + 'U · click a device for its links</p></div>' +
              '<button class="icon-btn" data-act="zoom-close" aria-label="Close zoom view">×</button></div>' +
            '<div class="zoom-body">' + UI.rackCard(rack, { detailed:true, admin:false, selected:selected }) +
            connsHtml + '</div>' +
          '</div>' +
        '</div>';
    }

    function close(){ root.innerHTML = ''; document.removeEventListener('keydown', onKey); }

    function onKey(e){ if (e.key === 'Escape') close(); }

    root.onclick = function(e){
      const act = e.target.closest('[data-act]');
      if (e.target.classList.contains('zoom') || (act && act.getAttribute('data-act') === 'zoom-close')) { close(); return; }
      if (act && act.getAttribute('data-act') === 'zoom-dev') {
        selected = act.getAttribute('data-dev');
        render();
      }
    };
    root.onkeydown = function(e){
      const act = e.target.closest && e.target.closest('[data-act="zoom-dev"]');
      if (act && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selected = act.getAttribute('data-dev'); render(); }
    };
    document.addEventListener('keydown', onKey);
    render();
  }
};

/* global Escape: top modal first, then the profile dropdown */
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  if (UI._stack.length) { UI._stack[UI._stack.length - 1].close(); return; }
  if (UI.dropdownOpen()) UI.closeDropdown();
});
/* outside click closes the profile dropdown */
document.addEventListener('mousedown', function(e){
  if (UI.dropdownOpen() && !e.target.closest('.profile-wrap')) UI.closeDropdown();
});

Store.init();
