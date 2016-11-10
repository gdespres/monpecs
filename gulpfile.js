// ============================================================================
// GULPFILE
// ============================================================================
//
// Available tasks : 
//     gulp 
//     gulp build
//     gulp clean
//     gulp javascript
//     gulp javascript:clean
//     gulp stylesheet
//     gulp stylesheet:clean
//     gulp stylesheet:img
//     gulp vendors
//     gulp vendors:clean
//     gulp watch
//     gulp watchify
//
// ============================================================================

// gulp
var gulp = require('gulp');

// gulp-plugins
var browserify     = require('browserify');
var browserSync    = require('browser-sync').create();
var del            = require('del');
var babel          = require('gulp-babel');
var less           = require('gulp-less');
var ngAnnotate     = require('gulp-ng-annotate');
var sass           = require('gulp-sass');
var sourcemaps     = require('gulp-sourcemaps');
var uglify         = require('gulp-uglify');
var gutil          = require('gulp-util');
var assign         = require('lodash.assign');
var mainBowerFiles = require('main-bower-files');
var buffer         = require('vinyl-buffer');
var source         = require('vinyl-source-stream');
var watchify       = require('watchify');

gulp.task('sass', function() {
    browserSync.notify('Compiling CSS ...');
    gutil.log('Compiling CSS ...');
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('public/css'))
        .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('default', ['sass', 'html', 'js']);

// gulp.task('watch', function() {
//     gulp.watch('src/scss/**/*.scss', ['sass']);
// })

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles({
        overrides: {
            bootstrap: {
                main: [ "./less/**/!(variables).less", "./dist/fonts/*", "./dist/js/bootstrap.*" ]
            }
        }}), {
            base: 'bower_components'
        })
        .pipe(gulp.dest('public/lib'));
});

gulp.task('bootstrap:prepareLess', ['bower'], function() {
  return gulp.src('src/less/bootstrap/variables.less')
    .pipe(gulp.dest('public/lib/bootstrap/less'));
});

gulp.task('bootstrap:compileLess', ['bootstrap:prepareLess'], function() {
  return gulp.src('public/lib/bootstrap/less/bootstrap.less')
    .pipe(less())
    .pipe(gulp.dest('public/lib/bootstrap/dist/css'))
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

// ----------------------------------------------------------------------------
// CONFIGURATIONS
// ----------------------------------------------------------------------------

var src    = 'src';
var dest   = 'public'; 
var config = {
    
    /**
     * 
     */
    js : {
        src  : src + '/js/index.js',
        dest : dest + '/js'
    }
}

// ----------------------------------------------------------------------------
// TASK : js:clean
// ----------------------------------------------------------------------------

gulp.task('js:clean', function() {

    return del(config.js.dest);
});

// ----------------------------------------------------------------------------
// TASK : js
// ----------------------------------------------------------------------------

gulp.task('js', ['js:clean'], function() {

	var bundler = browserify(config.js.src, { debug : true });

  	return bundler.bundle()
	    .on('error', gutil.log)
	    .pipe(source('bundle.js'))
	    .pipe(buffer())
	    .pipe(ngAnnotate())
		.pipe(babel({
            presets: ['es2015']
        }))
	    .pipe(uglify().on('error', gutil.log))
	    .pipe(gulp.dest(config.js.dest))
});

// ----------------------------------------------------------------------------
// TASK : js:watchify
// ----------------------------------------------------------------------------

var customOpts = {
    entries: [config.js.src],
    debug: true
}
var opts = assign({}, watchify.args, customOpts);
var bundler = watchify(browserify(opts));

gulp.task('js:watchify', ['js:clean'], bundle);
bundler.on('update', bundle);
bundler.on('log', gutil.log);

function bundle() {
    let t = Date.now();
    gutil.log('Starting Watchify Bundle');
    return bundler.bundle()
        .on('error', function(err) {
            gutil.log(err.message);
            browserSync.notify("Browserify Error!");
            this.emit('end');
        })
        .on('end', function() {
            gutil.log('Finished Bundling after: ', gutil.colors.magenta(Date.now() - t + 'ms'));
        })
        .pipe(source('bundle.js'))
	    .pipe(buffer())
	    .pipe(ngAnnotate())
		.pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(config.js.dest))
        .pipe(browserSync.stream({once: true}));
}

// ----------------------------------------------------------------------------
// TASK : html
// ----------------------------------------------------------------------------

gulp.task('html', function() {
     return gulp.src('src/**/*.html')
         .pipe(gulp.dest('public'));
});

// ----------------------------------------------------------------------------
// TASK : serve
// ----------------------------------------------------------------------------

gulp.task('watch', ['js:watchify'], function() {

    browserSync.init({
        server: {
            baseDir: 'public'
        },
        open: false
    });
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/**/*.html', ['html']).on('change', browserSync.reload);
    gulp.watch('src/less/bootstrap/variables.less', ['bootstrap:compileLess']);
});