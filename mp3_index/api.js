var express = require('express');
var router = express.Router();

var mp3_index = require('./index');

/* GET home page. */
router.get('/', function(req, res) {
  mp3_index.getIndex();
  res.json(mp3_index.rows);
});

router.get('/file_spec/:row_index', function(req, res) {
  mp3_index.getIndex();
  console.log(req.params.row_index);
  mp3_index.getRowSpec(req.params.row_index, function(err, spec) {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }

    res.json(spec);
  });
});

router.get('/all_rows', function(req, res) {
  mp3_index.getIndex();
  res.render('all_rows', {
    song_list: mp3_index.rows
  });
});

module.exports = router;
