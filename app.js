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

//find.__errorHandler = function(err) { console.log(err); };

find.file(/\.mp3$/, dir_path, function(files) {
  var file_specs = [];

  if (fs.existsSync(index)) {
    var index_json = fs.readFileSync(index, {encoding: 'utf8'});
    file_specs = JSON.parse(index_json);
  }

  files.forEach(function(file) {
    file_specs.push(file_spec(file));
  });

  q.all(file_specs).then(function(spec_list) {
    var index_struct = {
      artist: {
        album: {},
        title: {}
      },
      album: {
        artist: {},
        title: {}
      },
      title: {
        album: {},
        artist: {}
      }
    };

    //XXX There really needs to be a better way to index all this stuff.
    fs.writeFileSync(index, JSON.stringify(spec_list), {encoding: 'utf8'});
  }).fail(function(err) { throw err; });
}).error(function(err) { console.log(err); });
