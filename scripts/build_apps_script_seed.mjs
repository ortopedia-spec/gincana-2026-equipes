import fs from 'node:fs';
const base=JSON.parse(fs.readFileSync('dist/data/equipes.json','utf8'));
const products=JSON.parse(fs.readFileSync('backend/catalogo.json','utf8'));
if(base.equipes.length!==10||base.profissionais.length!==588||products.length!==31)throw new Error('Totais inesperados; revise a base antes de gerar o seed.');
const teams=new Map(base.equipes.map(t=>[t.id,t.nome]));
const people=base.profissionais.map(p=>({profissional_id:p.id,nome:p.nome,equipe_id:p.equipeId,equipe_nome:teams.get(p.equipeId),setor_unidade:p.informacoesComplementares?.setorUnidade||'',ativo:true}));
if(people.some(p=>!p.equipe_nome))throw new Error('Equipe ausente.');
fs.writeFileSync('backend/Seed.gs','var SEED_PROFESSIONALS_='+JSON.stringify(people)+';\nvar SEED_PRODUCTS_='+JSON.stringify(products)+';\n');
fs.writeFileSync('dist/catalog.js','// Catálogo normatizado da Gincana 2026; gerado de backend/catalogo.json.\nexport const products='+JSON.stringify(products.map(p=>({id:p.produto_id,nome:p.nome,referencia:p.quantidade_referencia,pontos:p.pontos_por_unidade})))+';\n');
