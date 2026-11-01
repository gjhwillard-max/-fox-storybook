// Ink-and-wash visitors in the original drawing's 500 × 539 working coordinates.
function createWildlife(scene) {
  const ns = 'http://www.w3.org/2000/svg';
  function group(parent, tag='g') {
    const el = document.createElementNS(ns,tag);
    parent.appendChild(el);
    return el;
  }
  const art = group(scene,'svg');
  art.id='wildlife';
  art.setAttribute('viewBox','0 0 500 539');
  art.setAttribute('aria-hidden','true');
  art.setAttribute('stroke-linejoin','round');
  art.setAttribute('stroke-linecap','round');

  function ink(g,d,fill,stroke='#52483d',width=.7) {
    const p = group(g,'path');
    for (const [k,v] of Object.entries({d,fill,stroke,'stroke-width':width})) p.setAttribute(k,v);
    return p;
  }
  function bird() {
    const root=group(art), back=group(root);
    ink(back,'M-2 0 Q-9 -6 -12 -16 Q-8 -15 -4 -10 L-5 -13 Q1 -8 4 -1Z','#827863');
    ink(root,'M-5 1 L-17 -2 L-14 1 L-17 1 L-8 5 Q-3 8 4 5 Q8 4 10 0 Q9 -6 5 -5 Q2 -5 1 -2Z','#9f896b');
    ink(root,'M-6 4 Q1 7 6 1 Q8 -1 9 0 Q7 7 -1 6Z','#d2b798','none');
    ink(root,'M9 -2 L14 -1 L9 .4Z','#81624a');
    ink(root,'M6.8 -2.8 l.55 .12','none','#3f392f',1.25);
    const wing=group(root);
    ink(wing,'M3 0 C-1 -2 -5 -9 -13 -12 Q-12 -9 -9 -6 L-13 -8 Q-11 -4 -7 -2 L-10 -3 Q-7 2 -2 3 Q2 4 3 0Z','#88785f');
    ink(wing,'M-10 -9 Q-6 -6 -3 -2 M-8 -5 Q-4 -2 -1 -1','none','#66594a',.55);
    ink(wing,'M-5 -4 Q-2 -3 0 -1','none','#b29d7c',1);
    return {root,back,wing};
  }
  function butterfly(ochre) {
    const root=group(art);
    const wings=[-1,1].map(side=>{
      const pivot=group(root), shape=group(pivot);
      shape.setAttribute('transform','scale('+side+' 1)');
      ink(shape,'M0 1 Q2 -4 8 -8 Q12 -10 11 -6 Q11 -1 6 1 Q10 1 8 5 Q5 8 2 4Z',ochre?'#c08d51':'#819b9b');
      ink(shape,'M1 1 Q5 -4 9 -6 M2 2 Q5 1 7 3','none',ochre?'#8e6a47':'#5b7374',.55);
      ink(shape,'M8 -5 l1 -.7 M6 -3 l.7 -.4','none','#d9ca9e',1.15);
      return pivot;
    });
    ink(root,'M0 3 Q-.5 0 0 -3 M0 -2 Q-1 -4 -2 -4 M0 -2 Q1 -4 2 -4','none','#574d3f',.85);
    return {root,wings};
  }
  const birds=[bird(),bird()];
  const butterflies=[butterfly(false),butterfly(true)];
  const leaves=Array.from({length:6},(_,i)=>{
    const leaf=group(art);
    ink(leaf,'M-6 1 Q-3 -4 0 -3 L1 -4 Q4 -4 7 -2 Q5 2 1 3 Q-3 4 -6 1Z',['#ad875c','#a49568','#b27853'][i%3]);
    ink(leaf,'M-8 2 Q-2 1 5 -2 M-1 0 L0 -2','none','#71674b',.6);
    return leaf;
  });
  const sin=Math.sin, cos=Math.cos, pi=Math.PI;
  function move(el,tx,ty,angle,sx,sy=sx) {
    el.setAttribute('transform',`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
  }
  return function paint(t,lookX,lookY,power) {
    birds.forEach(({root,back,wing},i)=>{
      const phase=(t+(i?12:1.1))%(i?29:23), duration=i?7.8:6.9;
      root.style.display=phase<duration?'':'none';
      if (phase>=duration) return;
      const u=phase/duration, near=u*u, dir=i?-1:1;
      const dx=dir*(48*u+245*near), dy=-46*sin(pi*u)+85*near;
      const flap=sin(phase*20+i), glide=Math.max(0,Math.min(1,1.3+1.6*cos(phase*2.1)));
      const size=.27+1.68*near;
      const cx=(i?281:296)+dx+lookX*(near-.3)*12*power;
      const cy=(i?200:155)+dy+2*flap*glide*size+lookY*(near-.3)*8*power;
      move(root,cx,cy,dir*(-12*cos(pi*u)+6),dir*size,size);
      root.setAttribute('opacity',Math.min(1,u*12)*(.68+.32*u));
      move(wing,0,0,-9+9*flap,.98,.34+.8*flap*glide);
      move(back,0,0,6-7*flap,.9,.45+.68*sin(phase*20+i-.32)*glide);
    });
    butterflies.forEach(({root,wings},i)=>{
      const a=t*(i?.64:.82)+i*3, flutter=.19+.81*(.5+.5*cos(12.5*t+i+sin(a)));
      const cx=(i?132:317)+35*sin(a)+9*sin(2.1*a)+lookX*(i?5:2)*power;
      const cy=(i?389:260)+13*sin(a*1.53)+3*cos(a*3)+lookY*(i?4:2)*power;
      move(root,cx,cy,10+21*cos(a),i?.79:.57);
      wings[0].setAttribute('transform',`scale(${flutter} 1)`);
      wings[1].setAttribute('transform',`scale(${.12+.78*flutter} 1)`);
    });
    leaves.forEach((leaf,i)=>{
      const period=14+i*1.7, u=((t+i*4.3)%period)/period;
      const sw=t*(.94+i*.055)+i, depth=.26+(i%4)*.17+.33*u;
      const cx=42+(i*87)%430+25*sin(sw)+35*u+lookX*(depth-.4)*12*power;
      const cy=-12+565*u+4*sin(sw*2)+lookY*(depth-.4)*7*power;
      move(leaf,cx,cy,42*sin(sw)+i*53,depth*(.2+.8*Math.abs(cos(sw))),depth);
    });
  };
}
