var express = require('express'),
    app = express(),
    fs = require('fs'),
    bodyParser = require('body-parser')

var controllers = {}
    , controllers_path = process.cwd() + '/app/controllers'
fs.readdirSync(controllers_path).forEach(function (file) {
    if (file.indexOf('.js') != -1) {
        controllers[file.split('.')[0]] = require(controllers_path + '/' + file)
    }
})

app.use(bodyParser());

var port = 5555;

var router = express.Router();
router.route('/documentacao').get(controllers.transacaoController.documentacao);
router.route('/testar/conexao').get(controllers.transacaoController.teste);
router.route('/comprar').post(controllers.transacaoController.comprar);
router.route('/sacar').post(controllers.transacaoController.sacar);
router.route('/transacoes').post(controllers.transacaoController.viewTransacoes);
router.route('/pagar/conta').post(controllers.transacaoController.pagar_conta);
router.route('/pagar/fatura').post(controllers.transacaoController.pagar_fatura);



app.use('/api', router);

app.listen(port, function (){
    console.log('servidor rodando na porta : '+port)
});