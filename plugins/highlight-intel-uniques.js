// @author         jaiperdu
// @name           Highlight uniques captured/visited/scanned
// @category       Highlighter
// @version        1.5.0
// @description    Highlighter for unique visited/captured/scout controlled portals

let plugin = window.plugin.portalHighlighterVisited = function () { };

let [VISITED, CAPTURED, SCANNED] = [1,2,4];

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
        default: {opacity: 0, fillOpacity:0},
    },
    "Uniques (Captured)": {
        order: [CAPTURED],
        styles: [
            {},
        ],
        default: {radius:0},
    },
    "Uniques (Scoot controlled)": {
        order: [SCANNED],
        styles: [
            {},
        ],
        default: {radius:0},
    },
    "Uniques (Hide captured)": {
        order: [CAPTURED],
        styles: [
            {radius:0},
        ],
        default: {},
    },
    "Uniques (Hide visited)": {
        order: [VISITED | CAPTURED | SCANNED],
        styles: [
            {radius:0},
        ],
        default: {},
    },
    "Uniques (Hide scoot controlled)": {
        order: [SCANNED],
        styles: [
            {radius:0},
        ],
        default: {},
    },
};

plugin.highlighter = function (data, style) {
    let visited = data.portal.options.ent[2][18];

    if (visited == null) {
        data.portal.setStyle(style.default);
        return;
    }

    for (let i=0; i < style.order.length; i++) {
        if (visited & style.order[i]) {
            data.portal.setStyle(style.styles[i]);
            return;
        }
    }
    data.portal.setStyle(style.default);
};

var setup = function () {
    for (let name in plugin.styles) {
        let style = plugin.styles[name];
        window.addPortalHighlighter(name, function (data) {
            return plugin.highlighter(data, style);
        });
    }
}
