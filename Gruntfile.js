module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: './public/javascripts/lib',
          install: false
        }
      },
      dev: {
        options: {
          targetDir: 'public/test/lib',
          install: false
        }
      }
    },
    bower_concat: {
      prod: {
        dest: './public/javascripts/lib/bower_lib.js',
        cssDest: './public/stylesheets/bower_lib.css',
        include: [
          'knockout',
          'q'
        ]
      },
      dev: {
        dest: './public/test/lib/bower_lib.js',
        cssDest: './public/test/lib/bower_lib.css',
        include: [
          'chai',
          'mocha',
          'sinon',
          'sinon-chai'
        ],
        mainFiles: {
          sinon: 'pkg/sinon.js',
          'sinon-chai': 'sinon-chai.js'
        }
      }
    },
    'bower-install-simple': {
      prod: {
        options: {
          production: true
        }
      },
      dev: {
        options: {
          production: false
        }
      }
    },
    mkdir: {
      crypto: {
        mode: 0700,
        create: ['crypto']
      }
    },
    database: {
      absente: {
        db_name: './absente.db',
        schema: './sql/schema.sql'
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-mkdir');

  grunt.registerTask('build_sinon', function() {
    var done = this.async();
    grunt.file.setBase('bower_components/sinon');
    grunt.util.spawn({
      cmd: 'npm',
      args: ['install', '--save-dev']
    }, function(err, result, code) {
      if (err) {
        grunt.fail.fatal('Got ' + err.toString() + ' doing npm install for sinon');
      } else if (code === 0) {
        grunt.util.spawn({
          cmd: './build'
        }, function(err, result, code) {
          if (err) {
            grunt.fail.fatal('Got ' + err.toString() + ' doing build for sinon');
          } else if (code === 0) {
            grunt.file.setBase('../..');
            done();
          } else {
            grunt.fail.fatal('build command failure ' + result.toString());
          }
        });
      } else {
        grunt.fail.fatal('npm install command failure ' + result.toString());
      }
    });
  });

  grunt.registerTask('rsa_files', function() {
    var done = this.async();
    var path = 'crypto';

    var key_file = path + '/rsa_private.pem';
    var pub_file = path + '/rsa_public.pem';

    [key_file, pub_file].forEach(function(pem_file) {
      if (grunt.file.exists(pem_file)) {
        grunt.file.copy(pem_file, pem_file + '.old');
      }
    });

    grunt.util.spawn({
      cmd: 'openssl',
      args: ['genrsa', '-out', key_file]
    }, function(err, result, code) {
      if (err) {
        grunt.fail.fatal('Got ' + err.toString() + ' creating key file');
      } else if (code === 0) {
          // grunt.log.writeln(result.toString());
          grunt.util.spawn({
            cmd: 'openssl',
            args: ['rsa', '-in', key_file, '-pubout', '-out', pub_file],
          }, function(err, result, code) {
            if (err) {
              grunt.fail.fatal('Got ' + err.toString() + ' creating public key');
            } else if (code === 0) {
              //grunt.log.writeln(result.toString());
              done();
            } else {
              grunt.fail.fatal('openssl rsa command failure ' + result.toString());
            }
          });
      } else {
        grunt.fail.fatal('openssl genrsa command failure ' + result.toString());
      }
    });
  });

  grunt.registerTask('crypto', function() {
    var path = 'crypto';

    if (!grunt.file.exists(path)) {
      grunt.file.mkdir(path, 0700);

      if (!grunt.file.exists(path)) {
        grunt.fail.fatal('Failed to create "' + path + '"');
      }

      grunt.task.run('rsa_files');
    }

    if (!grunt.file.isDir(path)) {
      grunt.fail.fatal('"' + path + '" is not a directory');
    }

  });

  grunt.registerTask('clean', function() {
    var files = [
      'public/javascripts/lib/bower_lib.js',
      'public/test/lib/bower_lib.js',
      'public/test/lib/bower_lib.css'
    ];

    files.forEach(function(file) {
      if (grunt.file.exists(file)) {
        grunt.file.delete(file);
      }
    });
  });

  grunt.registerTask('clean_bower', function() {
    grunt.task.run('clean');
    grunt.file.delete('bower_components');
  });

  grunt.registerTask('prodlib', ['bower-install-simple:prod']);
  grunt.registerTask('devlib', ['bower-install-simple:dev', 'build_sinon']);
  grunt.registerTask('prodjs', ['bower_concat:prod']);
  grunt.registerTask('devjs', ['bower_concat:dev']);

  grunt.registerTask('prod_build', ['prodlib', 'prodjs']);
  grunt.registerTask('dev_build', ['devlib', 'devjs']);

  grunt.registerTask('prod', ['prod_build', 'crypto']);
  grunt.registerTask('dev', ['prod', 'dev_build']);

  // Default task(s).
  grunt.registerTask('default', ['prod']);
};
