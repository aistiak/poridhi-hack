const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({

},{strict : false });

const Feed = mongoose.model('feeds', feedSchema);

module.exports = Feed;
