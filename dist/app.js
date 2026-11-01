'use strict';
const scene = document.querySelector('#scene');
const canvas = document.querySelector('#woodland');
const painting = document.querySelector('#painting');
const strength = document.querySelector('#strength');
const tilt = document.querySelector('#tilt');
const message = document.querySelector('#status');
const paintWildlife = createWildlife(scene);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.max(-1, Math.min(1, value));
let mode, draw, frameId = 0, last = 0, elapsed = 0;
let x = 0, y = 0, aimX = 0, aimY = 0, visible = true;
let tiltOn = false, neutral = null, finger = null;

const vertex = `
attribute vec2 corner;
attribute vec3 material;
varying vec2 uv;
uniform vec2 gaze;
uniform float t, amount, alive;
float oval(vec2 p, vec2 centre, vec2 radius) {
  vec2 q = (p-centre)/radius;
  return exp(-dot(q,q)*2.);
}
void main() {
  vec2 p = corner;
  uv = p;
  vec3 region = material;
  // Continuous sampling keeps ink and paper together across overlapping silhouettes.
  vec2 travel = gaze + alive * vec2(.25*sin(t*.41), .16*sin(t*.31));
  vec2 offset = travel * (region.r-.44) * vec2(.062,.043);
  float gust = sin(t*1.21 + p.y*7. - p.x*4.) + .38*sin(t*2.37+p.x*10.);
  vec2 wind = region.g * vec2(.0054*gust,.0019*cos(t*1.21+p.x*5.));
  // Longer grass bends more at the tips; roots and the sleeping fox stay quiet.
  float grass = smoothstep(.63,.79,p.y)*smoothstep(.46,.72,region.g)*(1.-region.b);
  wind += grass * vec2(.0035*gust+.0014*sin(t*1.85-p.x*23.),.0009*cos(t*1.21-p.x*8.));
  float breath = .5-.5*cos(t*1.39);
  vec2 animal = vec2(0.,-.0055*breath*oval(p,vec2(.588,.753),vec2(.12,.08)));
  float beat = mod(t+2.,12.);
  float flick = exp(-18.*(beat-4.)*(beat-4.))*sin((beat-4.)*13.);
  animal.x += .009*flick*oval(p,vec2(.469,.716),vec2(.039,.052));
  animal.y += .006*sin(t*.83)*oval(p,vec2(.676,.899),vec2(.055,.056));
  offset += alive*(wind + region.b*animal);
  // Anchor the outside edge to the frame so extreme drags always show painted pixels.
  vec2 rim = smoothstep(vec2(0.),vec2(.077),min(p,1.-p));
  vec2 pos = p + rim*offset*amount;
  gl_Position = vec4(pos.x*2.-1.,1.-pos.y*2.,0.,1.);
}`;
const fragment = `
precision mediump float;
varying vec2 uv;
uniform sampler2D paper;
void main() {
  gl_FragColor = texture2D(paper,uv);
}`;

async function makeRenderer() {
  const gl = canvas.getContext('webgl',{alpha:false,antialias:false,depth:false});
  if (!gl) return;
  const relief = new Image();
  relief.src = canvas.dataset.field;
  await Promise.all([painting.decode(), relief.decode()]);
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  // Neighbouring triangles share vertices. The whole painted surface moves as one sheet.
  const cols=100, rows=108;
  const sampler=document.createElement('canvas');
  sampler.width=cols+1; sampler.height=rows+1;
  const ctx=sampler.getContext('2d');
  ctx.drawImage(relief,0,0,sampler.width,sampler.height);
  const pixels=ctx.getImageData(0,0,sampler.width,sampler.height).data;
  const vertices=[], indices=[];
  for (let j=0;j<=rows;j++) for (let i=0;i<=cols;i++) {
    const n=j*(cols+1)+i;
    vertices.push(i/cols,j/rows,...[0,1,2].map(k=>pixels[n*4+k]/255));
    if (i<cols && j<rows) indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  for (const [name,size,offset] of [['corner',2,0],['material',3,8]]) {
    const attr=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr,size,gl.FLOAT,false,20,offset);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const loc = name => gl.getUniformLocation(program,name);
  {
    gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
    for (const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
    for (const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,painting);
    gl.uniform1i(loc('paper'),0);
  }
  const gaze = loc('gaze'), time = loc('t'), amount = loc('amount'), alive = loc('alive');
  draw = power => {
    const ratio = Math.min(devicePixelRatio || 1,2,1320/Math.max(1,scene.clientWidth));
    const w = Math.max(1,Math.round(scene.clientWidth*ratio)), h = Math.max(1,Math.round(scene.clientHeight*ratio));
    if (canvas.width!==w || canvas.height!==h) { canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,w,h);
    gl.uniform2f(gaze,x,y);
    gl.uniform1f(time,elapsed);
    gl.uniform1f(amount,power);
    gl.uniform1f(alive,mode==='alive' ? 1 : 0);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  };
  painting.style.transform='';
  wake();
}
function wake() {
  if (!frameId && visible && !document.hidden && mode!=='still') frameId=requestAnimationFrame(frame);
}
function frame(now) {
  frameId=0;
  if (!visible || document.hidden || mode==='still') { last=0; return; }
  const dt=Math.min((now-last)/1000 || .016,.05);
  last=now; elapsed+=dt;
  const ease=1-Math.exp(-11*dt);
  x+=(aimX-x)*ease; y+=(aimY-y)*ease;
  const power=Number(strength.value)/100;
  if (draw) { draw(power); canvas.hidden=false; }
  else {
    const idle=mode==='alive' ? Math.sin(elapsed*.5)*.3 : 0;
    painting.style.transform='translate('+((x+idle)*1.1*power)+'%,'+(y*.85*power)+'%) scale('+(1+.034*power)+')';
  }
  if (mode==='alive') paintWildlife(elapsed,x,y,power);
  if (mode==='alive' || Math.abs(aimX-x)+Math.abs(aimY-y)>.0005) wake();
}
function target(a,b) { aimX=clamp(a); aimY=clamp(b); wake(); }
function select(next) {
  mode=scene.dataset.mode=next;
  for (const button of document.querySelectorAll('button[data-mode]')) button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  message.textContent={still:'Original composition. Every detail at rest.',parallax:'Drag across the drawing, move your cursor, or use the arrow keys.',alive:'The canopy stirs and the fox dreams. Drag across the glade to explore.'}[mode];
  if (mode==='still') {
    x=y=aimX=aimY=0; neutral=null; canvas.hidden=true; painting.style.transform='';
  }
  wake();
}
for (const button of document.querySelectorAll('button[data-mode]')) button.onclick=()=>select(button.dataset.mode);
scene.onpointerdown=e=>{
  if (e.pointerType==='mouse' || mode==='still') return;
  finger={id:e.pointerId,x:e.clientX,y:e.clientY};
  scene.setPointerCapture(e.pointerId);
};
scene.onpointermove=e=>{
  if (mode==='still') return;
  if (finger && finger.id===e.pointerId) target((e.clientX-finger.x)/65,(e.clientY-finger.y)/65);
  else if (e.pointerType==='mouse') {
    const r=scene.getBoundingClientRect();
    target(2*(e.clientX-r.left)/r.width-1,2*(e.clientY-r.top)/r.height-1);
  }
};
scene.onpointerleave=()=>{ if (!finger) target(0,0); };
scene.onlostpointercapture=()=>{ finger=null; target(0,0); };
scene.onblur=()=>target(0,0);
scene.onkeydown=e=>{
  if (e.key==='Escape') return select('still');
  const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if (mode!=='still' && arrows[e.key]) { e.preventDefault(); target(...arrows[e.key]); }
};
function orientation(e) {
  if (mode==='still' || finger || e.beta==null || e.gamma==null) return;
  if (!neutral) neutral={b:e.beta,g:e.gamma};
  target((e.gamma-neutral.g)/20,(e.beta-neutral.b)/20);
}
tilt.onclick=async()=>{
  if (tiltOn) {
    window.removeEventListener('deviceorientation',orientation);
    tiltOn=false; neutral=null; target(0,0); tilt.textContent='Enable device tilt ↗'; return;
  }
  try {
    const sensor=window.DeviceOrientationEvent;
    if (!sensor || !window.isSecureContext || (sensor.requestPermission && await sensor.requestPermission()!=='granted')) throw Error();
    if (mode==='still') select('parallax');
    window.addEventListener('deviceorientation',orientation);
    tiltOn=true; neutral=null; tilt.textContent='Disable device tilt ↙';
    message.textContent='Hold comfortably, then tilt gently.';
  } catch { message.textContent='Tilt is unavailable. Drag sideways across the drawing instead.'; }
};
const particles=document.querySelector('#particles');
for (let i=0;i<28;i++) {
  const p=document.createElement('i');
  p.className='particle '+(i<7 ? '' : i%3 ? 'dust' : 'spore');
  p.style.cssText='left:'+(8+i*37%85)+'%;top:'+(8+i*23%83)+'%;--duration:'+(5+i%9)+'s;--delay:-'+(i*1.71)+'s';
  particles.append(p);
}
document.querySelector('#motes').onchange=e=>particles.classList.toggle('off',!e.target.checked);
strength.oninput=wake;
window.addEventListener('resize',wake);
document.addEventListener('visibilitychange',()=>{ last=0; neutral=null; wake(); });
new IntersectionObserver(entries=>{ visible=entries[0].isIntersecting; wake(); }).observe(scene);
reduce.addEventListener('change',()=>select(reduce.matches?'still':'alive'));
canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); draw=null; canvas.hidden=true; wake(); });
function initialise() { makeRenderer().catch(error=>console.warn('Using illustrated motion fallback',error)); }
canvas.addEventListener('webglcontextrestored',initialise);
select(reduce.matches?'still':'alive');
initialise();
