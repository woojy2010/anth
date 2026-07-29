'use strict';
/* ───────────────────────────────────────────────────────────────────────────
   물리는 Verlet + 거리 제약(PBD). 이 해석기는 삼각형도 사면체도 모르고 거리만
   맞춘다. 그런데도 삼각형은 접히고 사면체는 안 접힌다 — 3D 에서 그게 사실이라서.

   흐름은 채널 배열이다. 하향을 자금·운영·유통 3개로 늘릴 때 CHANNELS 에 항목만
   추가하면 된다 — 계산도 렌더도 배열을 순회할 뿐이다.

   VR: 모든 오브젝트는 world 그룹 안에 있다. 몰입 세션에서는 그룹째 축소해
   눈앞의 탁상 모형으로 만들고, 양손 그립으로 옮기고 키운다.
   ─────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────── 말 (i18n) */
var L = {
ko: {
  sub:'구조 · 중력 · 흐름', start:'시작', startVR:'몰입 시작', enter:'몰입 체험',
  exitVR:'몰입 종료', reset:'다시', why:'왜 흔들리지?', back:'돌아가기',
  speed:'속도', theme_l:'라이트', theme_d:'다크', music:'음악', musicOff:'음악 끄기',
  fit:'맞춤', hgt:'높이', wob:'흔들림', up:'현장 → 정점', dn:'정점 → 현장',
  gc:'땅에 닿은 접점',
  i_place:'바닥에 점 세 개를 놓아라 — 남은 자리 {0}개',
  i_done:'바닥이 닫혔다. 이제 이 위로 올린다',
  b_pick:'밝은 자리를 골라 클릭하라',
  b_pick2:'공중은 <b>올리는 수</b>, 바닥은 <b>넓히는 수</b>다. 공중에 세우면 곧바로 쓰러지기 시작한다',
  b_fall:'쓰러지는 중', b_fall2:'<b>빛나는 점들을 클릭해 받쳐라.</b> 막대가 3개여야 멈춘다',
  b_hinge:'아직 흔들린다',
  b_hinge2:'막대 2개는 <b>경첩</b>이다 — 두 점을 잇는 축을 중심으로 계속 돈다. 하나 더',
  b_lock:'잠겼다 — 흔들림이 멎었다', b_lock2:'이 점이 새 발판이 된다. 다음 자리를 골라라',
  b_wide:'접점을 넓혔다', b_wide2:'땅에 닿은 접점이 <b>{0}개</b>. 위로 보낼 수 있는 양이 늘었다',
  b_dead:'막다른 길', b_dead2:'막대가 닿는 범위에 받칠 점이 없다. <b>바닥부터 넓혔어야 한다</b>',
  b_thin:'높이는 닿았는데 정보가 안 올라온다',
  b_thin2:'접점이 <b>{0}개</b> 뿐이다. 바닥 자리를 눌러 <b>넓혀라</b>',
  b_win:'완성 — 위아래가 통한다', b_win2:'높이 <b>{0}</b> · 상향 <b>{1}</b> · 막대 {2}개',
  b_drop:'무너졌다', b_drop2:'막대 3개가 붙기 전에 바닥에 닿았다. <b>다시 세워보라</b>',
  d_two:'왼쪽은 막대 2개, 오른쪽은 3개', d_two2:'가만히 두고 무슨 일이 벌어지는지 보라',
  d_fell:'왼쪽이 무너졌다',
  d_fell2:'막대 2개는 두 점을 잇는 축을 중심으로 <b>접힌다</b>. 오른쪽은 세 점에 이어져 접힐 방향이 아예 없다',
  t_two:'막대 2개', t_two2:'삼각형 — 경첩', t_three:'막대 3개', t_three2:'사면체 — 강체',
  t_prop:'받쳐라', t_prop2:'막대 {0} / 3',
  vrfail:'몰입을 시작하지 못했다', vol:'음량', stage:'스테이지', nextS:'다음 스테이지 →', best:'Apple Vision Pro 에서 가장 좋습니다',
  to2d:'2D 로 보기', links:'남은 연결', out:'연결을 다 썼다',
  out2:'<b>다시</b> 를 눌러 새로 시작하라', nofl:'아직 위아래가 이어지지 않았다',
  nofl2:'정점이 <b>고리</b> 높이에 닿으면 그때 흐름이 시작된다',
},
en: {
  sub:'Structure · Gravity · Flow', start:'START', startVR:'ENTER VR', enter:'Immersive',
  exitVR:'Exit VR', reset:'Restart', why:'Why wobble?', back:'Back',
  speed:'Speed', theme_l:'Light', theme_d:'Dark', music:'Music', musicOff:'Mute',
  fit:'Fit', hgt:'Height', wob:'Wobble', up:'Floor → Apex', dn:'Apex → Floor',
  gc:'Ground contacts',
  i_place:'Set three points on the ground — {0} left',
  i_done:'The base is closed. Now build upward',
  b_pick:'Pick a lit spot',
  b_pick2:'In the air it <b>climbs</b>; on the ground it <b>widens</b>. Anything you raise starts falling at once',
  b_fall:'Falling', b_fall2:'<b>Click the glowing points to prop it up.</b> It stops at three struts',
  b_hinge:'Still wobbling',
  b_hinge2:'Two struts make a <b>hinge</b> — it keeps swinging about the axis between them. One more',
  b_lock:'Locked — the wobble stopped', b_lock2:'This point is now a footing. Pick the next spot',
  b_wide:'Base widened', b_wide2:'<b>{0}</b> ground contacts now. More can travel upward',
  b_dead:'Dead end', b_dead2:'No three points within reach. <b>You needed a wider base first</b>',
  b_thin:'Tall enough, but nothing reaches the top',
  b_thin2:'Only <b>{0}</b> ground contacts. Click a ground spot to <b>widen</b>',
  b_win:'Complete — it conducts both ways', b_win2:'Height <b>{0}</b> · Upward <b>{1}</b> · {2} struts',
  b_drop:'It collapsed', b_drop2:'It hit the ground before the third strut. <b>Try again</b>',
  d_two:'Two struts on the left, three on the right', d_two2:'Leave them alone and watch',
  d_fell:'The left one collapsed',
  d_fell2:'Two struts <b>fold</b> about the axis between them. The right one reaches three points, so there is no way to fold',
  t_two:'2 struts', t_two2:'Triangle — hinge', t_three:'3 struts', t_three2:'Tetrahedron — rigid',
  t_prop:'Prop it', t_prop2:'{0} / 3 struts',
  vrfail:'Could not start the immersive session', vol:'Volume', stage:'Stage', nextS:'Next stage →', best:'Best viewed on Apple Vision Pro',
  to2d:'Back to 2D', links:'Links left', out:'Out of links',
  out2:'Press <b>Restart</b> to begin again', nofl:'Not connected top to bottom yet',
  nofl2:'Flow begins when the apex reaches the <b>ring</b>',
}};
var lang = (navigator.language || 'en').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';
function t(k) {
  var s = (L[lang] && L[lang][k]) || L.en[k] || k;
  for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
  return s;
}

// 스테이지가 올라가면 중력이 세지고 예산이 줄고 목표가 높아진다.
// 중력이 세다 = 받칠 시간이 짧다. 그것이 난이도의 본체다.
var STAGE = (window.MILKY_STAGE) || { id: 1, grav: -4.4, goalY: 2.8, goalUp: 1.0, links: 26 };
var GRAV = STAGE.grav, DAMP = .992, ITER = 14, GROUND = 0;
var REACH = 2.5, STILL = .00035, timeScale = .5;
var GOAL_Y = STAGE.goalY, GOAL_UP = STAGE.goalUp, BASE_R = 1.25;
var LINK_MAX = STAGE.links, linksLeft = LINK_MAX;

var P = [], S = [];
var mode = 'build';                 // 'build' | 'demo'
var phase = 'intro';                // 'intro' | 'play'

/* ─────────────────────────────────────────────────── 물리 */
function addPoint(x, y, z, pin) {
  var j = pin ? 0 : .006;           // 완벽한 수직은 불안정 평형이라 안 쓰러진다
  P.push({ x: x, y: y, z: z, px: x + (Math.random() - .5) * j, py: y,
           pz: z + (Math.random() - .5) * j, pin: !!pin, still: 0, locked: false, born: y });
  return P.length - 1;
}
function d3(p, q) {
  var dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function addStick(a, b) {
  if (a === b || a < 0 || b < 0) return false;
  for (var i = 0; i < S.length; i++)
    if ((S[i].a === a && S[i].b === b) || (S[i].a === b && S[i].b === a)) return false;
  S.push({ a: a, b: b, len: d3(P[a], P[b]) });
  return true;
}
function stickCount(i) {
  var n = 0;
  for (var k = 0; k < S.length; k++) if (S[k].a === i || S[k].b === i) n++;
  return n;
}
function speed(p) { return Math.abs(p.x - p.px) + Math.abs(p.y - p.py) + Math.abs(p.z - p.pz); }
function isLocked(i) { return P[i].pin || P[i].locked; }
// "잠김"은 규칙이 아니라 물리에게 묻는다. 임계값 하나면 미세한 떨림에 깜빡이므로 이력을 준다.
function updateLock(i, dt) {
  var p = P[i];
  if (p.pin) return;
  var v = speed(p);
  if (p.locked) { if (v > STILL * 8) { p.locked = false; p.still = 0; } }
  else { p.still = v < STILL ? p.still + dt : 0; if (p.still > .12) p.locked = true; }
}
function step(dt) {
  var i, p;
  for (i = 0; i < P.length; i++) {
    p = P[i]; if (p.pin) continue;
    var vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP, vz = (p.z - p.pz) * DAMP;
    p.px = p.x; p.py = p.y; p.pz = p.z;
    p.x += vx; p.y += vy + GRAV * dt * dt; p.z += vz;
  }
  for (var it = 0; it < ITER; it++) {
    for (i = 0; i < S.length; i++) {
      var s = S[i], A = P[s.a], B = P[s.b];
      var dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      var diff = (d - s.len) / d;
      var mA = A.pin ? 0 : (B.pin ? 1 : .5), mB = B.pin ? 0 : (A.pin ? 1 : .5);
      A.x += dx * diff * mA; A.y += dy * diff * mA; A.z += dz * diff * mA;
      B.x -= dx * diff * mB; B.y -= dy * diff * mB; B.z -= dz * diff * mB;
    }
    for (i = 0; i < P.length; i++) {
      p = P[i];
      if (!p.pin && p.y < GROUND) { p.y = GROUND; p.px += (p.x - p.px) * .5; }
    }
  }
  for (i = 0; i < P.length; i++) updateLock(i, dt);
}
function maxY() { var h = 0; for (var i = 0; i < P.length; i++) if (P[i].y > h) h = P[i].y; return h; }
function avgWobble() {
  var s = 0, n = 0;
  for (var i = 0; i < P.length; i++) if (!P[i].pin) { s += speed(P[i]); n++; }
  return n ? s / n : 0;
}

/* ─────────────────────────────────────── 흐름 */
var CHANNELS = [
  { id: 'up',   up: true,  hue: [.40, .52], rate: 0 },
  { id: 'down', up: false, hue: [.80, .95], rate: 0 }
];
var flowState = { hop: [], carry: [], groundContacts: 0, apex: -1, up: 0, down: 0,
                  pickUp: [], pickDn: [], meta: [], linked: false };

function analyze() {
  var n = P.length, i, k;
  var adj = []; for (i = 0; i < n; i++) adj.push([]);
  for (i = 0; i < S.length; i++) {
    if (!isLocked(S[i].a) || !isLocked(S[i].b)) continue;
    adj[S[i].a].push(S[i].b); adj[S[i].b].push(S[i].a);
  }
  var hop = []; for (i = 0; i < n; i++) hop.push(-1);
  var q = [];
  for (i = 0; i < n; i++) if (P[i].pin) { hop[i] = 0; q.push(i); }
  for (var h = 0; h < q.length; h++) {
    var cur = q[h];
    for (k = 0; k < adj[cur].length; k++) {
      var nb = adj[cur][k];
      if (hop[nb] < 0) { hop[nb] = hop[cur] + 1; q.push(nb); }
    }
  }
  var apex = -1, best = .35;
  for (i = 0; i < n; i++)
    if (!P[i].pin && isLocked(i) && hop[i] > 0 && P[i].y > best) { best = P[i].y; apex = i; }

  // 접점 = 정점에서 실제로 도달 가능한 고정점. 박혀만 있고 위와 안 이어지면 안 센다.
  var gcList = [], seen = [];
  for (i = 0; i < n; i++) seen.push(false);
  if (apex >= 0) {
    var q2 = [apex]; seen[apex] = true;
    for (var j = 0; j < q2.length; j++) {
      var c2 = q2[j];
      if (P[c2].pin) gcList.push(c2);
      for (k = 0; k < adj[c2].length; k++)
        if (!seen[adj[c2][k]]) { seen[adj[c2][k]] = true; q2.push(adj[c2][k]); }
    }
  }
  var gc = gcList.length;
  var carry = [], pickUp = [], pickDn = [], meta = [];
  for (i = 0; i < S.length; i++) {
    var ok = isLocked(S[i].a) && isLocked(S[i].b) && seen[S[i].a] && seen[S[i].b];
    carry.push(ok);
    var A = P[S[i].a], B = P[S[i].b];
    var vert = Math.abs(A.y - B.y) / Math.max(S[i].len, .01);
    var loHop = Math.min(hop[S[i].a] < 0 ? 99 : hop[S[i].a], hop[S[i].b] < 0 ? 99 : hop[S[i].b]);
    meta.push({ vert: vert, hop: loHop });
    if (!ok) continue;
    // 하향은 안개다 — 수직에 가까운 막대를 타고 더 많이 흘러내린다
    for (k = 0; k <= Math.round(vert * 3); k++) pickDn.push(i);
    // 상향은 땅에서 쏘아 올린 pulse 다 — 아래쪽 막대에서 더 많이 출발한다
    for (k = 0; k <= Math.round(3 / (1 + loHop)); k++) pickUp.push(i);
  }

  // 첫 막대가 잠기자마자 반짝이면 안 된다 — 정점이 고리 높이에 닿아
  // 위아래가 실제로 이어졌을 때 비로소 흐름이 산다.
  var apexH = apex >= 0 ? P[apex].y : 0;
  var linked = apex >= 0 && apexH >= GOAL_Y - .15;
  var up = linked ? gc * .62 / (1 + apexH * .5) : 0;
  var eq = 1;
  if (gcList.length > 1 && apex >= 0) {
    var mn = 1e9, mx = 0;
    for (i = 0; i < gcList.length; i++) {
      var dd = d3(P[gcList[i]], P[apex]);
      if (dd < mn) mn = dd;
      if (dd > mx) mx = dd;
    }
    eq = mx > 0 ? mn / mx : 1;
  }
  var down = linked ? 1.35 * (.45 + .55 * eq) : 0;
  flowState = { hop: hop, carry: carry, groundContacts: gc, apex: apex, up: up, down: down,
                pickUp: pickUp, pickDn: pickDn, meta: meta, linked: linked };
  CHANNELS[0].rate = up; CHANNELS[1].rate = down;
}

/* ─────────────────────────────────────── 놓을 자리 */
var spots = [];
function triArea(a, b, c) {
  var ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
  var vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
  var cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  return .5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
}
function supportsFor(pos) {
  var out = [];
  for (var i = 0; i < P.length; i++) {
    if (!isLocked(i)) continue;
    var d = d3(pos, P[i]);
    if (d <= REACH && d > .45) out.push({ i: i, d: d });
  }
  if (out.length < 3) return null;
  out.sort(function (a, b) { return a.d - b.d; });
  var lim = Math.min(out.length, 7);
  for (var a = 0; a < lim - 2; a++)
    for (var b = a + 1; b < lim - 1; b++)
      for (var c = b + 1; c < lim; c++)
        if (triArea(P[out[a].i], P[out[b].i], P[out[c].i]) > .42)
          return [out[a].i, out[b].i, out[c].i];
  return null;
}
function nearestLocked(pos) {
  var best = -1, bd = REACH;
  for (var i = 0; i < P.length; i++) {
    if (!isLocked(i)) continue;
    var d = d3(pos, P[i]);
    if (d < bd && d > .5) { bd = d; best = i; }
  }
  return best;
}
function computeSpots() {
  spots = [];
  if (phase !== 'play') return;
  var locked = [], i, k;
  for (i = 0; i < P.length; i++) if (isLocked(i)) locked.push(i);
  if (!locked.length) return;
  locked.sort(function (a, b) { return P[b].y - P[a].y; });
  var cand = [];
  var dirs = [[0, 1.25, 0]];
  for (var a = 0; a < 6; a++) {
    var th = a / 6 * Math.PI * 2;
    dirs.push([Math.cos(th) * 1.05, .95, Math.sin(th) * 1.05]);
  }
  var seeds = locked.slice(0, 7);
  for (var s = 0; s < seeds.length; s++) {
    var sp = P[seeds[s]];
    for (var d = 0; d < dirs.length; d++) {
      var pos = { x: sp.x + dirs[d][0], y: sp.y + dirs[d][1], z: sp.z + dirs[d][2] };
      if (pos.y < .55) continue;
      var bad = false;
      for (k = 0; k < P.length; k++) if (d3(pos, P[k]) < .8) { bad = true; break; }
      if (bad) continue;
      var sup = supportsFor(pos);
      if (!sup) continue;
      cand.push({ x: pos.x, y: pos.y, z: pos.z, base: sup, ground: false, score: pos.y });
    }
  }
  // 바닥 — 새 접점을 심는다. 상향 용량은 접점 수에서 나오므로 이것이 "넓히기" 다.
  for (i = 0; i < P.length; i++) {
    if (!P[i].pin) continue;
    var pp = P[i], rad = Math.sqrt(pp.x * pp.x + pp.z * pp.z) || 1;
    for (var m = -1; m <= 1; m++) {
      var ang = Math.atan2(pp.z, pp.x) + m * .52;
      var gp = { x: Math.cos(ang) * (rad + 1.25), y: 0, z: Math.sin(ang) * (rad + 1.25) };
      var bad2 = false;
      for (k = 0; k < P.length; k++) if (d3(gp, P[k]) < 1.05) { bad2 = true; break; }
      if (bad2) continue;
      var anchor = nearestLocked(gp);
      if (anchor < 0) continue;
      cand.push({ x: gp.x, y: 0, z: gp.z, base: [anchor], ground: true, score: -.5 });
    }
  }
  cand.sort(function (a, b) { return b.score - a.score; });
  var nAir = 0, nGnd = 0;
  for (var c = 0; c < cand.length && spots.length < 5; c++) {
    if (cand[c].ground ? nGnd >= 2 : nAir >= 3) continue;
    var dup = false;
    for (var g = 0; g < spots.length; g++) if (d3(cand[c], spots[g]) < 1.6) { dup = true; break; }
    if (dup) continue;
    spots.push(cand[c]);
    if (cand[c].ground) nGnd++; else nAir++;
  }
}

/* ─────────────────────────────────────── 인트로 */
// 시작 전에 바닥 삼각형을 직접 만든다. 카메라가 바로 위에 있어 화면에서는
// 원 안에 삼각형이 그려지는 2D 도형으로 보인다 — 이 게임의 기본형이다.
var slots = [], placed = 0;
function setupIntro() {
  phase = 'intro'; mode = 'build'; P = []; S = []; spots = [];
  slots = [];
  for (var k = 0; k < 3; k++) {
    var a = k / 3 * Math.PI * 2 - Math.PI / 2;
    slots.push({ x: Math.cos(a) * BASE_R, y: 0, z: Math.sin(a) * BASE_R, used: false });
  }
  placed = 0;
  game.active = -1; game.won = false;
  analyze();
  document.getElementById('introStep').textContent = t('i_place', 3);
}
function placeSlot(i) {
  if (slots[i].used) return;
  slots[i].used = true;
  addPoint(slots[i].x, 0, slots[i].z, true);
  placed++;
  var el = document.getElementById('introStep');
  if (placed < 3) { el.textContent = t('i_place', 3 - placed); return; }
  for (var k = 0; k < 3; k++) addStick(k, (k + 1) % 3);
  analyze();
  el.textContent = t('i_done');
  document.getElementById('startWrap').classList.add('on');
  vrStart.visible = xrOn;
}
function startGame() {
  if (phase !== 'intro' || placed < 3) return;
  phase = 'play';
  camTween = 1;                       // 위에서 내려다보던 시점을 비스듬히 돌린다
  document.getElementById('intro').classList.add('gone');
  document.getElementById('introBest').style.opacity = '0';
  document.getElementById('introStep').style.opacity = '0';
  document.getElementById('startWrap').classList.remove('on');
  vrStart.visible = false;
  ['say', 'hud'].forEach(function (id) { document.getElementById(id).classList.add('on'); });
  ['bottom', 'bottomR', 'zoom'].forEach(function (id) { document.getElementById(id).classList.add('on'); });
  analyze(); computeSpots();
  say('b_pick', 'b_pick2');
  playMusic();
}

/* ─────────────────────────────────────── 게임 */
var game = { active: -1, won: false };
function setupBuild() {
  mode = 'build'; archSel = -1; P = []; S = []; linksLeft = LINK_MAX;
  var idx = [];
  for (var k = 0; k < 3; k++) {
    var a = k / 3 * Math.PI * 2 - Math.PI / 2;
    idx.push(addPoint(Math.cos(a) * BASE_R, 0, Math.sin(a) * BASE_R, true));
  }
  addStick(idx[0], idx[1]); addStick(idx[1], idx[2]); addStick(idx[2], idx[0]);
  game.active = -1; game.won = false;
  analyze(); computeSpots();
  say('b_pick', 'b_pick2');
  setButtons();
}
function supporters() {
  var out = [];
  if (game.active < 0) return out;
  for (var i = 0; i < P.length; i++) {
    if (i === game.active || !isLocked(i)) continue;
    if (d3(P[i], P[game.active]) > REACH) continue;
    var dup = false;
    for (var k = 0; k < S.length; k++)
      if ((S[k].a === i && S[k].b === game.active) || (S[k].b === i && S[k].a === game.active)) dup = true;
    if (!dup) out.push(i);
  }
  return out;
}
function support(from) {
  if (game.active < 0) return;
  if (!addStick(from, game.active)) return;
  linksLeft--;
  if (stickCount(game.active) === 2) say('b_hinge', 'b_hinge2');
}

/* ─────────────────────────────────────── 비교 시연 */
var demo = { left: -1, right: -1, said: false };
function setupDemo() {
  mode = 'demo'; archSel = -1; P = []; S = [];
  function tri(ox) {
    var tt = [];
    for (var k = 0; k < 3; k++) {
      var a = k / 3 * Math.PI * 2 - Math.PI / 2;
      tt.push(addPoint(ox + Math.cos(a), 0, Math.sin(a), true));
    }
    addStick(tt[0], tt[1]); addStick(tt[1], tt[2]); addStick(tt[2], tt[0]);
    return tt;
  }
  var A = tri(-2.2), B = tri(2.2);
  demo.left = addPoint(-2.2, 1.45, 0, false);
  addStick(A[0], demo.left); addStick(A[1], demo.left);
  demo.right = addPoint(2.2, 1.45, 0, false);
  addStick(B[0], demo.right); addStick(B[1], demo.right); addStick(B[2], demo.right);
  demo.said = false; spots = []; game.active = -1;
  say('d_two', 'd_two2');
  setButtons();
}

/* ─────────────────────────────────────── 테마 */
var THEMES = {
  dark: {
    bg: 0x07080b, fog: .030, grid: [0x252b35, 0x12151c],
    shell: [.62, .70, .86], core: [.88, .92, 1.0], stick: [.68, .73, .84], spot: [.55, .90, .84],
    goal: 0xe8ecf2, goalOp: .55, blend: THREE.AdditiveBlending, pLum: .60, pOp: .95, haloOp: .17,
    hemi: [0xaab4c4, 0x0a0b10, .95], key: .85, rim: .45, panel: 'rgba(11,13,19,.86)', hotPanel: 'rgba(40,120,105,.75)', ink: '#e8ecf2'
  },
  light: {
    bg: 0xeef1f6, fog: .020, grid: [0xc0c8d6, 0xdbe1ea],
    shell: [.36, .42, .55], core: [.14, .19, .30], stick: [.32, .38, .50], spot: [.05, .52, .45],
    goal: 0x39415a, goalOp: .7, blend: THREE.NormalBlending, pLum: .40, pOp: 1, haloOp: .10,
    hemi: [0xffffff, 0x9aa4b8, 1.15], key: .55, rim: .3, panel: 'rgba(255,255,255,.92)', hotPanel: 'rgba(120,230,210,.8)', ink: '#161d2b'
  }
};
var themeName = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
var T = THEMES[themeName];

/* ─────────────────────────────────────── 렌더 */
var canvas = document.getElementById('c');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.xr.enabled = true;
var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(T.bg, T.fog);
var camera = new THREE.PerspectiveCamera(46, 1, .1, 200);
var world = new THREE.Group(); scene.add(world);

var hemi = new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]); scene.add(hemi);
var key = new THREE.DirectionalLight(0xffffff, T.key); key.position.set(3, 6, 4); scene.add(key);
var rim = new THREE.DirectionalLight(0xc8d4e4, T.rim); rim.position.set(-4, 2, -3); scene.add(rim);
/* 화려함 — 설정에 flair 가 켜진 스테이지에서만 켠다. 배경이 화면을 잡아먹으면
   구조가 안 보이므로, 멀리 두고 아주 천천히 움직이게 한다. */
var neb = null, stars = null;
function buildFlair() {
  if (!STAGE.flair) return;
  // 성운 — 안쪽을 칠한 큰 구. 위는 자홍, 아래는 청록으로 흐름의 두 색을 미리 깐다.
  var g = new THREE.SphereGeometry(70, 32, 24);
  var pos = g.attributes.position, n = pos.count;
  var col = new Float32Array(n * 3), c = new THREE.Color();
  for (var i = 0; i < n; i++) {
    var y = pos.getY(i) / 70;                       // -1 아래 ~ +1 위
    var hue = .52 + (1 - (y * .5 + .5)) * .38;      // 청록 → 자홍
    c.setHSL(hue % 1, .75, .07 + Math.pow(Math.abs(y), 2) * .1);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  neb = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, depthWrite: false }));
  scene.add(neb);

  // 별 — 흐르는 색과 같은 색상대에서 뽑아 화면 전체가 한 팔레트로 묶이게 한다
  var N = 1400, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3);
  for (i = 0; i < N; i++) {
    var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 24 + Math.random() * 34;
    sp[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    sp[i * 3 + 1] = Math.cos(ph) * r * .7 + 6;
    sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    c.setHSL(Math.random() < .5 ? .40 + Math.random() * .12 : .80 + Math.random() * .15,
             .8, .45 + Math.random() * .35);
    sc[i * 3] = c.r; sc[i * 3 + 1] = c.g; sc[i * 3 + 2] = c.b;
  }
  var sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({
    size: .5, map: GLOW, vertexColors: true, transparent: true, opacity: .85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  stars.frustumCulled = false;
  scene.add(stars);
}

var grid = null;
function buildGrid() {
  if (grid) { world.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
  grid = new THREE.GridHelper(40, 80, T.grid[0], T.grid[1]);
  world.add(grid);
}
buildGrid();

// 도달해야 할 zone. 파티클 색상대를 한 바퀴 돌려 칠한다 — 어느 방향으로 붙어도
// 그쪽 색으로 흐른다는 것을 고리 자체가 미리 말해 준다.
var goalGeo = new THREE.TorusGeometry(1.7, .02, 8, 128);
(function paintGoal() {
  var pos = goalGeo.attributes.position, n = pos.count;
  var col = new Float32Array(n * 3), c = new THREE.Color();
  for (var i = 0; i < n; i++) {
    var a = Math.atan2(pos.getY(i), pos.getX(i));      // 고리를 도는 각도
    c.setHSL(((a / (Math.PI * 2)) + 1) % 1, .85, .6);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  goalGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}());
var goalRing = new THREE.Mesh(goalGeo, new THREE.MeshBasicMaterial({
  vertexColors: true, transparent: true, opacity: T.goalOp }));
goalRing.rotation.x = Math.PI / 2; world.add(goalRing);

// 인트로의 원 — 바닥 삼각형이 이 안에 그려진다
var baseRing = new THREE.Mesh(new THREE.TorusGeometry(BASE_R, .011, 6, 96),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: .5 }));
baseRing.rotation.x = Math.PI / 2; baseRing.position.y = .004; world.add(baseRing);

var shellGeo = new THREE.OctahedronGeometry(.185, 0);
var coreGeo = new THREE.OctahedronGeometry(.085, 0);
var stickGeo = new THREE.CylinderGeometry(.028, .028, 1, 6); stickGeo.translate(0, .5, 0);
var footGeo = new THREE.RingGeometry(.2, .235, 28); footGeo.rotateX(-Math.PI / 2);
var shells = [], cores = [], stickMeshes = [], footMeshes = [], spotMeshes = [], slotMeshes = [];

var timerRing = new THREE.Mesh(new THREE.TorusGeometry(.42, .012, 6, 48),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: .85 }));
timerRing.visible = false; world.add(timerRing);

function makeSpot() {
  var g = new THREE.Group();
  var shell = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: .26, wireframe: true }));
  var core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .9 }));
  var halo = new THREE.Mesh(new THREE.TorusGeometry(.36, .009, 6, 40),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: .6 }));
  halo.rotation.x = Math.PI / 2;
  var beamGeo = new THREE.CylinderGeometry(.005, .005, 1, 4); beamGeo.translate(0, -.5, 0);
  var beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .16 }));
  g.add(shell); g.add(core); g.add(halo); g.add(beam);
  g.userData = { shell: shell, core: core, halo: halo, beam: beam };
  world.add(g); return g;
}
for (var si = 0; si < 3; si++) {
  var sg = new THREE.Group();
  var sc2 = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .9 }));
  var sh2 = new THREE.Mesh(new THREE.TorusGeometry(.3, .009, 6, 40),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: .55 }));
  sh2.rotation.x = Math.PI / 2;
  sg.add(sc2); sg.add(sh2);
  sg.userData = { core: sc2, halo: sh2 };
  world.add(sg); slotMeshes.push(sg);
}

// 파티클 — 화면에서 유일하게 진한 색. 흐르는 것만이 살아 있다.
var PPC = 340, _hsl = new THREE.Color();
// 점을 네모로 찍으면 알갱이가 딱딱하다. 가운데가 밝고 가장자리로 사라지는
// 스프라이트를 쓰면 심지 바깥으로 빛이 번져 나간다.
var GLOW = (function () {
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(.28, 'rgba(255,255,255,.62)');
  gr.addColorStop(.6, 'rgba(255,255,255,.16)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}());
CHANNELS.forEach(function (ch) {
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PPC * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PPC * 3), 3));
  ch.geo = geo;
  // 두 층이 같은 지오메트리를 공유한다 — 심지 하나, 그 바깥으로 크고 옅은 후광 하나.
  ch.pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: .1, map: GLOW, vertexColors: true, transparent: true,
    depthWrite: false, sizeAttenuation: true }));
  ch.halo = new THREE.Points(geo, new THREE.PointsMaterial({
    size: .42, map: GLOW, vertexColors: true, transparent: true,
    depthWrite: false, sizeAttenuation: true, opacity: .16 }));
  ch.pts.frustumCulled = ch.halo.frustumCulled = false;
  ch.halo.renderOrder = -1;
  world.add(ch.halo); world.add(ch.pts);
  ch.items = [];
  for (var i = 0; i < PPC; i++) ch.items.push({ s: -1, t: 0, h: Math.random() });
});
buildFlair();
function paintParticles() {
  CHANNELS.forEach(function (ch) {
    var col = ch.geo.attributes.color.array;
    for (var i = 0; i < PPC; i++) {
      // 파티클마다 채널 색상대 안에서 색이 흩어진다 — "다양한 네온색"
      _hsl.setHSL(ch.hue[0] + ch.items[i].h * (ch.hue[1] - ch.hue[0]), 1, T.pLum);
      ch.items[i].r = _hsl.r; ch.items[i].g = _hsl.g; ch.items[i].b = _hsl.b;
      col[i * 3] = _hsl.r; col[i * 3 + 1] = _hsl.g; col[i * 3 + 2] = _hsl.b;
    }
    ch.geo.attributes.color.needsUpdate = true;
    ch.pts.material.blending = T.blend;
    ch.pts.material.opacity = T.pOp;
    ch.pts.material.needsUpdate = true;
    ch.halo.material.blending = T.blend;
    ch.halo.material.opacity = T.haloOp;
    ch.halo.material.needsUpdate = true;
  });
}
function applyTheme(name) {
  themeName = name; T = THEMES[name];
  document.documentElement.dataset.theme = name;
  scene.background = new THREE.Color(T.bg);
  if (neb) neb.visible = (name === 'dark');
  if (stars) stars.material.opacity = (name === 'dark') ? .85 : .35;
  scene.fog.color.setHex(T.bg); scene.fog.density = T.fog;
  hemi.color.setHex(T.hemi[0]); hemi.groundColor.setHex(T.hemi[1]); hemi.intensity = T.hemi[2];
  key.intensity = T.key; rim.intensity = T.rim;
  goalRing.material.opacity = T.goalOp;
  buildGrid(); paintParticles(); drawVRStart(); redrawVRPanel();
  document.getElementById('bTheme').textContent = name === 'dark' ? t('theme_l') : t('theme_d');
}

var UP = new THREE.Vector3(0, 1, 0);
var _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

function syncParticles(dt) {
  CHANNELS.forEach(function (ch) {
    var pos = ch.geo.attributes.position.array;
    var col = ch.geo.attributes.color.array;
    var pick = ch.up ? flowState.pickUp : flowState.pickDn;
    var want = Math.min(PPC, Math.round(ch.rate * (ch.up ? 130 : 175)));
    if (!pick || !pick.length) want = 0;
    for (var i = 0; i < PPC; i++) {
      var it = ch.items[i];
      if (i >= want) { pos[i * 3 + 1] = -999; it.s = -1; continue; }
      if (it.s < 0 || it.s >= S.length || !flowState.carry[it.s]) {
        it.s = pick[(Math.random() * pick.length) | 0];
        it.t = ch.up ? 0 : Math.random();
        it.wear = 0;
      }
      var md = flowState.meta[it.s] || { vert: .5, hop: 0 };
      var spd;
      if (ch.up) {
        // 땅에서 쏘아 올린 pulse. 위로 갈수록 가속이 죽는다.
        spd = 2.1 / (1 + md.hop * .55);
      } else {
        // 안개처럼 내려온다. 수직일수록 빨리, 옆으로 누울수록 느리게 번진다.
        spd = .5 + md.vert * .95;
      }
      it.t += dt * spd;
      if (it.t > 1) {
        it.t = 0;
        // 여러 다리를 돌아 올라갈수록 정보가 흩어진다 — 마찰이 쌓인다
        it.wear = ch.up ? it.wear + .34 + md.vert * .12 : 0;
        it.s = pick[(Math.random() * pick.length) | 0];
        if (ch.up && it.wear > 1.6 && Math.random() < .55) { it.wear = 0; it.t = 0; }
      }
      var st = S[it.s], A = P[st.a], B = P[st.b];
      var lo = flowState.hop[st.a] <= flowState.hop[st.b] ? A : B;
      var hi = (lo === A) ? B : A;
      var f = ch.up ? lo : hi, g = ch.up ? hi : lo;
      // 상향은 올라가며 감속하는 느낌, 하향은 늘어지며 내려앉는 느낌
      var u = ch.up ? 1 - Math.pow(1 - it.t, 1.9) : Math.pow(it.t, 1.25);
      pos[i * 3] = f.x + (g.x - f.x) * u;
      pos[i * 3 + 1] = f.y + (g.y - f.y) * u;
      pos[i * 3 + 2] = f.z + (g.z - f.z) * u;
      // 마찰로 흩어진 만큼 옅어진다
      var fade = ch.up ? 1 / (1 + it.wear * .8) : 1;
      col[i * 3] = it.r * fade; col[i * 3 + 1] = it.g * fade; col[i * 3 + 2] = it.b * fade;
    }
    ch.geo.attributes.position.needsUpdate = true;
    ch.geo.attributes.color.needsUpdate = true;
  });
}

function syncMeshes(tm) {
  var i, sup = supporters(), isSup = {};
  sup.forEach(function (k) { isSup[k] = true; });

  baseRing.visible = (phase === 'intro');
  baseRing.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
  for (i = 0; i < 3; i++) {
    var on2 = (phase === 'intro') && !slots[i].used;
    slotMeshes[i].visible = on2;
    if (!on2) continue;
    slotMeshes[i].position.set(slots[i].x, .05, slots[i].z);
    var pl = 1 + Math.sin(tm * 3.4 + i * 2.1) * .18;
    slotMeshes[i].userData.core.scale.setScalar(pl * 1.3);
    slotMeshes[i].userData.halo.scale.setScalar(pl);
    slotMeshes[i].userData.core.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
    slotMeshes[i].userData.halo.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
  }

  while (shells.length < P.length) {
    var sh = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({
      transparent: true, opacity: .4, roughness: .25, metalness: .1,
      flatShading: true, depthWrite: false }));
    world.add(sh); shells.push(sh);
    var co = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
      transparent: true, opacity: .9, roughness: .2, metalness: .3, flatShading: true }));
    world.add(co); cores.push(co);
    var ft = new THREE.Mesh(footGeo, new THREE.MeshBasicMaterial({
      transparent: true, opacity: .3, side: THREE.DoubleSide }));
    world.add(ft); footMeshes.push(ft);
  }
  for (i = 0; i < shells.length; i++) {
    var vis = i < P.length;
    shells[i].visible = cores[i].visible = footMeshes[i].visible = vis;
    if (!vis) continue;
    var p = P[i];
    shells[i].position.set(p.x, p.y, p.z);
    cores[i].position.set(p.x, p.y, p.z);
    shells[i].rotation.y = tm * .25 + i;       // 두 겹이 반대로 돌아 입체로 읽힌다
    cores[i].rotation.y = -tm * .35 + i;
    // 상태는 색상이 아니라 밝기·투명도·크기로 말한다. 진한 색은 흐름만 가진다.
    var lum = 1, op = .34, sc = 1;
    if (p.pin) { lum = 1.05; op = .42; }
    if (isLocked(i) && !p.pin) { lum = 1.18; op = .5; }
    if (!p.pin && !isLocked(i)) { lum = .8; op = .34; sc = 1.12; }
    if (isSup[i]) { lum = 1.5; op = .95; sc = 1.45 + Math.sin(tm * 7) * .2; }
    shells[i].material.color.setRGB(T.shell[0] * lum, T.shell[1] * lum, T.shell[2] * lum);
    shells[i].material.opacity = op; shells[i].scale.setScalar(sc);
    cores[i].material.color.setRGB(T.core[0] * lum, T.core[1] * lum, T.core[2] * lum);
    cores[i].material.opacity = Math.min(1, op * 2.1);
    cores[i].scale.setScalar(sc * (isSup[i] ? 1.3 : 1));
    footMeshes[i].position.set(p.x, .008, p.z);
    var k2 = 1 + p.y * .3;
    footMeshes[i].scale.setScalar(k2);
    footMeshes[i].material.color.setRGB(T.shell[0], T.shell[1], T.shell[2]);
    footMeshes[i].material.opacity = (p.pin ? .36 : .26) / (k2 * k2);
  }

  while (stickMeshes.length < S.length) {
    var sm = new THREE.Mesh(stickGeo, new THREE.MeshStandardMaterial({
      roughness: .35, metalness: .15, transparent: true, opacity: .75 }));
    world.add(sm); stickMeshes.push(sm);
  }
  for (i = 0; i < stickMeshes.length; i++) {
    var v = i < S.length; stickMeshes[i].visible = v;
    if (!v) continue;
    var A2 = P[S[i].a], B2 = P[S[i].b];
    _a.set(A2.x, A2.y, A2.z); _b.set(B2.x, B2.y, B2.z); _d.subVectors(_b, _a);
    var sk = stickMeshes[i];
    sk.position.copy(_a);
    sk.quaternion.setFromUnitVectors(UP, _d.clone().normalize());
    sk.scale.set(1, _d.length(), 1);
    var mv = Math.max(A2.pin ? 0 : speed(A2), B2.pin ? 0 : speed(B2));
    var calm = 1 - Math.min(1, mv * 55);
    var g2 = .62 + calm * .5;
    sk.material.color.setRGB(T.stick[0] * g2, T.stick[1] * g2, T.stick[2] * g2);
    sk.material.opacity = .4 + calm * .42;
  }

  while (spotMeshes.length < spots.length) spotMeshes.push(makeSpot());
  for (i = 0; i < spotMeshes.length; i++) {
    var on = (mode === 'build') && (i < spots.length) && (game.active < 0);
    spotMeshes[i].visible = on;
    if (!on) continue;
    var g3 = spots[i], u = spotMeshes[i].userData;
    spotMeshes[i].position.set(g3.x, g3.y, g3.z);
    var pulse = 1 + Math.sin(tm * 3.2 + i * 1.3) * .12;
    [u.shell, u.core, u.halo, u.beam].forEach(function (m) {
      m.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
    });
    u.shell.visible = u.core.visible = !g3.ground;
    u.shell.scale.setScalar(pulse); u.shell.rotation.y = tm * .5 + i;
    u.core.scale.setScalar(pulse);
    u.halo.scale.setScalar(g3.ground ? pulse * 1.9 : pulse * 1.08);
    u.halo.rotation.z = tm * .6 + i;
    u.beam.visible = !g3.ground;
    if (!g3.ground) u.beam.scale.set(1, Math.max(g3.y, .01), 1);
  }

  var ok = game.active >= 0 && game.active < P.length;
  timerRing.visible = ok;
  if (ok) {
    var ap = P[game.active];
    timerRing.position.set(ap.x, ap.y, ap.z);
    timerRing.quaternion.copy(camera.quaternion);
    var left = Math.max(0, Math.min(1, ap.y / Math.max(ap.born, .01)));
    timerRing.scale.setScalar(.45 + left * .75);
    timerRing.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
    timerRing.material.opacity = .3 + (1 - left) * .6;
  }
  goalRing.visible = (mode === 'build' && phase === 'play');
  goalRing.rotation.z = tm * .12;
}


/* ─────────────────────────────────────── 완성작 보관대 (왼쪽) */
// 완성한 구조를 왼쪽에 입체로 세워 둔다. 누르면 커져서 돌아가고, 다시 누르면
// 제자리로 간다. world 그룹 안에 있으므로 VR 에서도 그대로 손에 잡힌다.
var archive = [], archMeshes = [], archSel = -1;
var ARCH_MAX = 6, ARCH_X = -4.3;

function loadArchive() {
  try { var v = localStorage.getItem('milkysticky.archive'); if (v) archive = JSON.parse(v) || []; }
  catch (e) { archive = []; }
}
function persistArchive() {
  try { localStorage.setItem('milkysticky.archive', JSON.stringify(archive)); } catch (e) {}
}
function snapshot() {
  return {
    pts: P.map(function (p) { return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3), pin: p.pin }; }),
    sticks: S.map(function (st) { return [st.a, st.b]; }),
    h: +maxY().toFixed(2), up: +flowState.up.toFixed(2), gc: flowState.groundContacts, n: S.length
  };
}
function archiveCurrent() {
  archive.unshift(snapshot());
  while (archive.length > ARCH_MAX) archive.pop();
  persistArchive(); buildArchMeshes();
}
function disposeArch() {
  archMeshes.forEach(function (g) {
    world.remove(g);
    g.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  });
  archMeshes = [];
}
function buildArchMeshes() {
  disposeArch();
  for (var i = 0; i < archive.length; i++) {
    var rec = archive[i], g = new THREE.Group(), lp = [], k;
    for (k = 0; k < rec.sticks.length; k++) {
      var a = rec.pts[rec.sticks[k][0]], b = rec.pts[rec.sticks[k][1]];
      if (!a || !b) continue;
      lp.push(new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z));
    }
    var lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp),
      new THREE.LineBasicMaterial({ transparent: true, opacity: .8 }));
    var jp = [];
    for (k = 0; k < rec.pts.length; k++) jp.push(new THREE.Vector3(rec.pts[k].x, rec.pts[k].y, rec.pts[k].z));
    var pts = new THREE.Points(new THREE.BufferGeometry().setFromPoints(jp),
      new THREE.PointsMaterial({ size: .5, map: GLOW, transparent: true, opacity: .85,
                                 depthWrite: false, sizeAttenuation: true }));
    var plinth = new THREE.Mesh(new THREE.TorusGeometry(1.5, .03, 6, 48),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: .3 }));
    plinth.rotation.x = Math.PI / 2;
    g.add(lines); g.add(pts); g.add(plinth);
    g.userData = { lines: lines, pts: pts, plinth: plinth, rec: rec, spin: 0 };
    world.add(g); archMeshes.push(g);
  }
}
function archTarget(i) {
  if (i === archSel) return { x: ARCH_X - 1.1, y: 1.7, s: .62 };
  return { x: ARCH_X, y: .35 + i * 1.15, s: .2 };
}
function syncArchive(tm, dt) {
  for (var i = 0; i < archMeshes.length; i++) {
    var g = archMeshes[i], tg = archTarget(i);
    g.position.x += (tg.x - g.position.x) * .12;
    g.position.y += (tg.y - g.position.y) * .12;
    var cur = g.scale.x + (tg.s - g.scale.x) * .12;
    g.scale.setScalar(cur);
    g.userData.spin += dt * (i === archSel ? .55 : .12);
    g.rotation.y = g.userData.spin;
    g.userData.lines.material.color.setRGB(T.stick[0] * 1.1, T.stick[1] * 1.1, T.stick[2] * 1.1);
    g.userData.pts.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
    g.userData.plinth.material.color.setRGB(T.shell[0], T.shell[1], T.shell[2]);
    g.visible = (phase === 'play');
  }
}

/* ─────────────────────────── 카메라 */
var orbit = { yaw: .5, pitch: 1.5, dist: 5.4, ty: 0 };
var fitDist = 5.4, fitTy = 0, userZoom = 1, camTween = 0;
var pan = { x: 0, y: 0 };
var _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _cup = new THREE.Vector3();
function autoFrame() {
  if (phase === 'intro') { fitDist = 5.4; fitTy = 0; return; }
  if (!P.length) return;
  var minY = 1e9, maxYv = -1e9, maxR = 0, i;
  for (i = 0; i < P.length; i++) {
    var p = P[i];
    if (p.y < minY) minY = p.y;
    if (p.y > maxYv) maxYv = p.y;
    var r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r > maxR) maxR = r;
  }
  for (i = 0; i < spots.length; i++) {
    if (spots[i].y > maxYv) maxYv = spots[i].y;
    var gr = Math.sqrt(spots[i].x * spots[i].x + spots[i].z * spots[i].z);
    if (gr > maxR) maxR = gr;
  }
  if (archMeshes.length) {                 // 보관대도 화면에 담는다
    var ax = Math.abs(ARCH_X) + 1.2;
    if (ax > maxR) maxR = ax;
    var ay = .35 + (archMeshes.length - 1) * 1.15 + .8;
    if (ay > maxYv) maxYv = ay;
  }
  var halfH = Math.max((maxYv - minY) / 2, .9) + .7;
  var halfW = maxR + 1.0;
  var vFov = camera.fov * Math.PI / 180;
  var hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  fitDist = Math.max(halfH / (Math.tan(vFov / 2) * .78), halfW / Math.tan(hFov / 2)) + .7;
  fitTy = (minY + maxYv) / 2;
}
function placeCamera(dt) {
  // 시작을 누르면 위에서 내려다보던 시점이 비스듬한 시점으로 넘어간다
  if (camTween > 0) {
    camTween = Math.max(0, camTween - dt / 1.5);
    var e = 1 - Math.pow(camTween, 2);
    orbit.pitch = 1.5 + (.2 - 1.5) * e;
  }
  orbit.dist += (fitDist * userZoom - orbit.dist) * .1;
  orbit.ty += (fitTy - orbit.ty) * .1;
  var cp = Math.cos(orbit.pitch);
  var ox = Math.sin(orbit.yaw) * cp * orbit.dist;
  var oy = Math.sin(orbit.pitch) * orbit.dist;
  var oz = Math.cos(orbit.yaw) * cp * orbit.dist;
  _fwd.set(-ox, -oy, -oz).normalize();
  _right.crossVectors(_fwd, UP).normalize();
  if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);   // 정수직에서 축이 무너지는 것 방지
  _cup.crossVectors(_right, _fwd).normalize();
  var tx = _right.x * pan.x + _cup.x * pan.y;
  var ty = orbit.ty + _right.y * pan.x + _cup.y * pan.y;
  var tz = _right.z * pan.x + _cup.z * pan.y;
  camera.position.set(tx + ox, ty + oy, tz + oz);
  camera.up.set(0, 1, 0);
  camera.lookAt(tx, ty, tz);
}

/* ─────────────────────────────────────── 조작 (마우스 · VR 공용) */
var ray = new THREE.Raycaster();
var _inv = new THREE.Matrix4(), _rot = new THREE.Matrix4();
function toWorldLocal() {
  world.updateMatrixWorld();
  _inv.copy(world.matrixWorld).invert();
  ray.ray.applyMatrix4(_inv);
}
function nearestOfRay(list, maxD) {
  var best = -1, bestD = maxD;
  for (var k = 0; k < list.length; k++) {
    var i = list[k];
    _a.set(P[i].x, P[i].y, P[i].z);
    var d = ray.ray.distanceToPoint(_a);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
function nearestSpotRay() {
  var best = -1, bestD = 1e9;
  for (var i = 0; i < spots.length; i++) {
    _a.set(spots[i].x, spots[i].y, spots[i].z);
    var d = ray.ray.distanceToPoint(_a);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
// 마우스든 컨트롤러든 여기로 들어온다. 규칙이 한 곳에만 있다.
function act() {
  // 왼쪽 보관대를 먼저 본다. 누르면 커지고, 다시 누르면 제자리로.
  if (phase === 'play') {
    for (var ai = 0; ai < archMeshes.length; ai++) {
      _a.copy(archMeshes[ai].position);
      if (ray.ray.distanceToPoint(_a) < (ai === archSel ? 1.3 : .72)) {
        archSel = (ai === archSel) ? -1 : ai;
        return;
      }
    }
  }
  if (phase === 'intro') {
    var bi = -1, bd = 1e9;
    for (var i = 0; i < 3; i++) {
      if (slots[i].used) continue;
      _a.set(slots[i].x, slots[i].y, slots[i].z);
      var d = ray.ray.distanceToPoint(_a);
      if (d < bd) { bd = d; bi = i; }
    }
    if (bi >= 0) placeSlot(bi);
    return;
  }
  if (mode !== 'build') return;
  if (game.active >= 0) {
    var sup = supporters();
    var pick = nearestOfRay(sup, 1.6);
    if (pick >= 0) support(pick); else if (sup.length) support(sup[0]);
    return;
  }
  var s = nearestSpotRay();
  if (s < 0) return;
  var g = spots[s];
  if (linksLeft <= 0) { say('out', 'out2'); return; }
  if (g.ground) {
    var gi = addPoint(g.x, 0, g.z, true);
    addStick(g.base[0], gi); linksLeft--;
    analyze(); computeSpots();
    say('b_wide', 'b_wide2', flowState.groundContacts);
    return;
  }
  var ni = addPoint(g.x, g.y, g.z, false);
  // 첫 막대를 어디에 거는지는 조준 방향이 정한다 — 쓰러지는 방향이 달라진다
  var anchor = nearestOfRay(g.base, 1e9);
  addStick(anchor >= 0 ? anchor : g.base[0], ni); linksLeft--;
  game.active = ni; spots = [];
  say('b_fall', 'b_fall2');
}

var pointers = {}, nPointers = 0, gesture = null;
var press = { x: 0, y: 0, moved: 0, multi: false };
function panScale() { return orbit.dist * .0016; }
canvas.addEventListener('pointerdown', function (e) {
  if (!pointers[e.pointerId]) nPointers++;
  pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
  if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  if (nPointers === 1) { press.x = e.clientX; press.y = e.clientY; press.moved = 0; press.multi = false; }
  else { press.multi = true; gesture = null; }
});
canvas.addEventListener('pointermove', function (e) {
  if (!pointers[e.pointerId]) return;
  pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY;
  if (nPointers >= 2) {
    var ids = Object.keys(pointers), a = pointers[ids[0]], b = pointers[ids[1]];
    var dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (gesture) {
      if (gesture.dist > 8 && dist > 8)
        userZoom = Math.max(.35, Math.min(4, userZoom * (gesture.dist / dist)));
      pan.x -= (mx - gesture.mx) * panScale();
      pan.y += (my - gesture.my) * panScale();
    }
    gesture = { dist: dist, mx: mx, my: my };
    press.moved = 999;
    return;
  }
  if (phase === 'intro') return;              // 인트로에서는 시점을 고정한다
  var ddx = e.clientX - press.x, ddy = e.clientY - press.y;
  press.moved += Math.abs(ddx) + Math.abs(ddy);
  orbit.yaw -= ddx * .007;
  orbit.pitch = Math.max(-.1, Math.min(1.2, orbit.pitch + ddy * .005));
  press.x = e.clientX; press.y = e.clientY;
});
function endPointer(e) {
  if (pointers[e.pointerId]) { delete pointers[e.pointerId]; nPointers = Math.max(0, nPointers - 1); }
  if (nPointers < 2) gesture = null;
}
canvas.addEventListener('pointerup', function (e) {
  var wasDrag = press.moved > 10 || press.multi;
  endPointer(e);
  if (nPointers > 0 || wasDrag) return;
  ray.setFromCamera({ x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
  toWorldLocal();
  act();
});
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', function (e) {
  e.preventDefault();
  if (phase === 'intro') return;
  if (e.ctrlKey) userZoom = Math.max(.35, Math.min(4, userZoom * (1 + e.deltaY * .01)));
  else if (Math.abs(e.deltaX) > .5) {
    pan.x += e.deltaX * panScale() * .9; pan.y -= e.deltaY * panScale() * .9;
  } else userZoom = Math.max(.35, Math.min(4, userZoom * (1 + e.deltaY * .0016)));
}, { passive: false });

/* ─────────────────────────────────────── 음악 */
var bgm = document.getElementById('bgm');
var musicWanted = true, srcOK = false, musicArmed = false;
bgm.volume = .55;
// <source> 를 여러 개 두면 브라우저가 순서대로 시도한다. 어느 하나라도 열리면 여기 걸린다.
bgm.addEventListener('canplay', function () { srcOK = true; setButtons(); });
bgm.addEventListener('error', function () { srcOK = false; setButtons(); }, true);

function playMusic() {
  if (!musicWanted) return;
  var pr = bgm.play();
  if (pr && pr.catch) pr.catch(function () {});   // 자동재생 차단은 조용히 넘긴다
}
// 브라우저는 사용자 동작 뒤에만 소리를 허용한다. 첫 화면의 첫 클릭이 그 동작이다 —
// 시작 버튼까지 기다리지 않고 그때 바로 튼다.
function armMusic() {
  if (musicArmed) return;
  musicArmed = true;
  playMusic();
}
addEventListener('pointerdown', armMusic, true);
addEventListener('keydown', armMusic, true);
playMusic();                                       // 정책이 허용하면 즉시 재생

document.getElementById('mp3').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  bgm.src = URL.createObjectURL(f);
  srcOK = true; musicWanted = true; musicArmed = true;
  playMusic(); setButtons();
});
function setVolume(v) {
  bgm.volume = Math.max(0, Math.min(1, v));
  var el = document.getElementById('vol');
  if (el) el.value = Math.round(bgm.volume * 100);
}
function toggleMusic() {
  if (!bgm.paused) { bgm.pause(); musicWanted = false; setButtons(); return; }
  musicWanted = true; musicArmed = true;
  // 파일을 못 읽은 것과 자동재생이 막힌 것은 다른 문제다. 전자일 때만 고르게 한다.
  if (!srcOK) { document.getElementById('mp3').click(); return; }
  playMusic(); setButtons();
}
document.getElementById('bMusic').onclick = toggleMusic;
document.getElementById('vol').addEventListener('input', function (e) {
  setVolume(e.target.value / 100);
  if (bgm.paused && musicWanted) playMusic();
});

/* ─────────────────────────────────────── 몰입 (visionOS 기준) */
// visionOS 는 레이저를 쥐여 주지 않는다. 꼬집는 순간 그 시점의 시선에서
// transient-pointer 입력이 만들어지고 놓으면 사라진다.
//
// three.js r128 의 renderer.xr.getController(i) 는 입력 소스를 "인덱스" 로
// 붙잡는데, 꼬집을 때마다 생겼다 사라지는 소스에서는 그 인덱스가 유지되지
// 않는다 — 그래서 선택이 아예 안 걸렸다. 세션 이벤트를 직접 받고 XRFrame 에서
// 포즈를 꺼내 쓴다. 이 경로는 컨트롤러·손·시선 모두에서 동일하게 동작한다.
var xrOn = false, xrSession = null, xrAR = false, xrFrame = null;
var grab = null, savedBG = null;
var selecting = [];                       // 지금 꼬집고 있는 입력 소스들
var _m4x = new THREE.Matrix4();

var vrCv = document.createElement('canvas'); vrCv.width = 512; vrCv.height = 256;
var vrTex = new THREE.CanvasTexture(vrCv);
var vrStart = new THREE.Mesh(new THREE.PlaneGeometry(.62, .31),
  new THREE.MeshBasicMaterial({ map: vrTex, transparent: true }));
vrStart.position.set(0, 1.35, -1.0); vrStart.visible = false; scene.add(vrStart);
function drawVRStart() {
  var g = vrCv.getContext('2d');
  g.clearRect(0, 0, 512, 256);
  g.fillStyle = T.panel; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = T.ink; g.lineWidth = 3; g.strokeRect(2, 2, 508, 252);
  g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 62px ui-sans-serif, system-ui, sans-serif';
  g.fillText(t('start'), 256, 128);
  vrTex.needsUpdate = true;
}

/* 3D 설정판 — 몰입 중에는 DOM 이 안 보인다. 보고 꼬집어 누른다. */
var vrPanel = new THREE.Group();
vrPanel.position.set(-.52, 1.16, -.62);
vrPanel.rotation.y = .62;
vrPanel.visible = false; scene.add(vrPanel);
var vrBtns = [];
function makeVRBtn(label, action, w, h) {
  var cv = document.createElement('canvas'); cv.width = 320; cv.height = 84;
  var tex = new THREE.CanvasTexture(cv);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w || .40, h || .105),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.userData = { cv: cv, tex: tex, action: action, label: label, hot: 0 };
  vrPanel.add(m); vrBtns.push(m);
  return m;
}
function drawVRBtn(m) {
  var cv = m.userData.cv, g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = m.userData.hot > 0 ? T.hotPanel : T.panel;
  g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = T.ink; g.lineWidth = m.userData.hot > 0 ? 5 : 2;
  g.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 34px ui-sans-serif, system-ui, sans-serif';
  g.fillText(m.userData.label(), cv.width / 2, cv.height / 2);
  m.userData.tex.needsUpdate = true;
}
function buildVRPanel() {
  var defs = [
    [function () { return t('to2d'); }, function () { if (xrSession) xrSession.end(); }],
    [function () { return t('reset'); }, function () { resetView(); setupBuild(); }],
    [function () { return mode === 'demo' ? t('back') : t('why'); },
     function () { resetView(); if (mode === 'demo') setupBuild(); else setupDemo(); }],
    [function () { return themeName === 'dark' ? t('theme_l') : t('theme_d'); },
     function () { applyTheme(themeName === 'dark' ? 'light' : 'dark'); }],
    [function () { return bgm.paused ? t('music') : t('musicOff'); },
     function () { toggleMusic(); }],
    [function () { return t('vol') + '  −'; }, function () { setVolume(bgm.volume - .12); }],
    [function () { return t('vol') + '  +'; }, function () { setVolume(bgm.volume + .12); }]
  ];
  for (var i = 0; i < defs.length; i++) {
    var m = makeVRBtn(defs[i][0], defs[i][1]);
    m.position.y = (defs.length - 1 - i) * .125;
  }
}
buildVRPanel();
function redrawVRPanel() { for (var i = 0; i < vrBtns.length; i++) drawVRBtn(vrBtns[i]); }

/* 조준 표시 — 어디를 겨눴는지 눈으로 확인되어야 정확히 꼬집을 수 있다 */
var reticle = new THREE.Group();
var retRing = new THREE.Mesh(new THREE.TorusGeometry(.045, .006, 6, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95 }));
var retDot = new THREE.Mesh(new THREE.SphereGeometry(.012, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff }));
reticle.add(retRing); reticle.add(retDot);
reticle.visible = false; scene.add(reticle);
var retLife = 0;
function showReticle(pt) {
  reticle.position.copy(pt);
  reticle.visible = true; retLife = .8;
}
// 컨트롤러(Quest 등)는 손에서 광선이 나가는 것이 자연스럽다. visionOS 의
// transient-pointer 는 꼬집는 순간에만 존재하므로 광선 대신 표적만 남는다.
var rayLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
  new THREE.LineBasicMaterial({ transparent: true, opacity: .5 }));
rayLine.visible = false; scene.add(rayLine);

/* 손 — 패스스루가 없어도 내 손이 보이도록 관절을 직접 그린다 */
var HAND_MAX = 50;
var handMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 8, 6),
  new THREE.MeshStandardMaterial({ transparent: true, opacity: .92, roughness: .35, metalness: .1 }),
  HAND_MAX);
handMesh.frustumCulled = false; handMesh.visible = false; scene.add(handMesh);
var _hm = new THREE.Matrix4(), _hv = new THREE.Vector3();

function poseRay(pose) {
  _m4x.fromArray(pose.transform.matrix);
  ray.ray.origin.setFromMatrixPosition(_m4x);
  ray.ray.direction.set(0, 0, -1).transformDirection(_m4x).normalize();
}
function hitPoint(dist) {
  return ray.ray.origin.clone().add(ray.ray.direction.clone().multiplyScalar(dist));
}
// 마우스 클릭과 같은 처리로 들어간다. 규칙은 여전히 한 곳에만 있다.
function xrPick() {
  if (vrStart.visible) {
    var h0 = ray.intersectObject(vrStart, false);
    if (h0.length) { showReticle(h0[0].point); startGame(); return; }
  }
  if (vrPanel.visible) {
    var h1 = ray.intersectObjects(vrBtns, false);
    if (h1.length) {
      var b = h1[0].object;
      showReticle(h1[0].point);
      b.userData.hot = .35; drawVRBtn(b);
      b.userData.action(); redrawVRPanel();
      return;
    }
  }
  // 구조물은 world 그룹 로컬 좌표계에 있다
  var o = ray.ray.origin.clone(), d = ray.ray.direction.clone();
  toWorldLocal();
  act();
  ray.ray.origin.copy(o); ray.ray.direction.copy(d);
  showReticle(hitPoint(Math.max(.4, world.position.distanceTo(o) )));
}
function onXRSelectStart(e) {
  if (selecting.indexOf(e.inputSource) < 0) selecting.push(e.inputSource);
  if (selecting.length >= 2) return;        // 양손 동시 = 세계를 잡는 동작
  var rs = renderer.xr.getReferenceSpace();
  var pose = e.frame && rs ? e.frame.getPose(e.inputSource.targetRaySpace, rs) : null;
  if (!pose) return;
  poseRay(pose);
  xrPick();
}
function onXRSelectEnd(e) {
  var i = selecting.indexOf(e.inputSource);
  if (i >= 0) selecting.splice(i, 1);
  grab = null;
}

var _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _mid = new THREE.Vector3();
function srcPos(src, rs, out) {
  var sp = src.gripSpace || src.targetRaySpace;
  var pose = xrFrame.getPose(sp, rs);
  if (!pose) return false;
  out.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
  return true;
}
function updateXR(dt) {
  if (!xrFrame || !renderer.xr.isPresenting) { handMesh.visible = false; rayLine.visible = false; return; }
  var rs = renderer.xr.getReferenceSpace();
  var sess = renderer.xr.getSession();
  if (!rs || !sess) return;

  // ── 손 관절
  var n = 0;
  for (var si = 0; si < sess.inputSources.length && n < HAND_MAX; si++) {
    var src = sess.inputSources[si];
    if (!src.hand) continue;
    var joints = [];
    try { src.hand.forEach(function (j) { joints.push(j); }); }
    catch (err) { joints = []; }
    for (var ji = 0; ji < joints.length && n < HAND_MAX; ji++) {
      var jp = null;
      try { jp = xrFrame.getJointPose(joints[ji], rs); } catch (e2) {}
      if (!jp) continue;
      var r = (jp.radius || .008) * 1.15;
      _hm.makeScale(r, r, r);
      _hm.setPosition(jp.transform.position.x, jp.transform.position.y, jp.transform.position.z);
      handMesh.setMatrixAt(n++, _hm);
    }
  }
  handMesh.count = n;
  handMesh.visible = n > 0;
  if (n > 0) {
    handMesh.instanceMatrix.needsUpdate = true;
    handMesh.material.color.setRGB(T.spot[0] * 1.1, T.spot[1] * 1.1, T.spot[2] * 1.1);
    handMesh.material.emissive.setRGB(T.spot[0] * .35, T.spot[1] * .35, T.spot[2] * .35);
  }

  // ── 컨트롤러 광선 (tracked-pointer 만). 시선-꼬집기에는 광선이 없다.
  rayLine.visible = false;
  for (si = 0; si < sess.inputSources.length; si++) {
    var s2 = sess.inputSources[si];
    if (s2.targetRayMode !== 'tracked-pointer' || s2.hand) continue;
    var tp = xrFrame.getPose(s2.targetRaySpace, rs);
    if (!tp) continue;
    _m4x.fromArray(tp.transform.matrix);
    rayLine.position.setFromMatrixPosition(_m4x);
    rayLine.quaternion.setFromRotationMatrix(_m4x);
    rayLine.scale.z = 3;
    rayLine.material.color.setRGB(T.spot[0], T.spot[1], T.spot[2]);
    rayLine.visible = true;
    break;
  }

  // ── 양손을 함께 꼬집으면 세계를 잡는다
  if (selecting.length >= 2 && srcPos(selecting[0], rs, _p0) && srcPos(selecting[1], rs, _p1)) {
    _mid.addVectors(_p0, _p1).multiplyScalar(.5);
    var dist = _p0.distanceTo(_p1);
    var ang = Math.atan2(_p1.x - _p0.x, _p1.z - _p0.z);
    if (!grab) {
      grab = { mid: _mid.clone(), dist: dist, ang: ang,
               wp: world.position.clone(), ws: world.scale.x, wr: world.rotation.y };
    } else {
      world.scale.setScalar(Math.max(.03, Math.min(2, grab.ws * (dist / Math.max(grab.dist, .04)))));
      world.position.copy(grab.wp).add(_mid).sub(grab.mid);
      world.rotation.y = grab.wr - (ang - grab.ang);
    }
  } else grab = null;

  // ── 표적 잔상
  if (retLife > 0) {
    retLife -= dt;
    reticle.visible = retLife > 0;
    reticle.quaternion.copy(camera.quaternion);
    var k = Math.max(0, retLife / .8);
    reticle.scale.setScalar(1 + (1 - k) * 1.6);
    retRing.material.opacity = k * .95;
    retDot.material.opacity = k;
  }
  for (var bi = 0; bi < vrBtns.length; bi++) {
    if (vrBtns[bi].userData.hot > 0) {
      vrBtns[bi].userData.hot -= dt;
      if (vrBtns[bi].userData.hot <= 0) drawVRBtn(vrBtns[bi]);
    }
  }
}

function enterVR() {
  xrOn = true;
  world.scale.setScalar(.22);
  world.position.set(0, .85, -.75);
  world.rotation.set(0, 0, 0);
  if (xrAR) { savedBG = scene.background; scene.background = null; }
  vrStart.visible = (phase === 'intro' && placed >= 3);
  vrPanel.visible = true; redrawVRPanel();
  document.getElementById('bVR').textContent = t('exitVR');
  var sess = renderer.xr.getSession();
  if (sess) {
    sess.addEventListener('selectstart', onXRSelectStart);
    sess.addEventListener('selectend', onXRSelectEnd);
  }
}
function exitVR() {
  xrOn = false; grab = null; selecting = [];
  world.scale.setScalar(1); world.position.set(0, 0, 0); world.rotation.set(0, 0, 0);
  if (xrAR && savedBG !== null) scene.background = savedBG;
  xrAR = false;
  vrStart.visible = false; vrPanel.visible = false;
  handMesh.visible = false; rayLine.visible = false; reticle.visible = false;
  document.getElementById('bVR').textContent = t('enter');
  resize();
}
renderer.xr.addEventListener('sessionstart', enterVR);
renderer.xr.addEventListener('sessionend', exitVR);

function enterImmersive() {
  if (xrSession) { xrSession.end(); return; }
  // 손이 실제로 보이려면 패스스루가 낫다 — immersive-ar 을 먼저 시도한다.
  // 안 되면 immersive-vr 로 가고, 그때는 관절을 직접 그려서 손을 보여 준다.
  navigator.xr.isSessionSupported('immersive-ar').then(function (arOK) {
    xrAR = !!arOK;
    return navigator.xr.requestSession(arOK ? 'immersive-ar' : 'immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'unbounded']
    });
  }).then(function (sess) {
    xrSession = sess;
    sess.addEventListener('end', function () { xrSession = null; });
    try { renderer.xr.setReferenceSpaceType('local-floor'); } catch (e) {}
    return renderer.xr.setSession(sess);
  }).catch(function (err) {
    xrAR = false;
    say('vrfail', null, String(err && err.message || err));
  });
}
(function setupVR() {
  if (!navigator.xr || !navigator.xr.isSessionSupported) return;
  Promise.all([
    navigator.xr.isSessionSupported('immersive-ar').catch(function () { return false; }),
    navigator.xr.isSessionSupported('immersive-vr').catch(function () { return false; })
  ]).then(function (r) {
    if (!r[0] && !r[1]) return;
    document.getElementById('bVR').style.display = '';
    document.getElementById('bStartVR').style.display = '';
    document.getElementById('bVR').onclick = enterImmersive;
    document.getElementById('bStartVR').onclick = enterImmersive;
  });
}());

/* ─────────────────────────────────────── HUD */
var elSay = document.getElementById('say'), curSay = null;
function say(k, k2) {
  curSay = { k: k, k2: k2, a: Array.prototype.slice.call(arguments, 2) };
  renderSay();
}
function renderSay() {
  if (!curSay) return;
  elSay.querySelector('b').textContent = t.apply(null, [curSay.k].concat(curSay.a));
  elSay.querySelector('i').innerHTML = curSay.k2 ? t.apply(null, [curSay.k2].concat(curSay.a)) : '';
}
var tagL = document.createElement('div'); tagL.className = 'tag'; document.body.appendChild(tagL);
var tagR = document.createElement('div'); tagR.className = 'tag'; document.body.appendChild(tagR);
var _proj = new THREE.Vector3();
function placeTag(el, idx, main, sub, cls, dy) {
  if (xrOn || idx < 0 || idx >= P.length) { el.classList.remove('on'); return; }
  _proj.set(P[idx].x, P[idx].y + (dy || .6), P[idx].z).project(camera);
  el.style.left = ((_proj.x * .5 + .5) * innerWidth) + 'px';
  el.style.top = ((-_proj.y * .5 + .5) * innerHeight) + 'px';
  el.className = 'tag on ' + (cls || '');
  el.innerHTML = main + '<small>' + sub + '</small>';
}
var _tv = new THREE.Vector3();
function placeTagAt(el, vec, dy, main, sub) {
  if (xrOn) { el.classList.remove('on'); return; }
  _tv.copy(vec); _tv.y += dy || 0;
  world.updateMatrixWorld();
  _tv.applyMatrix4(world.matrixWorld).project(camera);
  el.style.left = ((_tv.x * .5 + .5) * innerWidth) + 'px';
  el.style.top = ((-_tv.y * .5 + .5) * innerHeight) + 'px';
  el.className = 'tag on';
  el.innerHTML = main + '<small>' + sub + '</small>';
}
function setButtons() {
  var b = document.getElementById('bDemo');
  b.classList.toggle('on', mode === 'demo');
  b.textContent = mode === 'demo' ? t('back') : t('why');
  document.getElementById('hud').style.display = mode === 'build' ? '' : 'none';
  document.getElementById('bMusic').textContent = bgm.paused ? t('music') : t('musicOff');
}
function applyLang() {
  document.documentElement.lang = lang;
  document.getElementById('bLang').textContent = lang === 'ko' ? 'EN' : '한국어';
  var h1 = document.querySelector('#introIn h1');
  if (h1) h1.textContent = STAGE.title || 'Milky-Sticky';
  var st = document.getElementById('introStage');
  if (st) st.textContent = STAGE.id > 1 ? (t('stage') + ' ' + STAGE.id) : '';
  document.getElementById('introSub').textContent = t('sub');
  document.getElementById('introBest').textContent = t('best');
  document.getElementById('bStart').textContent = t('start');
  document.getElementById('bStartVR').textContent = t('startVR');
  document.getElementById('bReset').textContent = t('reset');
  var nb2 = document.getElementById('bNext');
  if (nb2) nb2.textContent = t('nextS');
  document.getElementById('bSpeed').textContent = t('speed') + ' ' + (timeScale === 1 ? '1×' : '0.5×');
  document.getElementById('bTheme').textContent = themeName === 'dark' ? t('theme_l') : t('theme_d');
  document.getElementById('bVR').textContent = xrOn ? t('exitVR') : t('enter');
  document.getElementById('zFit').textContent = t('fit');
  document.getElementById('lHgt').textContent = t('hgt');
  document.getElementById('lWob').textContent = t('wob');
  document.getElementById('lUp').textContent = t('up');
  document.getElementById('lDn').textContent = t('dn');
  document.getElementById('lGc').textContent = t('gc');
  document.getElementById('lLk').textContent = t('links');
  if (phase === 'intro') {
    document.getElementById('introStep').textContent =
      placed < 3 ? t('i_place', 3 - placed) : t('i_done');
  }
  setButtons(); renderSay(); drawVRStart(); redrawVRPanel();
}
document.getElementById('bLang').onclick = function () {
  lang = lang === 'ko' ? 'en' : 'ko'; applyLang();
};
document.getElementById('bStart').onclick = startGame;
var bNext = document.getElementById('bNext');
if (bNext) bNext.onclick = function () { if (STAGE.next) location.href = STAGE.next; };
function resetView() { userZoom = 1; pan.x = pan.y = 0; orbit.yaw = .5; orbit.pitch = .2; }
document.getElementById('bReset').onclick = function () {
  resetView(); if (mode === 'demo') setupDemo(); else setupBuild();
};
document.getElementById('bDemo').onclick = function () {
  resetView(); if (mode === 'demo') setupBuild(); else setupDemo();
};
document.getElementById('bSpeed').onclick = function () {
  timeScale = timeScale < .8 ? 1 : .5;
  document.getElementById('bSpeed').textContent = t('speed') + ' ' + (timeScale === 1 ? '1×' : '0.5×');
};
document.getElementById('bTheme').onclick = function () {
  applyTheme(themeName === 'dark' ? 'light' : 'dark');
};
document.getElementById('zIn').onclick = function () { userZoom = Math.max(.35, userZoom * .8); };
document.getElementById('zOut').onclick = function () { userZoom = Math.min(4, userZoom * 1.25); };
document.getElementById('zFit').onclick = resetView;
function resize() {
  if (xrOn) return;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ─────────────────────────────────────── 루프 */
loadArchive(); buildArchMeshes();
applyTheme(themeName);
setupIntro();
applyLang();
var last = performance.now(), reanalyze = 0;

renderer.setAnimationLoop(function (now, frame) {
  xrFrame = frame || null;
  now = now || performance.now();
  // XR 세션이 시작되면 이 콜백의 시간 기준이 performance.now() 와 달라져
  // now < last 가 될 수 있다. 아래쪽을 안 막으면 dt 가 큰 음수가 되고
  // GRAV*dt*dt 가 폭발해 구조가 한 프레임에 바닥으로 처박힌다.
  var raw = Math.max(0, Math.min((now - last) / 1000, .033)); last = now;
  var tm = now / 1000;
  for (var k = 0; k < 2; k++) step(raw * timeScale / 2);

  if (mode === 'demo') {
    var lp = P[demo.left];
    placeTag(tagL, demo.left, t('t_two'), t('t_two2'));
    placeTag(tagR, demo.right, t('t_three'), t('t_three2'));
    if (lp && lp.y < .5 && !demo.said) { demo.said = true; say('d_fell', 'd_fell2'); }
  } else if (phase === 'play') {
    if (game.active >= 0) {
      placeTag(tagL, game.active, t('t_prop'), t('t_prop2', stickCount(game.active)), 'call', .55);
      tagR.classList.remove('on');
      var ap = P[game.active];
      if (isLocked(game.active)) {
        game.active = -1; analyze(); computeSpots();
        if (maxY() >= GOAL_Y && flowState.up >= GOAL_UP && !game.won) {
          game.won = true;
          say('b_win', 'b_win2', maxY().toFixed(1), flowState.up.toFixed(2), S.length);
          archiveCurrent();
          if (STAGE.next) {                       // 다음 스테이지로 넘어갈 문을 연다
            var nb = document.getElementById('bNext');
            if (nb) { nb.textContent = t('nextS'); nb.style.display = ''; }
          }
        } else if (!spots.length) say('b_dead', 'b_dead2');
        else if (maxY() >= GOAL_Y) say('b_thin', 'b_thin2', flowState.groundContacts);
        else if (linksLeft <= 0) say('out', 'out2');
        else if (!flowState.linked && maxY() > 1.4) say('nofl', 'nofl2');
        else say('b_lock', 'b_lock2');
      } else if (ap.y < .3) {
        var dead = game.active;
        S = S.filter(function (s) { return s.a !== dead && s.b !== dead; });
        P.splice(dead, 1);
        S.forEach(function (s) { if (s.a > dead) s.a--; if (s.b > dead) s.b--; });
        game.active = -1; analyze(); computeSpots();
        say('b_drop', 'b_drop2');
      }
    } else { tagL.classList.remove('on'); tagR.classList.remove('on'); }
    goalRing.position.y = GOAL_Y;
    reanalyze += raw;
    if (reanalyze > .25) { reanalyze = 0; analyze(); }
  } else { tagL.classList.remove('on'); tagR.classList.remove('on'); }

  syncParticles(raw * timeScale);
  syncArchive(tm, raw);
  if (mode === 'build' && phase === 'play' && archSel >= 0 && archSel < archMeshes.length) {
    var ar = archMeshes[archSel].userData.rec;
    placeTagAt(tagR, archMeshes[archSel].position, 1.15,
      t('hgt') + ' ' + ar.h,
      t('up') + ' ' + ar.up + ' · ' + t('gc') + ' ' + ar.gc + ' · ' + ar.n);
  }

  var h = maxY(), w = avgWobble();
  document.getElementById('hgt').textContent = h.toFixed(2);
  document.getElementById('hgtBar').style.width = Math.min(100, h / GOAL_Y * 100) + '%';
  document.getElementById('wob').textContent = w.toFixed(4);
  document.getElementById('wobBar').style.width = Math.min(100, w * 2400) + '%';
  document.getElementById('fUp').textContent = flowState.up.toFixed(2);
  document.getElementById('fUpBar').style.width = Math.min(100, flowState.up / GOAL_UP * 100) + '%';
  document.getElementById('fDn').textContent = flowState.down.toFixed(2);
  document.getElementById('fDnBar').style.width = Math.min(100, flowState.down / 1.4 * 100) + '%';
  document.getElementById('gc').textContent = flowState.groundContacts;
  document.getElementById('lk').textContent = Math.max(0, linksLeft);

  if (stars) stars.rotation.y = tm * .006;
  if (neb) neb.rotation.y = -tm * .003;
  if (xrOn) updateXR(raw);
  else { autoFrame(); placeCamera(raw); }
  syncMeshes(tm);
  renderer.render(scene, camera);
});
