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
                    { expand: true, cwd: 'bower_components/jekyll-blog-app', src: ['dist/**', 'jekyll/**'], dest: '.'}
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
