'use strict';
/* Dashboard — read-only live rack view for users AND admins */
document.addEventListener('DOMContentLoaded', function(){
  const me = Auth.require(false);
  if (!me) return;
  UI.topbar('dashboard');
  UI.banner(document.getElementById('bannerRoot'),
    'Read-only view — click a device to zoom in and see its links.');

  const grid = document.getElementById('rackGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('countLine');
  const search = document.getElementById('search');
  let query = '';

  function match(d){
    if (!query) return true;
    return (d.name + ' ' + d.kind + ' ' + (d.ip || '')).toLowerCase().indexOf(query) >= 0;
  }

  function render(){
    UI.renderRacks(grid, { admin:false, clickable:true, filter:match });
    const racks = Store.racks();
    const devices = Store.devices();
    const visDev = query ? devices.filter(match).length : devices.length;
    const visRacks = query
      ? racks.filter(function(r){ return Store.devicesIn(r.id).some(match); }).length
      : racks.length;
    count.textContent = visRacks + ' rack' + (visRacks === 1 ? '' : 's') + ' · ' +
      visDev + ' device' + (visDev === 1 ? '' : 's');
    empty.textContent = query ? 'No devices match your search.' : 'No devices yet.';
    empty.hidden = visDev > 0;
  }
  render();
  Store.ready(render);

  function openZoom(el){
    const card = el.closest('[data-rack]');
    if (!card) return;
    UI.zoom(card.getAttribute('data-rack'), el.getAttribute('data-dev'));
  }
  grid.addEventListener('click', function(e){
    const b = e.target.closest('[data-act="zoom-dev"]');
    if (b) openZoom(b);
  });
  grid.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const b = e.target.closest('[data-act="zoom-dev"]');
    if (b) { e.preventDefault(); openZoom(b); }
  });

  search.addEventListener('input', debounce(function(){
    query = search.value.trim().toLowerCase();
    render();
  }, 120));
});
