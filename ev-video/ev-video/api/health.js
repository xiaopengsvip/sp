export default function handler(req,res){res.setHeader('Cache-Control','no-store');res.status(200).json({ok:true,name:'EV视频',version:'2.0.0',time:new Date().toISOString()})}
