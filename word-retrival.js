var mongoose = require('mongoose');

function WordRetrival (){
    // this.Schema = mongoose.Schema;
    // this.ObjectId = this.Schema.ObjectId;
    // this.Schema_Word = new mongoose.Schema({
    //     _id     : this.ObjectId,
    //     word_id : Number,
    //     word    : String
    // });
}
// Retrives a random word from the database.
WordRetrival.prototype.getWord = function(){
    mongoose.connection.once('open', function(){
        var Schema = mongoose.Schema,
            ObjectId = Schema.ObjectId;
        var Schema_Word = new mongoose.Schema({
            _id     : ObjectId,
            word_id : Number,
            word    : String
        });

        var collection = mongoose.model('pictionary_collection', Schema_Word, 'pictionary_collection');
        // var max;
        // collection.count({}, function(err, count){
        //     if (err) {
        //         console.log(err);
        //     };
        //     console.log(count);
        //     max = count;
        // });
        var w_id = Math.floor(Math.random() * (1752) + 1);
        var query = {};
        var word_id = "word_id";
        query[word_id] = w_id;
        collection.find(query, function(err, word){
            if (err) {
                console.log(err);
            } 
            console.log(word);
        });
    });
}



module.exports = WordRetrival;