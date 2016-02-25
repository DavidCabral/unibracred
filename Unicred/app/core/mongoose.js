var mongoose = require('mongoose')
    , fs = require('fs')
    , models_path = process.cwd() + '/app/models'

var banco = "mongodb://127.0.0.1/unibracred";    

mongoose.connect(banco);
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('MongoDB connection error:', err);
});
db.once('open', function callback() {
    console.log('MongoDB connection is established');
});
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    mongoose.connect(banco);
});
db.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});

fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js'))
        require(models_path + '/' + file)
});