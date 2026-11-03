import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [team,name]=process.argv.slice(2);
if(!team||name===undefined){console.error('Uso: node scripts/atualizar_coordenadores.mjs "Nome exato da equipe" "Nome do coordenador"');process.exit(2)}
const base=JSON.parse(await readFile(resolve(root,'dist/data/equipes.json'),'utf8'));
if(!base.equipes.some(item=>item.nome===team)){console.error(`Equipe não encontrada: ${team}`);process.exit(2)}
const path=resolve(root,'dist/data/coordenadores.json');
const data=JSON.parse(await readFile(path,'utf8'));
data.coordenadores[team]=name;
data.atualizadoEm=new Date().toISOString();
await writeFile(path,JSON.stringify(data,null,2)+'\n','utf8');
console.log(`Coordenador de ${team} atualizado.`);
