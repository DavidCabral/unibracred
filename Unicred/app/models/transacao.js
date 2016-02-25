var mongoose = require("mongoose");
var Schema   = mongoose.Schema;
 

var TransacaoSchema = new Schema({
    numero_cartao: String,
    id_cliente: String,
    descricao: String,
    data_compra: Date,
    data_cobranca : Date,
    cod_natureza : Number,    
    valor: Number,
  
});
mongoose.model('Transacao', TransacaoSchema);