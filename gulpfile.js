'use strict';

var gulp       = require('gulp');
var concat     = require('gulp-concat');
var traceur    = require('gulp-traceur');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('default', function() {
  // place code for your default task here
  //
});

gulp.task('js', function() {
  gulp.src('public/js/**/*.js')
    .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      .pipe(traceur({ sourceMaps: true, experimental: true }))
      .pipe(ngAnnotate())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public/dist'));
});

