/* Run manually after configuring SPREADSHEET_ID. Safe to run repeatedly. */
function initialize() { return withLock_(function(){
  var book=spreadsheet_(),created=[],inserted={Profissionais:0,Produtos:0};
  Object.keys(HEADERS_).forEach(function(name){var sheet=book.getSheetByName(name);if(!sheet){sheet=book.insertSheet(name);sheet.getRange(1,1,1,HEADERS_[name].length).setValues([HEADERS_[name]]);sheet.setFrozenRows(1);created.push(name);}else{var header=sheet.getRange(1,1,1,HEADERS_[name].length).getValues()[0];if(header.join('|')!==HEADERS_[name].join('|'))throw new Error('Cabeçalho incompatível em '+name);}});
  function addMissing(name,seed,key){var existing=Object.create(null);rows_(name).forEach(function(r){existing[r[key]]=true;});var missing=seed.filter(function(r){return !existing[r[key]];});if(missing.length){var s=sheet_(name),range=s.getRange(s.getLastRow()+1,1,missing.length,HEADERS_[name].length);range.setValues(missing.map(function(r){return record_(name,r).map(function(v){return typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v;});}));}inserted[name]=missing.length;}
  addMissing('Profissionais',SEED_PROFESSIONALS_,'profissional_id');addMissing('Produtos',SEED_PRODUCTS_,'produto_id');
  return {created:created,inserted:inserted,professionals:rows_('Profissionais').length,products:rows_('Produtos').length};
});}
