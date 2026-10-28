/* bili♪ 音乐库 —— 前端（无构建，原生 JS） */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- 图标 ---------------- */
const P = {
  play: '<polygon points="6 3 20 12 6 21" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
  prev: '<polygon points="19 5 9 12 19 19" fill="currentColor" stroke="none"/><rect x="4" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
  next: '<polygon points="5 5 15 12 5 19" fill="currentColor" stroke="none"/><rect x="17.5" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  repeat1: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><path d="M12 11v5"/><path d="M11 11h1"/>',
  vol: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  queue: '<path d="M3 6h13M3 12h13M3 18h9"/><path d="m17 12 6 4-6 4z" fill="currentColor" stroke="none"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5 5 5-5"/><path d="M12 14V2"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  grip: '<circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.6l2.6-2.6a5 5 0 0 0-7-7L11.5 5.6"/><path d="M14 11a5 5 0 0 0-7.5-.6L3.9 13a5 5 0 0 0 7 7l1.5-1.5"/>',
};
function icon(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
}

/* ---------------- 小工具 ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (sec) => {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};
const fsize = (b) => {
  if (!b) return '0 MB';
  const mb = b / 1048576;
  return mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB';
};

let toastTimer = null;
function toast(msg, bad = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast' + (bad ? ' bad' : '')), 2600);
}

async function api(path, body, method) {
  const opt = { method: method || (body ? 'POST' : 'GET'), headers: {} };
  if (body) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const r = await fetch(path, opt);
  let j = null;
  try { j = await r.json(); } catch { /* 空响应 */ }
  if (!r.ok) throw new Error((j && j.detail) || `HTTP ${r.status}`);
  return j;
}

/* ---------------- 状态 ---------------- */
const LS = 'bili-music-v1';
const saved = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } })();

const state = {
  lib: null,
  byId: new Map(),
  fav: new Set(),
  view: 'library',
  pid: null,
  collectionId: null,
  colById: new Map(),
  filter: '',
  queue: Array.isArray(saved.queue) ? saved.queue : [],
  qi: Number.isFinite(saved.qi) ? saved.qi : 0,
  currentId: saved.currentId || null,
  shuffle: !!saved.shuffle,
  repeat: saved.repeat || 'off',
  volume: Number.isFinite(saved.volume) ? saved.volume : 0.9,
  positions: (saved.positions && typeof saved.positions === 'object') ? saved.positions : {},
  dragging: false,
};
function save() {
  // 每首歌听到哪儿了，只留最近 400 条，别把 localStorage 塞爆
  const keys = Object.keys(state.positions);
  if (keys.length > 400) {
    keys.slice(0, keys.length - 400).forEach((k) => delete state.positions[k]);
  }
  localStorage.setItem(LS, JSON.stringify({
    queue: state.queue, qi: state.qi, currentId: state.currentId,
    shuffle: state.shuffle, repeat: state.repeat, volume: state.volume,
    positions: state.positions,
  }));
}

const audio = $('#audio');

/* ---------------- 启动 ---------------- */
function boot() {
  $$('[data-ico]').forEach((el) => { el.outerHTML = icon(el.dataset.ico); });

  $('#nav').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    state.view = b.dataset.view;
    state.pid = null;
    render();
  });

  $('#search').addEventListener('input', (e) => {
    state.filter = e.target.value.trim().toLowerCase();
    renderMain();
  });

  bindAddbar();
  bindTheme();
  $('#newPlaylist').addEventListener('click', () => newPlaylistModal());

  $('#playlistNav').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-pid]');
    if (!li) return;
    state.view = 'playlist';
    state.pid = Number(li.dataset.pid);
    render();
  });

  $('#view').addEventListener('click', onViewClick);
  $('#view').addEventListener('pointerdown', onDragStart);
  $('#drawer').addEventListener('click', onQueueClick);

  // 播放器
  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnPrev').addEventListener('click', () => step(-1, false));
  $('#btnNext').addEventListener('click', () => step(1, false));
  $('#btnShuffle').addEventListener('click', () => { state.shuffle = !state.shuffle; save(); paintControls(); });
  $('#btnRepeat').addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    save(); paintControls();
  });
  $('#btnQueue').addEventListener('click', () => $('#drawer').classList.toggle('open'));
  $('#drawerClose').addEventListener('click', () => $('#drawer').classList.remove('open'));
  $('#npFav').addEventListener('click', () => state.currentId && toggleFav(state.currentId));

  $('#seek').addEventListener('input', (e) => {
    if (audio.duration) audio.currentTime = (e.target.value / 1000) * audio.duration;
  });
  $('#vol').addEventListener('input', (e) => {
    state.volume = e.target.value / 100;
    audio.volume = state.volume;
    paintControls(); save();
  });
  $('#tCur').addEventListener('click', () => {
    if (!audio.src) return;
    audio.currentTime = 0;
    if (state.currentId) { state.positions[state.currentId] = 0; save(); }
    paintProgress();
  });
  $('#btnMute').addEventListener('click', () => {
    audio.muted = !audio.muted;
    paintControls();
  });

  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('durationchange', paintProgress);
  audio.addEventListener('play', () => { paintControls(); markPlaying(); });
  audio.addEventListener('pause', () => { paintControls(); rememberPosition(true); });
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', () => {
    if (!state.currentId) return;
    const t = state.byId.get(state.currentId);
    toast('播放出错' + (t ? `：${t.title}` : ''), true);
  });

  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowRight' && e.shiftKey) { audio.currentTime += 10; }
    else if (e.key === 'ArrowLeft' && e.shiftKey) { audio.currentTime -= 10; }
    else if (e.key === 'n') step(1, false);
    else if (e.key === 'p') step(-1, false);
  });

  $('#modalWrap').addEventListener('click', (e) => {
    if (e.target.id === 'modalWrap') closeModal();
  });

  audio.volume = state.volume;
  refresh().then(() => {
    if (state.currentId && state.byId.has(state.currentId)) {
      if (!state.queue.length) { state.queue = [state.currentId]; state.qi = 0; save(); }
      restoreCurrent();
    } else {
      state.currentId = null;
      paintControls();
    }
  });

  window.addEventListener('beforeunload', () => rememberPosition(true));

  setInterval(async () => {
    const busy = state.lib && state.lib.tracks.some((t) => t.status === 'queued' || t.status === 'downloading');
    if (busy) {
      try { await refresh(true); } catch { /* 忽略 */ }
    }
  }, 1600);
}

/* ---------------- 数据刷新 ---------------- */
async function refresh(silent = false) {
  const scroll = $('#view').scrollTop;
  const prevIds = state.lib ? state.lib.tracks.map((t) => t.id).join() : '';
  const lib = await api('/api/library');
  state.lib = lib;
  state.byId = new Map(lib.tracks.map((t) => [t.id, t]));
  state.fav = new Set(lib.favorites);
  state.colById = new Map((lib.collections || []).map((c) => [c.id, c]));
  if (state.view === 'playlist' && !lib.playlists.some((p) => p.id === state.pid)) state.view = 'library';
  if (state.dragging) return;          // 拖动过程中重建 DOM 会把手里的行弄丢

  // 轮询刷新时，如果曲目集合没变（只是缓存进度在动），就只改徽章，
  // 否则 150 首的列表每 1.6 秒重建一次，会明显卡
  const listView = ['library', 'favorites', 'playlist'].includes(state.view);
  const sameIds = prevIds === lib.tracks.map((t) => t.id).join();
  if (silent && sameIds && listView) {
    patchBadges();
    renderSide();
    renderQueue();
    return;
  }
  render(silent ? scroll : null);
}

function patchBadges() {
  for (const t of state.lib.tracks) {
    const el = document.querySelector(`.tr[data-id="${CSS.escape(t.id)}"] .tr-badge`);
    if (!el) continue;
    const html = statusBadge(t);
    if (el.innerHTML !== html) el.innerHTML = html;
  }
}

function render(keepScroll) {
  $('#addbar').classList.toggle('hide', !['library', 'singles', 'collections'].includes(state.view));
  renderSide();
  renderMain();
  paintControls();
  renderQueue();
  if (keepScroll != null) $('#view').scrollTop = keepScroll;
}

/* ---------------- 侧栏 ---------------- */
function renderSide() {
  $$('#nav button').forEach((b) => {
    b.classList.toggle('on', b.dataset.view === state.view);
  });
  const lib = state.lib;
  if (!lib) return;
  $('#playlistNav').innerHTML = lib.playlists.map((p) => `
    <li data-pid="${p.id}" class="${state.view === 'playlist' && state.pid === p.id ? 'on' : ''}">
      <span class="n">${esc(p.name)}</span><span class="c">${p.count}</span>
    </li>`).join('');
  $('#sideStats').innerHTML = `
    ${lib.stats.count} 首 · ${(lib.collections || []).length} 个音乐库<br>
    已缓存 ${lib.stats.cached} 首 ·
    ${fsize(lib.stats.size)}${lib.stats.downloading ? ` · 队列 ${lib.stats.downloading}` : ''}`;
}

/* ---------------- 主视图 ---------------- */
function renderMain() {
  const v = $('#view');
  if (!state.lib) { v.innerHTML = `<div class="empty">正在读取音乐库…</div>`; return; }
  const map = {
    library: viewLibrary,
    singles: viewSingles,
    collections: viewCollections,
    collection: viewCollection,
    favorites: viewFavorites,
    cache: viewCache,
    settings: viewSettings,
    playlist: viewPlaylist,
  };
  v.innerHTML = (map[state.view] || viewLibrary)();
}

function filtered(list) {
  if (!state.filter) return list;
  const f = state.filter;
  return list.filter((t) => `${t.title} ${t.uploader || ''}`.toLowerCase().includes(f));
}

function statusBadge(t) {
  if (t.status === 'ready') return `<span class="badge ready">${icon('check')}本地</span>`;
  if (t.status === 'downloading') return `<span class="badge downloading">缓存 ${Math.round(t.progress || 0)}%</span>`;
  if (t.status === 'queued') return `<span class="badge queued">排队中</span>`;
  if (t.status === 'error') return `<span class="badge error" title="${esc(t.err || '')}">失败</span>`;
  return `<span class="badge none">未缓存</span>`;
}

function trackRow(t, i, opts = {}) {
  const cur = t.id === state.currentId;
  const col = t.collection_id ? state.colById.get(t.collection_id) : null;
  const sub = [t.uploader || '未知 UP', (col && !opts.hideCollection) ? col.title : '']
    .filter(Boolean).join(' · ');
  return `<div class="tr ${cur ? 'playing' : ''}" data-id="${esc(t.id)}">
    <div class="tr-idx">
      <span class="num">${i + 1}</span>
      ${opts.inPlaylist && opts.draggable
        ? `<span class="tr-handle" title="拖动排序" data-drag="${esc(t.id)}">${icon('grip')}</span>`
        : `<span class="playico">${icon('play')}</span>`}
    </div>
    <div class="tr-main" data-act="play">
      <div class="tr-cover">${t.cover ? `<img src="/api/cover/${encodeURIComponent(t.id)}" loading="lazy" alt="">` : icon('music')}</div>
      <div class="tr-txt">
        <div class="tr-title" title="${esc(t.title)}">${esc(t.title)}</div>
        <div class="tr-artist" title="${esc(sub)}">${esc(sub)}</div>
      </div>
    </div>
    <div class="tr-badge">${statusBadge(t)}</div>
    <div class="tr-dur">${fmt(t.duration)}</div>
    <div class="tr-acts">
      <button class="icon-btn ${state.fav.has(t.id) ? 'faved' : ''}" data-act="fav" title="收藏">${icon('heart')}</button>
      <button class="icon-btn" data-act="addpl" title="加入歌单">${icon('plus')}</button>
      <button class="icon-btn" data-act="cache" title="${t.status === 'ready' ? '已在本地' : '缓存到本地'}">${icon('down')}</button>
      ${opts.inPlaylist ? `<button class="icon-btn" data-act="unpl" title="从歌单移除">${icon('minus')}</button>` : ''}
      <button class="icon-btn" data-act="del" title="从库里删除">${icon('trash')}</button>
    </div>
  </div>`;
}

function trackList(list, opts = {}) {
  if (!list.length) {
    return `<div class="empty"><div class="big">♪</div><b>${opts.emptyTitle || '这里还空着'}</b>
      <div class="hint">${opts.emptyHint || '点右上角「添加链接」，把 B 站视频的链接粘进来。'}</div></div>`;
  }
  return `<div class="list">
    <div class="thead"><span></span><span>单曲</span><span class="h-badge">状态</span>
      <span class="h-dur">时长</span><span class="h-acts"></span></div>
    ${list.map((t, i) => trackRow(t, i, opts)).join('')}
  </div>`;
}

function recentCards() {
  const ids = (state.lib.recent || []).filter((id) => state.byId.has(id)).slice(0, 12);
  if (!ids.length) return '';
  return `<div class="sect-title"><span>最近播放</span><div class="line"></div></div>
    <div class="cardrow">${ids.map((id) => {
      const t = state.byId.get(id);
      return `<div class="card" data-id="${esc(t.id)}">
        <div class="cv">${t.cover ? `<img src="/api/cover/${encodeURIComponent(t.id)}" loading="lazy" alt="">` : icon('music')}
          <span class="go">${icon('play')}</span></div>
        <div class="t">${esc(t.title)}</div><div class="s">${esc(t.uploader || '')}</div>
      </div>`;
    }).join('')}</div>`;
}

function viewLibrary() {
  const all = state.lib.tracks;
  const list = filtered(all);
  const s = state.lib.stats;
  return `<div class="view-h">
      <h1>全部</h1>
      <div class="sub">${all.length} 首 · 本地 ${s.cached} 首 · ${fsize(s.size)}</div>
      <div class="grow"></div>
      <button class="ghost" data-act="cacheall">${icon('down')}缓存未缓存的</button>
      <button class="ghost" data-act="playall" data-ids="all">${icon('play')}播放全部</button>
    </div>
    ${state.filter ? '' : recentCards()}
    ${all.length ? '' : ''}
    ${trackList(list, { emptyTitle: state.filter ? '没找到' : '音乐库是空的' })}`;
}

function viewSingles() {
  const singles = state.lib.tracks.filter((t) => !t.collection_id);
  const list = filtered(singles);
  return `<div class="view-h">
      <h1>单曲</h1>
      <div class="sub">${singles.length} 首不属于任何音乐库</div><div class="grow"></div>
      ${list.length ? `<button class="ghost" data-act="playall" data-ids="singles">${icon('play')}播放全部</button>` : ''}
    </div>
    ${trackList(list, {
      emptyTitle: state.filter ? '没找到' : '还没有单曲',
      emptyHint: '单 P 视频加进来就是单曲；多 P 的会归到一个音乐库。',
    })}`;
}

function viewCollections() {
  const cols = (state.lib.collections || []).filter((c) => {
    if (!state.filter) return true;
    return `${c.title} ${c.uploader || ''}`.toLowerCase().includes(state.filter);
  });
  if (!cols.length) {
    return `<div class="view-h"><h1>音乐库</h1>
        <div class="sub">多 P 视频会自动归到这里</div></div>
      <div class="empty"><div class="big">♪</div>
        <b>${state.filter ? '没找到' : '还没有音乐库'}</b>
        <div class="hint">粘一个多 P 的合集链接，整条链接下的所有曲目会自动归成同一个音乐库。</div>
      </div>`;
  }
  return `<div class="view-h">
      <h1>音乐库</h1>
      <div class="sub">${cols.length} 个合集 · ${cols.reduce((a, c) => a + c.count, 0)} 首</div>
    </div>
    <div class="grid">
      ${cols.map((c) => `<div class="gcard" data-cid="${esc(c.id)}">
        <div class="cv">
          ${c.cover ? `<img src="/api/cover/${encodeURIComponent(c.id)}" loading="lazy" alt="">` : icon('folder')}
          <span class="go">${icon('play')}</span>
        </div>
        <div class="t">${esc(c.title)}</div>
        <div class="s">${esc(c.uploader || '')} · ${c.count} 首 · ${fmt(c.duration)}</div>
      </div>`).join('')}
    </div>`;
}

function viewCollection() {
  const c = state.colById.get(state.collectionId);
  if (!c) return `<div class="empty">这个音乐库不在了</div>`;
  const ids = state.lib.tracks
    .filter((t) => t.collection_id === c.id)
    .sort((a, b) => (a.page || 0) - (b.page || 0));
  const list = filtered(ids);
  return `<div class="coll-head">
      <div class="coll-cover">
        ${c.cover ? `<img src="/api/cover/${encodeURIComponent(c.id)}" alt="">` : icon('folder')}
      </div>
      <div class="coll-info">
        <div class="crumb">音乐库</div>
        <h1>${esc(c.title)}</h1>
        <div class="sub">${esc(c.uploader || '')} · ${ids.length} 首 · ${fmt(c.duration)}${c.cached ? ` · 已缓存 ${c.cached} 首` : ''}</div>
        <div class="coll-acts">
          ${ids.length ? `<button class="primary" data-act="playall" data-ids="col">${icon('play')}播放全部</button>` : ''}
          <button class="ghost" data-act="cachecol">${icon('down')}缓存整个库</button>
          <button class="ghost" data-act="delcol">${icon('trash')}删除音乐库</button>
        </div>
      </div>
    </div>
    ${trackList(list, { hideCollection: true, emptyTitle: '这个音乐库里没有曲目' })}`;
}

function viewFavorites() {
  const list = filtered(state.lib.tracks.filter((t) => state.fav.has(t.id)));
  return `<div class="view-h">
      <h1>收藏</h1><div class="sub">${list.length} 首</div><div class="grow"></div>
      ${list.length ? `<button class="ghost" data-act="playall" data-ids="fav">${icon('play')}播放全部</button>` : ''}
    </div>
    ${trackList(list, { emptyTitle: '还没有收藏', emptyHint: '在列表里点 ♡ 就收藏了。' })}`;
}

function viewCache() {
  const all = state.lib.tracks;
  const ready = all.filter((t) => t.status === 'ready');
  const pending = all.filter((t) => t.status !== 'ready');
  const s = state.lib.stats;
  const pct = all.length ? Math.round((ready.length / all.length) * 100) : 0;
  return `<div class="view-h"><h1>缓存</h1>
      <div class="sub">${ready.length} / ${all.length} 首已存到本地</div><div class="grow"></div>
      <button class="ghost" data-act="cacheall">${icon('down')}全部缓存</button>
      <button class="ghost" data-act="clearcache">${icon('trash')}清空音频文件</button>
    </div>
    <div class="stats">
      <div class="stat accent"><b>${fsize(s.size)}</b><span>本地占用</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="stat"><b>${ready.length}</b><span>首已缓存</span></div>
      <div class="stat"><b>${pending.length}</b><span>首未缓存</span></div>
      <div class="stat"><b>${s.downloading}</b><span>队列中</span></div>
    </div>
    ${trackList(pending.length ? pending : all, {
      emptyTitle: '还没有任何缓存', emptyHint: '点「全部缓存」会把整个库下到本地。',
    })}`;
}

function viewSettings() {
  const st = state.lib.settings;
  const sw = (k, on) => `<div class="switch ${on ? 'on' : ''}" data-act="toggle" data-key="${k}"></div>`;
  const ck = ['', 'chrome', 'firefox', 'edge', 'brave', 'chromium', 'opera'];
  return `<div class="view-h"><h1>设置</h1><div class="sub">改完立即生效</div></div>
    <div class="settings">
      <div class="set-row">
        <div class="lbl"><b>缓存音质</b><span>m4a 是原样保存（推荐）；mp3 兼容老播放器；flac 只在有 Hi-Res 源时有意义</span></div>
        <select data-set="quality">
          <option value="m4a" ${st.quality === 'm4a' ? 'selected' : ''}>m4a 原始</option>
          <option value="mp3" ${st.quality === 'mp3' ? 'selected' : ''}>mp3</option>
          <option value="flac" ${st.quality === 'flac' ? 'selected' : ''}>flac</option>
        </select>
      </div>
      <div class="set-row">
        <div class="lbl"><b>登录状态</b><span>读浏览器里的 B 站 Cookie，大会员 / Hi-Res 才需要</span></div>
        <select data-set="cookies">
          ${ck.map((c) => `<option value="${c}" ${st.cookies === c ? 'selected' : ''}>${c || '不使用'}</option>`).join('')}
        </select>
      </div>
      <div class="set-row">
        <div class="lbl"><b>点开就自动缓存</b><span>没缓存过的歌，点播放时先下到本地再播</span></div>
        ${sw('autocache', st.autocache === '1')}
      </div>
      <div class="set-row">
        <div class="lbl"><b>预缓存下一首</b><span>当前这首开始播时，顺手把队列里下一首也下好</span></div>
        ${sw('prefetch', st.prefetch === '1')}
      </div>
      <div class="set-row">
        <div class="lbl"><b>数据目录</b><span>${esc(state.lib.home)}</span></div>
        <button class="ghost" data-act="copyhome">${icon('folder')}复制路径</button>
      </div>
      <div class="set-row">
        <div class="lbl"><b>快捷键</b><span>空格 播放/暂停 · N 下一首 · P 上一首 · Shift+←/→ 快退快进</span></div>
        <button class="ghost" data-act="reload">${icon('reset')}刷新页面</button>
      </div>
    </div>`;
}

function viewPlaylist() {
  const p = state.lib.playlists.find((x) => x.id === state.pid);
  if (!p) return `<div class="empty">这个歌单不在了</div>`;
  const ids = state.lib.items.filter((i) => i.playlist_id === p.id).map((i) => i.track_id);
  const list = filtered(ids.map((id) => state.byId.get(id)).filter(Boolean));
  const first = state.byId.get(ids[0]);
  return `<div class="view-h">
      <h1>${esc(p.name)}</h1><div class="sub">${list.length} 首</div><div class="grow"></div>
      ${list.length ? `<button class="ghost" data-act="playall" data-ids="pl">${icon('play')}播放全部</button>` : ''}
      <button class="ghost" data-act="renamepl" data-pid="${p.id}">${icon('plus')}重命名</button>
      <button class="ghost" data-act="delpl" data-pid="${p.id}">${icon('trash')}删除歌单</button>
    </div>
    ${first && first.cover ? '' : ''}
    ${trackList(list, {
      inPlaylist: true,
      draggable: !state.filter,
      emptyTitle: '歌单还是空的',
      emptyHint: '在任意曲目上点「＋」就能加进来。',
    })}`;
}

/* ---------------- 视图交互 ---------------- */
async function onViewClick(e) {
  if (e.target.closest('.tr-handle, .handle')) return;
  const actEl = e.target.closest('[data-act]');
  const row = e.target.closest('.tr');
  const card = e.target.closest('.card[data-id]');
  const gcard = e.target.closest('.gcard[data-cid]');
  const act = actEl ? actEl.dataset.act : null;

  // 卡片 → 播放
  if (card && !act) { playList([...state.lib.recent], card.dataset.id); return; }

  // 音乐库卡片 → 进合集
  if (gcard && !act) {
    state.view = 'collection';
    state.collectionId = gcard.dataset.cid;
    state.filter = '';
    $('#search').value = '';
    render();
    return;
  }

  if (act === 'playall') {
    const scope = actEl.dataset.ids;
    let ids = [];
    if (scope === 'fav') ids = state.lib.tracks.filter((t) => state.fav.has(t.id)).map((t) => t.id);
    else if (scope === 'pl') ids = state.lib.items.filter((i) => i.playlist_id === state.pid).map((i) => i.track_id);
    else if (scope === 'singles') ids = state.lib.tracks.filter((t) => !t.collection_id).map((t) => t.id);
    else if (scope === 'col') ids = collectionTracks();
    else ids = state.lib.tracks.map((t) => t.id);
    if (!ids.length) return toast('没有可播的曲子');
    playList(ids, ids[0]);
    return;
  }
  if (act === 'cachecol') {
    const ids = collectionTracks().filter((id) => state.byId.get(id)?.status !== 'ready');
    if (!ids.length) return toast('这个库已经都在本地了');
    try {
      const r = await api('/api/cache', { ids });
      toast(`已排入 ${r.queued.length} 首`);
      refresh();
    } catch (err) { toast(err.message, true); }
    return;
  }
  if (act === 'delcol') {
    const c = state.colById.get(state.collectionId);
    confirmModal('删除音乐库', `「${c ? c.title : ''}」和其中所有曲目、本地文件都会被删掉。`, async () => {
      await api(`/api/collections/${encodeURIComponent(state.collectionId)}`, null, 'DELETE');
      state.view = 'collections';
      state.collectionId = null;
      await refresh();
      toast('已删除');
    });
    return;
  }
  if (act === 'cacheall') {
    try {
      const r = await api('/api/cache', { all: true });
      toast(r.queued.length ? `已排入 ${r.queued.length} 首` : '都已经在本地了');
      refresh();
    } catch (err) { toast(err.message, true); }
    return;
  }
  if (act === 'clearcache') {
    confirmModal('清空音频文件', '元数据、收藏、歌单都保留，下次播放会重新缓存。确定吗？', async () => {
      try {
        await api('/api/cache/clear', {});
        toast('已清空本地音频');
        refresh();
      } catch (err) { toast(err.message, true); }
    });
    return;
  }
  if (act === 'copyhome') {
    navigator.clipboard?.writeText(state.lib.home).then(() => toast('路径已复制'), () => toast('复制失败', true));
    return;
  }
  if (act === 'reload') { location.reload(); return; }
  if (act === 'renamepl') { renamePlaylistModal(Number(actEl.dataset.pid)); return; }
  if (act === 'delpl') {
    const pid = Number(actEl.dataset.pid);
    confirmModal('删除歌单', '只删歌单本身，歌还在库里。', async () => {
      await api(`/api/playlists/${pid}`, null, 'DELETE');
      state.view = 'library'; state.pid = null;
      await refresh();
      toast('歌单已删除');
    });
    return;
  }
  if (act === 'toggle') {
    const key = actEl.dataset.key;
    const now = actEl.classList.contains('on');
    actEl.classList.toggle('on');
    await api('/api/settings', { key, value: now ? '0' : '1' });
    state.lib.settings[key] = now ? '0' : '1';
    return;
  }

  if (!row) return;
  const id = row.dataset.id;
  const t = state.byId.get(id);
  if (!t) return;

  if (!act || act === 'play') {
    const visible = $$('.tr', $('#view')).map((r) => r.dataset.id);
    playList(visible, id);
    return;
  }
  if (act === 'fav') { await toggleFav(id); return; }
  if (act === 'cache') {
    if (t.status === 'ready') return toast('已经在本地了');
    try { await api('/api/cache', { ids: [id] }); toast('开始缓存'); refresh(); }
    catch (err) { toast(err.message, true); }
    return;
  }
  if (act === 'addpl') { addToPlaylistModal(id); return; }
  if (act === 'unpl') {
    await api(`/api/playlists/${state.pid}/items/${encodeURIComponent(id)}`, null, 'DELETE');
    await refresh();
    return;
  }
  if (act === 'del') {
    confirmModal('从库里删除', `「${t.title}」和它的本地文件都会删掉。`, async () => {
      await api(`/api/tracks/${encodeURIComponent(id)}`, null, 'DELETE');
      if (state.currentId === id) { audio.pause(); audio.removeAttribute('src'); state.currentId = null; }
      state.queue = state.queue.filter((q) => q !== id);
      save();
      await refresh();
      toast('已删除');
    });
  }
}

$('#view') && document.addEventListener('change', async (e) => {
  const sel = e.target.closest('[data-set]');
  if (!sel) return;
  try {
    const s = await api('/api/settings', { key: sel.dataset.set, value: sel.value });
    state.lib.settings = s;
    toast('已保存');
  } catch (err) { toast(err.message, true); }
});

function collectionTracks() {
  if (!state.collectionId) return [];
  return state.lib.tracks
    .filter((t) => t.collection_id === state.collectionId)
    .sort((a, b) => (a.page || 0) - (b.page || 0))
    .map((t) => t.id);
}

async function toggleFav(id) {
  try {
    const r = await api(`/api/favorite/${encodeURIComponent(id)}`, {});
    if (r.fav) state.fav.add(id); else state.fav.delete(id);
    state.byId.get(id) && (state.byId.get(id).fav = r.fav);
    renderMain(); paintControls();
    toast(r.fav ? '已收藏' : '已取消收藏');
  } catch (err) { toast(err.message, true); }
}

/* ---------------- 歌单拖拽排序 ----------------
 * 拖动时把整行“提”成一个浮动影子跟着指针走，
 * 其余用 FLIP 平滑让位，落点用一个虚线槽位表示。
 */
let drag = null;

function onDragStart(e) {
  const handle = e.target.closest('.tr-handle');
  if (!handle) return;
  const row = handle.closest('.tr');
  const list = row && row.parentElement;
  if (!row || !list || state.view !== 'playlist') return;

  e.preventDefault();
  const rect = row.getBoundingClientRect();

  // 影子：原行的一份克隆，脱离文档流跟着指针
  const ghost = row.cloneNode(true);
  ghost.classList.remove('drag-placeholder');
  ghost.classList.add('drag-ghost');
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.015)`;
  document.body.appendChild(ghost);

  drag = {
    row, list, pid: state.pid, ghost,
    grabY: e.clientY - rect.top,      // 指针在行内的相对位置
    left: rect.left,
    y: e.clientY,
    moved: false,
  };

  state.dragging = true;
  row.classList.add('drag-placeholder');   // 原位留一个槽
  document.body.classList.add('dragging');
  try { handle.setPointerCapture(e.pointerId); } catch { /* 合成事件没有真实 pointerId */ }

  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd, { once: true });
  document.addEventListener('pointercancel', onDragEnd, { once: true });
}

function onDragMove(e) {
  if (!drag) return;
  drag.moved = true;
  drag.y = e.clientY;
  drag.ghost.style.transform =
    `translate3d(${drag.left}px, ${e.clientY - drag.grabY}px, 0) scale(1.015)`;
  moveSlot(e.clientY);
  autoScroll(e.clientY);
}

/* FLIP：先量旧位置，改 DOM，再用反向位移 + 过渡滑到新位置 */
function flip(mutate) {
  const { list, row } = drag;
  const rows = Array.from(list.querySelectorAll('.tr'));
  const before = new Map(rows.map((r) => [r, r.getBoundingClientRect().top]));

  mutate();

  for (const r of rows) {
    if (r === row) continue;                  // 槽位本身不参与动画
    const dy = before.get(r) - r.getBoundingClientRect().top;
    if (!dy) continue;
    r.style.transition = 'none';
    r.style.transform = `translateY(${dy}px)`;
    void r.offsetHeight;                      // 强制回流，让起点生效
    r.style.transition = 'transform .22s cubic-bezier(.22,.85,.3,1)';
    r.style.transform = '';
  }
}

function moveSlot(y) {
  const { row, list } = drag;
  const others = Array.from(list.querySelectorAll('.tr:not(.drag-placeholder)'));
  if (!others.length) return;

  let target = null;
  let before = false;
  for (const r of others) {
    const b = r.getBoundingClientRect();
    if (y >= b.top && y <= b.bottom) { target = r; before = y < b.top + b.height / 2; break; }
  }
  if (!target) {
    const first = others[0].getBoundingClientRect();
    const last = others[others.length - 1].getBoundingClientRect();
    if (y < first.top) { target = others[0]; before = true; }
    else if (y > last.bottom) { target = others[others.length - 1]; before = false; }
  }
  if (!target) return;

  const next = before ? target : target.nextElementSibling;
  if (next === row) return;                   // 位置没变，别白动
  flip(() => list.insertBefore(row, next));
}

function autoScroll(y) {
  const v = $('#view');
  const b = v.getBoundingClientRect();
  if (y < b.top + 56) v.scrollTop -= 14;
  else if (y > b.bottom - 56) v.scrollTop += 14;
}

async function onDragEnd() {
  if (!drag) return;
  const { row, list, pid, ghost, moved } = drag;
  document.removeEventListener('pointermove', onDragMove);
  document.body.classList.remove('dragging');

  // 影子滑回槽位再淡出，视觉上像“放下去”
  const slot = row.getBoundingClientRect();
  ghost.style.transition = 'transform .16s ease, opacity .16s ease';
  ghost.style.transform = `translate3d(${slot.left}px, ${slot.top}px, 0) scale(1)`;
  ghost.style.opacity = '0';
  setTimeout(() => ghost.remove(), 200);

  row.classList.remove('drag-placeholder');
  drag = null;
  state.dragging = false;

  if (!moved) return;

  const ids = Array.from(list.querySelectorAll('.tr')).map((r) => r.dataset.id);
  try {
    await api(`/api/playlists/${pid}/order`, { track_ids: ids }, 'PATCH');
    applyLocalOrder(pid, ids);          // 本地已经是对的，不用再整表重绘
    renumber();                         // 但序号要跟着改
  } catch (err) {
    toast(err.message, true);
    refresh(true);
  }
}

function renumber() {
  Array.from(document.querySelectorAll('#view .tr')).forEach((r, i) => {
    const n = r.querySelector('.tr-idx .num');
    if (n) n.textContent = i + 1;
  });
}

function applyLocalOrder(pid, ids) {
  if (!state.lib) return;
  const others = state.lib.items.filter((i) => i.playlist_id !== pid);
  state.lib.items = others.concat(ids.map((track_id) => ({ playlist_id: pid, track_id })));
}

/* ---------------- 播放 ---------------- */
function playList(ids, startId) {
  ids = ids.filter((id) => state.byId.has(id));
  if (!ids.length) return;
  const i = Math.max(0, ids.indexOf(startId));
  state.queue = ids;
  state.qi = i;
  save();
  renderQueue();
  playCurrent();
}

async function playCurrent() {
  const id = state.queue[state.qi];
  if (!id) return;
  const t = state.byId.get(id);
  if (!t) return;

  rememberPosition(true);      // 先记住上一首听到哪儿
  state.currentId = id;
  save();
  paintNowPlaying();
  markPlaying();

  if (t.status !== 'ready') {
    if (state.lib.settings.autocache === '0') {
      toast('这首还没缓存，点一下缓存按钮', true);
      return;
    }
    const ok = await ensureCached(id);
    if (!ok) return;
  }

  attachSource(id);
  try {
    await audio.play();
  } catch {
    toast('浏览器拦了自动播放，再点一下播放键');
  }
  api(`/api/play/${encodeURIComponent(id)}`, {}).catch(() => {});
  setMediaSession(t);
  prefetchNext();
}

/* 把某首接进 audio，并跳回上次听到的地方 */
function attachSource(id) {
  const pos = Number(state.positions[id]) || 0;
  const dur = Number(state.byId.get(id)?.duration) || 0;
  audio.src = `/api/stream/${encodeURIComponent(id)}`;
  const seek = () => {
    if (pos > 5 && (!dur || pos < dur - 12)) audio.currentTime = pos;
    paintProgress();
  };
  if (audio.readyState >= 1) seek();
  else audio.addEventListener('loadedmetadata', seek, { once: true });
}

let lastSaved = 0;
function onTimeUpdate() {
  paintProgress();
  const now = Date.now();
  if (now - lastSaved > 2000) { lastSaved = now; rememberPosition(); }
}

function rememberPosition(force = false) {
  const id = state.currentId;
  if (!id || !audio.src || !audio.duration) return;
  // 播完 / 快结束时不记，免得下次一点开就跳到结尾
  if (audio.currentTime > audio.duration - 12) return;
  if (audio.currentTime < 2 && !force) return;
  state.positions[id] = Math.round(audio.currentTime);
  save();
}

async function ensureCached(id) {
  const hint = $('#bufferHint');
  const t = state.byId.get(id);
  if (t && t.status === 'ready') return true;
  try { await api('/api/cache', { ids: [id] }); } catch (e) { toast(e.message, true); return false; }
  for (let n = 0; n < 900; n++) {
    await sleep(600);
    let r;
    try { r = await api(`/api/track/${encodeURIComponent(id)}`); } catch { break; }
    if (r.status === 'ready') {
      hint.textContent = '';
      Object.assign(state.byId.get(id) || {}, r);
      if (state.byId.get(id)) state.byId.get(id).status = 'ready';
      refresh(true).catch(() => {});
      return true;
    }
    if (r.status === 'error') {
      hint.textContent = '';
      toast('缓存失败：' + (r.err || '未知原因'), true);
      refresh(true).catch(() => {});
      return false;
    }
    hint.textContent = `缓存中 ${Math.round(r.progress || 0)}%`;
    const badge = $(`.tr[data-id="${CSS.escape(id)}"] .tr-badge`);
    if (badge) badge.innerHTML = statusBadge({ ...r, progress: r.progress });
  }
  hint.textContent = '';
  toast('缓存超时了', true);
  return false;
}

function prefetchNext() {
  if (state.lib.settings.prefetch === '0') return;
  let n = state.qi + 1;
  if (n >= state.queue.length) {
    if (state.repeat !== 'all') return;
    n = 0;
  }
  const id = state.queue[n];
  const t = id && state.byId.get(id);
  if (t && t.status === 'none') api('/api/cache', { ids: [id] }).catch(() => {});
}

function step(dir, auto) {
  if (!state.queue.length) return;
  if (auto && state.repeat === 'one') {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }
  let i;
  if (state.shuffle && dir > 0 && state.queue.length > 1) {
    do { i = Math.floor(Math.random() * state.queue.length); } while (i === state.qi);
  } else {
    i = state.qi + dir;
    if (i >= state.queue.length) {
      if (state.repeat === 'all' || !auto) i = 0; else { stopAtEnd(); return; }
    }
    if (i < 0) i = state.repeat === 'all' ? state.queue.length - 1 : 0;
  }
  state.qi = i;
  save();
  renderQueue();
  playCurrent();
}

function onEnded() {
  if (state.currentId) { delete state.positions[state.currentId]; save(); }
  if (state.repeat === 'one') { audio.currentTime = 0; audio.play().catch(() => {}); return; }
  if (state.qi + 1 >= state.queue.length && state.repeat === 'off') { stopAtEnd(); return; }
  step(1, true);
}

function stopAtEnd() {
  audio.pause();
  audio.currentTime = 0;
  paintControls();
}

function togglePlay() {
  if (!state.currentId) {
    if (state.queue.length) return playCurrent();
    const first = state.lib && state.lib.tracks[0];
    if (first) return playList(state.lib.tracks.map((t) => t.id), first.id);
    return toast('先加一首歌');
  }
  if (audio.paused) {
    if (!audio.src) playCurrent();
    else audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function restoreCurrent() {
  if (!state.currentId || !state.byId.has(state.currentId)) return;
  const t = state.byId.get(state.currentId);
  paintNowPlaying();
  setMediaSession(t);
  // 接上音源但不播：进度条停在「上次听到」的位置，点一下就接着听
  const tt = state.byId.get(state.currentId);
  if (tt && tt.status === 'ready') attachSource(state.currentId);
  else paintSavedProgress();
}

function paintSavedProgress() { paintProgress(); }

/* ---------------- 播放器绘制 ---------------- */
function paintNowPlaying() {
  const t = state.byId.get(state.currentId);
  if (!t) return;
  $('#npTitle').textContent = t.title;
  $('#npArtist').textContent = t.uploader || '未知 UP';
  $('#npCover').innerHTML = t.cover
    ? `<img src="/api/cover/${encodeURIComponent(t.id)}" alt="">`
    : icon('music');
  paintControls();
  markPlaying();
}

function paintControls() {
  const playing = !audio.paused && !!audio.src;
  $('#btnPlay').innerHTML = icon(playing ? 'pause' : 'play');
  $('#btnShuffle').classList.toggle('on', state.shuffle);
  const rb = $('#btnRepeat');
  rb.innerHTML = icon(state.repeat === 'one' ? 'repeat1' : 'repeat');
  rb.classList.toggle('on', state.repeat !== 'off');
  $('#btnMute').innerHTML = icon(audio.muted || state.volume === 0 ? 'mute' : 'vol');
  $('#vol').value = Math.round((audio.muted ? 0 : state.volume) * 100);
  $('#npFav').classList.toggle('faved', state.fav.has(state.currentId));
  paintProgress();
}

function paintProgress() {
  const hasSrc = !!audio.getAttribute('src');
  const t = state.byId.get(state.currentId);
  const d = audio.duration || Number(t && t.duration) || 0;
  const c = hasSrc ? (audio.currentTime || 0) : (Number(state.positions[state.currentId]) || 0);
  $('#tCur').textContent = fmt(c);
  $('#tDur').textContent = d ? fmt(d) : '0:00';
  const p = d ? (c / d) * 1000 : 0;
  $('#seek').value = p;
  $('#seekFill').style.width = `${(p / 10).toFixed(2)}%`;
}

function markPlaying() {
  $$('.tr').forEach((r) => r.classList.toggle('playing', r.dataset.id === state.currentId));
}

function renderQueue() {
  const box = $('#queueList');
  if (!state.queue.length) {
    box.innerHTML = `<div class="empty" style="padding:40px 10px"><b>队列是空的</b></div>`;
    return;
  }
  box.innerHTML = state.queue.map((id, i) => {
    const t = state.byId.get(id);
    if (!t) return '';
    return `<div class="qi ${i === state.qi ? 'on' : ''}" data-i="${i}">
      <span>${i === state.qi ? icon('play') : i + 1}</span>
      <span class="qi-t">${esc(t.title)}</span>
      <button class="icon-btn qi-x" data-x="${i}" title="移出队列">${icon('close')}</button>
    </div>`;
  }).join('');
}

function onQueueClick(e) {
  const x = e.target.closest('[data-x]');
  if (x) {
    e.stopPropagation();
    const i = Number(x.dataset.x);
    state.queue.splice(i, 1);
    if (i < state.qi) state.qi--;
    else if (i === state.qi && i < state.queue.length) { save(); renderQueue(); playCurrent(); return; }
    if (state.qi >= state.queue.length) state.qi = Math.max(0, state.queue.length - 1);
    save(); renderQueue();
    return;
  }
  const it = e.target.closest('.qi[data-i]');
  if (!it) return;
  state.qi = Number(it.dataset.i);
  save();
  renderQueue();
  playCurrent();
}

function setMediaSession(t) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: t.title,
    artist: t.uploader || 'Bilibili',
    album: 'B站音乐库',
    artwork: t.cover ? [{ src: `/api/cover/${encodeURIComponent(t.id)}`, sizes: '480x480', type: 'image/jpeg' }] : [],
  });
  const set = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch { /* 忽略 */ } };
  set('play', () => audio.play());
  set('pause', () => audio.pause());
  set('previoustrack', () => step(-1, false));
  set('nexttrack', () => step(1, false));
}

/* ---------------- 主题 ---------------- */
function bindTheme() {
  paintThemeIcon();
  $('#themeBtn').onclick = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('bili-theme', next); } catch { /* 隐私模式 */ }
    paintThemeIcon();
  };
}
function paintThemeIcon() {
  const light = document.documentElement.dataset.theme === 'light';
  $('#themeBtn').innerHTML = icon(light ? 'sun' : 'moon');
  $('#themeBtn').title = light ? '切换到深色' : '切换到浅色';
}

/* ---------------- 内联添加栏 ---------------- */
const add = { text: '', preview: null, pages: 'one', busy: false, msg: '', kind: '' };

function bindAddbar() {
  const input = $('#addInput');
  input.addEventListener('input', () => { add.text = input.value; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); resolveAdd(); }
    if (e.key === 'Escape') { clearAddPreview(); }
  });
  $('#addGo').addEventListener('click', resolveAdd);
  $('#addPreview').addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-pages]');
    if (chip) { add.pages = chip.dataset.pages; paintAddbar(); return; }
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    if (btn.dataset.add === 'cancel') return clearAddPreview();
    if (btn.dataset.add === 'ok' && !add.busy) doImport();
  });
  paintAddbar();
}

function addMsg(text, kind = '') {
  add.msg = text;
  add.kind = kind;
  const el = $('#addMsg');
  el.textContent = text || '支持完整链接、b23.tv 短链，或者只写 BV 号';
  el.className = 'addbar-msg' + (kind ? ' ' + kind : '');
}

function clearAddPreview() {
  add.preview = null;
  add.busy = false;
  $('#addPreview').innerHTML = '';
  addMsg('');
}

function paintAddbar() {
  const v = add.preview;
  const box = $('#addPreview');
  if (!v) { box.innerHTML = ''; return; }
  const total = v.duration || v.parts.reduce((a, p) => a + (p.duration || 0), 0);
  const cv = v.cover ? `/api/preview-cover?url=${encodeURIComponent(v.cover)}` : '';
  box.innerHTML = `<div class="addprev">
    ${cv ? `<img src="${cv}" alt="封面" onerror="this.style.display='none'">` : `<div class="noimg">${icon('music')}</div>`}
    <div class="ap-txt">
      <b>${esc(v.title)}</b>
      <span>${esc(v.uploader || '')} · ${fmt(total)}${v.is_multi ? ` · ${v.parts.length} P` : ''}</span>
      ${v.is_multi ? `<div class="ap-opts">
        <button class="chip ${add.pages === 'one' ? 'on' : ''}" data-pages="one">只加当前这 P</button>
        <button class="chip ${add.pages === 'all' ? 'on' : ''}" data-pages="all">整个合集 ${v.parts.length} 首</button>
      </div>` : ''}
    </div>
    <div class="ap-end">
      <button class="ghost" data-add="cancel">取消</button>
      <button class="primary" data-add="ok" ${add.busy ? 'disabled' : ''}>${add.busy ? '添加中…' : '加入库'}</button>
    </div>
  </div>`;
}

async function resolveAdd() {
  const url = $('#addInput').value.trim();
  add.text = url;
  if (!url) { addMsg('先粘个链接进来', 'bad'); $('#addInput').focus(); return; }
  addMsg('解析中…');
  try {
    const v = await api('/api/resolve', { url });
    add.preview = v;
    add.pages = 'one';
    addMsg('');
    paintAddbar();
  } catch (err) {
    add.preview = null;
    $('#addPreview').innerHTML = '';
    addMsg(err.message, 'bad');
  }
}

async function doImport() {
  add.busy = true;
  paintAddbar();
  try {
    const r = await api('/api/import', { url: add.text, pages: add.pages });
    if (r.added.length > 30) {
      // 一次几百兆的合集不自动下载，让人自己决定
      toast(`已加入 ${r.added.length} 首（还没缓存，去「缓存」页批量下）`);
    } else {
      toast(`已加入 ${r.added.length} 首，开始缓存`);
      await api('/api/cache', { ids: r.added });
    }
    add.text = '';
    $('#addInput').value = '';
    clearAddPreview();
    await refresh();
    $('#addInput').focus();
  } catch (err) {
    add.busy = false;
    paintAddbar();
    addMsg(err.message, 'bad');
  }
}
/* ---------------- 弹窗 ---------------- */
function openModal(html) {
  $('#modal').innerHTML = html;
  $('#modalWrap').classList.add('open');
}
function closeModal() { $('#modalWrap').classList.remove('open'); }

function confirmModal(title, text, onOk) {
  openModal(`<h2>${esc(title)}</h2><div class="m-sub">${esc(text)}</div>
    <div class="foot">
      <button class="ghost" id="mCancel">取消</button>
      <button class="primary" id="mOk">确定</button>
    </div>`);
  $('#mCancel').onclick = closeModal;
  $('#mOk').onclick = async () => {
    closeModal();
    try { await onOk(); } catch (e) { toast(e.message, true); }
  };
}

function newPlaylistModal() {
  openModal(`<h2>新建歌单</h2><div class="m-sub">给歌单起个名字</div>
    <input class="input" id="plName" style="width:100%" placeholder="比如：写代码时听" autofocus>
    <div class="foot"><button class="ghost" id="mCancel">取消</button>
      <button class="primary" id="mOk">创建</button></div>`);
  $('#mCancel').onclick = closeModal;
  const inp = $('#plName');
  inp.focus();
  const go = async () => {
    const name = inp.value.trim();
    if (!name) return toast('名字不能空着');
    try {
      const r = await api('/api/playlists', { name });
      closeModal();
      state.view = 'playlist';
      state.pid = r.id;
      await refresh();
      toast('歌单已创建');
    } catch (e) { toast(e.message, true); }
  };
  $('#mOk').onclick = go;
  inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

function renamePlaylistModal(pid) {
  const p = state.lib.playlists.find((x) => x.id === pid);
  openModal(`<h2>重命名歌单</h2><div class="m-sub"></div>
    <input class="input" id="plName" style="width:100%" value="${esc(p ? p.name : '')}" autofocus>
    <div class="foot"><button class="ghost" id="mCancel">取消</button>
      <button class="primary" id="mOk">保存</button></div>`);
  $('#mCancel').onclick = closeModal;
  $('#mOk').onclick = async () => {
    try {
      await api(`/api/playlists/${pid}`, { name: $('#plName').value || '未命名' }, 'PATCH');
      closeModal();
      await refresh();
    } catch (e) { toast(e.message, true); }
  };
}

function addToPlaylistModal(tid) {
  const pls = state.lib.playlists;
  openModal(`<h2>加入歌单</h2><div class="m-sub">选一个歌单，或者新建</div>
    <div class="plpick">
      ${pls.length ? pls.map((p) => `<button data-pid="${p.id}">${esc(p.name)}<span style="color:#6c7288">${p.count} 首</span></button>`).join('') : `<div class="m-sub">还没有歌单</div>`}
    </div>
    <div class="row" style="margin-top:14px">
      <input class="input" id="newPl" placeholder="新歌单名字" style="flex:1">
      <button class="ghost" id="mk">新建并加入</button>
    </div>
    <div class="foot"><button class="ghost" id="mCancel">关闭</button></div>`);
  $('#mCancel').onclick = closeModal;
  $$('.plpick button', $('#modal')).forEach((b) => {
    b.onclick = async () => {
      try {
        await api(`/api/playlists/${b.dataset.pid}/items`, { track_id: tid });
        closeModal();
        await refresh();
        toast('已加入歌单');
      } catch (e) { toast(e.message, true); }
    };
  });
  $('#mk').onclick = async () => {
    const name = $('#newPl').value.trim();
    if (!name) return toast('先写个名字');
    try {
      const r = await api('/api/playlists', { name });
      await api(`/api/playlists/${r.id}/items`, { track_id: tid });
      closeModal();
      await refresh();
      toast('已新建歌单并加入');
    } catch (e) { toast(e.message, true); }
  };
}

boot();
