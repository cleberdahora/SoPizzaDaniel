'use strict';

var gulp       = require('gulp');
var gulpif     = require('gulp-if');
var concat     = require('gulp-concat');
var traceur    = require('gulp-traceur');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var symlink    = require('gulp-symlink');
var uglify     = require('gulp-uglify');
var argv       = require('yargs')
                  .alias('p', 'production')
                  .argv;

gulp.task('default', function() {
  // place code for your default task here
  //
});

gulp.task('js', function() {
  var production = argv.production;
  gulp.src('app/js/**/*.js')
    .pipe(gulpif(!production, symlink('public/dist/js')))
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.js'))
      .pipe(traceur({ sourceMaps: true, experimental: true }))
      .pipe(ngAnnotate())
     .pipe(gulpif(production, uglify({ warnings: true })))
    .pipe(gulpif(!production, sourcemaps.write('.')))
    .pipe(gulp.dest('app/dist'));
});


