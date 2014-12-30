var mm = require('musicmetadata');
var id3 = require('id3js');
var fs = require('fs');
var path = require('path');
var uid = require('uid');
var util = require('util');

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

MP3Index.prototype.empty_spec = function() {
  return {
    uid: '',
    title: '',
    artist: '',
    album: '',
    path: ''
  };
};

MP3Index.prototype.normalizeTag_ = function(tag_value) {
  var old_tag = tag_value;
  try {
    return tag_value.replace(/\u0000/g, '');
  } catch(e) {
    return old_tag;
  }
};

MP3Index.prototype.setVSpec = function(vspec, spec) {
  ['track', 'title', 'artist', 'album'].forEach(function(tagname) {
    if (vspec[tagname]) {
      var tag_value = this.normalizeTag_(vspec[tagname]);
      if (tag_value.length > 0) spec[tagname] = tag_value;
    }
  }.bind(this));
};

MP3Index.prototype.rowFromSpec = function(file_path, tags) {
/*
  var spec = {
    uid: uid(32),
    title: this.normalizeTag_(tags.title),
    artist: this.normalizeTag_(tags.artist),
    album: this.normalizeTag_(tags.album),
    path: this.normalizeTag_(file_path),
    track: -1
  }

  if (tags.v1) this.setVSpec(tags.v1, spec);
  if (tags.v2) this.setVSpec(tags.v2, spec);

  return spec;
*/
  return {
    uid: uid(32),
    title: tags.title,
    artist: tags.artist,
    album: tags.album,
    path: file_path,
    track: tags.track.no
  };
};

MP3Index.prototype.getFileSpec = function(file_path, cb) {
  fs.exists(file_path, function(exists) {
    if (exists) {
/*
      try {
        id3({file: file_path, type: id3.OPEN_LOCAL}, function(err, tags) {
          if (err) return cb('File ' + file_path + ': ' + util.inspect(err));
          return cb(null, tags);
        });
      } catch(err) {
        return cb(err);
      }
*/
      var stream;

      try {
        stream = fs.createReadStream(file_path);
        var parser = mm(stream);

        parser.on('metadata', function (result) {
          cb(null, result);
        });

        parser.on('done', function(err) {
          if (err) cb(err);
          stream.destroy();
        });
      } catch(err) {
        cb('Error opening "' + file_path + '":' + err);
      }
    } else {
      return cb(new Error('File "' + file_path + '" does not exist!'));
    }
  });
};

MP3Index.prototype.getRowSpec = function(row_index, cb) {
  if (this.rows[row_index]) {
    return this.getFileSpec(this.rows[row_index].path, cb);
  } else {
    return cb(new Error('No such row'));
  }
};

MP3Index.prototype.getRowByUID = function(uid) {
  var match = this.rows.filter(function(row) {
    return row.uid === uid;
  });
  if (match.length > 0) return match[0];
  return null;
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
