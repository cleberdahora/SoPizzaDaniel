'use strict';

var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var concat       = require('gulp-concat');
var traceur      = require('gulp-traceur');
var sourcemaps   = require('gulp-sourcemaps');
var ngAnnotate   = require('gulp-ng-annotate');
var uglify       = require('gulp-uglify');
var sass         = require('gulp-ruby-sass');
var prefixer     = require('gulp-autoprefixer');
var minifyCSS    = require('gulp-minify-css');
var browserSync  = require('browser-sync');
var argv         = require('yargs')
                    .alias('p', 'production')
                    .argv;

var production = argv.production;

gulp.task('default', ['js', 'sass', 'bs'], function () {
  // Build on file changes
  gulp.watch('app/js/**/*.js', ['js']);
  gulp.watch('app/sass/**/*.scss', ['sass']);
});

// JavaScript build
gulp.task('js', function() {
  return gulp.src('app/js/**/*.js')
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.js'))
      .pipe(traceur({ sourceMaps: true, experimental: true }))
      .pipe(ngAnnotate())
      .pipe(gulpif(production, uglify({ warnings: true })))
    .pipe(gulpif(!production, sourcemaps.write()))
    .pipe(gulp.dest('app/dist'))
    .pipe(browserSync.reload({ stream: true }));
});

// Sass build
gulp.task('sass', function() {
  return gulp.src('app/sass/**/*.scss')
    .pipe(sass(!production ? { sourcemap: true } : {}))
    .pipe(gulpif(!production, sourcemaps.init({ loadMaps: true })))
      .pipe(prefixer({ browsers: ['> 4%', 'last 2 versions'] }))
      .pipe(gulpif(production, minifyCSS()))
    .pipe(gulpif(!production, sourcemaps.write()))
    .pipe(gulp.dest('app/dist'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('bs', function() {
  browserSync({
    server: {
      baseDir: 'app/dist',
      index: 'index.html'
    }
  });
});
