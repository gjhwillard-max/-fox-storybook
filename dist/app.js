'use strict';
const scene=document.querySelector('#scene'), layers=[...document.querySelectorAll('.layer')], status=document.querySelector('#status'), strength=document.querySelector('#strength'), tilt=document.querySelector('#tilt');
let mode='alive', target={x:0,y:0}, current={x:0,y:0}, raf=0, tiltActive=false, neutral=null;
const clamp=v=>Math.max(-1,Math.min(1,v));
function frame(){raf=0;current.x+=(target.x-current.x)*.28;current.y+=(target.y-current.y)*.28;const scale=(scene.clientWidth/400)*Number(strength.value)/100*12;layers.forEach(l=>{const d=Number(l.dataset.depth)*scale;l.style.transform=`translate(${current.x*d}px,${current.y*d}px)`});if(Math.abs(target.x-current.x)+Math.abs(target.y-current.y)>.001)raf=requestAnimationFrame(frame)}
function setTarget(x,y){target={x:clamp(x),y:clamp(y)};if(!raf)raf=requestAnimationFrame(frame)}
function select(next){mode=next;scene.dataset.mode=next;document.querySelectorAll('[data-mode]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.mode===next))});status.textContent={still:'Original composition. Every detail at rest.',parallax:'Move your cursor, or use the arrow keys on the artwork.',alive:'A sleeping breath. An ear twitch. A little woodland light.'}[next];if(next==='still'){if(raf)cancelAnimationFrame(raf);raf=0;target={x:0,y:0};current={x:0,y:0};layers.forEach(l=>l.style.transform='none');neutral=null}}
document.querySelectorAll('button[data-mode]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
scene.addEventListener('pointermove',e=>{if(mode==='still'||e.pointerType==='touch')return;const r=scene.getBoundingClientRect();setTarget(2*(e.clientX-r.left)/r.width-1,2*(e.clientY-r.top)/r.height-1)});
let touchStart=null;
scene.addEventListener('touchstart',e=>{if(mode==='still'||!e.touches.length)return;const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
scene.addEventListener('touchmove',e=>{if(mode==='still'||!touchStart||!e.touches.length)return;const t=e.touches[0];const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;if(Math.abs(dx)>7||Math.abs(dy)>7){if(e.cancelable)e.preventDefault();setTarget(dx/35,dy/35)}},{passive:false});
scene.addEventListener('touchend',()=>{touchStart=null;setTarget(0,0)},{passive:true});
scene.addEventListener('touchcancel',()=>{touchStart=null;setTarget(0,0)},{passive:true});
scene.addEventListener('pointerleave',()=>setTarget(0,0));scene.addEventListener('blur',()=>setTarget(0,0));
scene.addEventListener('keydown',e=>{if(e.key==='Escape'){select('still');return}if(mode==='still')return;const moves={ArrowLeft:[-.6,0],ArrowRight:[.6,0],ArrowUp:[0,-.6],ArrowDown:[0,.6]};if(moves[e.key]){e.preventDefault();setTarget(...moves[e.key])}});
strength.addEventListener('input',()=>{if(!raf)raf=requestAnimationFrame(frame)});
const particles=document.querySelector('#particles');for(let i=0;i<21;i++){const p=document.createElement('i');p.className='particle'+(i>6?' dust':'');p.style.cssText=`left:${13+(i*37%76)}%;top:${12+(i*23%72)}%;--duration:${6+i%7}s;--delay:-${i*1.7}s`;particles.appendChild(p)}document.querySelector('#motes').addEventListener('change',e=>particles.classList.toggle('off',!e.target.checked));
function orientation(e){if(!tiltActive||mode==='still'||e.beta===null||e.gamma===null)return;if(!neutral)neutral={b:e.beta,g:e.gamma};setTarget((e.gamma-neutral.g)/20,(e.beta-neutral.b)/20)}
tilt.addEventListener('click',async()=>{if(tiltActive){tiltActive=false;neutral=null;tilt.textContent='Enable device tilt ↗';setTarget(0,0);return}try{if(!window.isSecureContext){status.textContent='Device tilt needs HTTPS or localhost. Cursor and arrow keys still work.';return}if(!window.DeviceOrientationEvent){status.textContent='This device does not provide tilt. Try cursor or arrow keys.';return}if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){status.textContent='Tilt permission was not granted. Cursor controls remain available.';return}tiltActive=true;neutral=null;window.addEventListener('deviceorientation',orientation);if(mode==='still')select('parallax');tilt.textContent='Disable device tilt ↙';status.textContent='Hold comfortably, then tilt gently. The first reading sets the centre.'}catch(e){status.textContent='Tilt is unavailable here. Cursor and arrow keys still work.'}});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('hidden',document.hidden);if(document.hidden){setTarget(0,0);neutral=null}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)select('still')});

if(matchMedia('(prefers-reduced-motion: reduce)').matches)select('still');else select('alive');
