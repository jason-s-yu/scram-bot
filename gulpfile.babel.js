import gulp from 'gulp';
import typescript from 'gulp-typescript';
import del from 'del';
import merge from 'merge-stream';

const dir = {
  src: 'src',
  build: 'dist'
};

gulp.task('clean', () => del([ dir.build ]));

gulp.task('envs', () => {
  const prismaEnv = gulp.src('prisma/.env')
    .pipe(gulp.dest(`${dir.build}/prisma`));
  // const projectEnv = gulp.src('.env')
  //   .pipe(gulp.dest(`${dir.build}`));
  return prismaEnv;
});

gulp.task('dirs', () => {
  return gulp.src('*.*', { read: false })
    .pipe(gulp.dest(`${dir.build}/${dir.src}/commands`));
});

gulp.task('server', () => {
  let entry = gulp.src(`${dir.src}/bot.ts`)
    .pipe(typescript(require('./tsconfig.json').compilerOptions))
    .pipe(gulp.dest(`${dir.build}/${dir.src}`));
  let everything_else = gulp.src('./*(!(node_modules|prod_modules|tests|.git))/**/*.ts')
    .pipe(typescript(require('./tsconfig.json').compilerOptions))
    .pipe(gulp.dest(`${dir.build}`));
  return merge(entry, everything_else);
});

gulp.task('default', gulp.series('clean', 'dirs', 'server', 'envs'));
