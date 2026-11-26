'use strict';
const {islas, tecnologias, github, email, linkedin} = window.PORTAFOLIO;
const {nodes, edges, edgeId, distance, route, step} = window.AVENTURA;
const $ = (selector) => document.querySelector(selector);
const make = (tag, cls, value) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (value != null) el.textContent = value;
  return el;
};
const svg = (tag, attrs) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key,val] of Object.entries(attrs)) el.setAttribute(key,val);
  return el;
};

const stateKey = 'celeste.progreso.v2';
let unlocked = new Set(), opened = false;
try {
  const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
  unlocked = new Set((Array.isArray(saved.seen) ? saved.seen : []).filter(id => Object.hasOwn(islas,id)));
  opened = Boolean(saved.opened);
} catch {}
function save() {
  try { localStorage.setItem(stateKey, JSON.stringify({seen: [...unlocked], opened})); } catch {}
}
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = $('#zelda'), dialog = $('#island-dialog');
const pins = {}, nav = {}, paths = {}, miniDots = {};
let current = 'inicio', previous = null, destination = null, moving = false, queued = null;
let facing = 1, trigger = null, returningAfterReset = false;
let look = 'away';
let travelMode = 'normal';
const travelFill = $('#travel-fill');
const questLocation = $('#quest-location');
const controlsPanel = $('#game-controls');
const toggleControls = $('#toggle-controls');
const controlsContent = $('#controls-content');
document.querySelectorAll('.hud-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    const content = document.getElementById(toggle.getAttribute('aria-controls'));
    content.hidden = !expanded;
    toggle.closest('.hud').classList.toggle('is-collapsed', !expanded);
  });
});
document.querySelectorAll('.left-rail > .rail-tab, .right-rail > .rail-tab').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const rail = toggle.parentElement;
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    rail.classList.toggle('is-hidden', !expanded);
    const verb = expanded ? 'Ocultar' : 'Ver';
    const label = rail.dataset.label.toLowerCase();
    toggle.querySelector('span:not([aria-hidden="true"])').textContent = `${verb} ${label}`;
    toggle.setAttribute('aria-label', `${verb} ${label}`);
  });
});
const mapToggle = $('.minimap > .rail-tab');
mapToggle.addEventListener('click', () => {
  const expanded = mapToggle.getAttribute('aria-expanded') !== 'true';
  mapToggle.setAttribute('aria-expanded', String(expanded));
  $('.minimap').classList.toggle('is-hidden', !expanded);
    mapToggle.querySelector('span:not([aria-hidden="true"])').textContent = `${expanded ? 'Ocultar' : 'Ver'} mapa`;
    mapToggle.setAttribute('aria-label', `${expanded ? 'Ocultar' : 'Ver'} mapa`);
});
function setControlsExpanded(expanded) {
  toggleControls.setAttribute('aria-expanded', String(expanded));
  toggleControls.setAttribute('aria-label', expanded ? 'Ocultar controles de movimiento' : 'Mostrar controles de movimiento');
  toggleControls.title = expanded ? 'Ocultar controles' : 'Mostrar controles';
  controlsContent.hidden = !expanded;
  controlsPanel.classList.toggle('is-collapsed', !expanded);
  if (!expanded && controlsContent.contains(document.activeElement)) toggleControls.focus();
}
toggleControls.addEventListener('click', () => {
  setControlsExpanded(toggleControls.getAttribute('aria-expanded') !== 'true');
});
const order = ['inicio', ...Object.keys(islas)];
for (const id of order) {
  const button = make('button', '', islas[id]?.titulo || 'Inicio');
  button.type = 'button';
  button.dataset.go = id;
  nav[id] = button;
  $('#destinos').append(button);
  if (!islas[id]) continue;
  const [x,y] = nodes[id];
  const pin = make('button','pin');
  pin.type='button';
  pin.dataset.island=id;
  pin.style.setProperty('--x', x/10 + '%');
  pin.style.setProperty('--y', y/6.25 + '%');
  const icon = make('span','sigil',islas[id].icono);
  icon.setAttribute('aria-hidden','true');
  pin.append(icon,make('span','pin-name',islas[id].titulo));
  pin.addEventListener('click', () => {
    if (current===id && !moving) openIsland(id,pin);
    else travel(id);
  });
  pins[id]=pin;
  $('#pins').append(pin);
}
for (const name of tecnologias) $('#tech-chips').append(make('span','chip',name));

for (const [a,b] of edges) {
  const d='M'+nodes[a].join(' ')+' L'+nodes[b].join(' ');
  const path = svg('path',{d,class:'road'});
  paths[edgeId(a,b)] = path;
  $('#roads').append(path);
  $('#mini-art').append(svg('path',{d,class:'map-trail'}));
}
const islandShape = 'M -58 -7 -49 -25 -31 -28 -19 -41 3 -34 23 -38 38 -26 61 -22 56 2 65 15 40 23 29 39 4 30 -22 39 -32 24 -51 26 -58 10Z';
for (const [index,id] of order.entries()) {
  const [x,y]=nodes[id];
  const lump=svg('path',{d:islandShape,transform:'translate('+x+' '+y+') rotate('+((index*19)%64-31)+')',class:'map-lump'});
  const dot=svg('circle',{cx:x,cy:y,r:12,class:'map-dot'});
  miniDots[id]=dot;
  $('#mini-art').append(lump,dot);
}
const mapPlayer=svg('path',{d:'M 0 -24 L 16 17 L 0 8 L -16 17 Z', id:'map-player'});
$('#mini-art').append(mapPlayer);

function setLook(mode, directionX = 1) {
  look = mode;
  if (mode === 'side' && directionX) facing = directionX >= 0 ? 1 : -1;
  hero.dataset.look = look;
  hero.style.setProperty('--facing', facing);
}

function position(x,y) {
  hero.style.left=x/10+'%';
  hero.style.top=y/6.25+'%';
  hero.style.setProperty('--perspective', String(Math.min(1.12,.35+(y/625)*.79)));
  hero.style.setProperty('--facing',facing);
  hero.dataset.look = look;
  mapPlayer.setAttribute('transform','translate('+x+' '+y+')');
}
function update() {
  for (const id of order) {
    if (current===id && !moving) nav[id].setAttribute('aria-current','true');
    else nav[id].removeAttribute('aria-current');
    if (!pins[id]) continue;
    const ready=current===id && !moving;
    const pin=pins[id];
    pin.classList.toggle('ready',ready);
    pin.classList.toggle('target',destination===id && moving);
    pin.setAttribute('aria-label',(ready?'Abrir ':'Caminar a ')+islas[id].titulo);
    pin.title=ready?'Estás aquí. Abre el santuario.':'Caminar a '+islas[id].titulo;
    if (ready) pin.setAttribute('aria-haspopup','dialog');
    else pin.removeAttribute('aria-haspopup');
    hero.classList.toggle('arrived', ready);
    miniDots[id].classList.toggle('seen',unlocked.has(id));
  }
  $('#interact').disabled=moving || !islas[current];
  questLocation.textContent = 'REGIÓN CELESTE · ' + (moving ? 'EN RUTA' : label(current).toUpperCase());
  $('#tracker').max=Object.keys(islas).length;
  $('#tracker').value=unlocked.size;
  $('#progress-count').textContent=unlocked.size+' / '+Object.keys(islas).length;
  $('#mission-arrive').classList.toggle('done',unlocked.size>0);
  $('#mission-open').classList.toggle('done',opened);
  $('#mission-all').classList.toggle('done',unlocked.size===Object.keys(islas).length);
}
const say = (message) => { if ($('#status').textContent!==message) $('#status').textContent=message; };
function label(id) { return islas[id]?.titulo || (id==='inicio'?'Inicio':'el sendero'); }
function discover(id) {
  if (!returningAfterReset && islas[id] && !unlocked.has(id)) { unlocked.add(id); save(); }
}
function stop() {
  if (current==='inicio') returningAfterReset=false;
  moving=false;
  destination=null;
  travelMode='normal';
  hero.classList.remove('walking');
  if (islas[current]) setLook('front', facing);
  travelFill.style.width = '0%';
  update();
  say(islas[current] ? 'Llegaste a '+label(current)+'. Pulsa la isla iluminada o E.' :
      current==='inicio' ? 'Elige una isla o sigue los senderos con la princesa.' :
      'Estás en el sendero. Sigue con las flechas o elige una isla.');
}
function walk(path) {
  if (path.length<2) {stop();return;}
  moving=true;
  destination=path.at(-1);
  travelMode = destination === 'inicio' ? 'returning' : 'normal';
  hero.classList.add('walking');
  update();
  say('La princesa viaja hacia '+label(destination)+'…');
  let index=0;
  function segment() {
    const a=path[index], b=path[index+1];
    const [x0,y0]=nodes[a], [x1,y1]=nodes[b];
    const pathEl=paths[edgeId(a,b)];
    pathEl.classList.add('live');
    const dx = x1-x0, dy = y1-y0;
    // Regla de viaje:
    // - si está regresando al inicio, TODO el trayecto se muestra de frente.
    // - en viajes normales, al subir se ve de espaldas y al bajar de frente.
    // - solo se usa costado en trayectos casi horizontales que no sean de regreso.
    const mostlyHorizontal = Math.abs(dx) > Math.abs(dy) * 1.35;
    if (travelMode === 'returning') setLook('front', dx || facing);
    else if (dy > 6 && !mostlyHorizontal) setLook('front', dx || facing);
    else if (dy < -6 && !mostlyHorizontal) setLook('away', dx || facing);
    else setLook('side', dx || facing);
    const time=motion.matches?0:Math.max(145,distance(a,b)*3.2);
    let started=null;
    function frame(now) {
      if (started===null) started=now;
      const f=time?Math.min((now-started)/time,1):1;
      position(x0+(x1-x0)*f,y0+(y1-y0)*f);
      travelFill.style.width = ((index+f)/(path.length-1)*100).toFixed(1)+'%';
      if (f<1) { requestAnimationFrame(frame); return; }
      pathEl.classList.remove('live');
      previous=a;
      current=b;
      discover(b);
      update();
      if (queued) {
        const action=queued;
        queued=null;
        moving=false;
        if (action.id) { travel(action.id); return; }
        if (manual(action.dir)) return;
        moving=true;
      }
      if (++index<path.length-1) segment();
      else stop();
    }
    requestAnimationFrame(frame);
  }
  segment();
}
function travel(id) {
  if (!nodes[id] || dialog.open) return;
  if (moving) { queued={id}; return; }
  if (id!=='inicio') returningAfterReset=false;
  if (current===id) { stop(); return; }
  walk(route(current,id));
}
function manual(dir) {
  if (dialog.open) return false;
  if (moving) { if (!queued?.id) queued={dir}; return true; }
  const next=step(current,dir,previous);
  if (!next) return false;
  returningAfterReset=false;
  walk([current,next]);
  return true;
}

function card(data) {
  const element=make('article');
  element.append(make('h3','',data.titulo),make('p','',data.texto));
  if (data.tags?.length) {
    const tags=make('div','tags');
    for (const name of data.tags) tags.append(make('span','chip',name));
    element.append(tags);
  }
  return element;
}
function link(text,url) {
  const el=make('a','modal-link',text);
  el.href=url;
  if (url.startsWith('https:')) {el.target='_blank';el.rel='noopener noreferrer';}
  return el;
}
function show(kicker,title,items,from) {
  if (dialog.open) return;
  trigger=from||document.activeElement;
  $('#dialog-kicker').textContent=kicker;
  $('#dialog-title').textContent=title;
  $('#dialog-body').replaceChildren(...items);
  dialog.showModal();
}
function openIsland(id,from) {
  if (current!==id || moving || !islas[id] || dialog.open) return;
  const data=islas[id];
  const items=[make('p','',data.intro),...data.tarjetas.map(card)];
  if (id==='contacto' || id==='proyectos') items.push(link('Ver GitHub',github));
  if (id==='contacto') items.push(link('Ver LinkedIn',linkedin));
  if (id==='contacto' && email.trim()) items.push(link('Escribir por correo','mailto:'+email.trim()));
  opened=true;
  save();
  update();
  show(data.lugar,data.titulo,items,from);
}
function openHelp() {
  const items=make('ol');
  for (const phrase of [
    'Usa WASD, las flechas o los controles táctiles para moverte por los senderos.',
    'También puedes elegir una isla en el mapa o en el menú. La princesa caminará hasta ella.',
    'Al llegar, el marcador de la isla se ilumina. Púlsalo o usa E para leer su información.',
    'Puedes cerrar la ventana con Esc o con el botón de cierre.'
  ]) items.append(make('li','',phrase));
  const reset=make('button','modal-link','Reiniciar descubrimientos');
  reset.type='button';
  reset.addEventListener('click',()=>{
    unlocked=new Set();
    returningAfterReset=true;
    opened=false;
    save();
    update();
    dialog.close();
    travel('inicio');
  });
  show('DIARIO DE EXPLORACIÓN','Cómo jugar',[items, reset],$('#ayuda'));
}
document.addEventListener('click',event=>{
  const el=event.target.closest('button');
  if (!el) return;
  if (el.dataset.go) travel(el.dataset.go);
  if (el.dataset.step) manual(el.dataset.step);
});
$('#ayuda').addEventListener('click',openHelp);
$('#interact').addEventListener('click',()=>openIsland(current,$('#interact')));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{
  if (e.target!==dialog) return;
  const {left,top,right,bottom}=dialog.getBoundingClientRect();
  if (e.clientX<left||e.clientX>right||e.clientY<top||e.clientY>bottom) dialog.close();
});
dialog.addEventListener('close',()=>{
  if (trigger instanceof HTMLElement && !trigger.matches(':disabled')) trigger.focus({preventScroll:true});
});
const keys={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
document.addEventListener('keydown',e=>{
  if (dialog.open || e.altKey || e.ctrlKey || e.metaKey || e.target.matches('input,textarea,select,[contenteditable]')) return;
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if (keys[key]) { e.preventDefault(); manual(keys[key]); }
  if (key==='e' && !e.repeat && islas[current] && !moving) { e.preventDefault();openIsland(current,pins[current]); }
});
position(...nodes.inicio);
hero.dataset.look='away';
update();
