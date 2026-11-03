import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchData,sortedMembers,coordinatorLabel} from '../dist/search.js';

const data=JSON.parse(await readFile(new URL('../dist/data/equipes.json',import.meta.url),'utf8'));
const person=data.profissionais[0];
const team=data.equipes.find(t=>t.id===person.equipeId);
test('base real tem todas as equipes, pessoas e coordenadores vazios',async()=>{
  assert.equal(data.equipes.length,10);assert.equal(data.profissionais.length,588);
  assert.ok(data.equipes.every(t=>t.coordenador===''));
  const coord=JSON.parse(await readFile(new URL('../dist/data/coordenadores.json',import.meta.url),'utf8'));
  assert.ok(Object.values(coord.coordenadores).every(value=>value===''));
});
test('nome completo, primeiro nome, sobrenome e trecho sem acentos ou caixa',()=>{
  assert.ok(searchData(data,person.nome).people.some(p=>p.id===person.id));
  const parts=person.nome.split(/\s+/);
  for(const term of [parts[0],parts.at(-1),person.nome.slice(1,7),person.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()])assert.ok(searchData(data,term).people.some(p=>p.id===person.id),term);
  assert.ok(searchData(data,`  ${parts[0]}   ${parts.at(-1)} `).people.some(p=>p.id===person.id));
});
test('equipe, setor, ordenação e contagem',()=>{
  assert.ok(searchData(data,team.nome).teams.some(t=>t.id===team.id));
  const sector=data.profissionais.find(p=>p.informacoesComplementares.setorUnidade)?.informacoesComplementares.setorUnidade;
  assert.ok(searchData(data,sector).people.length>0);
  const members=sortedMembers(data,team.id);
  assert.equal(members.length,data.profissionais.filter(p=>p.equipeId===team.id).length);
  assert.ok(members.every((p,i)=>i===0||members[i-1].nome.localeCompare(p.nome,'pt-BR',{sensitivity:'base'})<=0));
});
test('duplicados sintéticos permanecem selecionáveis por ID',()=>{
  const synthetic={equipes:[{id:'a',nome:'Equipe A'},{id:'b',nome:'Equipe B'}],profissionais:[{id:'p1',nome:'Ana Souza',equipeId:'a',informacoesComplementares:{setorUnidade:'A'}},{id:'p2',nome:'Ana Souza',equipeId:'b',informacoesComplementares:{setorUnidade:'B'}}]};
  const result=searchData(synthetic,'ANA souza');
  assert.deepEqual(result.people.map(p=>p.id),['p1','p2']);
  assert.equal(sortedMembers(synthetic,'a').length,1);
});
test('sem resultados',()=>assert.deepEqual(searchData(data,'zzzzzzzzzz'),{people:[],teams:[]}));
test('coordenador vazio e preenchido em dados sintéticos',()=>{
  assert.equal(coordinatorLabel(team,{}),'Coordenador ainda não cadastrado');
  assert.equal(coordinatorLabel(team,{[team.nome]:'Pessoa de teste'}),'Pessoa de teste');
});
