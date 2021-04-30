// @author         jaiperdu
// @name           Highlight uniques captured/visited/scanned
// @category       Highlighter
// @version        1.5.5
// @description    Highlighter for unique visited/captured/scout controlled portals

const plugin = window.plugin.portalHighlighterVisited = function () { };

const [VISITED, CAPTURED, SCANNED] = [1,2,4];

const hidden = {radius:0};

plugin.styles = {
    "Uniques ": {
        order: [CAPTURED, SCANNED, VISITED],
        styles: [
            {fillOpacity:0},
            {fillColor:'yellow'},
            {fillColor:'magenta'},
        ],
        default: {},
    },
    "Uniques (Visited)": {
        order: [CAPTURED, SCANNED, VISITED],
        styles: [
            {fillOpacity:0},
            {fillColor:'yellow'},
            {fillColor:'magenta'},
        ],
        default: hidden,
    },
    "Uniques (Captured)": {
        order: [CAPTURED],
        styles: [
            {},
        ],
        default: hidden,
    },
    "Uniques (Scout controlled)": {
        order: [SCANNED],
        styles: [
            {},
        ],
        default: hidden,
    },
    "Uniques (Hide captured)": {
        order: [CAPTURED],
        styles: [
            hidden,
        ],
        default: {},
    },
    "Uniques (Hide visited)": {
        order: [VISITED | CAPTURED | SCANNED],
        styles: [
            hidden,
        ],
        default: {},
    },
    "Uniques (Hide scout controlled)": {
        order: [SCANNED],
        styles: [
            hidden,
        ],
        default: {},
    },
};

const applyStyle = function (portal, style) {
    portal.setStyle(style);
    if (style.radius === 0) portal.setRadius(0);
};

plugin.highlighter = function (data, style) {
    const history = data.portal.options.data.history;
    const visited = history ? history._raw : data.portal.options.ent[2][18];

    if (visited == null) {
        applyStyle(data.portal,style.default);
        return;
    }

    for (let i=0; i < style.order.length; i++) {
        if (visited & style.order[i]) {
            applyStyle(data.portal, style.styles[i]);
            return;
        }
    }
    applyStyle(data.portal, style.default);
};

var setup = function () {
    for (const name in plugin.styles) {
        const style = plugin.styles[name];
        window.addPortalHighlighter(name, function (data) {
            return plugin.highlighter(data, style);
        });
    }
}
