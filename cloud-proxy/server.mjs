import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const allowedOrigin='https://ortopedia-spec.github.io';
const allowedMethods=new Set(['catalog','createDonation','validatedDonations','authorize','logout','pending','detail','validate','correct']);

export function createServer({upstream=process.env.APPS_SCRIPT_URL,fetchImpl=fetch}={}){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(upstream||''))throw new Error('APPS_SCRIPT_URL inválido.');
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    const origin=req.headers.origin;
    if(origin===allowedOrigin){
      res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
      res.setHeader('Vary','Origin');
    }
    if(req.url==='/healthz'&&req.method==='GET'){
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}).end('{"ok":true}');
      return;
    }
    if(req.url!=='/api'||origin!==allowedOrigin){res.writeHead(403).end();return;}
    if(req.method==='OPTIONS'){
      res.writeHead(204,{'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}).end();
      return;
    }
    if(req.method!=='POST'){res.writeHead(405).end();return;}
    try{
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>128*1024)throw new Error('Requisição muito grande.');chunks.push(chunk);}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if(!body||typeof body.requestId!=='string'||!(/^[a-f0-9-]{36}$/.test(body.requestId))||!allowedMethods.has(body.method))throw new Error('Requisição inválida.');
      const params=new URLSearchParams({transport:'json',payload:JSON.stringify(body)});
      const response=await fetchImpl(upstream,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params,signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error('Serviço indisponível.');
      const result=await response.json();
      if(!result||result.requestId!==body.requestId||typeof result.ok!=='boolean')throw new Error('Resposta inválida do serviço.');
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(result));
    }catch(error){
      const status=error instanceof SyntaxError||/Requisição/.test(error.message)?400:502;
      res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify({ok:false,error:status===400?error.message:'Não foi possível acessar o serviço de doações.'}));
    }
  });
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  createServer().listen(Number(process.env.PORT)||8080,'0.0.0.0');
}
