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
            css: {
                files: [{ expand: true, cwd: 'src/css', src: ['images/**'], dest: 'dist/styles' }]
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
                    dest: '.tmp/scripts/app',
                    ext: '.js'
                }]
            }
        },

        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // JS 文件优化方式，目前支持以下几种：
                    //   uglify: （默认） 使用 UglifyJS 来压缩代码
                    //   closure: 使用 Google's Closure Compiler 的简单优化模式
                    //   closure.keepLines: 使用 closure，但保持换行
                    //   none: 不压缩代码
                    //optimize: 'none',
                    // 模块根目录。默认情况下所有模块资源都相对此目录。
                    // 若该值未指定，模块则相对build文件所在目录。
                    // 若appDir值已指定，模块根目录baseUrl则相对appDir。
                    baseUrl: '.tmp/scripts/app',
                    // 指定输出目录，若值未指定，则相对 build 文件所在目录
                    dir: 'dist/scripts/app',
                    // 设置模块别名
                    // RequireJS 2.0 中可以配置数组，顺序映射，当前面模块资源未成功加载时可顺序加载后续资源
                    paths: {
                        'text': 'empty:',
                        'async': 'empty:',
                        'jquery': 'empty:',
                        'doT': 'empty:',
                        'director': 'empty:',
                        'EventEmitter': 'empty:'
                    },
                    // 在 RequireJS 2.0.2 中，输出目录的所有资源会在 build 前被删除
                    // 值为 true 时 rebuild 更快，但某些特殊情景下可能会出现无法预料的异常
                    keepBuildDir: true,
                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    //generateSourceMaps: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
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
        'coffee2js',
        'jade'
    ]);
}
