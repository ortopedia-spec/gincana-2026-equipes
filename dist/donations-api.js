import {donationsConfig} from './donations-config.js';
const pending=new Map();
function googleScriptOrigin(origin){try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'));}catch{return false;}}
window.addEventListener('message',event=>{
  if(!googleScriptOrigin(event.origin)||!event.data||typeof event.data!=='object')return;
  const item=pending.get(event.data.requestId);
  if(!item)return;
  pending.delete(event.data.requestId);clearTimeout(item.timer);
  item.frame.remove();
  if(event.data.ok)item.resolve(event.data.result);
  else item.reject(new Error(event.data.error||'Falha na operação.'));
});
export function api(method,data={},token=''){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(donationsConfig.appsScriptUrl))return Promise.reject(new Error('Módulo de doações ainda não configurado.'));
  const requestId=crypto.randomUUID();
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');frame.name='donations-'+requestId;frame.hidden=true;frame.title='Resposta do cadastro de doações';document.body.append(frame);
    const form=document.createElement('form');form.method='POST';form.action=donationsConfig.appsScriptUrl;form.target=frame.name;form.hidden=true;
    const field=document.createElement('input');field.name='payload';field.value=JSON.stringify({requestId,method,data,token});form.append(field);document.body.append(form);
    const timer=setTimeout(()=>{pending.delete(requestId);frame.remove();reject(new Error('A resposta demorou. Tente novamente; o mesmo cadastro será recuperado.'));},45000);
    pending.set(requestId,{resolve,reject,frame,timer});form.submit();form.remove();
  });
}
export const donationsReady=Boolean(donationsConfig.appsScriptUrl&&donationsConfig.googleClientId);
