const gulp = require("gulp");
const browserSync = require("browser-sync");
const useref = require("gulp-useref");
const uglify = require("gulp-uglify-es").default;
const gulpIf = require("gulp-if");
const cssnano = require("gulp-cssnano");
const htmlmin = require("gulp-htmlmin");

gulp.task("browserSync", () => {
  browserSync.init({
    server: {
      baseDir: "app"
    }
  });
});

gulp.task("build", ["useref", "copy"]);

gulp.task("useref", () => {
  return gulp
    .src("app/*.html")
    .pipe(useref())
    .pipe(gulpIf("*.js", uglify()))
    .pipe(gulpIf("*.css", cssnano()))
    .pipe(gulp.dest("dist"));
});

gulp.task("copy", () => {
  return gulp
    .src(["app/service-worker.js", "app/logo.png", "app/manifest.json"])
    .pipe(gulp.dest("dist"));
});
