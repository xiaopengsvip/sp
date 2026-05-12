import React,{useEffect,useMemo,useRef,useState}from'react';
import{createRoot}from'react-dom/client';
import{Home,Flame,Compass,Clock,Bookmark,Settings,Search,Shuffle,EyeOff,PlayCircle,PauseCircle,Maximize2,Heart,RefreshCw,Volume2,VolumeX,Wifi,Database,Monitor,Smartphone,ChevronUp,ChevronDown,Loader2,Box,Trash2}from'lucide-react';
import'./style.css';
const CATS=[['recommend','推荐','综合精选'],['hot','热门','高调用量'],['dance','热舞','舞蹈内容'],['fashion','穿搭','穿搭街拍'],['scenery','风景','横屏背景'],['anime','动漫','ACG漫展'],['handsome','帅哥','男生视频'],['creators','达人','系列内容'],['random','随机','全接口轮播']];
const VERSION='0.0.1 BETA';
const NAV=[['recommend','推荐',Home,'推荐视频流'],['hot','热门',Flame,'高热频道'],['discover','发现',Compass,'随机探索'],['history','历史',Clock,'观看记录'],['favorites','收藏',Bookmark,'本地收藏'],['settings','设置',Settings,'播放设置']];
const TTL=1000*60*20;
const safe=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const uniq=a=>{const s=new Set;return a.filter(x=>x&&x.url&&!s.has(x.url)&&s.add(x.url))};

function detectDeviceMode(){
 const w=window.innerWidth||1024,h=window.innerHeight||768;
 const coarse=matchMedia('(pointer: coarse)').matches;
 const hoverNone=matchMedia('(hover: none)').matches;
 const ua=navigator.userAgent||'';
 const mobileUA=/Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
 const landscape=w>h;
 const force=localStorage.evDeviceMode||'auto';
 if(force==='pc'||force==='mobile')return force;
 if(w<=820)return 'mobile';
 if(mobileUA&&coarse&&w<=1180&&!landscape)return 'mobile';
 if(coarse&&hoverNone&&w<=1024)return 'mobile';
 return 'pc';
}
function useDeviceMode(){
 const[mode,setMode]=useState(()=>detectDeviceMode());
 useEffect(()=>{
  const refresh=()=>setMode(detectDeviceMode());
  const mq1=matchMedia('(pointer: coarse)');
  const mq2=matchMedia('(hover: none)');
  addEventListener('resize',refresh,{passive:true});
  addEventListener('orientationchange',refresh,{passive:true});
  mq1.addEventListener?.('change',refresh);mq2.addEventListener?.('change',refresh);
  return()=>{removeEventListener('resize',refresh);removeEventListener('orientationchange',refresh);mq1.removeEventListener?.('change',refresh);mq2.removeEventListener?.('change',refresh)}
 },[]);
 return [mode,(m)=>{localStorage.evDeviceMode=m;setMode(detectDeviceMode())}];
}

function App(){
 const[device,setDevice]=useDeviceMode();
 const isMobile=device==='mobile';
 const[cat,setCat]=useState(localStorage.evCat||'recommend');
 const[page,setPage]=useState('recommend');
 const[query,setQuery]=useState('');
 const[feed,setFeed]=useState(()=>safe('evFeed').filter(x=>Date.now()-(x.ts||0)<TTL).slice(0,30));
 const[video,setVideo]=useState(()=>safe('evCurrent',null));
 const[favs,setFavs]=useState(()=>safe('evFavorites'));
 const[history,setHistory]=useState(()=>safe('evHistory'));
 const[muted,setMuted]=useState(localStorage.evMuted!=='no');
 const[clean,setClean]=useState(false);
 const[wide,setWide]=useState(localStorage.evWide==='yes');
 const[auto,setAuto]=useState(localStorage.evAuto==='yes');
 const[loading,setLoading]=useState(false);
 const[debug,setDebug]=useState([]);
 const[meta,setMeta]=useState(null);
 const[fx,setFx]=useState(null);
 const[motion,setMotion]=useState('');
 const triggerMotion=name=>{setMotion(name);clearTimeout(window.__evMotionTimer);window.__evMotionTimer=setTimeout(()=>setMotion(''),720)};
 const toggleWide=()=>{triggerMotion(wide?'zoom-out':'zoom-in');setWide(v=>!v)};
 const enterClean=()=>{triggerMotion('clean-in');setClean(true)};
 const exitClean=()=>{triggerMotion('clean-out');setClean(false)};
 const videoRef=useRef(null),wheel=useRef(false),touchY=useRef(0),preloading=useRef(false),warm=useRef(new Map());
 const active=useMemo(()=>CATS.find(x=>x[0]===cat)||CATS[0],[cat]);
 const liked=!!(video&&favs.some(x=>x.url===video.url));
 const log=s=>setDebug(d=>[{t:new Date().toLocaleTimeString(),s},...d].slice(0,28));
 const normalize=(x,c=cat)=>x&&x.url?{...x,ts:Date.now(),desc:x.desc||`${CATS.find(a=>a[0]===c)?.[2]||'EV视频'} · 接口 ${x.id||'-'} · Serverless批量预加载`} : null;
 const cacheFeed=arr=>{const f=uniq(arr).slice(0,40);put('evFeed',f);return f};
 const warmVideo=item=>{if(!item?.url||warm.current.has(item.url))return;const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;v.src=item.url;warm.current.set(item.url,v);if(warm.current.size>8){const k=warm.current.keys().next().value;warm.current.delete(k)}};
 const batch=async(c=cat,n=6)=>{const r=await fetch(`/api/video?category=${c}&batch=${n}`,{cache:'default'});const d=await r.json();if(!d.ok&&!d.items?.length)throw Error(d.message||'接口暂无数据');return (d.items||[]).map(x=>normalize(x,c)).filter(Boolean)};
 const preload=async(c=cat,n=8,reason='预加载')=>{if(preloading.current){log('已有预加载任务，跳过重复请求');return[]}preloading.current=true;try{const net=navigator.connection||{};const count=net.saveData?Math.min(4,n):n;log(`${reason}：批量请求 ${count} 条`);const arr=await batch(c,count);arr.slice(0,4).forEach(warmVideo);setFeed(old=>cacheFeed([...old,...arr]));log(`完成：新增 ${arr.length} 条，缓存池 ${Math.min(40,feed.length+arr.length)} 条`);return arr}finally{preloading.current=false}};
 const play=item=>{if(!item)return;setVideo(item);put('evCurrent',item);const h=uniq([item,...history]).slice(0,100);setHistory(h);put('evHistory',h);setTimeout(()=>videoRef.current?.play?.().catch(()=>{}),80)};
 const refresh=async(c=cat)=>{setLoading(true);try{const old=feed;const arr=await batch(c,8);const merged=cacheFeed([...arr,...old]);setFeed(merged);play(arr[0]||merged[0]);log('换一批完成，不清空旧列表')}catch(e){log('换一批失败：'+e.message)}finally{setLoading(false)}};
 const ensure=()=>{const idx=feed.findIndex(x=>x.url===video?.url);const remain=idx<0?feed.length:feed.length-idx-1;if(remain<=3&&!preloading.current)preload(cat,8,'自动补货');else feed.slice(Math.max(idx+1,0),idx+5).forEach(warmVideo)};
 const next=async()=>{const idx=feed.findIndex(x=>x.url===video?.url);let n=feed[idx+1];if(!n){const a=await preload(cat,6,'切换补货');n=a?.[0]||feed[0]}play(n)};
 const prev=()=>{const idx=feed.findIndex(x=>x.url===video?.url);play(feed[idx-1]||history[1]||video)};
 const togglePlay=()=>{const v=videoRef.current;if(!v)return;if(v.paused){v.play().then(()=>setFx(['play',Date.now()])).catch(()=>{})}else{v.pause();setFx(['pause',Date.now()])}setTimeout(()=>setFx(null),720)};
 const toggleFav=()=>{if(!video)return;const n=liked?favs.filter(x=>x.url!==video.url):uniq([video,...favs]).slice(0,100);setFavs(n);put('evFavorites',n);log(liked?'取消收藏':'已收藏')};
 const onNav=k=>{setPage(k);log('打开页面：'+pageName(k));if(k==='recommend'){setCat('recommend');refresh('recommend')}if(k==='hot'){setCat('hot');refresh('hot')}if(k==='discover'){setCat('random');refresh('random')}if(k==='history'&&history[0])play(history[0]);if(k==='favorites'&&favs[0])play(favs[0])};
 const currentList=page==='favorites'?favs:page==='history'?history:feed;
 const sideCats=CATS.filter(x=>(x[1]+x[2]+x[0]).toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{fetch('/api/video?meta=1').then(r=>r.json()).then(setMeta).catch(()=>{})},[]);
 useEffect(()=>{localStorage.evCat=cat;if(!feed.length||cat!==localStorage.evLastLoadedCat){localStorage.evLastLoadedCat=cat;refresh(cat)}},[cat]);
 useEffect(()=>{if(video)ensure()},[video,feed.length]);
 useEffect(()=>{localStorage.evMuted=muted?'yes':'no';if(videoRef.current)videoRef.current.muted=muted},[muted]);
 useEffect(()=>{localStorage.evWide=wide?'yes':'no'},[wide]);useEffect(()=>{localStorage.evAuto=auto?'yes':'no'},[auto]);
 useEffect(()=>{if(!feed.length)preload(cat,10,'首屏预热');else if(!video)play(feed[0]);const id=setTimeout(()=>preload(cat,6,'空闲后台'),1600);return()=>clearTimeout(id)},[]);
 useEffect(()=>{if(!auto||!video)return;const id=setInterval(next,12000);return()=>clearInterval(id)},[auto,video,feed,cat]);
 useEffect(()=>{const k=e=>{if(e.key==='ArrowDown')next();if(e.key==='ArrowUp')prev();if(e.code==='Space'){e.preventDefault();togglePlay()}if(e.key.toLowerCase()==='m')setMuted(x=>!x);if(e.key.toLowerCase()==='c')clean?exitClean():enterClean();if(e.key.toLowerCase()==='a')setAuto(x=>!x);if(e.key.toLowerCase()==='f')document.querySelector('.player')?.requestFullscreen?.()};addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[feed,video,history]);
 const wheelSwitch=e=>{if(isMobile||wheel.current)return;wheel.current=true;setTimeout(()=>wheel.current=false,420);e.deltaY>0?next():prev()};
 const touchStart=e=>touchY.current=e.touches[0].clientY;const touchEnd=e=>{const dy=touchY.current-e.changedTouches[0].clientY;if(Math.abs(dy)>60)dy>0?next():prev()};
 return <main className={`app device-${device} ${clean?'clean':''} ${wide?'wide':''} ${motion}`} onWheel={wheelSwitch} onTouchStart={touchStart} onTouchEnd={touchEnd}>
  <div className="bg">{video?.url&&<video src={video.url} muted autoPlay loop playsInline/>}<i/></div>
  <MobileTop cat={cat} setCat={setCat} refresh={()=>refresh(cat)} device={device} setDevice={setDevice}/>
  <aside className="side"><div className="brand"><b>EV</b><span>视频</span><i>{VERSION}</i></div><div className="online"><span></span> ONLINE · {meta?.uniqueConnected||37} API</div><label className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索分类 / 接口"/></label><nav>{NAV.map(([k,n,I,d])=><button key={k} className={page===k?'on':''} onClick={()=>onNav(k)}><I size={18}/><span>{n}<small>{d}</small></span><em>{k==='favorites'?favs.length:k==='history'?history.length:''}</em></button>)}</nav><section className="channels"><h4>分类频道</h4><div className="channelGrid">{sideCats.map(([k,n,d])=><button key={k} className={cat===k?'active':''} title={d} onClick={()=>{setPage('recommend');setCat(k)}}><span>{n}</span><small>{d}</small></button>)}</div></section><section className="quick"><button onClick={()=>refresh(cat)}><Shuffle size={16}/>换一批</button><button onClick={enterClean}><EyeOff size={16}/>清屏</button><button onClick={()=>setAuto(!auto)}>{auto?<PauseCircle size={16}/>:<PlayCircle size={16}/>}自动</button><button onClick={toggleWide}><Maximize2 size={16}/>{wide?'缩回':'宽屏'}</button></section><p className="info"><b>EV视频 · {VERSION}</b><br/><Database size={14}/> {meta?.uniqueConnected||37} API ONLINE</p></aside>
  <section className="main"><header><div><h1>EV视频</h1><p>{pageName(page)} · {active[1]} · {VERSION} · 批量预加载</p></div><span className="health"><Wifi size={15}/> 已接入 {meta?.uniqueConnected||37} API</span><DeviceSwitch device={device} setDevice={setDevice}/></header><div className="layout"><section className="center"><ViewHero page={page} favs={favs} history={history} feed={feed} setPage={setPage} refresh={()=>refresh(cat)} /><div className="player">{!video?.url&&<Skeleton/>}<video ref={videoRef} src={video?.url} autoPlay loop playsInline muted={muted} onClick={togglePlay} onCanPlay={()=>setLoading(false)} onWaiting={()=>setLoading(true)} onError={()=>{log('当前视频失败，自动切下一条');next()}}/><div className="shade"/><div className="modeBadge">{clean?'清屏沉浸':wide?'影院放大':'正常浏览'}</div><div className="meta"><b>{active[1]} / EV Feed</b><h2>{video?.title||'正在准备视频'}</h2><p>{video?.desc||'正在从缓存池加载，页面不会留空。'}</p><div><span>{video?.views||'--'} 播放</span><span>{video?.likes||'--'} 喜欢</span><span>接口 {video?.id||'--'}</span></div></div>{fx&&<div className={`playFx ${fx[0]}`} key={fx[1]}><span>{fx[0]==='play'?<PlayCircle/>:<PauseCircle/>}</span></div>}<div className="actions"><button onClick={toggleFav}><Heart fill={liked?'white':'none'}/></button><button onClick={()=>refresh(cat)}><RefreshCw/></button><button onClick={()=>setMuted(!muted)}>{muted?<VolumeX/>:<Volume2/>}</button><button className="zoom" onClick={toggleWide}><Maximize2/></button></div>{loading&&<div className="loading"><Loader2 size={16}/> 正在缓冲，已保留当前画面</div>}</div><div className="arrows"><button onClick={prev}><ChevronUp/></button><button onClick={next}><ChevronDown/></button></div></section><Right page={page} list={currentList} feed={feed} favs={favs} history={history} play={play} clearHistory={()=>{setHistory([]);put('evHistory',[])}} clearFavs={()=>{setFavs([]);put('evFavorites',[])}} auto={auto} setAuto={setAuto} wide={wide} setWide={setWide} clean={enterClean} debug={debug} preload={()=>preload(cat,8,'手动预加载')}/></div></section>
  <MobileBottom muted={muted} setMuted={setMuted} next={next} refresh={()=>refresh(cat)} clean={enterClean} auto={auto} setAuto={setAuto}/>
  {clean&&<button className="cleanExit" onClick={exitClean}>退出清屏 C</button>}
 </main>
}
function pageName(p){return{recommend:'推荐',hot:'热门',discover:'发现',history:'历史',favorites:'收藏',settings:'设置'}[p]||'推荐'}
function Skeleton(){return <div className="skeleton"><Box size={34}/><b>正在读取缓存池</b><span>先展示骨架屏，接口回来后无缝播放</span></div>}
function DeviceSwitch({device,setDevice}){return <div className="deviceSwitch"><button className={device==='pc'?'on':''} onClick={()=>setDevice('pc')} title="强制PC布局"><Monitor size={14}/>PC</button><button className={device==='mobile'?'on':''} onClick={()=>setDevice('mobile')} title="强制移动布局"><Smartphone size={14}/>移动</button><button onClick={()=>setDevice('auto')} title="恢复自动识别">Auto</button></div>}
function MobileTop({cat,setCat,refresh,device,setDevice}){return <div className="mTop"><b>EV</b><div>{CATS.map(([k,n])=><button key={k} className={cat===k?'on':''} onClick={()=>setCat(k)}>{n}</button>)}</div><button onClick={refresh}>换</button><button className="modeBtn" onClick={()=>setDevice(device==='mobile'?'pc':'mobile')}>{device==='mobile'?'PC':'M'}</button></div>}
function MobileBottom({muted,setMuted,next,refresh,clean,auto,setAuto}){return <div className="mBottom"><button onClick={refresh}><Shuffle/><span>换一批</span></button><button onClick={()=>setAuto(!auto)}>{auto?<PauseCircle/>:<PlayCircle/>}<span>自动</span></button><button onClick={()=>setMuted(!muted)}>{muted?<VolumeX/>:<Volume2/>}<span>声音</span></button><button onClick={clean}><EyeOff/><span>清屏</span></button></div>}

function ViewHero({page,favs,history,feed,setPage,refresh}){
 if(page==='recommend'||page==='hot'||page==='discover')return null;
 const map={
  history:['观看历史',`已记录 ${history.length} 条观看记录`,'点击右侧历史列表可继续播放，支持一键清空。'],
  favorites:['我的收藏',`已收藏 ${favs.length} 条视频`,'点击右侧收藏列表可直接播放，数据保存在本地浏览器。'],
  settings:['播放设置','自动滑动 / 宽屏 / 清屏 / 预加载','右侧设置面板已打开，可直接切换播放模式。']
 };
 const m=map[page]; if(!m)return null;
 return <div className="viewHero"><b>{m[0]}</b><span>{m[1]}</span><p>{m[2]}</p><div><button onClick={()=>setPage('recommend')}>返回推荐</button><button onClick={refresh}>刷新视频</button></div></div>
}

function Right({page,list,feed,favs,history,play,clearHistory,clearFavs,auto,setAuto,wide,setWide,clean,debug,preload}){if(page==='settings')return <aside className="right"><Panel title="播放设置"><div className="settings"><button onClick={()=>setAuto(!auto)}>自动滑动播放：{auto?'开':'关'}</button><button onClick={()=>setWide(!wide)}>宽屏模式：{wide?'开':'关'}</button><button onClick={clean}>进入清屏播放</button><button onClick={preload}>手动预加载下一批</button></div></Panel><Panel title="加载调试">{debug.map((x,i)=><p className="log" key={i}>{x.t} {x.s}</p>)}</Panel></aside>;return <aside className="right"><Panel title={page==='favorites'?'我的收藏':page==='history'?'观看历史':'连续推荐'}>{list.length?list.slice(0,12).map((x,i)=><button className="mini" key={x.url+i} onClick={()=>play(x)}><video src={x.url} muted playsInline preload="metadata"/><span><b>{x.title}</b><small>{x.views||'点击播放'}</small></span></button>):<div className="empty"><b>暂无内容</b><span>先观看或收藏几个视频</span></div>}{page==='history'&&history.length>0&&<button className="danger" onClick={clearHistory}><Trash2 size={16}/>清空历史</button>}{page==='favorites'&&favs.length>0&&<button className="danger" onClick={clearFavs}><Trash2 size={16}/>清空收藏</button>}</Panel><Panel title="缓冲池"><div className="buffer"><b>{feed.length}</b><span>条已缓存，剩余不足会自动补货</span><button onClick={preload}>继续预加载</button></div></Panel></aside>}
function Panel({title,children}){return <section className="panel"><h3>{title}</h3>{children}</section>}
createRoot(document.getElementById('root')).render(<App/>);
