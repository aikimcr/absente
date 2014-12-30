var express = require('express');
var router = express.Router();

var mp3_index = require('./index');

/* GET home page. */
router.get('/', function(req, res) {
  mp3_index.getIndex();
  res.json(mp3_index.rows);
});

router.get('/file_spec/:uid', function(req, res) {
  mp3_index.getIndex();
  var row = mp3_index.getRowByUID(req.params.uid);

  if (row) {
    mp3_index.getFileSpec(row.path, function(err, spec) {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      }

      res.json(spec);
    });
  } else {
    res.status(404).send('No such file entry');
  }
});

router.get('/all_rows', function(req, res) {
  mp3_index.getIndex();
  res.render('all_rows', {
    song_list: mp3_index.rows
  });
});

module.exports = router;
