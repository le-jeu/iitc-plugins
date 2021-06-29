## [Highlight uniques captured/visited/scanned][highlight-intel-uniques] from intel data

Since February 2021, the intel provides Portal History. This plugin highlights portals depending on their history. It comes with some variants such as hiding all captured portals, or showing both captured and visited portals with different colors. Consider editing the source to fit your needs.

## [Player Inventory][player-inventory] (need CORE subscription)

Use the newly added (Feb 2021) feature for C.O.R.E users to bring the inventory to IITC.
This includes a dialog showing your whole inventory, the content of each capsules, the list of your keys.
It adds a highlight that shows all portals in view (even not loaded) you have keys.
You can export the key numbers to the [Keys](https://iitc.app/download_desktop.html#keys_bqy_xelio_release) plugin if available. In the later case, you benefit from the Keys plugin, including [keys on map](https://iitc.app/download_desktop.html#keys-on-map_bqy_xelio_release), and in the [portals list](https://iitc.app/download_desktop.html#portals-list_bqy_teo96_release).

## [Comm Filter Tab][comm-filter-tab]
Show virus in the regular Comm and add a tab/pane with portal/player name filter and event type filter. This script refactors IITC chat code and parses chat log to flag each comm by its type. The features are inspired by [COMM Filter](https://github.com/udnp/iitc-plugins) by upnp

## [Ingress Icons][ingress-icons]
Bring [ameba64/ingress-items](https://github.com/ameba64/ingress-items) icons into IITC. Currently for mods only, in portail details and as overlay on mobile

## [Portals pictures dialog][portals-pictures] for easier portal lookup on IFS decoding
Add a dialog including the pictures of all visible portals. When clicking one, the portal is selected. The list of picture is sorting according to the number of click so you can find easily a already clicked picture.

## [CartoDB and default Ingress map with labels above Ingress layers][labels_layer]
Bring the labels (street/city/etc) of CartoDB or default Ingress map above the fields/links and portal.

## [Custom Google Map][basemap-google-custom]
With the [Styling Wizard](https://mapstyle.withgoogle.com) from Google, you can design your own base map and use it in IITC-CE.

## [Portal cache][cache-portals]
Some cache plugin to populate the map with local data using IndexedDB.
The plugin only stores guid, coordinates, timestamp.and optionnaly team from intel.

## [GL Layer][glify-layer]
This is a WIP plugin to test WebGL layers for IITC.
Version 0.1 uses cached data from the Portal cache plugin to draw a layer with all portals using a WebGL layer with [Leaflet.glify](https://github.com/robertleeplummerjr/Leaflet.glify).

[basemap-google-custom]: https://le-jeu.github.io/iitc-plugins/basemap-google-custom.user.js
[cache-portals]: https://le-jeu.github.io/iitc-plugins/cache-portals.user.js
[comm-filter-tab]: https://le-jeu.github.io/iitc-plugins/comm-filter-tab.user.js
[glify-layer]: https://le-jeu.github.io/iitc-plugins/glify-layer.user.js
[highlight-intel-uniques]: https://le-jeu.github.io/iitc-plugins/highlight-intel-uniques.user.js
[labels_layer]: https://le-jeu.github.io/iitc-plugins/labels_layer.user.js
[ingress-icons]: https://le-jeu.github.io/iitc-plugins/ingress-icons.user.js
[player-inventory]: https://le-jeu.github.io/iitc-plugins/player-inventory.user.js
[portals-pictures]: https://le-jeu.github.io/iitc-plugins/portals-pictures.user.js