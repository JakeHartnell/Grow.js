var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var onError = function (err) {
  gutil.log(gutil.colors.green(err));
};
var sourcemaps = require('gulp-sourcemaps');
var mocha = require('gulp-mocha');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var gulpDoxx = require('gulp-doxx');

// Default
gulp.task('default', ['lint', 'build']);

gulp.task('build', function() {
  return gulp.src([
  	'./src/base.js',
  	'./src/connect.js', 
  	'./src/actions.js',
    './src/api.js',
    './src/growfile.js',
  	'./src/export.js'
  ])
    .pipe(concat('grow.js'))
    .pipe(gulp.dest('./'));
});

// Lint JS
// TODO: setup to work with ES6
gulp.task('lint', function() {
  return gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Build documentation using mr-doc
// https://github.com/mr-doc/mr-doc
gulp.task('docs', function() {

  gulp.src(['grow.js', 'README.md'], {base: '.'})
    .pipe(gulpDoxx({
      title: 'Grow.js',
      urlPrefix: '/docs'
    }))
    .pipe(gulp.dest('docs'));

});

// Minify JS
gulp.task('minify', function(){
  var uglifyOptions = {
      mangle: true,
      preserveComments : "license"
  };
  return gulp.src('grow.js')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(rename('grow.min.js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify(uglifyOptions))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
});
 
// Run tests
gulp.task('test', ['build'], function () {
	return gulp.src('test/*.js', {read: false})
		// gulp-mocha needs filepaths so you can't have any plugins before it 
		.pipe(mocha({reporter: 'nyan'}));
});
 
// EXPERIMENTAL... don't use, unless you're good with ES6 and can help
// convert this library over to it.
gulp.task('es6', function () {
  return gulp.src([
    './src/base.js',
    './src/connect.js', 
    './src/growfile.js',
    './src/actions.js',
    './src/grow-api.js',
    // './src/sensors/ph.js',
    // './src/sensors/sensor.js',
    './src/export.js'
  ])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    .pipe(concat('grow.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./build/'));
});
