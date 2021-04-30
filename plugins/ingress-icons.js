// @author         jaiperdu
// @name           Ingress Icons
// @category       Appearance
// @version        0.1.1
// @description    Bring ameba64/ingress-items icons into IITC


function getModList(d) {
  var mods = [];
  var modsTitle = [];
  var modsColor = [];

  for (var i = 0; i < 4; i++) {
    var mod = d.mods[i];

    var item = {
      name: '',
      class: 'mod_free_slot',
      tooltip: '',
    }

    if (mod) {
      // all mods seem to follow the same pattern for the data structure
      // but let's try and make this robust enough to handle possible future differences

      item.name = mod.name || '(unknown mod)';

      item.class = mod.name.toLowerCase().replace('(-)', 'minus').replace('(+)', 'plus').replace(/[^a-z]/g, '_');

      if (mod.rarity) {
        item.name = mod.rarity.capitalize().replace(/_/g,' ') + ' ' + item.name;
        item.class = item.class + ' ' + mod.rarity.toLowerCase();
      }

      item.tooltip = item.name + '\n';
      if (mod.owner) {
        item.tooltip += 'Installed by: '+ mod.owner + '\n';
      }

      if (mod.stats) {
        item.tooltip += 'Stats:';
        for (var key in mod.stats) {
          if (!mod.stats.hasOwnProperty(key)) continue;
          var val = mod.stats[key];

          // if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

          // special formatting for known mod stats, where the display of the raw value is less useful
          if      (key === 'HACK_SPEED')            val = (val/10000)+'%'; // 500000 = 50%
          else if (key === 'HIT_BONUS')             val = (val/10000)+'%'; // 300000 = 30%
          else if (key === 'ATTACK_FREQUENCY')      val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'FORCE_AMPLIFIER')       val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'LINK_RANGE_MULTIPLIER') val = (val/1000) +'x'; // 2000 = 2x
          else if (key === 'LINK_DEFENSE_BOOST')    val = (val/1000) +'x'; // 1500 = 1.5x
          else if (key === 'REMOVAL_STICKINESS' && val > 100) val = (val/10000)+'%'; // an educated guess
          // else display unmodified. correct for shield mitigation and multihack - unknown for future/other mods

          item.tooltip += '\n+' +  val + ' ' + key.capitalize().replace(/_/g,' ');
        }
      }
    }

    mods.push(item);
  }

  return mods;
}

function getModDetails(d) {
  var t = '';
  getModList(d).forEach(function (item) {
    t += '<span'+(item.tooltip.length ? ' title="'+item.tooltip+'"' : '')+' class="'+item.class+'"></span>'
  });

  return t;
}

function updateMobile(data) {
  var el = $('#updatestatus .mods');
  if (el) el.remove();

  var guid = data.selectedPortalGuid;
  if(!window.portals[guid]) return;

  var details = window.portalDetail.get(guid);
  var t = '';
  getModList(details).forEach(function (item) {
    t += '<div'+(item.tooltip.length ? ' title="'+item.tooltip+'"' : '')+' class="'+item.class+'"></div>'
  });

  $('#updatestatus').prepend('<div class="mods">'+t+'</div>');
}

var setup = function () {
  $('<style>').prop('type', 'text/css').html('@include_string:ingress-icons.css@').appendTo('head');

  window.getModDetails = getModDetails;
  if (isSmartphone()) window.addHook('portalSelected', updateMobile);
}
