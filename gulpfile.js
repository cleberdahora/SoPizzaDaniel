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
var browserSync  = require('browser-sync');
var jshint       = require('gulp-jshint');
var nodemon      = require('gulp-nodemon');
//var cdnizer      = require('gulp-cdnizer');
var lodash       = require('lodash');
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
  'server'
];

gulp.task('default', defaultTasks, function () {
  // Build on file changes
  gulp.watch('public/js/**/*.js', ['js']);
  gulp.watch('public/css/**/*.less', ['css']);
  gulp.watch('public/html/**/*.html', ['html']);
  gulp.watch('public/images/**/*', ['images']);
  gulp.watch('public/videos/**/*', ['videos']);
  gulp.watch('public/components', ['components']);
});

gulp.task('build', ['js', 'css', 'html', 'components', 'images', 'videos']);

// JavaScript build
gulp.task('js', function() {
  gulp.src('public/js/**/*.js')
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
    .pipe(gulp.dest('public/dist'))
    .pipe(browserSync.reload({ stream: true }));
});

// CSS build
gulp.task('css', function() {
  var lessConfig = {
    paths: ['public/components/lesshat/build', 'public/css/globals'],
    ieCompat: false,
    //strictMath: true
  };
  var prefixerConfig = {
    browsers: ['> 4%', 'last 2 versions']
  };

  gulp.src('public/css/**/*.less')
    .pipe(plumber())
    .pipe(less(lessConfig))
    .pipe(concat('app.css'))
    .pipe(prefixer(prefixerConfig))
    .pipe(gulpif(production, minifyCSS()))
    .pipe(gulp.dest('public/dist'))
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

  gulp.src('public/html/index.html')
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
    .pipe(gulp.dest('public/dist/html'));

  gulp.src(['public/html/*/**/*.html'])
    .pipe(plumber())
    .pipe(htmlmin(htmlminOptions))
    .pipe(gulp.dest('public/dist/html'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('components', function() {
  gulp.src(['public/components/**/*'])
    .pipe(gulp.dest('public/dist/components'));
});

gulp.task('images', function() {
  gulp.src(['public/images/**/*'])
    .pipe(gulp.dest('public/dist/images'));
});

gulp.task('videos', function() {
  gulp.src(['public/videos/**/*'])
    .pipe(gulp.dest('public/dist/videos'));
});

gulp.task('server', function(cb) {
  var startProxy = lodash.once(function() {
    browserSync({
      proxy: 'localhost:8888'
    });
    cb();
  });

  nodemon({
    script: 'server.js',
    nodeArgs: ['--harmony'],
    ext: 'js',
    watch: ['api', 'services', 'config', 'server.js'],
    env: {
      IP: '127.0.0.1',
      PORT: 8888,
      MONGOHQ_URL: 'mongodb://localhost:27017/so_pizza'
    }
  })
  .on('start', function() {
    lodash.delay(startProxy, 1000);
  });
});
