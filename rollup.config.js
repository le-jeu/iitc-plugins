import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import url from "postcss-url";

import fs from "fs";
import path from "path";

import metablock from "./rollup-plugin-iitcplugin";

const buildPath = "dist";
const pluginsPath = "src";

let pluginsId = fs
  .readdirSync(pluginsPath)
  .filter((s) => s.slice(-10) === ".meta.json")
  .map((s) => s.slice(0, -10));

export default pluginsId.map((p) => ({
  input: path.join(pluginsPath, p + ".js"),
  output: {
    format: "iife",
    name: "setup",
    file: path.join(buildPath, p + ".user.js"),
  },
  plugins: [
    resolve(),
    postcss({
      inject: false,
      plugins: [
        url({
          url: "inline",
        }),
      ],
    }),
    babel({ babelHelpers: "bundled", presets: ["@babel/preset-env"] }),
    metablock({
      id: p,
      meta: require("./" + path.join(pluginsPath, p + ".meta.json")),
      downloadRoot: "https://le-jeu.github.io/iitc-plugins/",
      //updateMeta: true,
      timestamp: true,
    }),
  ],
}));
