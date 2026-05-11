const feed = document.querySelector('#feed');
const tabs = document.querySelector('#tabs');
const tpl = document.querySelector('#videoTpl');
const refreshBtn = document.querySelector('#refreshBtn');
const ageGate = document.querySelector('#ageGate');
const enterBtn = document.querySelector('#enterBtn');

let sources = [];
let activeId = '261';
let muted = true;
let observer;
let loadingMore = false;

function acceptedAdult(){ return localStorage.getItem('xh_adult_ok') === '1'; }
function showGate(){ ageGate.classList.toggle('hide', acceptedAdult()); }
enterBtn.onclick = () => { localStorage.setItem('xh_adult_ok','1'); showGate(); resetFeed(); };

async function getSources(){
  const res = await fetch('/api/sources');
  const data = await res.json();
  sources = data.sources || [];
}

function renderTabs(){
  tabs.innerHTML = sources.map(s => `<button data-id="${s.id}" class="${s.id===activeId?'active':''} ${s.adult?'adult':''}">${s.name}</button>`).join('');
  tabs.querySelectorAll('button').forEach(btn=>{
    btn.onclick = () => {
      activeId = btn.dataset.id;
      document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.id===activeId));
      resetFeed();
    };
  });
}

function sourceInfo(id){ return sources.find(s=>s.id===id) || { title:'随机短视频', adult:false }; }

function createCard(index){
  const node = tpl.content.firstElementChild.cloneNode(true);
  const video = node.querySelector('video');
  const title = node.querySelector('h2');
  const desc = node.querySelector('p');
  const like = node.querySelector('.like');
  const replay = node.querySelector('.replay');
  const mute = node.querySelector('.mute');
  const info = sourceInfo(activeId);

  video.src = `/api/video?id=${encodeURIComponent(activeId)}&n=${Date.now()}-${index}-${Math.random()}`;
  video.muted = muted;
  video.controls = false;
  title.textContent = info.title;
  desc.textContent = `${info.adult ? '成人分类 · ' : ''}上滑继续浏览，点击视频播放/暂停。Vercel Serverless 自动解析接口真实地址。`;

  video.addEventListener('canplay', () => node.classList.add('ready'), { once: true });
  video.addEventListener('error', () => { node.classList.add('ready'); desc.textContent = '当前接口临时不可用，点右侧刷新或切换分类。'; });
  video.addEventListener('click', () => video.paused ? video.play().catch(()=>{}) : video.pause());
  like.onclick = () => like.classList.toggle('liked');
  replay.onclick = () => { video.src = `/api/video?id=${encodeURIComponent(activeId)}&n=${Date.now()}-${Math.random()}`; video.play().catch(()=>{}); };
  mute.onclick = () => {
    muted = !muted;
    document.querySelectorAll('video').forEach(v => v.muted = muted);
    document.querySelectorAll('.mute').forEach(b => b.textContent = muted ? '🔇' : '🔊');
  };
  mute.textContent = muted ? '🔇' : '🔊';
  return node;
}

function appendVideos(count=6){
  const start = feed.children.length;
  for(let i=0;i<count;i++) feed.appendChild(createCard(start+i));
  observeVideos();
}

function observeVideos(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const video = entry.target.querySelector('video');
      if(entry.isIntersecting){
        if (acceptedAdult()) video.play().catch(()=>{});
        const idx = [...feed.children].indexOf(entry.target);
        if(idx >= feed.children.length - 2 && !loadingMore){
          loadingMore = true;
          setTimeout(()=>{ appendVideos(4); loadingMore=false; }, 350);
        }
      }else video.pause();
    });
  }, { threshold: 0.72 });
  document.querySelectorAll('.video-card').forEach(card => observer.observe(card));
}

function resetFeed(){
  feed.innerHTML = '';
  appendVideos(7);
  feed.scrollTo({top:0, behavior:'instant'});
}

refreshBtn.onclick = resetFeed;
document.addEventListener('keydown', e=>{
  const cards = [...feed.children];
  const current = cards.find(c => Math.abs(c.getBoundingClientRect().top) < innerHeight * .45);
  if(e.code === 'Space' && current){ e.preventDefault(); const v = current.querySelector('video'); v.paused ? v.play().catch(()=>{}) : v.pause(); }
  if((e.key === 'ArrowDown' || e.key === 'ArrowUp') && current){ const idx = cards.indexOf(current) + (e.key === 'ArrowDown' ? 1 : -1); if(cards[idx]) cards[idx].scrollIntoView({behavior:'smooth'}); }
});

(async function init(){
  showGate();
  await getSources();
  renderTabs();
  resetFeed();
})();
