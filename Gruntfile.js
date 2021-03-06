'use strict';
// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  var exec = require('child_process').exec;

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({
    // Project settings
    pkg: grunt.file.readJSON('package.json'),
    bower: grunt.file.readJSON('bower.json'),
    meta: {
      banner: '/**\n' + ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd hh:nn") %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */'
    },
    watch: {
      less: {
        files: ['less/{,*/}*.less'],
        tasks: ['less']
      }
    },
    concat: {
      options: {
        banner: '/*! forms-angular <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: [
          'js/forms-angular.js',
          'js/controllers/*.js',
          'js/directives/*.js',
          'js/filters/*.js',
          'js/services/*.js',
          'generated/*.js'
        ],
        dest: 'dist/forms-angular.js'
      }
    },
    copy: {

    },

//      If you are here because you just came across "task Fatal error: variable @input-border is undefined Use --force to continue.
//      Then make sure your bower.json specifies ~1.2 of git://github.com/t0m/select2-bootstrap-css.git#~1.2

    less: {
      dist: {
        options: {
          compile: true
        },
        files: {
          'dist/forms-angular-with-bs2.css': ['less/forms-angular-with-bs2.less'],
          'dist/forms-angular-with-bs3.css': ['less/forms-angular-with-bs3.less']
        }
      }
    },

    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
              '.tmp',
              'dist/*',
              'dist/.git*'
            ]
          }
        ]
      },
      server: '.tmp'
    },

    uglify: {
      options: {
        banner: '/*! forms-angular <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/forms-angular.js',
        dest: 'dist/forms-angular.min.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['js/services/utils.js']
      },
      all: [
        'Gruntfile.js',
        'server/{,*/}*.js',
        'js/{,*/}*.js',
        'test/{,*/}*.js'
      ]
    },
    karma: {
      options: {
        singleRun: true
      },
      unit: {
        configFile: 'config/karma.conf.js'
      },
      midway: {
        configFile: 'config/karma.midway.conf.js'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'dot'
        },
        src: ['test/api/**/*Spec.js']
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'], // '-a' for all files
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngAnnotate: {
      dist: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat/scripts',
            src: ['lib.js'],
            dest: '.tmp/concat/scripts'
          }
        ]
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'dist/',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/',
        ext: '.min.css'
      }
    },

    ngtemplates: {
      formsAngular: {
        cwd: '.',
        src: 'template/**.html',
        dest: 'generated/app.templates.js',
        options: {
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        },
        module: 'formsAngular'
      }
    }
  });

  grunt.registerTask('commit-tag-push', 'Do a git commit, tag and push', function (folder) {
    var startDir = process.cwd();
    var opts = grunt.config.get(['bump']).options;
    process.chdir(folder);
    var globalVersion = grunt.config.get().pkg.version;
    var commitMessage = opts.commitMessage.replace('%VERSION%', globalVersion);

    var done = this.async();
    var queue = [];
    var next = function () {
      if (!queue.length) {
        process.chdir(startDir);
        return done();
      }
      queue.shift()();
    };
    var runIt = function (behavior) {
      queue.push(behavior);
    };

    runIt(function () {
      exec('git commit ' + opts.commitFiles.join(' ') + ' -m "' + commitMessage + '"', function (err, stdout, stderr) {
        if (err) {
          grunt.fatal('Can not create the commit:\n  ' + stderr);
        }
        grunt.log.ok('Committed as "' + commitMessage + '"');
        next();
      });
    });

    var tagName = opts.tagName.replace('%VERSION%', globalVersion);
    var tagMessage = opts.tagMessage.replace('%VERSION%', globalVersion);

    runIt(function () {
      exec('git tag -a ' + tagName + ' -m "' + tagMessage + '"', function (err, stdout, stderr) {
        if (err) {
          grunt.fatal('Can not create the tag:\n  ' + stderr);
        }
        grunt.log.ok('Tagged as "' + tagName + '"');
        next();
      });
    });

    runIt(function () {
      exec('git push ' + opts.pushTo + ' && git push ' + opts.pushTo + ' --tags', function (err, stdout, stderr) {
        if (err) {
          grunt.fatal('Can not push to ' + opts.pushTo + ':\n  ' + stderr);
        }
        grunt.log.ok('Pushed to ' + opts.pushTo);
        next();
      });
    });

    next();
  });

  grunt.registerTask('npm-publish', 'Publish a package', function () {
    var done = this.async();
    exec('npm publish .', function (err, stdout, stderr) {
      grunt.log.ok(stdout);
      if (err) {
        grunt.fatal('Can publish to npm:\n  ' + stderr);
      }
      grunt.log.ok('Package published');
      done();
    });
  });

  var bumpLevel = grunt.option('bumpLevel') || 'patch';

  grunt.registerTask('build', [
    'check',
    'really-build'
  ]);

  grunt.registerTask('really-build', [
    'clean:dist',
    'ngtemplates',
    'concat',
    'ngAnnotate',
    'less',
    'cssmin',
    'uglify'
  ]);

  grunt.registerTask('check', [
    'jshint',
    'karma',
    'mochaTest'
  ]);

  grunt.registerTask('default', [
    'check'
  ]);

  // To do a minor / major release to something of the form
  // grunt release --bumpLevel=minor

  grunt.registerTask('release', [
    'build',
    'bump-only:' + bumpLevel,
    'bump-commit',
    'commit-tag-push:js-build',
    'npm-publish:npm-build'
  ]);

};
