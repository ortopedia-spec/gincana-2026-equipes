/* Pure rules. Also exercised by the Node tests without Apps Script services. */
function quantity_(value) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error('Informe uma quantidade inteira entre 0 e 1.000.000.');
  return value;
}
function points_(quantity, unitPoints) {
  var result = quantity_(quantity) * Number(unitPoints);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Pontuação fora do limite permitido.');
  return result;
}
function itemsFromDeclaration_(input, products) {
  if (!Array.isArray(input) || input.length > products.length) throw new Error('Lista de produtos inválida.');
  var byId = Object.create(null), seen = Object.create(null), result = [];
  products.forEach(function(p) { byId[p.produto_id] = p; });
  input.forEach(function(item) {
    if (!item || typeof item.produtoId !== 'string' || seen[item.produtoId]) throw new Error('Produto repetido ou inválido.');
    seen[item.produtoId] = true;
    var p = byId[item.produtoId], q = quantity_(item.quantidade);
    if (!p || p.ativo !== true) throw new Error('Produto indisponível: ' + item.produtoId);
    if (q) result.push({produto_id:p.produto_id, produto_nome_snapshot:p.nome, referencia_snapshot:p.quantidade_referencia, pontos_por_unidade_snapshot:p.pontos_por_unidade, quantidade_declarada:q, quantidade_validada:'', pontos_previstos:points_(q,p.pontos_por_unidade), pontos_confirmados:0});
  });
  if (!result.length) throw new Error('Selecione ao menos um alimento.');
  return result;
}
function itemsFromValidation_(input, oldItems, products) {
  if (!Array.isArray(input) || input.length > products.length) throw new Error('Lista de conferência inválida.');
  var old = Object.create(null), catalog = Object.create(null), seen = Object.create(null), result = [];
  oldItems.forEach(function(i) { old[i.produto_id] = i; });
  products.forEach(function(p) { catalog[p.produto_id] = p; });
  input.forEach(function(i) {
    if (!i || typeof i.produtoId !== 'string' || seen[i.produtoId]) throw new Error('Produto repetido ou inválido.');
    seen[i.produtoId] = true;
    var q = quantity_(i.quantidade), previous = old[i.produtoId], p = catalog[i.produtoId];
    if (!previous && (!p || p.ativo !== true)) throw new Error('Produto indisponível: ' + i.produtoId);
    if (!previous && !q) return;
    var copy = previous ? Object.assign({},previous) : {produto_id:p.produto_id,produto_nome_snapshot:p.nome,referencia_snapshot:p.quantidade_referencia,pontos_por_unidade_snapshot:p.pontos_por_unidade,quantidade_declarada:0,pontos_previstos:0};
    copy.quantidade_validada = q;
    copy.pontos_confirmados = points_(q,copy.pontos_por_unidade_snapshot);
    result.push(copy);
  });
  oldItems.forEach(function(i) { if (!seen[i.produto_id]) throw new Error('A conferência deve incluir todos os itens declarados.'); });
  return result;
}
function sumPoints_(items, field) { return items.reduce(function(total,i){ var next=total+Number(i[field]||0); if (!Number.isSafeInteger(next)) throw new Error('Pontuação fora do limite.'); return next; },0); }
