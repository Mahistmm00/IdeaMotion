const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=__dirname;
(async()=>{
 const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0]);const file=path.resolve(base,'.'+(name==='/'?'/walkthrough.html':name));if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.wav')?'audio/wav':'text/html; charset=utf-8');res.end(body)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('button').evaluate(el=>el.style.display='none');
 for(let i=0;i<7;i++){await page.evaluate(i=>drawFrame(i,.5),i);await page.locator('canvas').screenshot({path:path.join(base,'scene-'+i+'.png')})}
 console.log('Recording narrated concept walkthrough...');
 const result=await page.evaluate(()=>runMovie(true));
 const data=await page.evaluate(()=>videoBase64);
 const output=path.join(base,'application-walkthrough.'+result.extension);
 fs.writeFileSync(output,Buffer.from(data,'base64'));
 const audioCheck=await page.evaluate(async(data)=>{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const ac=new AudioContext();try{const a=await ac.decodeAudioData(bytes.buffer);const samples=a.getChannelData(0);let peak=0,energy=0;for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));energy+=samples[i]*samples[i]}return {audioDuration:a.duration,audioChannels:a.numberOfChannels,audioPeak:peak,audioRms:Math.sqrt(energy/samples.length)}}finally{await ac.close()}},data);
 const video=await page.evaluate(async(data)=>{const v=document.createElement('video');v.src=URL.createObjectURL(new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type:'video/'+outputExtension}));await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=reject});return {width:v.videoWidth,height:v.videoHeight,duration:v.duration}},data);
 fs.writeFileSync(path.join(base,'render-info.json'),JSON.stringify({...result,...video,...audioCheck,output},null,2));
 console.log(JSON.stringify({...result,...video,...audioCheck,output}));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(err=>{console.error(err);process.exitCode=1});
