const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const catalog={
 recommend:[261,88,224,295,89,304,280,302,284,305,358,286,285,191,230,194,349],
 hot:[261,167,89,285,166,88,257,284,305,304,280,302,281],
 dance:[89,304,286,159,280,257,302],
 fashion:[302,285,256,281,284,257,305,358],
 scenery:[191,230,208,194,349],
 anime:[194,349,283,172],
 handsome:[87],
 random:[261,88,224,295,191,230,194,349,89,304,302]
};
const names={261:'小姐姐随机视频',88:'小姐姐视频',224:'综合随机视频',295:'快手随机视频',89:'热舞视频',304:'丝滑舞蹈',280:'变装系列',302:'穿搭系列',284:'清纯系列',305:'完美身材',358:'怼脸自拍',286:'慢摇系列',285:'吊带系列',191:'PC风景视频',230:'海边晚霞',194:'动漫视频',349:'漫展视频',167:'黑丝视频',166:'白丝视频',257:'甜妹系列',256:'JK洛丽塔',281:'街拍系列',159:'抖音变装',283:'COS系列',172:'ACG动漫',87:'帅哥视频',208:'二次元房间背景'};
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function absUrl(u){try{return new URL(u,'https://api.yujn.cn').toString()}catch{return u}}
async function fetchText(url,timeout=8500){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'user-agent':UA,'referer':'https://api.yujn.cn/'}});const ct=r.headers.get('content-type')||'';const final=r.url;if(/video|image|audio/.test(ct)||/\.(mp4|m3u8|webm|mov)(\?|$)/i.test(final))return final;return await r.text()}finally{clearTimeout(t)}}
function extractUrl(raw){if(!raw)return''; let s=String(raw).trim();
 try{const j=JSON.parse(s); const stack=[j]; while(stack.length){const x=stack.shift(); if(!x)continue; if(typeof x==='string'){const u=extractUrl(x); if(u)return u} else if(Array.isArray(x)) stack.push(...x); else if(typeof x==='object'){for(const k of ['video','url','data','mp4','src','play','link','image','pic']) if(x[k]) stack.unshift(x[k]); for(const v of Object.values(x)) stack.push(v)}}}catch{}
 const m=s.match(/https?:\\?\/\\?\/[^\s"'<>]+?\.(?:mp4|m3u8|webm|mov)(?:\?[^\s"'<>]*)?/i)||s.match(/https?:\\?\/\\?\/[^\s"'<>]+/i); return m?m[0].replaceAll('\\/','/'):'';
}
async function resolveById(id){const detail=`https://api.yujn.cn/?action=interface&id=${id}`; const html=await fetchText(detail,10000);
 const urls=[...new Set((html.match(/https?:\/\/api\.yujn\.cn\/api\/[^\s"'<>]+/g)||[]).map(u=>u.replace(/&amp;/g,'&')))].filter(u=>!u.includes('action=interface'));
 const candidates=urls.length?urls:[`https://api.yujn.cn/api/xjj.php`,`https://api.yujn.cn/api/zzxjj.php`,`https://api.yujn.cn/api/rewu.php`,`https://api.yujn.cn/api/ksxjj.php`];
 let last=''; for(const u of candidates.slice(0,5)){try{const body=await fetchText(absUrl(u),11000); const got=extractUrl(body)||(/^(https?:\/\/)/.test(body)?body.trim():''); if(got) return {url:got,source:u}}catch(e){last=e.message}}
 throw new Error(last||'接口暂时没有返回视频地址')
}
export default async function handler(req,res){res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Cache-Control','no-store'); try{const category=String(req.query.category||'recommend'); const list=catalog[category]||catalog.recommend; const id=Number(req.query.id||pick(list)); const data=await resolveById(id); res.status(200).json({ok:true,id,title:names[id]||'EV随机视频',category,url:data.url,source:data.source,cover:data.url});}catch(e){res.status(200).json({ok:false,message:e.message,fallback:'/api/video?category=random&retry=1'});}}
