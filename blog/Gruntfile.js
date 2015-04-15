'use strict';

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
            dist: ['_site']
        },
        copy: {
            app: {
                files: [
                    { expand: true, cwd: 'bower_components/jekyll-blog-app/dist', src: ['**'], dest: '.'},
                    { expand: true, cwd: 'bower_components/jekyll-blog-app/jekyll', src: ['**'], dest: '.'}
                ]
            }
        },
        exec: {
            dist: {
                cwd: '.',
                command: 'jekyll build',
                callback: function(){
                    grunt.log.write('jekyll build done.')
                }
            }
        }
    });
    grunt.registerTask('default', ['clean', 'copy', 'exec']);
}
