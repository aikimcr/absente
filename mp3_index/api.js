var express = require('express');
var router = express.Router();

var mp3_index = require('./index');

/* GET home page. */
router.get('/', function(req, res) {
  mp3_index.getIndex();
  res.json(mp3_index.rows);
});

module.exports = router;
