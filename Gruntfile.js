'use strict';

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
            dist: ['.tmp', 'dist']
        },

        copy: {
            blog: {
                files: [{ expand: true, cwd: 'blog', src: ['settings.json', 'categories.json', 'CNAME'], dest: 'dist'}]
            },
            mock: {
                files: [{ expand: true, cwd: 'mock', src: ['**'], dest: 'dist' }]
            },
            templates: {
                files: [{ expand: true, cwd: 'src', src: ['templates/**'], dest: 'dist/scripts/app' }]
            },
            bower_components: {
                files: [
                    { expand: true, cwd: 'bower_components/requirejs', src: ['require.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/text', src: ['text.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/async/lib', src: ['async.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/doT', src: ['doT.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/director/build', src: ['director.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/EventEmitter', src: ['EventEmitter.js'], dest: 'dist/scripts/lib' }
                ]
            }
        },

        concat: {
            dist: {
                src: [
                    'bower_components/zeptojs/src/zepto.js',
                    'bower_components/zeptojs/src/event.js',
                    'bower_components/zeptojs/src/callbacks.js',
                    'bower_components/zeptojs/src/deferred.js',
                    'bower_components/zeptojs/src/ajax.js'
                ],
                dest: 'dist/scripts/lib/zepto.js'
            }
        },

        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: './src/css',
                    src: '{,*/}*.css',
                    dest: 'dist/styles',
                    ext: '.css'
                }]
            }
        },

        less: {
            options: {
                compress: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: './src/less',
                    src: '{,*/}*.less',
                    dest: 'dist/styles',
                    ext: '.css'
                }]
            }
        },

        coffee: {
            dist: {
                files: [{
                    // rather than compiling multiple files here you should
                    // require them into your main .coffee file
                    expand: true,
                    cwd: './src/coffee',
                    src: '{,*/}*.coffee',
                    dest: 'dist/scripts/app',
                    ext: '.js'
                }]
            }
        },

        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    optimize: 'none',
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: '.tmp/scripts',
                    name: 'main',
                    out: 'dist/scripts/main.js',
                    paths: {
                        'async': '../../bower_components/async/lib/async',
                        'jquery': '../../.tmp/lib/jquery',
                        'doT': '../../bower_components/doT/doT',
                        'director': '../../bower_components/director/build/director',
                        'EventEmitter': '../../bower_components/EventEmitter/EventEmitter'
                    },
                    shim: {
                      async: {
                        exports: 'async'
                      },
                      jquery: {
                        exports: 'Zepto'
                      },
                      doT: {
                        exports: 'doT'
                      },
                      director: {
                        exports: 'Router'
                      },
                      EventEmitter: {
                        exports: 'EventEmitter'
                      }
                    },
                    wrapShim: true,

                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    //generateSourceMaps: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    //wrap: true,
                    wrap: {
                      startFile: [
                        'bower_components/almond/almond.js'
                      ]
                    }
                    //uglify2: {} // https://github.com/mishoo/UglifyJS2
                }
            }
        },

        jade: {
            'dist/index.html': './src/index.jade'
        },

        htmlmin: {
            dist: {
                options: {
                    removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    //useShortDoctype: true,
                    removeEmptyAttributes: true
                    //removeOptionalTags: true
                },
                files: [ 
                  { expand: true, cwd: '.tmp', src: ['*.html'], dest: './dist' }
                ]
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            options: {
                livereload: '<%= connect.options.livereload %>'
            },
            cssmin: {
                files: ['./css/{,*/}*.css'],
                tasks: ['cssmin', 'jade']
            },
            less: {
                files: ['./less/{,*/}*.less'],
                tasks: ['less', 'jade']
            },
            coffee: {
                files: ['./coffee/{,*/}*.coffee'],
                tasks: ['coffee', 'jade']
            },
            jade: {
                files: ['./{,*/}*.jade', './templates/{,*/}*.tmpl.html'],
                tasks: ['jade']
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                debug: true,
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            dist: {
                options: {
                    open: true,
                    base: 'dist'
                }
            }
        }
    });
    grunt.registerTask('serve', ['connect', 'watch']);
    grunt.registerTask('coffee2js', ['coffee', 'requirejs']);
    grunt.registerTask('default', [
        'clean',
        'copy',
        'concat',
        'cssmin',
        'less',
        'coffee',
        'jade'
    ]);
}
