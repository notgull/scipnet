/*
 * gulpfile.js
 *
 * scipnet - Multi-tenant writing wiki software
 * Copyright (C) 2019 not_a_seagull, Ammon Smith
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const gulp = require('gulp');
const ts = require('gulp-typescript');
const transform = require('vinyl-transform');
const babelify = require('babelify');
const fs = require('fs');

const browserify = require('browserify')

const tsProject = ts.createProject('tsconfig.json');

gulp.task('ts', () => (
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'))
));

gulp.task('browserify', () => (
  browserify('dist/bundle.js')
    .transform("babelify", { presets: ["@babel/preset-env"] })
    .bundle()
    .pipe(fs.createWriteStream("release/bundle.js"))
));

gulp.task('default', gulp.series('ts', 'browserify'));

