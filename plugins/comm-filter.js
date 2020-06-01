// @author         udnp
// @name           COMM Filter
// @category       COMM
// @version        0.5.6
// @description    COMM Filter

//Naf update
//1) add inlined total MUs created in the backlog
//2) add fracker as a filter
//3) add virus detection and as a filter
//4) add checkable filtering for all/faction/alert
//5) add per agent total MUs created in the backlog
//6) the #6 answer

// replace chat functions

window.chat.writeDataToHash = function(newData, storageHash, isPublicChannel, isOlderMsgs) {
  $.each(newData.result, function(ind, json) {
    // avoid duplicates
    if(json[0] in storageHash.data) return true;

    var categories = json[2].plext.categories;
    var isPublic = (categories & 1) == 1;
    var isSecure = (categories & 2) == 2;
    var msgAlert = (categories & 4) == 4;

    var time = json[1];
    var systemNarrowcast = json[2].plext.plextType === 'SYSTEM_NARROWCAST';

    //track oldest + newest timestamps
    if (storageHash.oldestTimestamp === -1 || storageHash.oldestTimestamp > time) storageHash.oldestTimestamp = time;
    if (storageHash.newestTimestamp === -1 || storageHash.newestTimestamp < time) storageHash.newestTimestamp = time;

    let data = {
      public: isPublic,
      secure: isSecure,
      alert: msgAlert,
      time: time,
      player: {
        name: '',
        team: ''
      }
    };
    let markup = json[2].plext.markup;
    let withSender = markup.some(ent => ent[0] == 'SENDER');
    let portals = markup.filter(ent => ent[0] == 'PORTAL').map(ent => ent[1]);
    let numbers = markup.filter(ent => ent[0] == 'TEXT' && !isNaN(ent[1].plain)).map(ent => parseInt(ent[1].plain));
    let atPlayers = markup.filter(ent => ent[0] == 'AT_PLAYER').map(ent =>
      ({
        name: ent[1].plain.slice(1),
        team: ent[1].team
      })
    );

    let plainSub = markup.map(ent =>
      (ent[0] == 'TEXT' && !withSender)
      ? isNaN(ent[1].plain)
        ? ent[1].plain
        : 'NUMBER'
      : ent[0]
    ).join('|');

    if (markup[0][0] == 'PLAYER') {
      // <PLAYER| captured |PORTAL (ADDRESS)>
      // <PLAYER| created a Control Field @|PORTAL (ADDRESS)| +|NUMBER| MUs>
      // <PLAYER| deployed a Beacon on |PORTAL (ADDRESS)>
      // <PLAYER| deployed a Fracker on |PORTAL (ADDRESS)>
      // <PLAYER| deployed a Resonator on |PORTAL (ADDRESS)>
      // <PLAYER| destroyed a Control Field @|PORTAL (ADDRESS)| -|NUMBER| MUs>
      // <PLAYER| destroyed a Resonator on |PORTAL (ADDRESS)>
      // <PLAYER| destroyed the Link |PORTAL (ADDRESS)| to |PORTAL (ADDRESS)>
      // <PLAYER| linked |PORTAL (ADDRESS)| to |PORTAL (ADDRESS)>
      data.player = {
        name: markup[0][1].plain,
        team: markup[0][1].team
      }

      data.type = "unknown player action";
      if (markup[1][1].plain.search('captured') != -1) {
        data.type = 'capture';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('created') != -1) {
        data.type = 'field';
        data.portal = portals[0];
        if (numbers.length > 0)
          data.mus = numbers[0];
      }
      else if (markup[1][1].plain.search('deployed a Beacon') != -1) {
        data.type = 'beacon';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('deployed a Fracker') != -1) {
        data.type = 'fracker';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('deployed a Resonator') != -1) {
        data.type = 'deploy';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('destroyed a Control Field') != -1) {
        data.type = 'destroy field';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('destroyed a Resonator') != -1) {
        data.type = 'destroy resonator';
        data.portal = portals[0];
      }
      else if (markup[1][1].plain.search('destroyed the Link') != -1) {
        data.type = 'destroy link';
        data.from = portals[0];
        data.to = portals[1];
      }
      else if (markup[1][1].plain.search('linked') != -1) {
        data.type = 'link';
        data.from = portals[0];
        data.to = portals[1];
        if (numbers.length > 0)
          data.mus = numbers[0];
      }
    }

    if (systemNarrowcast) {
      // <Your Link |PORTAL (ADDRESS)| to |PORTAL (ADDRESS)| destroyed by |PLAYER>
      // <Your Portal |PORTAL (ADDRESS)| is under attack by |PLAYER>
      // <Your Portal |PORTAL (ADDRESS)| neutralized by |PLAYER>
      let players = markup.filter(ent => ent[0] == 'PLAYER').map(ent => ent[1]);
      data.player = {
        name: (players.length > 0) ? players[0].plain : 'unknown',
        team: (players.length > 0) ? players[0].team : 'unknown'
      };
      if (markup[0][1].plain.search("Link") != -1) {
        data.type = 'destroy link';
        data.from = portals[0];
        data.to = portals[1];
      }
      else if (markup[2][1].plain.search("neutralized") != -1) {
        data.type = 'destroy portal';
        data.portal = portals[0];
      }
      else {
        data.type = 'attack portal';
        data.portal = portals[0];
      }
    }
    // drop secure entity
    if (isSecure)
      markup = markup.slice(1);

    if (markup[0][0] == 'SENDER') {
      // <SENDER| blah |@PLAYER| blah |@PLAYER| blah >
      // <[secure] |SENDER| blah |@PLAYER| blah |@PLAYER| blah >
      data.type = "chat";
      data.player = {
        name: markup[0][1].plain.slice(0, -2),
        team: markup[0][1].team
      };
      data.mentions = atPlayers;
      data.markup = markup.slice(1);
      data.message = data.markup.map(ent => ent[1].plain).join('').trim();
    }
    else if (!data.type) {
      // <[secure] | |PLAYER| captured their first Portal.>
      // <[secure] | |PLAYER| created their first Control Field>
      // <[secure] | |PLAYER| created their first Link.>
      let players = markup.filter(ent => ent[0] == 'PLAYER').map(ent => ent[1]);
      data.player = {
        name: (players.length > 0) ? players[0].plain : 'unknown',
        team: (players.length > 0) ? players[0].team : 'unknown'
      };
      if (plainSub.search('first Portal') != -1)
        data.type = 'first capture';
      else if (plainSub.search('first Control') != -1)
        data.type = 'first field';
      else if (plainSub.search('first Link') != -1)
        data.type = 'first link';
      else
        data.markup = markup;
    }

    let renderPortal = function (portal) {
      const lat = portal.latE6/1E6, lng = portal.lngE6/1E6;
      const perma = window.makePermalink([lat,lng]);
      const js = 'window.selectPortalByLatLng('+lat+', '+lng+');return false';
      return '<a onclick="'+js+'"'
        + ' title="'+portal.address+'"'
        + ' href="'+perma+'" class="help">'
        + portal.name
        + '</a>';
    }

    let renderAtPlayer = function (player) {
      const name = player.plain.slice(1);
      const thisToPlayer = name == window.PLAYER.nickname;
      const spanClass = thisToPlayer ? "pl_nudge_me" : (player.team + " pl_nudge_player");
      return $('<div/>').html($('<span/>')
                        .attr('class', spanClass)
                        .attr('onclick',"window.chat.nicknameClicked(event, '"+name+"')")
                        .text('@' + name)).html();
    }

    let renderMarkupEntity = function (ent) {
      if (ent[0] == 'PORTAL')
        return renderPortal(ent[1]);
      if (ent[0] == 'AT_PLAYER')
        return renderAtPlayer(ent[1]);
      if (ent[0] == 'TEXT')
        return $('<div/>').text(ent[1].plain).html().autoLink();
      return $('<div/>').text(ent[0]+':<'+ent[1].plain+'>').html();
    }

    //NOTE: these two are redundant with the above two tests in place - but things have changed...
    //from the server, private channel messages are flagged with a SECURE string '[secure] ', and appear in
    //both the public and private channels
    //we don't include this '[secure]' text above, as it's redundant in the faction-only channel
    //let's add it here though if we have a secure message in the public channel, or the reverse if a non-secure in the faction one
    let prefix = '';
    if (data.type == 'chat' && !(isPublicChannel===false) && isSecure) prefix = '<span style="color: #f88; background-color: #500;">[faction]</span> ';
    //and, add the reverse - a 'public' marker to messages in the private channel
    if (data.type == 'chat' && !(isPublicChannel===true) && (!isSecure)) prefix = '<span style="color: #ff6; background-color: #550">[public]</span> ';

    let msg;
    if (data.type == 'chat')
      msg = data.markup.map(renderMarkupEntity).join(' ');
    else if (data.type == 'capture')
      msg = 'captured ' + renderPortal(data.portal);
    else if (data.type == 'beacon')
      msg = 'deployed a Beacon on ' + renderPortal(data.portal);
    else if (data.type == 'fracker')
      msg = 'deployed a Fracker on ' + renderPortal(data.portal);
    else if (data.type == 'deploy')
      msg = 'deployed a Resonator on ' + renderPortal(data.portal);
    else if (data.type == 'destroy resonator')
      msg = 'destroyed a Resonator on ' + renderPortal(data.portal);
    else if (data.type == 'field')
      msg = 'created a field from ' + renderPortal(data.portal) + ' +' + data.mus + 'MUs';
    else if (data.type == 'destroy field')
      msg = 'destroyed a field from ' + renderPortal(data.portal) + ' -' + data.mus + 'MUs';
    else if (data.type == 'link')
      msg = 'linked ' + renderPortal(data.from) + ' to ' + renderPortal(data.to);
    else if (data.type == 'destroy link')
      msg = 'destroyed the link from ' + renderPortal(data.from) + ' to ' + renderPortal(data.to);
    else if (data.type == 'attack portal')
      msg = 'attacked ' + renderPortal(data.portal);
    else if (data.type == 'destroy portal')
      msg = 'neutralized ' + renderPortal(data.portal);
    else if (data.type == 'first capture')
      msg = 'captured first portal';
    else if (data.type == 'first link')
      msg = 'created first link';
    else if (data.type == 'first field')
      msg = 'created first field';
    else msg = (data.markup || markup).map(renderMarkupEntity).join(' ');


    // format: timestamp, autogenerated, HTML message
    storageHash.data[json[0]] = [
      json[1],
      data.type == 'chat',
      chat.renderMsg(prefix + msg, data.player.name, data.time, data.player.team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL, data.alert, systemNarrowcast),
      data.player.name,
      data
    ];

  });
}

window.unixTimeToHHmmss = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var h = '' + d.getHours(); h = h.length === 1 ? '0' + h : h;
  var m = '' + d.getMinutes(); m = m.length === 1 ? '0' + m : m;
  var s = '' + d.getSeconds(); s = s.length === 1 ? '0' + s : s;
  return  h + ':' + m + ':' + s;
}

window.chat.renderMsg = function(msg, nick, time, team, msgToPlayer, systemNarrowcast) {
  var ta = unixTimeToHHmmss(time);
  var tb = unixTimeToDateTimeString(time, true);
  //add <small> tags around the milliseconds
  tb = (tb.slice(0,19)+'<small class="milliseconds">'+tb.slice(19)+'</small>').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  if ( msgToPlayer )
  {
    t = '<div class="pl_nudge_date">' + t + '</div><div class="pl_nudge_pointy_spacer"></div>';
  }
  if (systemNarrowcast)
  {
    msg = '<div class="system_narrowcast">' + msg + '</div>';
  }
  var color = COLORS[team];
  if (nick === window.PLAYER.nickname) color = '#fd6';    //highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
  var s = 'style="cursor:pointer; color:'+color+'"';
  var i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
  return '<tr><td>'+t+'</td><td>'+i[0]+'<mark class="nickname" ' + s + '>'+ nick+'</mark>'+i[1]+'</td><td>'+msg+'</td></tr>';
}

window.plugin.commFilter = function () {};



var setup = function() {};