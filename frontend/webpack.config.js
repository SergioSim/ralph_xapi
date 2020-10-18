module.exports = {
  watch: true,
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  output: {
    path: "/app/frontend/static/frontend",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        } 
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
};