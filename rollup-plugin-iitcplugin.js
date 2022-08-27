const framework = `
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};
`;

const wrapper = {
  header: "function wrapper(plugin_info) {\n",
  footer:
    "setup.info = plugin_info; //add the script info data to the function as a property\n}\n",
};
const noWrapper = "setup.info = info;\n";

const injection = `
// inject code into site context
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };

var script = document.createElement('script');
// if on last IITC mobile, will be replaced by wrapper(info)
var mobile = \`script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);\`;
// detect if mobile
if (mobile.startsWith('script')) {
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/@plugin_id@.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
`;

export default function metablock(options = {}) {
  const pluginId = options.id;
  const baseConf = {
    author: "anonymous",
    name: "New plugin",
    category: "Misc",
    version: "0.1.0",
    description: "custom plugin",
    id: pluginId,
    namespace: "https://github.com/IITC-CE/ingress-intel-total-conversion",
    updateURL: false,
    downloadURL: false,
    match: "https://intel.ingress.com/*",
    grant: "none",
  };

  if (options.meta) {
    Object.keys(options.meta).forEach((key) => {
      if (key in baseConf) baseConf[key] = options.meta[key];
    });
  }

  const buildDate = new Date().toISOString();
  if (options.timestamp) {
    baseConf.version += "-" + buildDate.replace(/[-:]/g, "").slice(0, 15);
  }

  if (!options.withoutNamePrefix)
    baseConf.name = "IITC plugin: " + baseConf.name;

  if (options.downloadRoot) {
    if (options.downloadRoot.slice(-1) !== "/") options.downloadRoot += "/";
    baseConf.downloadURL = options.downloadRoot + pluginId + ".user.js";
    baseConf.updateURL =
      options.downloadRoot +
      pluginId +
      (options.updateMeta ? ".meta.js" : ".user.js");
  }

  const lines = [];
  lines.push("// ==UserScript==");
  for (const key in baseConf) {
    if (baseConf[key]) {
      lines.push(`// @${key.padEnd(13, " ")} ${baseConf[key]}`);
    }
  }
  lines.push("// ==/UserScript==");

  const header = lines.join("\n");
  const useMeta = options.updateMeta;
  const useWrapper = !options.noWrapper;

  return {
    banner() {
      return (
        header +
        "\n" +
        (useWrapper ? wrapper.header : "") +
        framework
      );
    },
    footer() {
      return (
        (useWrapper
          ? wrapper.footer + injection.replace("@plugin_id@", pluginId)
          : noWrapper)
      );
    },
    generateBundle() {
      if (useMeta)
        this.emitFile({
          type: "asset",
          fileName: pluginId + ".meta.js",
          source: header,
        });
    },
    resolveId (source, _, options ) {
      if (options.isEntry && source.includes(pluginId)) {
        return "iitc-plugin-entry-point"
      }
      return null;
    },
    load ( id ) {
      if (id === 'iitc-plugin-entry-point') {
        return `import setup from "./src/${pluginId}";
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();`; 
      }
      return null;
    }
  };
}
