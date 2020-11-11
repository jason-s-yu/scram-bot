import gulp from 'gulp';
import typescript from 'gulp-typescript';
import del from 'del';
import merge from 'merge-stream';

const dir = {
  src: 'src',
  build: 'build'
};

gulp.task('clean', () => del([ dir.build ]));

gulp.task('config', () => {
  return gulp.src('./src/config/*.json')
    .pipe(gulp.dest(`${dir.build}/src/config/`));
});

gulp.task('server', () => {
  let entry = gulp.src(`${dir.src}/bot.ts`)
    .pipe(typescript(require('./tsconfig.json').compilerOptions))
    .pipe(gulp.dest(`${dir.build}/${dir.src}`));
  let everything_else = gulp.src('./*(!(node_modules|tests))/**/*.ts')
    .pipe(typescript(require('./tsconfig.json').compilerOptions))
    .pipe(gulp.dest(`${dir.build}`));
  return merge(entry, everything_else);
});

gulp.task('default', gulp.series('clean', 'server', 'config'));