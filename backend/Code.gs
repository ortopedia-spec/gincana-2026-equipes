var HEADERS_={
  Profissionais:['profissional_id','nome','equipe_id','equipe_nome','setor_unidade','ativo'],
  Produtos:['produto_id','nome','quantidade_referencia','pontos_por_unidade','ativo','ordem_exibicao'],
  Validadores:['email','nome','ativo'],
  Doacoes:['doacao_id','protocolo','profissional_id','equipe_id','criado_em','status','pontos_previstos','pontos_confirmados','validado_em','validado_por','versao_registro','chave_idempotencia','hash_solicitacao'],
  Itens_Doacao:['item_id','doacao_id','produto_id','produto_nome_snapshot','referencia_snapshot','pontos_por_unidade_snapshot','quantidade_declarada','quantidade_validada','pontos_previstos','pontos_confirmados'],
  Historico_Validacoes:['evento_id','doacao_id','tipo_evento','registrado_em','responsavel_email','justificativa','valores_anteriores','valores_novos','chave_operacao']
};
function spreadsheet_(){var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')||'1bIeNox8Er33LEZTcfYiAQdNdWNvvhvK-djBotztZ0c8';return SpreadsheetApp.openById(id);}
function sheet_(name){var s=spreadsheet_().getSheetByName(name);if(!s)throw new Error('Aba ausente: '+name);return s;}
function rows_(name){var values=sheet_(name).getDataRange().getValues(),keys=HEADERS_[name];if(values.length===1&&values[0][0]==='')return [];return values.slice(1).map(function(v,index){var o={_row:index+1};keys.forEach(function(k,j){o[k]=v[j];});return o;}).filter(function(o){return o[keys[0]]!=='';});}
function record_(name,obj){return HEADERS_[name].map(function(k){return obj[k]===undefined||obj[k]===null?'':obj[k];});}
function cell_(value){if(value===null||value===undefined||value==='')return {userEnteredValue:{stringValue:''}};if(typeof value==='number')return {userEnteredValue:{numberValue:value}};if(typeof value==='boolean')return {userEnteredValue:{boolValue:value}};return {userEnteredValue:{stringValue:String(value)}};}
function append_(sheetName,objects){if(!objects.length)return null;return {appendCells:{sheetId:sheet_(sheetName).getSheetId(),rows:objects.map(function(o){return {values:record_(sheetName,o).map(cell_)};}),fields:'userEnteredValue'}};}
function update_(sheetName,obj){var values=record_(sheetName,obj);return {updateCells:{range:{sheetId:sheet_(sheetName).getSheetId(),startRowIndex:obj._row,endRowIndex:obj._row+1,startColumnIndex:0,endColumnIndex:values.length},rows:[{values:values.map(cell_)}],fields:'userEnteredValue'}};}
function batch_(requests){Sheets.Spreadsheets.batchUpdate({requests:requests.filter(Boolean)},spreadsheet_().getId());}
function withLock_(fn){var lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('O sistema está ocupado. Tente novamente.');try{return fn();}finally{lock.releaseLock();}}
function uuid_(){return Utilities.getUuid();}
function now_(){return new Date().toISOString();}
function checkId_(v){if(typeof v!=='string'||!v||v.length>120)throw new Error('Identificador inválido.');return v;}
function products_(){return rows_('Produtos').map(function(p){p.ativo=p.ativo===true;p.pontos_por_unidade=Number(p.pontos_por_unidade);return p;});}
function publicProduct_(p){return {id:p.produto_id,nome:p.nome,referencia:p.quantidade_referencia,pontos:p.pontos_por_unidade};}
function catalog_(){return {products:products_().filter(function(p){return p.ativo;}).sort(function(a,b){return a.ordem_exibicao-b.ordem_exibicao;}).map(publicProduct_)};}
function hash_(value){var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value),Utilities.Charset.UTF_8);return Utilities.base64EncodeWebSafe(bytes);}
function createDonation_(payload){
  return withLock_(function(){
    var key=checkId_(payload.idempotencyKey),personId=checkId_(payload.professionalId),people=rows_('Profissionais'),person=people.find(function(p){return p.profissional_id===personId&&p.ativo===true;});
    if(!person)throw new Error('Profissional indisponível. Atualize a consulta.');
    if(!Array.isArray(payload.items)||payload.items.length>31)throw new Error('Lista de produtos inválida.');
    var seen=Object.create(null),normalized=payload.items.map(function(i){if(!i||typeof i.produtoId!=='string'||seen[i.produtoId])throw new Error('Produto repetido ou inválido.');seen[i.produtoId]=true;return [i.produtoId,quantity_(i.quantidade)];}).filter(function(i){return i[1]>0;}).sort(function(a,b){return a[0].localeCompare(b[0]);});
    var requestHash=hash_([personId,normalized]),existing=rows_('Doacoes').find(function(d){return d.chave_idempotencia===key;});
    if(existing){if(existing.hash_solicitacao!==requestHash)throw new Error('Esta tentativa já foi usada para outra doação. Inicie um novo cadastro.');return {id:existing.doacao_id,protocol:existing.protocolo,status:existing.status,points:existing.pontos_previstos};}
    var items=itemsFromDeclaration_(payload.items,products_());
    var id=uuid_(),protocol='GIN26-'+Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyyMMdd')+'-'+id.replace(/-/g,'').slice(-8).toUpperCase(),now=now_();
    var donation={doacao_id:id,protocolo:protocol,profissional_id:personId,equipe_id:person.equipe_id,criado_em:now,status:'AGUARDANDO_VALIDACAO',pontos_previstos:sumPoints_(items,'pontos_previstos'),pontos_confirmados:0,validado_em:'',validado_por:'',versao_registro:1,chave_idempotencia:key,hash_solicitacao:requestHash};
    items.forEach(function(i){i.item_id=uuid_();i.doacao_id=id;});
    batch_([append_('Doacoes',[donation]),append_('Itens_Doacao',items)]);
    return {id:id,protocol:protocol,status:donation.status,points:donation.pontos_previstos};
  });
}
function donationView_(d,people,items){var p=people.find(function(x){return x.profissional_id===d.profissional_id;});return {id:d.doacao_id,protocol:d.protocolo,professionalId:d.profissional_id,professionalName:p?p.nome:'',teamId:d.equipe_id,teamName:p?p.equipe_nome:'',createdAt:d.criado_em,status:d.status,projectedPoints:Number(d.pontos_previstos)||0,confirmedPoints:Number(d.pontos_confirmados)||0,validatedAt:d.validado_em,validatedBy:d.validado_por,version:Number(d.versao_registro),items:items.filter(function(i){return i.doacao_id===d.doacao_id;}).map(function(i){return {productId:i.produto_id,name:i.produto_nome_snapshot,reference:i.referencia_snapshot,unitPoints:Number(i.pontos_por_unidade_snapshot),declared:Number(i.quantidade_declarada),received:i.quantidade_validada===''?null:Number(i.quantidade_validada),projectedPoints:Number(i.pontos_previstos),confirmedPoints:Number(i.pontos_confirmados)};})};}
function validatedDonations_(payload){var id=checkId_(payload.professionalId),people=rows_('Profissionais'),person=people.find(function(p){return p.profissional_id===id;});if(!person)throw new Error('Profissional não encontrado.');var items=rows_('Itens_Doacao'),all=rows_('Doacoes').filter(function(d){return d.status==='VALIDADA';});var donations=all.filter(function(d){return d.profissional_id===id;}).map(function(d){return donationView_(d,people,items);}).sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);});return {donations:donations,totalConfirmed:donations.reduce(function(n,d){return n+d.confirmedPoints;},0),teamTotalConfirmed:all.filter(function(d){return d.equipe_id===person.equipe_id;}).reduce(function(n,d){return n+Number(d.pontos_confirmados||0);},0)};}
function pending_(payload){var q=String(payload.query||'').trim().toLocaleLowerCase('pt-BR');if(q.length<2||q.length>120)throw new Error('Digite ao menos duas letras ou o protocolo.');var people=rows_('Profissionais'),items=rows_('Itens_Doacao');return {donations:rows_('Doacoes').filter(function(d){var p=people.find(function(x){return x.profissional_id===d.profissional_id;});return (d.status==='AGUARDANDO_VALIDACAO'||d.status==='VALIDADA')&&(d.protocolo.toLowerCase().includes(q)||p&&p.nome.toLocaleLowerCase('pt-BR').includes(q));}).slice(0,100).map(function(d){return donationView_(d,people,items);})};}
function detail_(payload){var id=checkId_(payload.donationId),d=rows_('Doacoes').find(function(x){return x.doacao_id===id;});if(!d)throw new Error('Doação não encontrada.');return donationView_(d,rows_('Profissionais'),rows_('Itens_Doacao'));}
function changeDonation_(payload,identity,correction){return withLock_(function(){
  var d=rows_('Doacoes').find(function(x){return x.doacao_id===checkId_(payload.donationId);});if(!d)throw new Error('Doação não encontrada.');
  var expected=correction?'VALIDADA':'AGUARDANDO_VALIDACAO';if(d.status!==expected||Number(d.versao_registro)!==payload.version)throw new Error('Esta doação foi alterada. Atualize a tela antes de salvar.');
  var opKey=checkId_(payload.operationKey),past=rows_('Historico_Validacoes').find(function(h){return h.chave_operacao===opKey;});if(past)throw new Error('Esta operação já foi concluída. Atualize a tela.');
  var reason=correction?String(payload.reason||'').trim():'';if(correction&&(reason.length<10||reason.length>500))throw new Error('Informe uma justificativa de 10 a 500 caracteres.');
  var oldItems=rows_('Itens_Doacao').filter(function(i){return i.doacao_id===d.doacao_id;}),updated=itemsFromValidation_(payload.items,oldItems,products_()),oldPoints=Number(d.pontos_confirmados)||0,newPoints=sumPoints_(updated,'pontos_confirmados'),now=now_();
  var previous={status:d.status,points:oldPoints,items:oldItems.map(function(i){return [i.produto_id,i.quantidade_validada,i.pontos_confirmados];})};
  var next={status:'VALIDADA',points:newPoints,delta:newPoints-oldPoints,items:updated.map(function(i){return [i.produto_id,i.quantidade_validada,i.pontos_confirmados];})};
  var original=Object.create(null);oldItems.forEach(function(i){original[i.produto_id]=i;});var updates=[];var newItems=[];
  updated.forEach(function(i){if(original[i.produto_id])updates.push(update_('Itens_Doacao',Object.assign({},original[i.produto_id],i)));else{i.item_id=uuid_();i.doacao_id=d.doacao_id;newItems.push(i);}});
  d.status='VALIDADA';d.pontos_confirmados=newPoints;d.validado_em=now;d.validado_por=identity.email;d.versao_registro=Number(d.versao_registro)+1;
  var event={evento_id:uuid_(),doacao_id:d.doacao_id,tipo_evento:correction?'CORRECAO':'VALIDACAO',registrado_em:now,responsavel_email:identity.email,justificativa:reason,valores_anteriores:JSON.stringify(previous),valores_novos:JSON.stringify(next),chave_operacao:opKey};
  batch_([update_('Doacoes',d)].concat(updates,[append_('Itens_Doacao',newItems),append_('Historico_Validacoes',[event])]));
  return {protocol:d.protocolo,confirmedPoints:newPoints,delta:next.delta,professionalId:d.profissional_id};
});}
function doGet(){return HtmlService.createHtmlOutput('Módulo de doações da Gincana 2026. Acesse pelo site oficial.');}
function doPost(e){
  var message={requestId:'',ok:false,error:'Requisição inválida.'};
  try{var input=JSON.parse(e.parameter.payload||'{}');message.requestId=String(input.requestId||'').slice(0,120);message.result=dispatch_(input.method,input.data||{},input.token);message.ok=true;delete message.error;}catch(err){message.error=err&&err.message?err.message:'Erro inesperado.';}
  var template=HtmlService.createTemplateFromFile('Response');template.message=JSON.stringify(message).replace(/</g,'\\u003c');template.origin=JSON.stringify(PropertiesService.getScriptProperties().getProperty('PUBLIC_ORIGIN')||'https://ortopedia-spec.github.io');
  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function dispatch_(method,payload,token){
  if(method==='catalog')return catalog_();
  if(method==='createDonation')return createDonation_(payload);
  if(method==='validatedDonations')return validatedDonations_(payload);
  if(method==='authorize')return login_(payload.code);
  if(method==='logout')return logout_(token);
  var identity=requireValidator_(token);
  if(method==='pending')return pending_(payload);
  if(method==='detail')return detail_(payload);
  if(method==='validate')return changeDonation_(payload,identity,false);
  if(method==='correct')return changeDonation_(payload,identity,true);
  throw new Error('Operação não permitida.');
}
