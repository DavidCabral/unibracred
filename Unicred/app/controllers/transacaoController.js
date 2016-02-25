var mongoose = require('mongoose'),
    Transacao = mongoose.model("Transacao"),   
    ObjectId = mongoose.Types.ObjectId

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');

var request = require('sync-request');


//show databases
// use unibracred
//collection
//db.transacaos.drop()


var getSaldo = function (numeroCartao) {
    //verifica o saldo do cartão informado       
    try {
        var url = properties.get('service.cartao.teste');
        var cartao = request('POST', url, {
            json: { numeroCartao: numeroCartao }
        });
        
        return JSON.parse(cartao.getBody('utf8')).saldo;    

    } catch (err) {
        throw new Error('Nao Foi Possivel conectar ao service de Conta Cartao, url ' + url);
    }    
};

var validaSaldo = function (numeroCartao, valor) {
   
    var saldoCartao = getSaldo(numeroCartao);

    if (valor > saldoCartao) {        
       throw new Error('saldo insuficiente')
    } else {        
        return saldoCartao - valor;
    }
};

var atualizaSaldo = function (numeroCartao, valor) {
        
    try {
        var url = properties.get('service.cartao.teste');
        var cartao = request('POST', url, {
            json: {
                numeroCartao: numeroCartao , 
                saldo: Number(valor)
            }
        });
    } catch (err) {

        throw new Error('Nao Foi Possivel conectar ao service de Conta Cartao, url ' + url);
    }    
    
};


exports.comprar = function (req, res) {    
    var par = Number(req.body.parcela);
    var valor = Number(req.body.valor);
    //recebe o saldo para comparação posterior  
    try {
        var saldoCartao = validaSaldo(req.body.numero_cartao, valor);
        atualizaSaldo(req.body.numero_cartao , saldoCartao);
    } catch (err) {
        console.log(err)
        res.status(500);
        res.json({
            cod: 01,
            error: err.message
        })
        return;
    }
      
    //se houver algum parcelamento as parcelas serão criadas   
    if (par > 1) {
        
        for (i = 1; i <= par; i++) {
            var d = new Date;     
            d.setMonth(d.getMonth() + i);            
            var transacaoModel = new Transacao();
            transacaoModel.descricao = "Compra Parcelada " + i + "\\" + par;
            transacaoModel.numero_cartao = req.body.numero_cartao;
            transacaoModel.id_cliente = req.body.id_cliente;
            transacaoModel.data_compra = new Date;
            transacaoModel.cod_natureza = 1;
            transacaoModel.data_cobranca = d;
            transacaoModel.valor = valor / par;
        }

        res.status(200);
        res.json({
            cod: 00,
            error: ""
        })
    } else {
        var transacaoModel = new Transacao(req.body);
        
        transacaoModel.descricao = "Compra Rotativa";
        transacaoModel.data_compra = new Date;
        transacaoModel.data_cobranca = new Date;
        transacaoModel.cod_natureza = 0;

        transacaoModel.save(function (err, transacao) {
            if (err) {
                res.status(500);
                res.json({
                    cod: 01,
                    error: "erro ao registrar compra "
                })
            } else {
                res.status(200);
                res.json({
                    cod: 00,
                    error: ""
                })
            }
        })
    }
    
    
}

exports.sacar = function (req, res) {
    var transacaomodel = new Transacao(req.body);
    
    //recebe o saldo para comparação posterior  
    try {
        var saldoCartao = validaSaldo(req.body.numero_cartao, transacaomodel.valor);
        atualizaSaldo(req.body.numero_cartao , saldoCartao);
    } catch (err) {
        console.log(err)
        res.status(500);
        res.json({
            cod: 01,
            error: err.message
        })
        return;
    }
    
        
    transacaomodel.descricao = "Saque";
    transacaomodel.data_compra = new Date;
    transacaomodel.data_cobranca = new Date;
    transacaomodel.cod_natureza = 2;
    
    transacaomodel.save(function (err, transacao) {
        if (err) {
            res.status(500);
            res.json({
                cod: 01,
                error: "erro ao registrar compra "
            })
        } else {
            res.status(200);
            res.json({
                cod: 00,
                error: ""
            })
        }
    })
}

exports.viewTransacoes = function (req, res, next) {
    //recebe a data inicial
    var parts = req.body.data_inicial.split('/');   
    // converte a data inicial
    var start = new Date(parts[2], parts[1] - 1, parts[0]); 
    console.log('data start ' + start);
    //recebe a data final
    parts = req.body.data_final.split('/');   
    // converte a data final
    var end = new Date(parts[2], parts[1] - 1, parts[0] ,23,59,59); 
    console.log('data fim ' + end);
    
    Transacao.find({ numero_cartao : req.body.numero_cartao , data_cobranca: { $gte: start, $lt: end }  }, function (err, transacao) {
        if (err) {
            res.status(500);
            res.json({
                type: false,
                data: "Error occured: " + err
            })
        } else {
            res.status(200);          
            res.json(transacao);
        }
    });
}

exports.pagar_conta = function (req, res) {
    var transacaomodel = new Transacao(req.body);
    
    //recebe o saldo para comparação posterior  
    try {
        var saldoCartao = validaSaldo(req.body.numero_cartao, transacaomodel.valor);
        atualizaSaldo(req.body.numero_cartao , saldoCartao);
    } catch (err) {
        console.log(err)
        res.status(500);
        res.json({
            cod: 01,
            error: err.message
        })
        return;
    }
    
    

    transacaomodel.descricao = "Pagamento de Conta";
    transacaomodel.data_compra = new Date;
    transacaomodel.data_cobranca = new Date;
    transacaomodel.cod_natureza = 3;
    
    transacaomodel.save(function (err, transacao) {
        if (err) {
            res.status(500);
            res.json({
                cod: 01,
                error: "erro ao registrar compra "
            })
        } else {
            res.status(200);
            res.json({
                cod: 00,
                error: ""
            })
        }
    })
}

exports.pagar_fatura = function (req, res) {
    var transacaomodel = new Transacao(req.body);    
    //recebe o saldo para comparação posterior  
    try {
        var saldoCartao = getSaldo(transacaomodel.numero_cartao);
        atualizaSaldo(req.body.numero_cartao , saldoCartao+transacaomodel.valor);
    } catch (err) {
        console.log(err)
        res.status(500);
        res.json({
            cod: 01,
            error: err.message
        })
        return;
    }
    
    transacaomodel.descricao = "Pagamento de Fatura";
    transacaomodel.data_compra = new Date;
    transacaomodel.data_cobranca = new Date;
    transacaomodel.cod_natureza = 4;
    
    transacaomodel.save(function (err, transacao) {
        if (err) {
            res.status(500);
            res.json({
                cod: 01,
                error: "erro ao registrar compra "
            })
        } else {
            res.status(200);
            res.json({
                cod: 00,
                error: ""
            })
        }
    })
}



 


