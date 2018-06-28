const gulp = require("gulp");
const browserSync = require("browser-sync");
const useref = require("gulp-useref");
// const uglify = require("gulp-uglify");
const uglify = require("gulp-uglify-es").default;
const gulpIf = require("gulp-if");
// const babel = require("gulp-babel");
const cssnano = require("gulp-cssnano");

gulp.task("browserSync", () => {
  browserSync.init({
    server: {
      baseDir: "app"
    }
  });
});

gulp.task("useref", () => {
  return (
    gulp
      .src("app/*.html")
      .pipe(useref())
      // .pipe(gulpIf("*.js", babel({ presets: ["env"] })))
      .pipe(gulpIf("*.js", uglify()))
      .pipe(gulp.dest("dist"))
  );
});
gulp.task("css", () => {
  return gulp
    .src("app/css/*.css")
    .pipe(cssnano())
    .pipe(gulp.dest("dist/css"));
});
