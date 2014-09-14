'use strict';

var gulp       = require('gulp');
var gulpif     = require('gulp-if');
var concat     = require('gulp-concat');
var traceur    = require('gulp-traceur');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var symlink    = require('gulp-symlink');
var uglify     = require('gulp-uglify');
var sass       = require('gulp-ruby-sass');
var argv       = require('yargs')
                  .alias('p', 'production')
                  .argv;

var production = argv.production;

gulp.task('default', ['js']);

// JavaScript build
gulp.task('js', function() {
  gulp.src('app/js/**/*.js')
    .pipe(gulpif(!production, symlink('app/dist/js')))
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.js'))
      .pipe(traceur({ sourceMaps: true, experimental: true }))
      .pipe(ngAnnotate())
     .pipe(gulpif(production, uglify({ warnings: true })))
    .pipe(gulpif(!production, sourcemaps.write('.')))
    .pipe(gulp.dest('app/dist'));
});

// Sass build
gulp.task('sass', function() {
  gulp.src('app/sass/**/*.scss')
    .pipe(gulpif(!production, symlink('app/dist/sass')))
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(sass(!production ? { sourcemap: true } : {}))
    .pipe(gulpif(!production, sourcemaps.write('.')))
    .pipe(gulp.dest('app/dist'));
});
