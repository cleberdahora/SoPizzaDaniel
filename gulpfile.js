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
//var prefixer     = require('gulp-autoprefixer');
var minifyCSS    = require('gulp-minify-css');
var htmlmin      = require('gulp-htmlmin');
var browserSync  = require('browser-sync');
var jshint       = require('gulp-jshint');
var nodemon      = require('gulp-nodemon');
//var cdnizer      = require('gulp-cdnizer');
var url          = require('url');
var proxy        = require('proxy-middleware');
var argv         = require('yargs')
                    .alias('p', 'production')
                    .argv;

var production = argv.production;

var defaultTasks = [
  'js',
  'css',
  'html',
  'components',
  'images',
  'videos',
  //'nodemon',
  'bs',
];

gulp.task('default', defaultTasks, function () {
  // Build on file changes
  gulp.watch('app/js/**/*.js', ['js']);
  gulp.watch('app/css/**/*.less', ['css']);
  gulp.watch('app/html/**/*.html', ['html']);
  gulp.watch('app/images/**/*', ['images']);
  gulp.watch('app/videos/**/*', ['videos']);
  gulp.watch('app/components', ['components']);
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
  var lessConfig = {
    paths: ['app/components/lesshat/build', 'app/css/globals'],
    ieCompat: false,
    //strictMath: true
  };

  gulp.src('app/css/**/*.less')
    .pipe(plumber())
    .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(concat('app.css'))
      .pipe(less(lessConfig))
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

  gulp.src('app/html/index.html')
    //.pipe(cdnizer({
      //files: [
        //'cdnjs:jquery',
        //'cdnjs:angular.js',
        //'cdnjs:angular-ui-router',
        //'cdnjs:restangular'
      //],
      //fallbackScript: '<script>function cdnizerLoad(u) { document.write(' +
                      //'"<scr"+"ipt src=" + u + "></scr"+"ipt>"); }</script>',
    //}))
    .pipe(gulp.dest('app/dist/html'));

  gulp.src(['app/html/*/**/*.html'])
    .pipe(plumber())
    .pipe(htmlmin(htmlminOptions))
    .pipe(gulp.dest('app/dist/html'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('components', function() {
  gulp.src(['app/components/**/*'])
    .pipe(gulp.dest('app/dist/components'));
});

gulp.task('images', function() {
  gulp.src(['app/images/**/*'])
    .pipe(gulp.dest('app/dist/images'));
});

gulp.task('videos', function() {
  gulp.src(['app/videos/**/*'])
    .pipe(gulp.dest('app/dist/videos'));
});

gulp.task('bs', function() {
  var proxyOptions = url.parse('http://localhost:8888/api');
  proxyOptions.route = '/api';

  browserSync({
    server: {
      baseDir: 'app/dist',
      index: 'html/index.html',
      routes: {
        '/resources': 'app/dist'
      },
      middleware: [proxy(proxyOptions)]
    }
  });
});

gulp.task('nodemon', function(cb) {
  nodemon({
    script: 'server.js',
    nodeArgs: ['--harmony'],
    ext: 'js',
    watch: 'api',
    env: {
      IP: '127.0.0.1',
      PORT: 8888,
      DB_URI: 'mongodb://localhost/so_pizza'
    }
  });
});
