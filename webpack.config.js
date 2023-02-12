const path = require('path');

module.exports = {
  entry: ["./src/main.js"],
  optimization: {
    minimize: false,
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
