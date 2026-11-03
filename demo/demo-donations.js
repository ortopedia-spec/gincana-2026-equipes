import {products} from './catalog.js';

// Este módulo é exclusivo da pasta demo. Não importa API, OAuth ou configurações de produção.
const storageKey='gincana-2026-demonstracao-v1';
const demoEmail='servico.social.demo@exemplo.com';
const $=id=>document.getElementById(id);
const region=$('result-region');
const searchPanel=$('search-panel');
let person=null,team=null,renderProfessional=null,base=null,selectProfessional=null,validator='';

function emptyState(){return {donations:[],events:[]};}
function readState(){
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey));
    if(saved&&Array.isArray(saved.donations)&&Array.isArray(saved.events))return saved;
  }catch{}
  return emptyState();
}
let state=readState();
function refresh(){state=readState();return state;}
function persist(next){localStorage.setItem(storageKey,JSON.stringify(next));state=next;}
function element(tag,className='',content=''){
  const node=document.createElement(tag);if(className)node.className=className;if(content)node.textContent=content;return node;
}
function button(label,className,action){const node=element('button',className,label);node.type='button';node.addEventListener('click',action);return node;}
function panel(kicker,title){const node=element('section','donation-panel');node.append(element('p','section-kicker',kicker),element('h2','',title));return node;}
function show(node){searchPanel.hidden=true;region.replaceChildren(node);window.scrollTo(0,0);}
function backToProfessional(){searchPanel.hidden=false;if(renderProfessional)renderProfessional();else region.replaceChildren();window.scrollTo(0,0);}
function backToSearch(){searchPanel.hidden=false;region.replaceChildren();window.scrollTo(0,0);}
function notice(box,message,type='error'){
  let node=box.querySelector('.donation-notice');if(!node){node=element('p','donation-notice');box.prepend(node);}
  node.className='donation-notice '+type;node.textContent=message;
}
function quantity(value){
  if(!/^(0|[1-9]\d*)$/.test(String(value))||Number(value)>1000000||!Number.isSafeInteger(Number(value)))throw new Error('Use quantidades inteiras de 0 a 1.000.000.');
  return Number(value);
}
function points(value){return `${value} ${value===1?'ponto':'pontos'}`;}
function date(value){return new Date(value).toLocaleString('pt-BR');}
function rowFor(product,initial,onChange,declared){
  const row=element('div','product-row'),description=element('div','product-description');
  description.append(element('strong','',product.nome),element('small','',`${product.referencia} · ${points(product.pontos)} por unidade`));
  if(declared!==undefined)description.append(element('small','declared-label',`Declarado: ${declared}`));
  const controls=element('div','quantity-controls'),input=element('input');
  input.type='number';input.inputMode='numeric';input.min='0';input.max='1000000';input.step='1';input.value=String(initial);
  input.setAttribute('aria-label',`${declared===undefined?'Quantidade de':'Quantidade recebida de'} ${product.nome}`);
  const minus=button('−','quantity-button',()=>{input.value=String(Math.max(0,quantity(input.value)-1));onChange();});
  const plus=button('+','quantity-button',()=>{input.value=String(Math.min(1000000,quantity(input.value)+1));onChange();});
  input.addEventListener('input',onChange);controls.append(minus,input,plus);
  const subtotal=element('strong','item-subtotal');row.append(description,controls,subtotal);
  return {row,input,subtotal,product};
}
function recalculate(rows,total){
  let sum=0,valid=true;
  for(const item of rows){
    try{const n=quantity(item.input.value);item.input.setCustomValidity('');item.subtotal.textContent=points(n*item.product.pontos);sum+=n*item.product.pontos;}
    catch(error){item.input.setCustomValidity(error.message);item.subtotal.textContent='Quantidade inválida';valid=false;}
  }
  total.textContent=valid?points(sum):'Corrija as quantidades';return valid;
}
function preparedItems(rows){return rows.map(item=>({productId:item.product.id,declared:quantity(item.input.value),name:item.product.nome,reference:item.product.referencia,unitPoints:item.product.pontos})).filter(item=>item.declared>0);}
function updateStatus(message){$('demo-status').textContent=message;}

export function setProfessional(selected,selectedTeam,renderAgain){person=selected;team=selectedTeam;renderProfessional=renderAgain;}
export function professionalActions(){
  if(!person)return null;
  const actions=element('div','professional-actions');
  actions.append(button('Cadastrar doação','primary-button',openDonation),button('Doações validadas','secondary-button',openHistory));
  return actions;
}

function openDonation(){
  const selected=person,selectedTeam=team,box=panel('Doação de alimentos','Cadastrar doação');
  box.append(element('p','donation-context',`${selected.nome} · ${selectedTeam.nome}`),element('p','muted','Informe o número de embalagens nas referências indicadas. Os pontos são previstos até a conferência do Serviço Social.'));
  const list=element('div','product-list'),total=element('strong','total-points','0 pontos'),footer=element('div','donation-footer'),rows=[];
  const update=()=>recalculate(rows,total);
  for(const product of products){const item=rowFor(product,0,update);rows.push(item);list.append(item.row);}
  box.append(list,element('p','total-label','Pontos previstos'),total,footer);
  const save=button('Salvar doação','primary-button',()=>{
    if(!update()){notice(box,'Corrija as quantidades.');return;}
    let items;try{items=preparedItems(rows);}catch(error){notice(box,error.message);return;}
    if(!items.length){notice(box,'Escolha pelo menos um alimento.');return;}
    save.disabled=true;
    try{
      const id=crypto.randomUUID(),now=new Date().toISOString();
      const protocol='SIM-2026-'+id.slice(0,8).toUpperCase();
      const donation={id,protocol,professionalId:selected.id,teamId:selectedTeam.id,createdAt:now,status:'PENDENTE',items:items.map(item=>({...item,received:null})),projectedPoints:items.reduce((sum,item)=>sum+item.declared*item.unitPoints,0),confirmedPoints:0,validatedAt:null,validatedBy:null};
      const current=refresh();persist({...current,donations:[...current.donations,donation]});
      const done=panel('Cadastro simulado','Doação cadastrada');
      done.append(element('p','donation-protocol',`Protocolo simulado: ${protocol}`),element('p','','Leve sua doação até o Serviço Social para validação.'),element('p','projected-label',`${points(donation.projectedPoints)} previstos · 0 confirmados`));
      done.append(button('Nova doação','primary-button',openDonation),button('Voltar à equipe','secondary-button',backToProfessional));
      show(done);
    }catch(error){save.disabled=false;notice(box,'Não foi possível salvar neste navegador. Verifique se o armazenamento local está disponível.');}
  });
  footer.append(save,button('Voltar','secondary-button',backToProfessional));
  update();show(box);
}

function openHistory(){
  const selected=person,box=panel('Histórico simulado','Doações validadas');
  box.append(element('p','donation-context',selected.nome),button('Voltar','secondary-button',backToProfessional));
  const donations=refresh().donations.filter(item=>item.professionalId===selected.id&&item.status==='VALIDADA').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  box.append(element('p','confirmed-total',`Total confirmado: ${points(donations.reduce((sum,item)=>sum+item.confirmedPoints,0))}`));
  if(!donations.length)box.append(element('p','muted','Ainda não há doações validadas nesta demonstração.'));
  for(const donation of donations){
    const card=element('article','donation-record');
    card.append(element('h3','',donation.protocol),element('p','',`${date(donation.createdAt)} · ${points(donation.projectedPoints)} previstos · ${points(donation.confirmedPoints)} confirmados`));
    for(const item of donation.items.filter(item=>item.received>0))card.append(element('p','',`${item.name}: ${item.received} × ${item.reference} · ${points(item.received*item.unitPoints)}`));
    card.append(element('p','demo-event',`Conferida por ${donation.validatedBy} em ${date(donation.validatedAt)}`));box.append(card);
  }
  show(box);
}

function openValidator(){
  if(validator)return renderAdmin();
  const box=panel('Serviço Social · demonstração','Entrada simulada');
  box.append(element('p','demo-simulation','Esta entrada por e-mail é apenas uma simulação e não comprova identidade. Na aplicação real, a autenticação Google permanece separada.'));
  box.append(element('p','',`E-mail de demonstração permitido: ${demoEmail}`));
  const form=element('form','admin-search'),input=element('input'),submit=element('button','primary-button','Entrar');
  input.type='email';input.required=true;input.placeholder='Digite o e-mail de demonstração';input.setAttribute('aria-label','E-mail de demonstração');submit.type='submit';
  form.append(input,submit);box.append(form,button('Voltar','secondary-button',backToSearch));
  form.addEventListener('submit',event=>{event.preventDefault();if(input.value.trim().toLowerCase()!==demoEmail){notice(box,'E-mail não permitido nesta demonstração.');return;}validator=demoEmail;renderAdmin();});
  show(box);
}
function renderAdmin(){
  const box=panel('Serviço Social · demonstração','Validar doações');
  box.append(element('p','demo-simulation',`Entrada simulada: ${validator}. Nenhuma identidade foi comprovada.`));
  const form=element('form','admin-search'),input=element('input'),submit=element('button','primary-button','Pesquisar');
  input.type='search';input.required=true;input.minLength=2;input.placeholder='Nome do profissional ou protocolo';input.setAttribute('aria-label','Nome do profissional ou protocolo');submit.type='submit';
  form.append(input,submit);const results=element('div','admin-results');box.append(form,results);
  box.append(button('Sair da área simulada','secondary-button',()=>{validator='';openValidator();}),button('Voltar à consulta','secondary-button',backToSearch));
  form.addEventListener('submit',event=>{
    event.preventDefault();const term=input.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const found=refresh().donations.filter(d=>d.status==='PENDENTE'&&(d.protocol.toLowerCase().includes(term)||base.profissionais.find(p=>p.id===d.professionalId)?.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term)));
    results.replaceChildren();
    if(!found.length){results.append(element('p','muted','Nenhuma doação pendente encontrada.'));return;}
    for(const donation of found){const name=base.profissionais.find(p=>p.id===donation.professionalId)?.nome||'Profissional';results.append(button(`${donation.protocol} · ${name} · ${date(donation.createdAt)} · aguardando validação`,'option',()=>review(donation.id)));}
  });
  show(box);
}
function review(id){
  if(!validator)return openValidator();
  const donation=refresh().donations.find(d=>d.id===id),selected=base.profissionais.find(p=>p.id===donation?.professionalId),selectedTeam=base.equipes.find(t=>t.id===donation?.teamId);
  if(!donation||donation.status!=='PENDENTE'){renderAdmin();return;}
  const box=panel('Serviço Social · demonstração','Conferir doação');
  box.append(element('p','donation-context',`${selected?.nome||'Profissional'} · ${selectedTeam?.nome||'Equipe'}`),element('p','donation-protocol',donation.protocol),element('p','muted',`${points(donation.projectedPoints)} previstos. Ajuste as quantidades efetivamente recebidas.`));
  const list=element('div','product-list'),total=element('strong','total-points'),rows=[];
  const update=()=>recalculate(rows,total);
  for(const original of donation.items){const product={id:original.productId,nome:original.name,referencia:original.reference,pontos:original.unitPoints};const item=rowFor(product,original.declared,update,original.declared);rows.push(item);list.append(item.row);}
  box.append(list);
  const select=element('select','demo-extra');select.setAttribute('aria-label','Incluir alimento não declarado');select.append(new Option('Incluir alimento não declarado',''));
  for(const product of products.filter(p=>!donation.items.some(item=>item.productId===p.id)))select.append(new Option(product.nome,product.id));
  select.addEventListener('change',()=>{const product=products.find(p=>p.id===select.value);if(!product)return;const item=rowFor(product,0,update,0);rows.push(item);list.append(item.row);select.querySelector(`option[value="${product.id}"]`).remove();select.value='';update();});
  box.append(select,element('p','total-label','Pontos a confirmar'),total);
  const save=button('Salvar validação','primary-button',()=>{
    if(!update()){notice(box,'Corrija as quantidades recebidas.');return;}
    const current=refresh(),record=current.donations.find(d=>d.id===id);
    if(!record||record.status!=='PENDENTE'){notice(box,'Este protocolo já foi validado. Atualize a consulta.');save.disabled=true;return;}
    let received;try{received=rows.map(item=>({productId:item.product.id,received:quantity(item.input.value),name:item.product.nome,reference:item.product.referencia,unitPoints:item.product.pontos}));}catch(error){notice(box,error.message);return;}
    const now=new Date().toISOString(),newItems=received.map(item=>{const original=record.items.find(old=>old.productId===item.productId);return {...item,declared:original?.declared||0};});
    const confirmedPoints=newItems.reduce((sum,item)=>sum+item.received*item.unitPoints,0);
    const updated={...record,status:'VALIDADA',items:newItems,confirmedPoints,validatedAt:now,validatedBy:validator};
    const event={id:crypto.randomUUID(),donationId:id,type:'VALIDACAO',at:now,by:validator,previous:{status:record.status,confirmedPoints:record.confirmedPoints},next:{status:updated.status,confirmedPoints}};
    try{persist({donations:current.donations.map(item=>item.id===id?updated:item),events:[...current.events,event]});}
    catch{notice(box,'Não foi possível salvar neste navegador.');return;}
    const done=panel('Conferência simulada','Validação salva');
    done.append(element('p','donation-protocol',record.protocol),element('p','confirmed-total',`${points(confirmedPoints)} confirmados`),element('p','demo-event',`Conferido por ${validator} em ${date(now)}`));
    done.append(button('Pesquisar outras doações','primary-button',renderAdmin),button('Ver profissional','secondary-button',()=>{person=selected;team=selectedTeam;searchPanel.hidden=false;selectProfessional(selected);}));
    show(done);
  });
  box.append(save,button('Voltar à pesquisa','secondary-button',renderAdmin));update();show(box);
}

export function initDonations(data,onSelect){
  base=data;selectProfessional=onSelect;
  const admin=$('validator-open');admin.hidden=false;admin.addEventListener('click',openValidator);
  $('demo-clear').addEventListener('click',()=>{
    const previous=region.firstChild,wasSearchVisible=!searchPanel.hidden;
    const box=panel('Demonstração','Limpar dados de demonstração?');
    box.append(element('p','muted','Todas as doações e conferências simuladas serão apagadas deste navegador.'));
    box.append(button('Apagar dados','primary-button',()=>{
      try{localStorage.removeItem(storageKey);}catch{notice(box,'Não foi possível apagar os dados neste navegador.');return;}
      state=emptyState();validator='';person=null;team=null;renderProfessional=null;
      searchPanel.hidden=false;region.replaceChildren();$('query').value='';$('clear-button').hidden=true;
      updateStatus('Dados de demonstração apagados deste navegador.');window.scrollTo(0,0);
    }),button('Cancelar','secondary-button',()=>{
      searchPanel.hidden=!wasSearchVisible;region.replaceChildren();if(previous)region.append(previous);window.scrollTo(0,0);
    }));
    show(box);
  });
}
