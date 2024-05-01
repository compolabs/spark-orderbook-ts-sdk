/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs-extra");
const path = require("path");

const srcDir = path.resolve(__dirname, "../src");
const destDir = path.resolve(__dirname, "../dist");

const filterFunc = (src) => {
  return path.extname(src) === ".d.ts";
};

fs.copySync(srcDir, destDir, { filter: filterFunc });

console.log("Done");
