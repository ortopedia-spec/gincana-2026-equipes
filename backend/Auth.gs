/* Credenciais do Serviço Social são lidas da aba Validadores em cada entrada. */
function validatorRows_(){
  var tab=sheet_('Validadores'),last=tab.getLastRow();
  if(last<2)return [];
  var range=tab.getRange(2,1,last-1,4),display=range.getDisplayValues(),values=range.getValues();
  return display.map(function(row,index){
    return {
      email:String(row[0]||'').trim().toLowerCase(),
      name:String(row[1]||'').trim(),
      active:values[index][2]===true,
      password:String(row[3]||'')
    };
  }).filter(function(row){return row.email!==''&&row.password!=='';});
}
function login_(email,password){
  var invalid='E-mail ou senha incorretos, ou acesso inativo';
  if(typeof email!=='string'||typeof password!=='string'||email.length>320||password.length>1024)throw new Error(invalid);
  var normalized=email.trim().toLowerCase();
  if(!normalized||!password)throw new Error(invalid);
  var account=validatorRows_().find(function(row){return row.email===normalized&&row.active&&row.password===password;});
  if(!account)throw new Error(invalid);
  var session=Utilities.getUuid()+Utilities.getUuid(),ttl=3600;
  CacheService.getScriptCache().put('session-'+hash_(session),JSON.stringify({email:account.email,name:account.name}),ttl);
  return {sessionToken:session,email:account.email,name:account.name,expiresIn:ttl};
}
function requireValidator_(session){
  if(typeof session!=='string'||session.length<60||session.length>120)throw new Error('Sua sessão expirou. Entre novamente.');
  var cache=CacheService.getScriptCache(),key='session-'+hash_(session),saved=cache.get(key);
  if(!saved)throw new Error('Sua sessão expirou. Entre novamente.');
  var identity=JSON.parse(saved);
  var current=validatorRows_().find(function(row){return row.email===identity.email&&row.active;});
  if(!current){cache.remove(key);throw new Error('Sua sessão expirou. Entre novamente.');}
  return {email:current.email,name:current.name};
}
function logout_(session){
  if(typeof session==='string'&&session.length>=60&&session.length<=120)CacheService.getScriptCache().remove('session-'+hash_(session));
  return {ok:true};
}
