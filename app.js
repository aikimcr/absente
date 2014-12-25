#! /usr/bin/node

var id3 = require('id3js');
var find = require('find');
var fs = require('fs');
var path = require('path');
var q = require('q');
var util = require('util');

var dir_path = process.argv[2];
var index = path.join(dir_path, 'index.json');

function file_spec(file_path) {
  return q.promise(function(resolve, reject, notify) {
    try {
      id3({file: file_path, type: id3.OPEN_LOCAL}, function(err, tags) {
        if (err) {
	  return resolve({
            title: '',
            artist: '',
            album: '',
            path: file_path
          });
	}	
        var spec = {
          title: tags.title,
          artist: tags.artist,
          album: tags.album,
          path: file_path
        };

        if (tags.v1) {
          if (tags.v1.track) spec.track = tags.v1.track;
          ['title', 'artist', 'album'].forEach(function(tagname) {
            if (tags.v1[tagname]) spec[tagname] = tags.v1[tagname];
          });
        }

        if (tags.v2) {
          ['title', 'artist', 'album'].forEach(function(tagname) {
            if (tags.v2[tagname]) spec[tagname] = tags.v2[tagname];
          });
        }

        Object.keys(spec).forEach(function(tagname) {
          var old_tag = spec[tagname];
          try {
            spec[tagname] = old_tag.replace(/\u0000/g, '');
          } catch(e) {
            spec[tagname] = old_tag;
          }
        });

        return resolve(spec);
      });
    } catch(e) {
      return resolve({
        title: '',
        artist: '',
        album: '',
        path: file_path
      });
    }
  });
}

function index_row(index_obj, row, index, index_keys) {
  if (index_keys.length > 0) {
    var current_key = index_keys.shift();
    if (current_key in row) current_key = row[current_key];
    if (index_keys.length > 0) {
      if (!index_obj[current_key]) index_obj[current_key] = {};
      index_row(index_obj[current_key], row, index, index_keys);
    } else if (index_obj[current_key]) {
      index_obj[current_key].push(index);
    } else {
      index_obj[current_key] = [index];
    }
  }
}

find.file(/\.mp3$/, dir_path, function(files) {
  var file_specs = [];

  if (fs.existsSync(index)) {
    var index_json = fs.readFileSync(index, {encoding: 'utf8'});
    file_specs = JSON.parse(index_json);
  }

  files.forEach(function(file) {
    file_specs.push(file_spec(file));
  });

  var specs_by_artist = {};
  var specs_by_title = {};
  var specs_by_album = {};

  q.all(file_specs).then(function(spec_list) {
    spec_list.forEach(function(spec, index) {
      index_row(specs_by_artist, spec, index, ['artist', 'titles', 'title', 'album']);
      index_row(specs_by_artist, spec, index, ['artist', 'albums', 'album', 'title']);
      index_row(specs_by_title, spec, index, ['title', 'artists', 'artist', 'album']);
      index_row(specs_by_title, spec, index, ['title', 'albums', 'album', 'artist']);
      index_row(specs_by_album, spec, index, ['album', 'artists', 'artist', 'title']);
      index_row(specs_by_album, spec, index, ['album', 'titles', 'title', 'artist']);
    });

    var result = {
      rows: spec_list,
      artists: specs_by_artist,
      titles: specs_by_title,
      albums: specs_by_album
    };

    fs.writeFileSync(index, JSON.stringify(result), {encoding: 'utf8'});
  }).fail(function(err) { throw err; });
}).error(function(err) { console.log(err); });
