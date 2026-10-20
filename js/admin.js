'use strict';
/* Racks tab — rack / device / connection management (admin only) */
document.addEventListener('DOMContentLoaded', function(){
  const me = Auth.require(true);
  if (!me) return;
  UI.topbar('admin');
  UI.banner(document.getElementById('bannerRoot'),
    'Everything here persists in this browser (<code>localStorage</code>) — reload the page to confirm.');

  const grid = document.getElementById('rackGrid');
  const empty = document.getElementById('emptyState');

  function render(){
    UI.renderRacks(grid, { admin:true, clickable:false });
    empty.hidden = Store.racks().length > 0;
  }
  render();
  /* re-render once the database handshake settles, and correct the banner for the active mode */
  Store.ready(function(){
    render();
    UI.banner(document.getElementById('bannerRoot'),
      Store.mode() === 'server'
        ? 'Saved to the bundled database (<code>data/rackflow-db.json</code>) — reload the page to confirm.'
        : 'Everything here persists in this browser (<code>localStorage</code>) — reload the page to confirm.');
  });

  /* ---------- delegated actions ---------- */
  grid.addEventListener('click', function(e){
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    const card = b.closest('[data-rack]');
    const rackId = card ? card.getAttribute('data-rack') : null;
    const devId = b.getAttribute('data-dev');
    if (act === 'edit-rack') rackForm(rackId);
    else if (act === 'add-device') deviceForm(rackId, null);
    else if (act === 'edit-dev') deviceForm(Store.device(devId) ? Store.device(devId).rackId : rackId, devId);
    else if (act === 'del-dev') deleteDevice(devId);
    else if (act === 'conn') connectionsModal(devId);
  });
  const addBtn = document.querySelector('.head-actions [data-act="add-rack"]');
  if (addBtn) addBtn.addEventListener('click', function(){ rackForm(null); });

  /* ---------- rack modal (add / edit / remove) ---------- */
  function rackForm(rackId){
    const r = rackId ? Store.rack(rackId) : null;
    UI.modal({
      title: r ? 'Edit rack' : 'Add a rack',
      sub: r ? 'Rename it, resize it, recolor it.' : 'Name, site, size in rack units and an accent color.',
      body:
        '<label class="field"><span>Rack name</span><input id="rkName" value="' + escapeHtml(r ? r.name : '') + '" placeholder="Core Rack D"></label>' +
        '<div class="grid-2">' +
          '<label class="field"><span>Site</span><input id="rkSite" value="' + escapeHtml(r ? r.site : '') + '" placeholder="DC-1"></label>' +
          '<label class="field"><span>Rack units (U)</span><input id="rkUnits" type="number" min="1" max="60" value="' + (r ? r.units : 42) + '"></label>' +
        '</div>' +
        '<label class="field"><span>Accent color</span><input id="rkAccent" type="color" value="' + escapeHtml(r ? r.accent : '#22d3ee') + '"></label>' +
        '<p class="err" id="rkErr" hidden></p>',
      foot:
        (r ? '<button class="btn danger left" data-rm>Remove rack</button>' : '') +
        '<button class="btn ghost" data-x>Cancel</button>' +
        '<button class="btn primary" data-save>' + (r ? 'Save changes' : 'Add rack') + '</button>',
      onMount: function(h){
        const err = $('#rkErr', h.el);
        const fail = function(msg){ err.textContent = msg; err.hidden = false; };
        $$('input, select', h.el).forEach(function(el){ el.addEventListener('input', function(){ err.hidden = true; }); });
        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        if (r) {
          h.el.querySelector('[data-rm]').onclick = function(){ h.close(); confirmRemoveRack(r); };
        }
        h.el.querySelector('[data-save]').onclick = function(){
          const name = $('#rkName', h.el).value.trim();
          const site = $('#rkSite', h.el).value.trim() || 'DC-1';
          const units = clamp(parseInt($('#rkUnits', h.el).value, 10) || 0, 1, 60);
          const accent = $('#rkAccent', h.el).value || '#22d3ee';
          if (!name) return fail('Name is required');
          if (units < 1) return fail('Units must be at least 1');
          if (r && units < Store.rackTop(r.id)) return fail('Too small — existing devices reach U' + Store.rackTop(r.id));
          if (r) { Store.updateRack(r.id, { name:name, site:site, units:units, accent:accent }); UI.toast('Rack updated', 'success'); }
          else { Store.addRack({ name:name, site:site, units:units, accent:accent }); UI.toast('Rack added', 'success'); }
          h.close();
          render();
        };
      }
    });
  }

  function confirmRemoveRack(r){
    const devCount = Store.devicesIn(r.id).length;
    UI.confirm({
      title: 'Remove rack',
      text: 'Remove <strong>' + escapeHtml(r.name) + '</strong> together with <strong>' + devCount +
            ' device(s)</strong> and every connection touching them? This cannot be undone.',
      confirmLabel: 'Remove rack',
      danger: true,
      onConfirm: function(){
        Store.removeRack(r.id);
        render();
        UI.toast('Rack removed (devices + connections cascaded)', 'success');
      }
    });
  }

  /* ---------- device modal (add / edit) ---------- */
  function deviceForm(rackId, devId){
    const rack = Store.rack(rackId);
    if (!rack) return;
    const d = devId ? Store.device(devId) : null;
    const startDefault = d ? d.start : Store.firstFreeUnit(rackId);
    const kindOpts = DEVICE_KINDS.map(function(k){
      const sel = d ? (d.kind === k) : (k === 'Server');
      return '<option value="' + k + '"' + (sel ? ' selected' : '') + '>' + k + '</option>';
    }).join('');

    UI.modal({
      title: d ? 'Edit device' : 'Add device',
      sub: rack.name + ' · ' + rack.units + 'U',
      body:
        '<div class="grid-2">' +
          '<label class="field"><span>Type</span><select id="dvKind">' + kindOpts + '</select></label>' +
          '<label class="field"><span>Device name *</span><input id="dvName" value="' + escapeHtml(d ? d.name : '') + '" placeholder="Access Switch sw9"></label>' +
        '</div>' +
        '<label class="field"><span>IP address</span><input id="dvIp" value="' + escapeHtml(d ? d.ip : '') + '" placeholder="10.20.0.50"></label>' +
        '<div class="grid-2">' +
          '<label class="field"><span>Start unit</span><input id="dvStart" type="number" min="1" value="' + startDefault + '"></label>' +
          '<label class="field"><span>Height (U)</span><input id="dvHeight" type="number" min="1" value="' + (d ? d.height : 1) + '"></label>' +
        '</div>' +
        '<label class="field"><span>Ports</span><input id="dvPorts" value="' +
          escapeHtml(d ? d.ports.join(', ') : 'RJ45 1, RJ45 2') + '" placeholder="RJ45 1, RJ45 2">' +
          '<span class="hint">Comma-separated port names — used by the Connections modal.</span></label>' +
        '<p class="err" id="dvErr" hidden></p><p class="warn" id="dvWarn" hidden></p>',
      foot: '<button class="btn ghost" data-x>Cancel</button>' +
            '<button class="btn primary" data-save>' + (d ? 'Save changes' : 'Add device') + '</button>',
      onMount: function(h){
        const err = $('#dvErr', h.el), warn = $('#dvWarn', h.el);
        const startEl = $('#dvStart', h.el), heightEl = $('#dvHeight', h.el);
        const fail = function(msg){ err.textContent = msg; err.hidden = false; };
        $$('input, select', h.el).forEach(function(el){ el.addEventListener('input', function(){ err.hidden = true; }); });
        const check = function(){
          const s = parseInt(startEl.value, 10) || 0, ht = parseInt(heightEl.value, 10) || 0;
          const hit = Store.overlaps(rackId, s, ht, d ? d.id : null);
          warn.textContent = 'Heads up: overlaps an existing device in this rack';
          warn.hidden = !hit;
        };
        startEl.addEventListener('input', check);
        heightEl.addEventListener('input', check);
        check();
        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        h.el.querySelector('[data-save]').onclick = function(){
          const name = $('#dvName', h.el).value.trim();
          const kind = $('#dvKind', h.el).value;
          const ip = $('#dvIp', h.el).value.trim();
          const start = parseInt(startEl.value, 10) || 0;
          const height = parseInt(heightEl.value, 10) || 0;
          const ports = $('#dvPorts', h.el).value;
          if (!name) return fail('Device name is required');
          if (start < 1) return fail('Start unit must be 1 or higher');
          if (height < 1) return fail('Height must be at least 1U');
          if (start + height - 1 > rack.units) return fail('Does not fit — ' + rack.name + ' is ' + rack.units + 'U');
          const overlaps = Store.overlaps(rackId, start, height, d ? d.id : null);
          if (d) {
            Store.updateDevice(d.id, { name:name, kind:kind, ip:ip, start:start, height:height, ports:ports });
            UI.toast(overlaps ? 'Device saved with a unit overlap' : 'Device updated', overlaps ? 'warn' : 'success');
          } else {
            Store.addDevice({ rackId:rackId, name:name, kind:kind, ip:ip, start:start, height:height, ports:ports });
            UI.toast(overlaps ? 'Device added with a unit overlap' : 'Device added', overlaps ? 'warn' : 'success');
          }
          h.close();
          render();
        };
      }
    });
  }

  function deleteDevice(devId){
    const d = Store.device(devId);
    if (!d) return;
    const links = Store.connsFor(devId).length;
    UI.confirm({
      title: 'Delete device',
      text: 'Delete <strong>' + escapeHtml(d.name) + '</strong>' +
            (links ? ' and its <strong>' + links + ' connection(s)</strong>' : '') + '?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: function(){
        Store.removeDevice(devId);
        render();
        UI.toast('Device deleted', 'success');
      }
    });
  }

  /* ---------- connections modal (stays open, re-renders behind) ---------- */
  function connectionsModal(devId){
    UI.modal({
      title: 'Connections',
      sub: 'Pick a port on each device, add or remove links — the rack re-renders behind this dialog.',
      body:
        '<p class="sub-head">Add a link</p>' +
        '<div class="grid-2">' +
          '<label class="field"><span>Device A</span><select id="cnA"></select></label>' +
          '<label class="field"><span>Port A</span><select id="cnAPort"></select></label>' +
          '<label class="field"><span>Device B</span><select id="cnB"></select></label>' +
          '<label class="field"><span>Port B</span><select id="cnBPort"></select></label>' +
        '</div>' +
        '<button class="btn primary" data-add>Add link</button>' +
        '<p class="sub-head" style="margin-top:16px">Existing links</p>' +
        '<div id="cnList"></div>',
      foot: '<button class="btn ghost left" data-x>Close</button>',
      onMount: function(h){
        const selA = $('#cnA', h.el), selAP = $('#cnAPort', h.el);
        const selB = $('#cnB', h.el), selBP = $('#cnBPort', h.el);
        const listEl = $('#cnList', h.el);

        function devOptions(){
          return Store.devices().map(function(d){
            const rk = Store.rack(d.rackId);
            return '<option value="' + d.id + '">' + escapeHtml(d.name) + ' (' + escapeHtml(rk ? rk.name : '?') + ')</option>';
          }).join('');
        }
        function fillPorts(selDev, selPort){
          const d = Store.device(selDev.value);
          selPort.innerHTML = (d && d.ports.length)
            ? d.ports.map(function(p){ return '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>'; }).join('')
            : '<option value="">(no ports)</option>';
        }
        function refreshList(){
          const conns = Store.conns();
          if (!conns.length) { listEl.innerHTML = '<p class="conn-empty">No links yet.</p>'; return; }
          listEl.innerHTML = '<ul class="conn-list">' + conns.map(function(c){
            const a = Store.device(c.aDev), b = Store.device(c.bDev);
            return '<li><span class="lbl">' + escapeHtml(a ? a.name : '?') + '<span class="sep">:</span>' +
              escapeHtml(c.aPort) + ' ⇄ ' + escapeHtml(b ? b.name : '?') + '<span class="sep">:</span>' +
              escapeHtml(c.bPort) + '</span>' +
              '<button class="btn sm danger" data-rm="' + c.id + '">Remove</button></li>';
          }).join('') + '</ul>';
        }

        const devs = Store.devices();
        if (!devs.length) { selA.innerHTML = '<option value="">(no devices)</option>'; selB.innerHTML = '<option value="">(no devices)</option>'; }
        else {
          selA.innerHTML = devOptions();
          selB.innerHTML = devOptions();
          selA.value = devId && Store.device(devId) ? devId : devs[0].id;
          const other = devs.filter(function(d){ return d.id !== selA.value; })[0];
          if (other) selB.value = other.id;
          fillPorts(selA, selAP);
          fillPorts(selB, selBP);
        }
        selA.addEventListener('change', function(){ fillPorts(selA, selAP); });
        selB.addEventListener('change', function(){ fillPorts(selB, selBP); });
        refreshList();

        listEl.addEventListener('click', function(e){
          const rm = e.target.closest('[data-rm]');
          if (!rm) return;
          Store.removeConn(rm.getAttribute('data-rm'));
          refreshList();
          render();
          UI.toast('Link removed', 'success');
        });

        h.el.querySelector('[data-x]').onclick = function(){ h.close(); };
        h.el.querySelector('[data-add]').onclick = function(){
          const a = selA.value, b = selB.value, ap = selAP.value, bp = selBP.value;
          if (!a || !b) return UI.toast('Both devices are required', 'error');
          if (a === b) return UI.toast('Pick two different devices', 'error');
          if (!ap || !bp) return UI.toast('Both ports are required', 'error');
          if (!Store.addConn(a, ap, b, bp)) return UI.toast('That link already exists', 'error');
          refreshList();
          render();
          UI.toast('Link added', 'success');
        };
      }
    });
  }
});
