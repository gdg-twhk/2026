// Drive the word ticker directly so CSS motion preferences cannot stop it.
(()=>{
 const track=document.querySelector('.ticker>div');
 if(!track)return;
 const original=track.innerHTML;
 const copy=document.createElement('span');
 copy.style.margin='0';
 copy.innerHTML=original+'&nbsp;';
 track.replaceChildren(copy,copy.cloneNode(true));
 track.style.setProperty('animation','none','important');
 let offset=0,previous=0;
 function animate(now){
  const elapsed=previous?Math.min(now-previous,64):0;
  previous=now;
  const distance=copy.getBoundingClientRect().width;
  if(distance>0){offset=(offset+elapsed*.028)%distance;track.style.transform=`translate3d(${-offset}px,0,0)`;}
  requestAnimationFrame(animate);
 }
 document.addEventListener('visibilitychange',()=>{previous=0});
 requestAnimationFrame(animate);
})();
const menu=document.querySelector('.menu'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'關閉選單':'開啟選單');menu.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','開啟選單');menu.textContent='☰'}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))menu.click()});
const tracks={ai:{n:'01',title:'讓想像，<br>有實作的可能。',copy:'從生成式 AI 到機器學習應用，探索模型如何走進開發流程，讓你的下一個點子找到起點。',image:'braces',alt:'程式大括號貼紙',code:'Hello, possibilities.',color:'#c3ecf6'},cloud:{n:'02',title:'把想法，<br>帶到更大的世界。',copy:'探索雲端架構與基礎設施，從部署服務到維運，思考如何讓應用程式穩定成長。',image:'hash',alt:'井字號貼紙',code:'Build. Deploy. Grow.',color:'#ccf6c5'},web:{n:'03',title:'每一個介面，<br>都是新的連結。',copy:'從瀏覽器到行動裝置，一起探索開發工具、效能與使用體驗，讓好的點子被更多人使用。',image:'slashes',alt:'程式斜線貼紙',code:'Create something people love.',color:'#f8d8d8'},community:{n:'04',title:'你的下一步，<br>有人一起走。',copy:'交流職涯經驗、開源協作與社群故事，在技術之外，找到能一起學習的夥伴。',image:'pink',alt:'相向角括號貼紙',code:'Better, together.',color:'#ffe7a5'}};
document.querySelectorAll('[data-track]').forEach(button=>button.addEventListener('click',()=>{const t=tracks[button.dataset.track];document.querySelectorAll('[data-track]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelector('#track-number').textContent='EXPLORE / '+t.n;document.querySelector('#track-title').innerHTML=t.title;document.querySelector('#track-copy').textContent=t.copy;const img=document.querySelector('#track-image');img.src='assets/'+t.image+'.png';img.alt=t.alt;document.querySelector('#track-code').textContent=t.code;document.querySelector('.track-feature').style.background=t.color;button.style.background=t.color;document.querySelectorAll('[data-track]').forEach(b=>{if(b!==button)b.style.background=''})}));
// Pointer and keyboard controls share the same bounded sticker state.
const wall=document.querySelector('.sticker-wall');
const hint=wall.querySelector('.wall-label');
const gravityButton=wall.querySelector('.gravity');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const stickerNames=['箭頭','斜線','大括號','角括號','井字號','乘號'];
let pieces=[],gravity=false,frame=0,lastTime=0,zIndex=1,active=null,moves=0,tipTimer;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function say(text){clearTimeout(tipTimer);hint.textContent=text;tipTimer=setTimeout(()=>{hint.textContent=gravity?'拖起來，試著丟出去！':'拖動貼紙 · 點一下旋轉'},3500)}
function paint(p){p.el.style.transform=`translate(${p.x}px,${p.y}px) rotate(${p.angle}deg)`;}
function bounds(p){return {left:8,top:46,right:Math.max(8,wall.clientWidth-p.w-8),bottom:Math.max(46,wall.clientHeight-p.h-38)}}
function contain(p){const b=bounds(p);p.x=clamp(p.x,b.left,b.right);p.y=clamp(p.y,b.top,b.bottom)}
function pop(x,y){if(reducedMotion.matches)return;['+','{ }','✳︎'].forEach((text,i)=>{const el=document.createElement('span');el.className='play-pop';el.textContent=text;el.style.left=(x+i*13-12)+'px';el.style.top=(y+i*5)+'px';el.style.setProperty('--dx',(i-1)*30+'px');wall.append(el);setTimeout(()=>el.remove(),750)})}
function resetPieces(){if(active)finishDrag(null,true);pieces.forEach(p=>{p.el.style.left='';p.el.style.top='';p.el.style.right='';p.el.style.bottom='';p.el.style.transform='';p.el.style.zIndex=''});pieces=Array.from(wall.querySelectorAll('.sticker')).map((el,i)=>{const p={el,x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight,angle:[-15,10,-10,9,13,10][i],vx:0,vy:0,spin:0};el.style.left='0';el.style.top='0';el.style.right='auto';el.style.bottom='auto';contain(p);paint(p);return p})}
function tick(time){if(!gravity){frame=0;return}const dt=Math.min((time-lastTime)/16.67||1,2);lastTime=time;for(const p of pieces){if(active?.p===p)continue;p.vy+=.22*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;p.vx*=Math.pow(.995,dt);const b=bounds(p);if(p.x<b.left||p.x>b.right){p.x=clamp(p.x,b.left,b.right);p.vx*=-.7;p.spin*=-.7}if(p.y>b.bottom){p.y=b.bottom;p.vy=-Math.abs(p.vy)*.54;p.vx*=.96;p.spin*=.92;if(Math.abs(p.vy)<.65){p.vy=0;p.spin*=.9}}if(p.y<b.top){p.y=b.top;p.vy=Math.abs(p.vy)*.5}}
// Circular collision bounds keep the irregular glyphs from becoming a pile of overlapping images.
for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i],b=pieces[j];const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2;const distance=Math.hypot(dx,dy)||1,min=(Math.min(a.w,a.h)+Math.min(b.w,b.h))*.34;if(distance<min){const nx=dx/distance,ny=dy/distance,overlap=(min-distance)*.5;if(active?.p!==a){a.x-=nx*overlap;a.y-=ny*overlap}if(active?.p!==b){b.x+=nx*overlap;b.y+=ny*overlap}const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(closing<0){const impulse=-closing*.7;if(active?.p!==a){a.vx-=impulse*nx;a.vy-=impulse*ny}if(active?.p!==b){b.vx+=impulse*nx;b.vy+=impulse*ny}}}}
for(const p of pieces){contain(p);paint(p)}frame=requestAnimationFrame(tick)}
function setGravity(on){gravity=on;gravityButton.setAttribute('aria-pressed',String(on));gravityButton.textContent=on?'↑ 暫停重力':'↓ 重力模式';wall.classList.toggle('is-gravity',on);if(on){pieces.forEach(p=>{p.vx=(Math.random()-.5)*7;p.vy=-Math.random()*4;p.spin=(Math.random()-.5)*2});lastTime=0;if(!frame)frame=requestAnimationFrame(tick);say('放手，讓靈感自由落下。')}else{cancelAnimationFrame(frame);frame=0;say('定格！繼續拼出你的版面。')}}
function finishDrag(e,cancelled=false){if(!active)return;const a=active;active=null;a.p.el.classList.remove('dragging');if(a.p.el.hasPointerCapture(a.id))a.p.el.releasePointerCapture(a.id);if(cancelled){a.p.vx=a.p.vy=0;return}if(a.distance<5){a.p.angle+=30;pop(a.p.x+a.p.w/2,a.p.y+a.p.h/2);say('轉個角度，想法就不一樣。')}else{moves++;say(moves===3?'這張海報，開始有你的樣子了。':gravity?'漂亮的拋接！':'不錯的位置！再試試其他貼紙。')}paint(a.p)}
wall.querySelectorAll('.sticker').forEach((el,i)=>{el.draggable=false;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`移動${stickerNames[i]}貼紙，方向鍵移動，空白鍵旋轉`);el.addEventListener('pointerdown',e=>{if(active||e.button!==0)return;const p=pieces[i];if(!p)return;active={p,id:e.pointerId,startX:e.clientX,startY:e.clientY,x:p.x,y:p.y,lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),distance:0};p.vx=p.vy=0;p.el.style.zIndex=String(++zIndex);p.el.classList.add('dragging');el.setPointerCapture(e.pointerId)});el.addEventListener('pointermove',e=>{const a=active;if(!a||a.id!==e.pointerId||a.p.el!==el)return;const now=performance.now(),dt=Math.max(now-a.lastT,8);a.distance=Math.hypot(e.clientX-a.startX,e.clientY-a.startY);a.p.x=a.x+e.clientX-a.startX;a.p.y=a.y+e.clientY-a.startY;a.p.vx=clamp((e.clientX-a.lastX)*16/dt,-18,18);a.p.vy=clamp((e.clientY-a.lastY)*16/dt,-18,18);a.p.spin=a.p.vx*.12;a.lastX=e.clientX;a.lastY=e.clientY;a.lastT=now;contain(a.p);paint(a.p)});el.addEventListener('pointerup',e=>{if(active?.id===e.pointerId)finishDrag(e)});el.addEventListener('pointercancel',()=>finishDrag(null,true));el.addEventListener('lostpointercapture',()=>{if(active?.p.el===el)finishDrag(null,true)});el.addEventListener('keydown',e=>{const p=pieces[i];if(!p)return;const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'];if(!keys.includes(e.key))return;e.preventDefault();if(e.key===' '||e.key==='Enter'){p.angle+=30;pop(p.x+p.w/2,p.y+p.h/2)}else{const step=e.shiftKey?30:12;if(e.key==='ArrowLeft')p.x-=step;if(e.key==='ArrowRight')p.x+=step;if(e.key==='ArrowUp')p.y-=step;if(e.key==='ArrowDown')p.y+=step}contain(p);paint(p);say('你的版面，你來決定。')})});
gravityButton.addEventListener('click',()=>setGravity(!gravity));
wall.querySelector('.shuffle').addEventListener('click',()=>{setGravity(false);resetPieces();pieces.forEach(p=>{const b=bounds(p);p.x=b.left+Math.random()*(b.right-b.left);p.y=b.top+Math.random()*(b.bottom-b.top);p.angle=(Math.random()-.5)*60;paint(p)});pop(wall.clientWidth/2,wall.clientHeight/2);say('新的排列，新的靈感。')});
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const wasGravity=gravity;if(wasGravity)setGravity(false);resetPieces();if(wasGravity&&!reducedMotion.matches)setGravity(true)},100)}).observe(wall);
window.addEventListener('load',resetPieces,{once:true});resetPieces();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&gravity)setGravity(false)});


// Rotate only while the visitor can see the section and is not interacting.
const exploreSection=document.querySelector('#explore');
const trackButtons=Array.from(exploreSection.querySelectorAll('[data-track]'));
const autoplayButton=exploreSection.querySelector('.track-autoplay');
const trackFeature=exploreSection.querySelector('.track-feature');
let autoplayEnabled=!reducedMotion.matches,trackVisible=false,trackHovered=false,trackFocused=false,trackTimer=0;
function scheduleTrack(){clearTimeout(trackTimer);if(!autoplayEnabled||!trackVisible||trackHovered||trackFocused||document.hidden)return;trackTimer=setTimeout(()=>{trackFeature.setAttribute('aria-live','off');const current=trackButtons.findIndex(b=>b.classList.contains('active'));trackButtons[(current+1)%trackButtons.length].click();scheduleTrack()},5000)}
function updateAutoplay(){autoplayButton.setAttribute('aria-pressed',String(autoplayEnabled));autoplayButton.textContent=autoplayEnabled?'暫停自動切換':'開啟自動切換';scheduleTrack()}
autoplayButton.addEventListener('click',()=>{autoplayEnabled=!autoplayEnabled;updateAutoplay()});
trackButtons.forEach(button=>{button.addEventListener('pointerdown',()=>trackFeature.setAttribute('aria-live','polite'));button.addEventListener('keydown',()=>trackFeature.setAttribute('aria-live','polite'));button.addEventListener('click',scheduleTrack)});
exploreSection.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){trackHovered=true;scheduleTrack()}});
exploreSection.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){trackHovered=false;scheduleTrack()}});
exploreSection.addEventListener('focusin',()=>{trackFocused=true;scheduleTrack()});
exploreSection.addEventListener('focusout',e=>{trackFocused=exploreSection.contains(e.relatedTarget);scheduleTrack()});
new IntersectionObserver(entries=>{trackVisible=entries[0].isIntersecting;scheduleTrack()},{threshold:0.2}).observe(exploreSection);
document.addEventListener('visibilitychange',scheduleTrack);
reducedMotion.addEventListener('change',e=>{if(e.matches){autoplayEnabled=false;updateAutoplay()}});
updateAutoplay();

const photoGallery=document.querySelector('.photo-gallery');
const photoPause=document.querySelector('.gallery-pause');
if(photoGallery&&photoPause){let photosPaused=reducedMotion.matches;function setPhotosPaused(){photoGallery.classList.toggle('is-paused',photosPaused);photoPause.setAttribute('aria-pressed',String(photosPaused));photoPause.textContent=photosPaused?'繼續照片輪播':'暫停照片輪播'}photoPause.addEventListener('click',()=>{photosPaused=!photosPaused;setPhotosPaused()});reducedMotion.addEventListener('change',e=>{if(e.matches){photosPaused=true;setPhotosPaused()}});setPhotosPaused()}
