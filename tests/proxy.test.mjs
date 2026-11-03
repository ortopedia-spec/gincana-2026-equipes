import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from '../cloud-proxy/server.mjs';

test('ponte HTTP aceita apenas a origem pública e repassa respostas JSON',async()=>{
  const upstream='https://script.google.com/macros/s/AKfycb_test/exec';
  let calls=0;
  const server=createServer({upstream,fetchImpl:async(url,options)=>{
    calls++;
    assert.equal(url,upstream);
    const sent=JSON.parse(new URLSearchParams(options.body).get('payload'));
    assert.equal(new URLSearchParams(options.body).get('transport'),'json');
    return new Response(JSON.stringify({requestId:sent.requestId,ok:true,result:{donations:[]}}),{status:200,headers:{'Content-Type':'application/json'}});
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  try{
    const url=`http://127.0.0.1:${server.address().port}/api`;
    const data={requestId:'11111111-1111-4111-8111-111111111111',method:'validatedDonations',data:{professionalId:'p1'}};
    const forbidden=await fetch(url,{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(data)});
    assert.equal(forbidden.status,403);assert.equal(calls,0);
    const preflight=await fetch(url,{method:'OPTIONS',headers:{Origin:'https://ortopedia-spec.github.io'}});
    assert.equal(preflight.status,204);
    const allowed=await fetch(url,{method:'POST',headers:{Origin:'https://ortopedia-spec.github.io','Content-Type':'application/json'},body:JSON.stringify(data)});
    assert.equal(allowed.status,200);assert.equal(allowed.headers.get('access-control-allow-origin'),'https://ortopedia-spec.github.io');
    assert.deepEqual((await allowed.json()).result,{donations:[]});assert.equal(calls,1);
  }finally{server.close();}
});
