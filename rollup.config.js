import fs from 'fs';
import path from 'path';

import metablock from "./rollup-plugin-iitcplugin";

const buildPath = "dist";
const pluginsPath = "plugins";

let pluginsId = fs.readdirSync(pluginsPath)
	.filter((s) => s.slice(-10) === '.meta.json')
	.map((s) => s.slice(0, -10));

export default pluginsId.map((p) => ({
    input: path.join(pluginsPath, p + '.js'),
    output: {
      format: 'iife',
      name: 'setup',
      file: path.join(buildPath, p + '.user.js'),
      sourcemap: 'inline',
    },
    plugins: [
    	metablock({
    		id: p,
    		meta: require('./' + path.join(pluginsPath, p + '.meta.json')),
    		downloadRoot: 'https://le-jeu.github.io/iitc-plugins/',
    		//updateMeta: true,
    		timestamp: true
    	}),
    ]
}));