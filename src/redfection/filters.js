/* Filters API

Filters work by exclusion, following the old layer system.
A feature that matches a filter is removed from the map.
A filter applies to a combinaison of portal/link/field and is described by
 - data properties that must (all) match
 - or a predicate for complex filter

  { portal: true, link: true, data: { team: 'E' }}
      filters any ENL portal/link

  [{ link: true, data: { oGuid: "some guid" }}, { link: true, data: { dGuid: "some guid" }}]
      filters any links on portal with guid "some guid"

  { field: true, pred: function (f) { return f.options.timestamp < Date.parse('2021-10-31'); } }
      filters any fields made before Halloween 2021
*/

/**
 * @type {Object.<string, FilterDesc>}
 */
const _filters = {};

/**
 * @callback FilterPredicate
 * @param {Object} ent - IITC entity
 * @returns {boolean}
 */

/**
 * @typedef FilterDesc
 * @type {object}
 * @property {boolean} filterDesc.portal         apply to portal
 * @property {boolean} filterDesc.link           apply to link
 * @property {boolean} filterDesc.field          apply to field
 * @property {object} [filterDesc.data]          entity data properties that must match
 * @property {FilterPredicate} [filterDesc.pred] predicate on the entity
 */

/**
 * @param {string} name                              filter name
 * @param {FilterDesc | FilterDesc[]} filterDesc     filter description (OR)
 */
export function set(name, filterDesc) {
  _filters[name] = filterDesc;
}

export function has(name) {
  return name in _filters;
}

export function remove(name) {
  return delete _filters[name];
}

function simpleFilter(type, entity, filter) {
  // type must match
  if (!filter[type]) return false;
  // use predicate if available
  if (typeof filter.pred === 'function') return filter.pred(entity);
  // if no constraint, match
  if (!filter.data) return true;
  // else must match all constraints
  for (const prop in filter.data) if (entity.options.data[prop] !== filter.data[prop]) return false;
  return true;
}

function arrayFilter(type, entity, filters) {
  if (!Array.isArray(filters)) filters = [filters];
  filters = filters.flat();
  for (let i = 0; i < filters.length; i++) if (simpleFilter(type, entity, filters[i])) return true;
  return false;
}

/**
 *
 * @param {object} portal Portal to test
 * @returns {boolean} `true` if the the portal matches one of the filters
 */
export function filterPortal(portal) {
  return arrayFilter('portal', portal, Object.values(_filters));
}

/**
 *
 * @param {object} link Link to test
 * @returns {boolean} `true` if the the link matches one of the filters
 */
export function filterLink(link) {
  return arrayFilter('link', link, Object.values(_filters));
}

/**
 *
 * @param {object} field Field to test
 * @returns {boolean} `true` if the the field matches one of the filters
 */
export function filterField(field) {
  return arrayFilter('field', field, Object.values(_filters));
}

export function filterEntities() {
  for (const guid in window.portals) {
    const p = window.portals[guid];
    if (filterPortal(p)) p.remove();
    else p.addTo(window.map);
  }
  for (const guid in window.links) {
    const link = window.links[guid];
    if (filterLink(link)) link.remove();
    else link.addTo(window.map);
  }
  for (const guid in window.fields) {
    const field = window.fields[guid];
    if (filterField(field)) field.remove();
    else field.addTo(window.map);
  }
}

/**
 * @class FilterLayer
 * @description Layer abstraction to control with the layer chooser a filter.
 *              The filter is disabled on layer add, and enabled on layer remove.
 * @extends L.Layer
 * @param {{name: string, filter: FilterDesc}} options
 */
let FilterLayer = null;

export function filterLayer(options) {
  if (!FilterLayer) {
    FilterLayer = L.Layer.extend({
      options: {
        name: null,
        filter: {},
      },

      initialize: function (options) {
        L.setOptions(this, options);
        set(this.options.name, this.options.filter);
      },

      onAdd: function () {
        remove(this.options.name);
        filterEntities();
      },

      onRemove: function () {
        set(this.options.name, this.options.filter);
        filterEntities();
      },
    });
  }
  return new FilterLayer(options);
}
