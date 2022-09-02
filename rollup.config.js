import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import url from "postcss-url";

import path from "path";

import iitcplugin from "./rollup-plugin-iitcplugin";

const buildName = process.env.BUILD;

const buildPath = "dist";
const pluginsPath = "src";

let pluginsId = ["search-guid", "portals-pictures", "what3words", "dialogs", "player-inventory"];

export default pluginsId.map((p) => ({
  input: path.join(pluginsPath, p),
  output: {
    format: "es",
    exports: "none",
    file: path.join(buildPath, p + ".user.js"),
    interop: "auto",
  },
  plugins: [
    iitcplugin({
      id: p,
      meta: require("./" + path.join(pluginsPath, p, "meta.json")),
      downloadRoot: "https://le-jeu.github.io/iitc-plugins/",
      //updateMeta: true,
      timestamp: buildName === "local",
      noWrapper: false,
      buildName: buildName,
    }),
    resolve({
      moduleDirectories: ['node_modules', 'src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    babel({ babelHelpers: "bundled", extensions: ['.jsx', '.ts', '.tsx'] }),
    postcss({
      inject: false,
      plugins: [
        url({
          url: "inline",
        }),
      ],
    }),
  ],
}));
