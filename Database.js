var mongoose = require('mongoose');

function Database(){
    this.URL = 'mongodb://172username:172password@ec2-52-32-28-93.us-west-2.compute.amazonaws.com:27017/pictionarydb';
}

Database.prototype.connectTo = function () {
    mongoose.connect(this.URL);
    // CONNECTION EVENTS 
    // When successfully connected 
    mongoose.connection.on('connected', function () { console.log('Mongoose default connection open to ' + this.URL); }); 
    // If the connection throws an error 
    mongoose.connection.on('error',function (err) { console.log('Mongoose default connection error: ' + err); }); 
    // When the connection is disconnected 
    mongoose.connection.on('disconnected', function () { console.log('Mongoose default connection disconnected'); });
    console.log('Mongoose readyState: ' + mongoose.connection.readyState);
}

module.exports = Database;
