import {searchData,sortedMembers} from './search.js';
import {initDonations,setProfessional,professionalActions} from './donations.js?v=20261103-2';
const $=id=>document.getElementById(id);
const form=$('search-form'),query=$('query'),region=$('result-region'),status=$('data-status'),clear=$('clear-button'),submit=$('search-button');
let data=null,options=null;
function el(tag,cls='',content=''){const node=document.createElement(tag);if(cls)node.className=cls;if(content)node.textContent=content;return node}
function button(label,cls,fn){const node=el('button',cls,label);node.type='button';node.addEventListener('click',fn);return node}
function reset(){query.value='';options=null;region.replaceChildren();clear.hidden=true;query.focus()}
clear.addEventListener('click',reset);
function renderEmpty(title,message){const box=el('div','empty-state');box.append(el('h2','',title),el('p','',message));region.replaceChildren(box)}
function renderOptions(result){options=result;const box=el('div','options-panel');const count=result.people.length+result.teams.length;box.append(el('h2','',`${count} opções encontradas`),el('p','options-intro','Selecione uma pessoa ou equipe para ver a relação completa.'));const list=el('div','option-list');for(const person of result.people){const team=data.equipes.find(t=>t.id===person.equipeId);const item=button('', 'option',()=>renderTeam(team,person));item.append(el('strong','',person.nome),el('small','',`${team?.nome||'Equipe não encontrada'} · ${person.informacoesComplementares?.setorUnidade||'Setor não informado'}`));list.append(item)}for(const team of result.teams){const item=button('', 'option',()=>renderTeam(team));item.append(el('strong','',team.nome),el('small','',`Equipe · ${sortedMembers(data,team.id).length} integrantes`));list.append(item)}box.append(list);region.replaceChildren(box)}
function renderTeam(team,person=null){
  if(!team)return renderEmpty('Equipe não encontrada','Os dados desta equipe não estão disponíveis.');
  const members=sortedMembers(data,team.id),box=el('article','team-panel');
  if(options)box.append(button('← Voltar às opções','text-button back-button',()=>renderOptions(options)));
  const header=el('div','team-header'),title=el('div','team-title-block');
  title.append(el('p','section-kicker','Sua equipe'),el('h2','',team.nome));
  header.append(title,el('span','count',`${members.length} ${members.length===1?'integrante':'integrantes'}`));
  box.append(header);
  if(person){const match=el('div','matched-person');match.append(el('span','','Profissional encontrado'),el('strong','',person.nome));box.append(match);setProfessional(person,team,()=>renderTeam(team,person));const actions=professionalActions();if(actions)box.append(actions)}
  box.append(el('h3','member-heading','Integrantes da equipe'));
  const list=el('ol','members');
  for(const member of members){
    const item=el('li','member'+(person?.id===member.id?' selected':''));
    item.append(el('span','',member.nome));
    if(member.informacoesComplementares?.setorUnidade)item.append(el('small','',member.informacoesComplementares.setorUnidade));
    list.append(item);
  }
  box.append(list);region.replaceChildren(box);
}
function runSearch(){if(!data)return;const q=query.value.trim();if(!q){renderEmpty('Digite uma consulta','Informe um nome, equipe, setor ou unidade.');return}const result=searchData(data,q);clear.hidden=false;options=null;if(!result.people.length&&!result.teams.length)return renderEmpty('Nenhum resultado encontrado','Confira a grafia ou tente apenas parte do nome, setor ou equipe.');if(result.people.length===1&&result.teams.length===0){const person=result.people[0];return renderTeam(data.equipes.find(t=>t.id===person.equipeId),person)}if(result.teams.length===1&&result.people.length===0)return renderTeam(result.teams[0]);renderOptions(result)}
form.addEventListener('submit',event=>{event.preventDefault();runSearch()});
async function load(){
  submit.disabled=true;status.textContent='Carregando equipes…';
  try{
    const response=await fetch('./data/equipes.json',{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const base=await response.json();
    if(!Array.isArray(base.equipes)||!Array.isArray(base.profissionais)||base.metadados?.situacao==='aguardando_planilha')throw new Error('Base de equipes ainda não importada.');
    data=base;
    initDonations(base,person=>renderTeam(data.equipes.find(t=>t.id===person.equipeId),person));
    status.textContent=`${base.equipes.length} equipes · ${base.profissionais.length} profissionais`;
    submit.disabled=false;
  }catch(error){
    status.textContent='Base indisponível';
    renderEmpty('Não foi possível carregar as equipes','Tente atualizar a página. Se o problema continuar, avise a organização.');
    console.error('Falha no carregamento:',error);
  }
}
load();
