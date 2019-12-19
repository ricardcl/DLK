var gulp = require("gulp");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var tsProject = ts.createProject("tsconfig.json");
var exec = require('child_process').exec;

gulp.task("ts", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("app/dist"));
});

gulp.task("tslint", () =>
    gulp.src('app/src/**/*.ts')
        .pipe(tslint({
            formatter: "prose",
            configuration: "tslint.json"
        }))
        .pipe(tslint.report())
);

gulp.task("assets", (done) => {
    gulp.src('app/assets/**')
    .pipe(gulp.dest("app/dist/assets"));
    done();
});



gulp.task("start", () => {
    exec('node app/dist/main.js');
});


gulp.task('build', gulp.series('tslint', 'ts', 'assets'));
//gulp.task('build', ['tslint', 'ts', "assets"]);

gulp.task('run', gulp.series('build', 'start'));
//gulp.task('run', ['build', 'start']);



