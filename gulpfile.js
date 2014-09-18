'use strict';

var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var plumber      = require('gulp-plumber');
var concat       = require('gulp-concat');
var traceur      = require('gulp-traceur');
var sourcemaps   = require('gulp-sourcemaps');
var ngAnnotate   = require('gulp-ng-annotate');
var uglify       = require('gulp-uglify');
var less         = require('gulp-less');
var prefixer     = require('gulp-autoprefixer');
var minifyCSS    = require('gulp-minify-css');
var htmlmin      = require('gulp-htmlmin');
var htmlhint     = require('gulp-htmlhint');
var browserSync  = require('browser-sync');
var jshint       = require('gulp-jshint');
var argv         = require('yargs')
                    .alias('p', 'production')
                    .argv;

var production = argv.production;

gulp.task('default', ['js', 'css', 'html', 'bs'], function () {
  // Build on file changes
  gulp.watch('app/js/**/*.js', ['js']);
  gulp.watch('app/css/**/*.less', ['css']);
  gulp.watch('app/html/**/*.html', ['html']);
});

// JavaScript build
gulp.task('js', function() {
  gulp.src('app/js/**/*.js')
    .pipe(plumber())
    // Lint
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    // Build
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.js'))
      .pipe(traceur({ sourceMaps: true, experimental: true }))
      .pipe(ngAnnotate())
      .pipe(gulpif(production, uglify({ warnings: true })))
    .pipe(gulpif(!production, sourcemaps.write()))
    .pipe(gulp.dest('app/dist'))
    .pipe(browserSync.reload({ stream: true }));
});

// CSS build
gulp.task('css', function() {
  gulp.src('app/css/**/*.less')
    .pipe(plumber())
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.css'))
      .pipe(less({ paths: ['app/components/lesshat/build'], ieCompat: false }))
      // autoprefixer disabled, not working with less (2014-09-14)
      //.pipe(prefixer({ browsers: ['> 4%', 'last 2 versions'] }))
      .pipe(gulpif(production, minifyCSS()))
    .pipe(gulpif(!production, sourcemaps.write()))
    .pipe(gulp.dest('app/dist'))
    .pipe(browserSync.reload({ stream: true }));
});

// HTML build
gulp.task('html', function() {
  var htmlminOptions = {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    lint: false
  };

  gulp.src(['app/html/**/*.html'])
    .pipe(plumber())
    // Lint
    .pipe(htmlhint())
    .pipe(htmlhint.failReporter())
    // Build
    .pipe(htmlmin(htmlminOptions))
    .pipe(gulp.dest('app/dist/html'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('bs', function() {
  browserSync({
    server: {
      baseDir: 'app/dist',
      index: 'html/index.html',
      routes: {
        '/resources': 'app/dist'
      }
    }
  });
});
