import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source=name=>fs.readFileSync(new URL(`../backend/${name}`,import.meta.url),'utf8');
test('catálogo estático acompanha os 31 produtos oficiais',()=>{
  const products=JSON.parse(fs.readFileSync(new URL('../backend/catalogo.json',import.meta.url),'utf8'));
  const module=fs.readFileSync(new URL('../dist/catalog.js',import.meta.url),'utf8');
  const published=JSON.parse(module.match(/export const products=(.*);/)[1]);
  assert.equal(products.length,31);
  assert.deepEqual(published,products.map(p=>({id:p.produto_id,nome:p.nome,referencia:p.quantidade_referencia,pontos:p.pontos_por_unidade})));
});
function harness(){
  const headers={Profissionais:['profissional_id','nome','equipe_id','equipe_nome','setor_unidade','ativo'],Produtos:['produto_id','nome','quantidade_referencia','pontos_por_unidade','ativo','ordem_exibicao'],Validadores:['email','nome','ativo'],Doacoes:['doacao_id','protocolo','profissional_id','equipe_id','criado_em','status','pontos_previstos','pontos_confirmados','validado_em','validado_por','versao_registro','chave_idempotencia','hash_solicitacao'],Itens_Doacao:['item_id','doacao_id','produto_id','produto_nome_snapshot','referencia_snapshot','pontos_por_unidade_snapshot','quantidade_declarada','quantidade_validada','pontos_previstos','pontos_confirmados'],Historico_Validacoes:['evento_id','doacao_id','tipo_evento','registrado_em','responsavel_email','justificativa','valores_anteriores','valores_novos','chave_operacao']};
  const tabs=Object.fromEntries(Object.entries(headers).map(([k,v])=>[k,[v]]));
  tabs.Profissionais.push(['p1','Ana','e1','Laços que acolhem','Setor A',true]);
  tabs.Produtos.push(['ALI001','Panetone','Unidade',8,true,1],['ALI002','Leite','Caixa',4,true,2],['ALI003','Café','Pacote',5,true,3]);
  tabs.Validadores.push(['validor@example.com','Validador',true]);
  let seq=0,lock=false;
  const sheet=(name)=>({getDataRange:()=>({getValues:()=>tabs[name].map(r=>[...r])}),getSheetId:()=>Object.keys(headers).indexOf(name)+1,getLastRow:()=>tabs[name].length,getRange:(row,col,height,width)=>({getValues:()=>tabs[name].slice(row-1,row-1+height).map(r=>r.slice(col-1,col-1+width)),setValues:values=>values.forEach((v,i)=>{tabs[name][row-1+i]=v;})}),setFrozenRows:()=>{}});
  const book={getSheetByName:sheet,getId:()=> 'synthetic'};
  const context=vm.createContext({console,Date,BigInt,Number,JSON,Object,Array,String,Boolean,Error,Math,
    SpreadsheetApp:{openById:()=>book},PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='SPREADSHEET_ID'?'synthetic':'client'})},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(lock)return false;lock=true;return true;},releaseLock:()=>{lock=false;}})},
    Utilities:{getUuid:()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`,formatDate:()=> '20261103',computeDigest:(_alg,value)=>[...crypto.createHash('sha256').update(value).digest()].map(x=>x>127?x-256:x),base64EncodeWebSafe:bytes=>Buffer.from(bytes.map(x=>x&255)).toString('base64url'),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1}},
    Sheets:{Spreadsheets:{batchUpdate:({requests})=>{const copy=structuredClone(tabs);for(const r of requests){if(r.appendCells){const name=Object.keys(headers)[r.appendCells.sheetId-1];for(const row of r.appendCells.rows)copy[name].push(row.values.map(c=>Object.values(c.userEnteredValue)[0]));}else if(r.updateCells){const q=r.updateCells,name=Object.keys(headers)[q.range.sheetId-1];copy[name][q.range.startRowIndex]=q.rows[0].values.map(c=>Object.values(c.userEnteredValue)[0]);}else throw new Error('Unknown request');}Object.assign(tabs,copy);}}}
  });
  vm.runInContext(source('Domain.gs')+source('Code.gs'),context);
  context.requireValidator_=token=>{if(token!=='valid')throw new Error('Não autorizado');return {email:'validor@example.com'};};
  return {context,tabs};
}
const create=(c,key,items=[{produtoId:'ALI001',quantidade:2},{produtoId:'ALI002',quantidade:3}])=>c.createDonation_({professionalId:'p1',idempotencyKey:key,items});
test('cadastro, retries, doações independentes e catálogo histórico',()=>{
  const {context:c,tabs}=harness();const first=create(c,'key-1');assert.equal(first.points,28);assert.equal(first.status,'AGUARDANDO_VALIDACAO');
  assert.equal(create(c,'key-1').id,first.id);assert.equal(tabs.Doacoes.length,2);assert.throws(()=>create(c,'key-1',[{produtoId:'ALI001',quantidade:3}]),/outra doação/);
  const second=create(c,'key-2',[{produtoId:'ALI003',quantidade:3}]);assert.notEqual(first.id,second.id);assert.equal(tabs.Doacoes.length,3);
  tabs.Produtos[1][3]=99;assert.equal(create(c,'key-1').id,first.id);assert.equal(c.rows_('Itens_Doacao').find(x=>x.doacao_id===first.id).pontos_por_unidade_snapshot,8);
});
test('quantidades inválidas e declaração vazia',()=>{const {context:c,tabs}=harness();for(const q of [-1,1.5,NaN,'2'])assert.throws(()=>create(c,`key-${String(q)}`,[{produtoId:'ALI001',quantidade:q}]),/quantidade|Lista/);assert.throws(()=>create(c,'empty',[{produtoId:'ALI001',quantidade:0}]),/ao menos/);assert.equal(tabs.Doacoes.length,1);});
test('validação, extra não declarado, conflito, correção e totais',()=>{
  const {context:c,tabs}=harness();const first=create(c,'one');const second=create(c,'two',[{produtoId:'ALI003',quantidade:3}]);
  assert.throws(()=>c.dispatch_('pending',{query:'Ana'},''),/Não autorizado/);
  const payload={donationId:first.id,version:1,operationKey:'op-1',items:[{produtoId:'ALI001',quantidade:1},{produtoId:'ALI002',quantidade:4},{produtoId:'ALI003',quantidade:2}]};
  const validated=c.dispatch_('validate',payload,'valid');assert.equal(validated.confirmedPoints,34);assert.equal(validated.delta,34);assert.equal(c.validatedDonations_({professionalId:'p1'}).totalConfirmed,34);assert.equal(tabs.Doacoes.length,3);
  assert.equal(c.rows_('Itens_Doacao').find(x=>x.doacao_id===first.id&&x.produto_id==='ALI003').quantidade_declarada,0);
  assert.throws(()=>c.dispatch_('validate',payload,'valid'),/alterada/);
  assert.equal(c.validatedDonations_({professionalId:'p1'}).donations.length,1);assert.equal(c.rows_('Doacoes').find(x=>x.doacao_id===second.id).status,'AGUARDANDO_VALIDACAO');
  const corrected=c.dispatch_('correct',{...payload,version:2,operationKey:'op-2',reason:'Conferência posterior corrigiu a quantidade.',items:[{produtoId:'ALI001',quantidade:2},{produtoId:'ALI002',quantidade:4},{produtoId:'ALI003',quantidade:2}]},'valid');
  assert.equal(corrected.delta,8);assert.equal(c.validatedDonations_({professionalId:'p1'}).totalConfirmed,42);assert.equal(c.validatedDonations_({professionalId:'p1'}).teamTotalConfirmed,42);assert.equal(tabs.Historico_Validacoes.length,3);
  assert.throws(()=>c.dispatch_('correct',{...payload,version:2,operationKey:'op-3',reason:'Outra correção solicitada.'},'valid'),/alterada/);
});
test('OAuth por código: claims, conta autorizada, sessão e revogação',()=>{
  const {context:c,tabs}=harness(),cache=new Map(),now=Math.floor(Date.now()/1000),claims={aud:'client',iss:'https://accounts.google.com',exp:now+300,iat:now-10,email_verified:true,email:'VALIDOR@example.com',sub:'stable-sub'};
  const jwt=x=>`head.${Buffer.from(JSON.stringify(x)).toString('base64url')}.signature`;
  c.Utilities.base64DecodeWebSafe=s=>[...Buffer.from(s,'base64url')];c.Utilities.newBlob=b=>({getDataAsString:()=>Buffer.from(b).toString()});
  c.CacheService={getScriptCache:()=>({put:(k,v)=>cache.set(k,v),get:k=>cache.get(k),remove:k=>cache.delete(k)})};
  c.PropertiesService={getScriptProperties:()=>({getProperty:k=>({SPREADSHEET_ID:'synthetic',GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',PUBLIC_ORIGIN:'https://ortopedia-spec.github.io'})[k]})};
  c.UrlFetchApp={fetch:(url,options)=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(url.includes('/token')?{id_token:jwt(claims),access_token:'access',expires_in:3600}:{sub:claims.sub,email:claims.email,email_verified:true})})};
  vm.runInContext(source('Auth.gs'),c);
  for(const bad of [{aud:'other'},{iss:'evil'},{exp:now-1},{email_verified:false}])assert.throws(()=>c.oauthClaims_(jwt({...claims,...bad}),'client',now),/inválida/);
  assert.equal(c.oauthClaims_(jwt(claims),'client',now).email,'validor@example.com');
  const logged=c.login_('one-time-code');assert.equal(logged.email,'validor@example.com');assert.equal(c.requireValidator_(logged.sessionToken).sub,'stable-sub');
  tabs.Validadores[1][2]=false;assert.throws(()=>c.requireValidator_(logged.sessionToken),/permissão/);tabs.Validadores[1][2]=true;
  c.logout_(logged.sessionToken);assert.throws(()=>c.requireValidator_(logged.sessionToken),/expirou/);
  c.UrlFetchApp={fetch:()=>({getResponseCode:()=>400,getContentText:()=>''})};assert.throws(()=>c.login_('used-code'),/expirou/);
});
test('inicialização repetida preserva registros e não duplica IDs',()=>{
  const {context:c,tabs}=harness();vm.runInContext(source('Setup.gs'),c);
  c.SEED_PROFESSIONALS_=[{profissional_id:'p1',nome:'Ana',equipe_id:'e1',equipe_nome:'Laços que acolhem',setor_unidade:'Setor A',ativo:true}];
  c.SEED_PRODUCTS_=[{produto_id:'ALI001',nome:'Panetone',quantidade_referencia:'Unidade',pontos_por_unidade:8,ativo:true,ordem_exibicao:1},{produto_id:'ALI002',nome:'Leite',quantidade_referencia:'Caixa',pontos_por_unidade:4,ativo:true,ordem_exibicao:2},{produto_id:'ALI003',nome:'Café',quantidade_referencia:'Pacote',pontos_por_unidade:5,ativo:true,ordem_exibicao:3}];
  const donation=create(c,'seed-test');assert.equal(c.initialize().inserted.Profissionais,0);assert.equal(c.initialize().inserted.Produtos,0);assert.equal(tabs.Doacoes.length,2);assert.equal(c.rows_('Doacoes')[0].doacao_id,donation.id);
});
