/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = function override(config) {
  return {
    ...config,
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        react: path.resolve('./node_modules/react')
      }
    }
  }
}
