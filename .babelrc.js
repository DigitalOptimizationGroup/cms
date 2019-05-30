const env = process.env.NODE_ENV;

if (env === "commonjs" || env === "es") {
  module.exports = {
    presets: [["@babel/preset-env", { modules: false }]],
    plugins: []
  };

  if (env === "commonjs") {
    module.exports.plugins.push("@babel/plugin-transform-modules-commonjs");
  }
}
