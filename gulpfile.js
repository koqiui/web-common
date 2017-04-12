var gulp = require('gulp');
var browserify = require('browserify');
var glob = require('glob');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var estream = require('event-stream');
var template = require('art-template');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var open = require('open');

template.config('base', path.join(__dirname, 'test', 'mocha'));
template.config('extname', '.tpl.html');

var indexTitle = 'Mocha测试';
var indexDir = path.join(__dirname, 'test', 'mocha');

gulp.task('default', function (done) {
    console.log('default gulp task');

    var scriptFileNames = [];

    glob('./test/*.spec.js', function (err, fileEntries) {
        if(err) {
            done(err);
        }
        //
        var tasks = fileEntries.map(function (fileEntry) {
            return browserify(fileEntry)
            .bundle()
            .pipe(source(fileEntry))
            .pipe(rename(function (filePath) {
                var fileBasename = filePath.basename;
                fileBasename = fileBasename.substring(0, fileBasename.indexOf('.spec'));
                fileBasename = fileBasename + '.test';
                filePath.dirname = 'browser';
                filePath.basename = fileBasename;
                filePath.extname = filePath.extname;
                scriptFileNames.push(path.join('../browser', fileBasename + filePath.extname).replace(/\\/g, '/'));
            })).pipe(gulp.dest('./test'));
        });

        estream.merge(tasks).on('end', function () {
            done.apply(null, arguments);

            var templateData = {
                pageTitle: indexTitle,
                scriptFileNames: scriptFileNames
            };

            console.log(scriptFileNames);

            var indexHtml = template('index', templateData);

            fs.writeFileSync(path.join(indexDir, 'index.html'), indexHtml);
            //

            shell.cd(__dirname);
            //open("http://localhost/test/mocha/index.html");

            //
            setTimeout(function () {
                shell.exec('http-server -p80');
            }, 0);
        });
        //
    });
});