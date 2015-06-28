'use strict';

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: { dist: ['.tmp', 'dist'] },
        copy: {
            mock: { files: [{ expand: true, cwd: 'mock', src: ['**'], dest: 'dist' }] },
            css_images: { files: [{ expand: true, cwd: 'src/css', src: ['images/**'], dest: 'dist/styles' }] },
            blog: { files: [{ expand: true, cwd: 'blog', src: ['settings.json', 'categories.json', 'favicon.ico', 'CNAME'], dest: 'dist'}] },
            templates: { files: [{ expand: true, cwd: 'src', src: ['templates/**'], dest: '.tmp/scripts/app' }] },
            css: { files: [{ expand: true, cwd: 'src/css', src: ['**.css'], dest: '.tmp/styles' }] },
            swiper: { files: [{ expand: true, cwd: 'bower_components/swiper/dist/css', src: ['swiper.css'], dest: '.tmp/styles' }] }
        },

        less: {
            options: {
                compress: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: './src/less',
                    src: '*.less',
                    dest: '.tmp/styles',
                    ext: '.css'
                }]
            }
        },
        
        cssmin: {
            dist: { files: [ { expand: true, cwd: '.tmp/styles', src: 'index.css', dest: 'dist/styles', ext: '.css' } ] }
        },
        
        concat: {
            dist: {
                src: [
                    'bower_components/zeptojs/src/zepto.js',
                    'bower_components/zeptojs/src/event.js',
                    'bower_components/zeptojs/src/ajax.js',
                    'bower_components/zeptojs/src/ie.js',
                    'bower_components/zeptojs/src/detect.js',
                    'bower_components/zeptojs/src/fx.js',
                    'bower_components/zeptojs/src/deferred.js',
                    'bower_components/zeptojs/src/callbacks.js',
                    'bower_components/zeptojs/src/touch.js',
                    'bower_components/zeptojs/src/gesture.js'
                ],
                dest: '.tmp/scripts/lib/zepto.js'
            }
        },

        uglify: {
            bower_components: {
                files: [
                    { expand: true, cwd: 'bower_components/requirejs', src: ['require.js'], dest: 'dist/scripts/lib' },
                    { expand: true, cwd: 'bower_components/text', src: ['text.js'], dest: '.tmp/scripts/lib' },
                    { expand: true, cwd: 'bower_components/async/lib', src: ['async.js'], dest: '.tmp/scripts/lib' },
                    { expand: true, cwd: 'bower_components/doT', src: ['doT.js'], dest: '.tmp/scripts/lib' },
                    { expand: true, cwd: 'bower_components/director/build', src: ['director.js'], dest: '.tmp/scripts/lib' },
                    { expand: true, cwd: 'bower_components/swiper/dist/js', src: ['swiper.jquery.js'], dest: '.tmp/scripts/lib' },
                    { expand: true, cwd: 'bower_components/EventEmitter', src: ['EventEmitter.js'], dest: '.tmp/scripts/lib' }
                ]
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
                    optimize: 'none',
                    // 模块根目录。默认情况下所有模块资源都相对此目录。
                    // 若该值未指定，模块则相对build文件所在目录。
                    // 若appDir值已指定，模块根目录baseUrl则相对appDir。
                    baseUrl: '.tmp/scripts/app',
                    mainConfigFile: 'src/requirejs.conf.js',
                    // 指定输出目录，若值未指定，则相对 build 文件所在目录
                    //dir: 'dist/scripts/app',
                    // 仅优化单个模块及其依赖项
                    name: "main",
                    out: "dist/scripts/app/main.js",
                    // 在 RequireJS 2.0.2 中，输出目录的所有资源会在 build 前被删除
                    // 值为 true 时 rebuild 更快，但某些特殊情景下可能会出现无法预料的异常
                    keepBuildDir: true,
                    // 处理所有的文本资源依赖项，从而避免为加载资源而产生的大量单独xhr请求
                    inlineText: true,
                    stubModules: ['text'],
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
    grunt.registerTask('default', [
        'clean',
        'copy',
        'less',
        'cssmin',
        'concat',
        'uglify',
        'coffee',
        'requirejs',
        'jade'
    ]);
}
