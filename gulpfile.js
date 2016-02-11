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

// Default
gulp.task('default', ['lint', 'build', 'minify']);

gulp.task('build', function() {
  return gulp.src([
  	'./src/base.js',
  	'./src/connect.js', 
  	'./src/growfile.js',
  	'./src/actions.js',
  	'./src/grow-api.js',
    './src/sensors/ph.js',
  	'./src/export.js'
  ])
    .pipe(concat('grow.js'))
    .pipe(gulp.dest('./dist/'));
});

// Lint JS
gulp.task('lint', function() {
  return gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Minify JS
gulp.task('minify', function(){
  var uglifyOptions = {
      mangle: true,
      preserveComments : "license"
  };
  return gulp.src('dist/grow.js')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(rename('grow.min.js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify(uglifyOptions))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
});
 
// Run tests
gulp.task('test', ['lint', 'build'], function () {
	return gulp.src('test/*.js', {read: false})
		// gulp-mocha needs filepaths so you can't have any plugins before it 
		.pipe(mocha({reporter: 'nyan'}));
});
