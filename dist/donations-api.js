import {donationsConfig} from './donations-config.js';
const pending=new Map();
function googleScriptOrigin(origin){try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'));}catch{return false;}}
window.addEventListener('message',event=>{
  if(!googleScriptOrigin(event.origin)||!event.data||typeof event.data!=='object')return;
  const item=pending.get(event.data.requestId);
  if(!item)return;
  if(event.data.kind==='gincana-ready'){
    item.source=event.source;
    event.source.postMessage({kind:'gincana-request',requestId:event.data.requestId,method:item.method,data:item.data,token:item.token},event.origin);
    return;
  }
  if(event.data.kind!=='gincana-response'||event.source!==item.source)return;
  pending.delete(event.data.requestId);clearTimeout(item.timer);
  item.frame.remove();
  if(event.data.ok)item.resolve(event.data.result);
  else item.reject(new Error(event.data.error||'Falha na operação.'));
});
export function api(method,data={},token=''){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(donationsConfig.appsScriptUrl))return Promise.reject(new Error('Módulo de doações ainda não configurado.'));
  const requestId=crypto.randomUUID();
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='Comunicação segura com o cadastro de doações';
    const timer=setTimeout(()=>{pending.delete(requestId);frame.remove();reject(new Error('A resposta demorou. Tente novamente; o mesmo cadastro será recuperado.'));},45000);
    pending.set(requestId,{resolve,reject,frame,timer,method,data,token,source:null});
    frame.src=donationsConfig.appsScriptUrl+'?bridge='+encodeURIComponent(requestId);
    document.body.append(frame);
  });
}
export const donationsReady=Boolean(donationsConfig.appsScriptUrl&&donationsConfig.googleClientId);
