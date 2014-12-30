#! /usr/bin/node

var mp3_index = require('../mp3_index');
var find = require('find');
var fs = require('fs');
var path = require('path');
var util = require('util');

var dir_path = process.argv[2];
var index_file = path.join(dir_path, 'index.json');

function file_spec(file_path, callback) {

  mp3_index.getFileSpec(file_path, function(err, tags) {
    if (err) {
      console.log(err);
      callback(err);
    }
    callback(null, mp3_index.rowFromSpec(file_path, tags));
  });
}

find.file(/\.mp3$/, dir_path, function(files) {
  var count = files.length;
  var file_specs = [];

  files.forEach(function(file, index) {
    var spec = file_spec(file, function(err, spec) {
      file_specs[index] = spec;
      count--;

      process.nextTick(function() {
        if (count === 0) {
          process.nextTick(function() {
            fs.writeFileSync(index_file, JSON.stringify(file_specs), {encoding: 'utf8'});
          });
        }
      });
    });
  });
}).error(function(err) { console.log(err); });
