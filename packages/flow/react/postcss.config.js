require('dotenv').config();

const postcssImport = require('postcss-import');
const postcssNested = require('postcss-nested');
const postcssCombine = require('postcss-combine-duplicated-selectors');
const postcssRename = require('postcss-rename');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = (ctx) => {
  return {
    plugins: [
      postcssImport,
      postcssNested,
      postcssCombine,
      postcssRename({
        strategy: (className) => className.replace('xy', 'react'),
      }),
      autoprefixer,
      ctx.env === 'production' && cssnano,
    ],
  };
};

