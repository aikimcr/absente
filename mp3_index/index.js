var id3 = require('id3js');
var fs = require('fs');
var path = require('path');

function MP3Index(opt_dir_path) {
  if (opt_dir_path) {
    this.dir_path = opt_dir_path;
  } else {
    var cwd = process.cwd();
    var path_file = path.join(cwd, 'dir_path');

    if (fs.existsSync(path_file)) {
      this.dir_path = fs.readFileSync(path_file).toString();
    } else {
      this.dir_path = cwd;
    }
  }

  this.index_file = path.join(this.dir_path, 'index.json');
  this.rows = [];
  this.rows_by_artist = {};
  this.rows_by_title = {};
  this.rows_by_album = {};
}

MP3Index.empty_spec = {
  title: '',
  artist: '',
  album: '',
  path: ''
};

MP3Index.prototype.getFileSpec = function(file_path, cb) {
  try {
    id3({file: file_path, type: id3.OPEN_LOCAL}, function(err, tags) {
      if (err) return cb(err);
      return cb(null, tags);
    });
  } catch(err) {
    return cb(err);
  }
};

MP3Index.prototype.getRowSpec = function(row_index, cb) {
  if (this.rows[row_index]) {
    return this.getFileSpec(this.rows[row_index].path, cb);
  } else {
    return cb(new Error('No such row'));
  }
};

MP3Index.prototype.buildIndeces = function() {
  this.rows_by_artist = {};
  this.rows_by_title = {};
  this.rows_by_album = {};

  this.rows.forEach(function(row, index) {
    if (!this.rows_by_artist[row.artist]) this.rows_by_artist[row.artist] = [];
    this.rows_by_artist[row.artist].push(index);

    if (!this.rows_by_title[row.title]) this.rows_by_title[row.title] = [];
    this.rows_by_title[row.title].push(index);

    if (!this.rows_by_album[row.album]) this.rows_by_album[row.album] = [];
    this.rows_by_album[row.album].push(index);
  }.bind(this));
};

MP3Index.prototype.getIndex = function() {
  if (fs.existsSync(this.index_file)) {
    var index_json = fs.readFileSync(this.index_file).toString();
    this.rows = JSON.parse(index_json);
  }

  this.buildIndeces();
  return this;
};

module.exports = new MP3Index();
