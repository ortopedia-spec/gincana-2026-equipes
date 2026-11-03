/* Google OAuth authorization-code flow. Codes are exchanged server-side over TLS. */
function oauthClaims_(idToken,clientId,now){
  if(typeof idToken!=='string'||idToken.length>12000)throw new Error('Resposta de identidade Google inválida.');
  var parts=idToken.split('.'),claims;
  if(parts.length!==3)throw new Error('Resposta de identidade Google inválida.');
  try{claims=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());}catch(e){throw new Error('Resposta de identidade Google inválida.');}
  var time=now||Math.floor(Date.now()/1000);
  if(claims.aud!==clientId||!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||!Number.isFinite(claims.exp)||claims.exp<=time||!Number.isFinite(claims.iat)||claims.iat>time+60||claims.email_verified!==true||typeof claims.sub!=='string'||!claims.sub||typeof claims.email!=='string')throw new Error('Identidade Google expirada ou inválida.');
  return {sub:claims.sub,email:claims.email.toLowerCase()};
}
function authorizedValidator_(identity){
  if(!rows_('Validadores').some(function(v){return String(v.email).trim().toLowerCase()===identity.email&&v.ativo===true;}))throw new Error('Esta conta não tem permissão para validar doações.');
  return identity;
}
function login_(code){
  if(typeof code!=='string'||!code||code.length>3000)throw new Error('Código de login inválido.');
  var settings=PropertiesService.getScriptProperties(),clientId=settings.getProperty('GOOGLE_CLIENT_ID'),secret=settings.getProperty('GOOGLE_CLIENT_SECRET'),origin=settings.getProperty('PUBLIC_ORIGIN')||'https://ortopedia-spec.github.io';
  if(!clientId||!secret||!origin)throw new Error('Login Google ainda não configurado.');
  var response=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',payload:{code:code,client_id:clientId,client_secret:secret,redirect_uri:origin,grant_type:'authorization_code'},muteHttpExceptions:true});
  if(response.getResponseCode()!==200)throw new Error('O login expirou ou não foi autorizado. Tente novamente.');
  var token=JSON.parse(response.getContentText()),identity=oauthClaims_(token.id_token,clientId);
  if(!token.access_token||!Number.isFinite(token.expires_in))throw new Error('Resposta Google incompleta.');
  var profile=UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token.access_token},muteHttpExceptions:true});
  if(profile.getResponseCode()!==200)throw new Error('Não foi possível confirmar a identidade Google.');
  var info=JSON.parse(profile.getContentText());
  if(info.sub!==identity.sub||String(info.email).toLowerCase()!==identity.email||info.email_verified!==true)throw new Error('Identidade Google inconsistente.');
  authorizedValidator_(identity);
  var session=Utilities.getUuid()+Utilities.getUuid(),cacheKey='session-'+hash_(session),ttl=Math.max(1,Math.min(3600,Math.floor(token.expires_in)));
  CacheService.getScriptCache().put(cacheKey,JSON.stringify(identity),ttl);
  return {sessionToken:session,email:identity.email,expiresIn:ttl};
}
function requireValidator_(session){
  if(typeof session!=='string'||session.length<60||session.length>120)throw new Error('Faça login com Google novamente.');
  var saved=CacheService.getScriptCache().get('session-'+hash_(session));
  if(!saved)throw new Error('Sua sessão expirou. Faça login novamente.');
  return authorizedValidator_(JSON.parse(saved));
}
function logout_(session){if(typeof session==='string'&&session.length>=60&&session.length<=120)CacheService.getScriptCache().remove('session-'+hash_(session));return {ok:true};}
