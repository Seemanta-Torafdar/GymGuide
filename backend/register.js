require('reflect-metadata');
require('@babel/register')({
  extensions: ['.js'],
  ignore: [/node_modules/],
  cache: true,
});
