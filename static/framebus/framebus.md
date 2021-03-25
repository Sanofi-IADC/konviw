#### To create the framebus WebPack:

* Clone the framebus repository: `git clone https://github.com/braintree/framebus`
* Add `"rootDir": "src", "skipLibCheck": true,` in ./tsconfig.json (in `compilerOptions` array)
* Add those npm packages in framebus project: `npm install --save-dev webpack webpack-cli typescript ts-loader`
* Check if `"module"` is set to `"commonjs"` in ./tsconfig.json (in `compilerOptions` array)
* Create a new file at the root of your project named `webpack.config.json` and put this inside:
 
```
//webpack.config.js
const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src/index.ts",  // <--- Index file for framebus package
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: "framebus.js" // <--- Will be compiled to this file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};

```


* In the package.json, add this launch script: `"build": "webpack"`
* In the root directory, launch this command: `npx webpack -w`
* You can now find the generated file in ./build folder
* Fix eslint problems in the generated file (it will automaticaly replace some var by const and other minor changes)
* Remove the `const`/`var` before the `Framebus = /** @class */ (function () {` (arond ligne 47)
* Add the Framebus version you used at the top of the file
* Take this file and put it in the ./static folder in the CPV project (replace the current framebus.js by the new generated file)

