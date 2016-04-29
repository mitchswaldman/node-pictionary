var mongoose = require('mongoose');
var Schema = mongoose.Schema,
            ObjectId = Schema.ObjectId;
var Schema_Word = new mongoose.Schema({
        _id     : ObjectId,
        word_id : Number,
        word    : String
    });

var collection = mongoose.model('pictionary_collection', Schema_Word, 'pictionary_collection');



function WordRetrival (){
}
// Retrives a random word from the database.
WordRetrival.prototype.getWord = function(){
    //mongoose.connection.once('open', function(){
        var w_id = Math.floor(Math.random() * (1752) + 1);
        var query = {};
        var word_id = "word_id";
        query[word_id] = w_id;
        var wordString = collection.find(query, function(err, word){
            if (err) {
                console.log(err);
            } 
            //console.log(word[0].word);
        });
        //console.log(wordString);
        return wordString;
    //});

}



module.exports = WordRetrival;