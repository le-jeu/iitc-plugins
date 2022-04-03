import styleInject from "style-inject";
import style from "./comm-filter-tab.css";

//todo list
//4) add checkable filtering for all/faction/alert

// ==============
// chat injection
// ==============

function renderText(text) {
  return $("<div/>").text(text.plain).html().autoLink();
}

function renderPortal(portal) {
  const lat = portal.latE6 / 1e6,
    lng = portal.lngE6 / 1e6;
  const perma = window.makePermalink([lat, lng]);
  const js =
    "window.selectPortalByLatLng(" + lat + ", " + lng + ");return false";
  let spanClass = "";
  if (portal.team === "RESISTANCE") spanClass = "res-light";
  else if (portal.team === "ENLIGHTENED") spanClass = "enl-light";
  return (
    '<a onclick="' +
    js +
    '"' +
    ' title="' +
    portal.address +
    '"' +
    ' href="' +
    perma +
    '" class="help portal ' +
    spanClass +
    '">' +
    window.chat.getChatPortalName(portal) +
    "</a>"
  );
}

function renderFactionEnt(faction) {
  const name = faction.team === "RESISTANCE" ? "Resistance" : "Enlightened";
  const spanClass =
    faction.team === "RESISTANCE"
      ? window.TEAM_TO_CSS[window.TEAM_RES]
      : window.TEAM_TO_CSS[window.TEAM_ENL];
  return $("<div/>")
    .html($("<span/>").attr("class", spanClass).text(name))
    .html();
}

function renderPlayer(player, at, sender) {
  const name = sender
    ? player.plain.slice(0, -2)
    : at
    ? player.plain.slice(1)
    : player.plain;
  const thisToPlayer = name === window.PLAYER.nickname;
  const spanClass = thisToPlayer
    ? "pl_nudge_me"
    : player.team + " pl_nudge_player";
  return $("<div/>")
    .html(
      $("<span/>")
        .attr("class", spanClass)
        .attr("onclick", "window.chat.nicknameClicked(event, '" + name + "')")
        .text((at ? "@" : "") + name)
    )
    .html();
}

function renderMarkupEntity(ent) {
  switch (ent[0]) {
    case "TEXT":
      return renderText(ent[1]);
    case "PORTAL":
      return renderPortal(ent[1]);
    case "FACTION":
      return renderFactionEnt(ent[1]);
    case "SENDER":
      return renderPlayer(ent[1], false, true);
    case "PLAYER":
      return renderPlayer(ent[1]);
    case "AT_PLAYER":
      return renderPlayer(ent[1], true);
    default:
  }
  return $("<div/>")
    .text(ent[0] + ":<" + ent[1].plain + ">")
    .html();
}

function renderMarkup(markup) {
  let msg = "";
  markup.forEach(function (ent, ind) {
    switch (ent[0]) {
      case "SENDER":
      case "SECURE":
        // skip as already handled
        break;

      case "PLAYER": // automatically generated messages
        if (ind > 0) msg += renderMarkupEntity(ent); // don’t repeat nick directly
        break;

      default:
        // add other enitities whatever the type
        msg += renderMarkupEntity(ent);
        break;
    }
  });
  return msg;
}

function renderTimeCell(time, classNames) {
  const ta = window.unixTimeToHHmm(time);
  let tb = window.unixTimeToDateTimeString(time, true);
  // add <small> tags around the milliseconds
  tb = (
    tb.slice(0, 19) +
    '<small class="milliseconds">' +
    tb.slice(19) +
    "</small>"
  )
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return (
    '<td><time class="' +
    classNames +
    '" title="' +
    tb +
    '" data-timestamp="' +
    time +
    '">' +
    ta +
    "</time></td>"
  );
}

function renderNickCell(nick, classNames) {
  const i = [
    '<span class="invisep">&lt;</span>',
    '<span class="invisep">&gt;</span>',
  ];
  return (
    "<td>" +
    i[0] +
    '<mark class="' +
    classNames +
    '">' +
    nick +
    "</mark>" +
    i[1] +
    "</td>"
  );
}

function renderMsgCell(msg, classNames) {
  return '<td class="' + classNames + '">' + msg + "</td>";
}

function renderMsgRow(data) {
  const timeClass = data.msgToPlayer ? "pl_nudge_date" : "";
  const timeCell = renderTimeCell(data.time, timeClass);

  const nickClasses = ["nickname"];
  if (
    data.player.team === window.TEAM_ENL ||
    data.player.team === window.TEAM_RES
  )
    nickClasses.push(window.TEAM_TO_CSS[data.player.team]);
  // highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
  if (data.player.name === window.PLAYER.nickname)
    nickClasses.push("pl_nudge_me");
  const nickCell = renderNickCell(data.player.name, nickClasses.join(" "));

  const msg = renderMarkup(data.markup);
  const msgClass = data.narrowcast ? "system_narrowcast" : "";
  const msgCell = renderMsgCell(msg, msgClass);

  let className = "";
  if (!data.auto && data.public) className = "public";
  else if (!data.auto && data.secure) className = "faction";
  return (
    '<tr data-guid="' +
    data.guid +
    '" class="' +
    className +
    '">' +
    timeCell +
    nickCell +
    msgCell +
    "</tr>"
  );
}

function updateOldNewHash(newData, storageHash, isOlderMsgs, isAscendingOrder) {
  // handle guids reset before refactored chat
  if (storageHash.oldestGUID === undefined) storageHash.guids = [];
  // track oldest + newest timestamps/GUID
  if (newData.result.length > 0) {
    let first = {
      guid: newData.result[0][0],
      time: newData.result[0][1],
    };
    let last = {
      guid: newData.result[newData.result.length - 1][0],
      time: newData.result[newData.result.length - 1][1],
    };
    if (isAscendingOrder) {
      const temp = first;
      first = last;
      last = temp;
    }
    if (
      storageHash.oldestTimestamp === -1 ||
      storageHash.oldestTimestamp >= last.time
    ) {
      if (isOlderMsgs || storageHash.oldestTimestamp !== last.time) {
        storageHash.oldestTimestamp = last.time;
        storageHash.oldestGUID = last.guid;
      }
    }
    if (
      storageHash.newestTimestamp === -1 ||
      storageHash.newestTimestamp <= first.time
    ) {
      if (!isOlderMsgs || storageHash.newestTimestamp !== first.time) {
        storageHash.newestTimestamp = first.time;
        storageHash.newestGUID = first.guid;
      }
    }
  }
}

function parseMsgData(data) {
  const categories = data[2].plext.categories;
  const isPublic = (categories & 1) === 1;
  const isSecure = (categories & 2) === 2;
  const msgAlert = (categories & 4) === 4;

  const msgToPlayer = msgAlert && (isPublic || isSecure);

  const time = data[1];
  let team =
    data[2].plext.team === "RESISTANCE" ? window.TEAM_RES : window.TEAM_ENL;
  const auto = data[2].plext.plextType !== "PLAYER_GENERATED";
  const systemNarrowcast = data[2].plext.plextType === "SYSTEM_NARROWCAST";

  const markup = data[2].plext.markup;

  let nick = "";
  markup.forEach(function (ent) {
    switch (ent[0]) {
      case "SENDER": // user generated messages
        nick = ent[1].plain.slice(0, -2); // cut “: ” at end
        break;

      case "PLAYER": // automatically generated messages
        nick = ent[1].plain;
        team = ent[1].team === "RESISTANCE" ? window.TEAM_RES : window.TEAM_ENL;
        break;

      default:
        break;
    }
  });

  return {
    guid: data[0],
    time: time,
    public: isPublic,
    secure: isSecure,
    alert: msgAlert,
    msgToPlayer: msgToPlayer,
    type: data[2].plext.plextType,
    narrowcast: systemNarrowcast,
    auto: auto,
    player: {
      name: nick,
      team: team,
    },
    markup: markup,
  };
}

function writeDataToHash(
  newData,
  storageHash,
  isPublicChannel,
  isOlderMsgs,
  isAscendingOrder
) {
  updateOldNewHash(newData, storageHash, isOlderMsgs, isAscendingOrder);

  newData.result.forEach(function (json) {
    // avoid duplicates
    if (json[0] in storageHash.data) return true;

    const parsedData = parseMsgData(json);

    // format: timestamp, autogenerated, HTML message, nick, additional data (parsed, plugin specific data...)
    storageHash.data[parsedData.guid] = [
      parsedData.time,
      parsedData.auto,
      renderMsgRow(parsedData),
      parsedData.player.name,
      parsedData,
    ];

    if (isAscendingOrder) storageHash.guids.push(parsedData.guid);
    else storageHash.guids.unshift(parsedData.guid);
  });
}

function renderDivider(text) {
  return (
    '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>"
  );
}

function renderData(data, element, likelyWereOldMsgs, sortedGuids) {
  const elm = $("#" + element);
  if (elm.is(":hidden")) return;

  // discard guids and sort old to new
  //TODO? stable sort, to preserve server message ordering? or sort by GUID if timestamps equal?
  let vals = sortedGuids;
  if (vals === undefined) {
    vals = $.map(data, function (v, k) {
      return [[v[0], k]];
    });
    vals = vals.sort(function (a, b) {
      return a[0] - b[0];
    });
    vals = vals.map(function (v) {
      return v[1];
    });
  }

  // render to string with date separators inserted
  let msgs = "";
  let prevTime = null;
  vals.forEach(function (guid) {
    const msg = data[guid];
    const nextTime = new Date(msg[0]).toLocaleDateString();
    if (prevTime && prevTime !== nextTime)
      msgs += window.chat.renderDivider(nextTime);
    msgs += msg[2];
    prevTime = nextTime;
  });

  const firstRender = elm.is(":empty");
  const scrollBefore = window.scrollBottom(elm);
  elm.html("<table>" + msgs + "</table>");

  if (firstRender) elm.data("needsScrollTop", 99999999);
  else window.chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);

  if (elm.data("needsScrollTop")) {
    elm.data("ignoreNextScroll", true);
    elm.scrollTop(elm.data("needsScrollTop"));
    elm.data("needsScrollTop", null);
  }
}

// fix for browser zoom/devicePixelRatio != 1
// was jquery more reliable ?
function scrollBottom(elm) {
  if (typeof elm === "string") elm = $(elm);
  elm = elm.get(0);
  return Math.max(0, elm.scrollHeight - elm.clientHeight - elm.scrollTop);
}

// =============
// chat analysis
// =============

const commFilter = {};

commFilter.rules = [
  { type: "capture", plain: "PLAYER| captured |PORTAL" },
  {
    type: "field",
    plain: "PLAYER| created a Control Field @|PORTAL| +|NUMBER| MUs",
  },
  { type: "beacon", plain: "PLAYER| deployed a Beacon on |PORTAL" },
  { type: "battle", plain: "PLAYER| deployed a Battle Beacon on |PORTAL" },
  { type: "fracker", plain: "PLAYER| deployed a Fracker on |PORTAL" },
  { type: "resonator", plain: "PLAYER| deployed a Resonator on |PORTAL" },
  {
    type: "destroy field",
    plain: "PLAYER| destroyed a Control Field @|PORTAL| -|NUMBER| MUs",
  },
  {
    type: "destroy resonator",
    plain: "PLAYER| destroyed a Resonator on |PORTAL",
  },
  {
    type: "destroy link",
    plain: "PLAYER| destroyed the Link |PORTAL| to |PORTAL",
  },
  { type: "link", plain: "PLAYER| linked |PORTAL| to |PORTAL" },
  { type: "recurse", plain: "PLAYER| Recursed" },
  { type: "battle result", plain: "FACTION| won a Battle Beacon on |PORTAL" },
  {
    type: "destroy link",
    plain: "Your Link |PORTAL| to |PORTAL| destroyed by |PLAYER",
  },
  { type: "attack", plain: "Your Portal |PORTAL| is under attack by |PLAYER" },
  { type: "neutralize", plain: "Your Portal |PORTAL| neutralized by |PLAYER" },
  { type: "kinetic", plain: "Your Kinetic Capsule is now ready." },
  {
    type: "first capture",
    plain: "SECURE| |PLAYER| captured their first Portal.",
  },
  {
    type: "first field",
    plain: "SECURE| |PLAYER| created their first Control Field",
  },
  { type: "first link", plain: "SECURE| |PLAYER| created their first Link." },
  { type: "drone returned", plain: "Drone returned to Agent by |PLAYER" },
  { type: "drone returned", plain: "Your Drone returned by |PLAYER" },
  // { type: 'chat', plain: 'SENDER| blah |AT_PLAYER| blah |AT_PLAYER| blah ' },
  // { type: 'faction chat', plain: '[secure] |SENDER| blah |AT_PLAYER| blah |AT_PLAYER| blah ' },
];

const markupType = new Set([
  "TEXT",
  "PLAYER",
  "PORTAL",
  "FACTION",
  "NUMBER",
  "AT_PLAYER",
  "SENDER",
  "SECURE",
]);

function buildRules() {
  for (const r of commFilter.rules) {
    const items = r.plain.split("|");
    const markup = [];
    const text = new Map();
    r.portals = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (markupType.has(item)) {
        markup.push(item);
        if (item === "PORTAL") r.portals++;
        if (item === "PLAYER") r.player = true;
        if (item === "FACTION") r.faction = true;
      } else {
        markup.push("TEXT");
        text.set(i, item);
      }
    }
    r.markup = markup;
    r.text = text;
  }
}

function matchChat(data) {
  if (data.markup.some((ent) => ent[0] === "SENDER")) {
    if (data.markup[0][0] === "SECURE") return "chat faction";
    return "chat";
  }
  return "unknown";
}

function matchRule(data) {
  for (const r of commFilter.rules) {
    if (r.markup.length !== data.markup.length) continue;
    let match = true;
    for (let i = 0; i < r.markup.length; i++) {
      if (r.markup[i] === "NUMBER") {
        if (data.markup[i][0] !== "TEXT" || isNaN(data.markup[i][1].plain)) {
          match = false;
          break;
        }
      } else if (r.markup[i] !== data.markup[i][0]) {
        match = false;
        break;
      } else if (
        r.markup[i] === "TEXT" &&
        r.text.has(i) &&
        r.text.get(i) !== data.markup[i][1].plain
      ) {
        match = false;
        break;
      }
    }
    if (match) return r.type;
  }

  return matchChat(data);
}

function reParseData(data) {
  const parse = {};
  const markup = data.markup;
  const portals = markup
    .filter((ent) => ent[0] === "PORTAL")
    .map((ent) => ent[1]);
  const numbers = markup
    .filter((ent) => ent[0] === "TEXT" && !isNaN(ent[1].plain))
    .map((ent) => parseInt(ent[1].plain));
  const atPlayers = markup
    .filter((ent) => ent[0] === "AT_PLAYER")
    .map((ent) => ({
      name: ent[1].plain.slice(1),
      team: ent[1].team === "RESISTANCE" ? window.TEAM_RES : window.TEAM_ENL,
    }));

  parse.type = matchRule(data);

  switch (parse.type) {
    case "field":
    case "destroy field":
      parse.mus = numbers[0];
    // falls through
    case "capture":
    case "beacon":
    case "battle":
    case "fracker":
    case "resonator":
    case "destroy resonator":
    case "battle result":
    case "neutralize":
    case "attack":
      parse.portal = portals[0];
      break;
    case "link":
    case "destroy link":
      parse.from = portals[0];
      parse.to = portals[1];
      break;
  }
  if (portals.length > 0) parse.portals = portals;

  if (parse.type === "battle result") parse.faction = markup[0][1].team;

  if (parse.type === "chat" || parse.type === "chat faction") {
    parse.mentions = atPlayers;
    parse.message = markup
      .slice(1 + data.secure)
      .map((ent) => ent[1].plain)
      .join("")
      .trim();
  }

  data["comm-filter"] = parse;
}

commFilter.viruses = new Map();

function findVirus(guids, data) {
  commFilter.viruses.clear();
  let last_data = {};
  for (const guid of guids) {
    const parseData = data[guid][4];
    const log = parseData["comm-filter"];
    if (log.type !== "destroy resonator") continue;
    if (
      parseData.time !== last_data.time ||
      parseData.player.name !== last_data.player.name ||
      log.portal.latE6 !== last_data["comm-filter"].portal.latE6 ||
      log.portal.lngE6 !== last_data["comm-filter"].portal.lngE6
    ) {
      last_data = parseData;
      log.virus = log.portal.team === parseData.player.team;
    } else {
      log.virus = last_data.guid;
      last_data["comm-filter"].virus = true;
    }
  }
  for (const guid of guids) {
    const log = data[guid][4]["comm-filter"];
    if (log.virus === true)
      commFilter.viruses.set(guid, {
        guids: [],
        type: log.portal.team === "RESISTANCE" ? "jarvis" : "ada",
      });
    else if (log.virus) commFilter.viruses.get(log.virus).guids.push(guid);
  }
  for (const [guid, prop] of commFilter.viruses) {
    const parseData = data[guid][4];
    parseData.markup[1][1].plain =
      "destroyed " + (prop.guids.length + 1) + " Resonators on ";
    data[guid][2] = renderMsgRow(parseData);
  }
}

function computeMUs(guids, data) {
  const agents = new Map();
  let sum = 0;
  for (const guid of guids) {
    const parseData = data[guid][4];
    const log = parseData["comm-filter"];
    if (log.type === "field") {
      let tot = agents.get(parseData.player.name) || 0;
      tot += log.mus;
      agents.set(parseData.player.name, tot);
      sum += log.mus;
      log.totalMUs = {
        agent: tot,
        all: sum,
      };
      if (parseData.markup.length === 6) parseData.markup.push("");
      parseData.markup[6] = [
        "TEXT",
        {
          plain:
            " (" +
            tot.toLocaleString("en-US") +
            "/" +
            sum.toLocaleString("en-US") +
            ")",
        },
      ];
      data[guid][2] = renderMsgRow(parseData);
    }
  }
}

function computeHidden() {
  let hidden = [];
  for (const prop of commFilter.viruses.values()) {
    hidden = hidden.concat(prop.guids);
  }

  const filtered = new Set(hidden);
  for (const guid of window.chat._public.guids) {
    const n = window.chat._public.data[guid][3];
    const d = window.chat._public.data[guid][4]["comm-filter"];
    let show = commFilter.filters.type.includes(d.type);

    // special type
    if (commFilter.filters.type.includes("all")) show = true;
    if (
      commFilter.filters.type.includes("chat all") &&
      (d.type == "chat" || d.type == "chat faction")
    )
      show = true;
    if (commFilter.filters.type.includes("chat public") && d.type == "chat")
      show = true;
    if (commFilter.filters.type.includes("virus") && d.virus) show = true;

    let match = false;
    if (n.includes(commFilter.filters.text)) match = true;
    if (d.portals) {
      if (d.portals.some((p) => p.name.includes(commFilter.filters.text)))
        match = true;
    }
    if (d.mentions) {
      if (d.mentions.some((p) => p.name.includes(commFilter.filters.text)))
        match = true;
    }
    if (!show || !match) filtered.add(guid);
  }

  return filtered;
}

// for *ALL* and filter
function updateCSS() {
  let elm = document.getElementById("comm-filter-css");
  if (!elm) {
    elm = document.createElement("style");
    document.body.appendChild(elm);
    elm.id = "comm-filter-css";
  }

  elm.textContent = "";

  const ada = [];
  const jarvis = [];
  let hidden = [];
  for (const [guid, prop] of commFilter.viruses) {
    if (prop.type === "jarvis") jarvis.push(guid);
    else ada.push(guid);
    hidden = hidden.concat(prop.guids);
  }

  const highlights = [];
  for (const guid of window.chat._public.guids) {
    const d = window.chat._public.data[guid][4];
    if (d.msgToPlayer) highlights.push(guid);
  }

  let content = "";
  if (ada.length > 0) {
    content +=
      ada
        .map(
          (guid) => '#chat tr[data-guid="' + guid + '"] td:nth-child(3):before'
        )
        .join(",\n") +
      '{ content: "[JARVIS]"; color: #f88; background-color: #500; margin-right: .5rem; }\n';
  }
  if (jarvis.length > 0) {
    content +=
      jarvis
        .map(
          (guid) => '#chat tr[data-guid="' + guid + '"] td:nth-child(3):before'
        )
        .join(",\n") +
      '{ content: "[ADA]"; color: #f88; background-color: #500; margin-right: .5rem; }\n';
  }
  if (hidden.length > 0) {
    content +=
      hidden.map((guid) => '#chat tr[data-guid="' + guid + '"]').join(",\n") +
      "{ display: none }\n";
  }
  if (highlights.length > 0) {
    content +=
      highlights
        .map((guid) => '#chat tr[data-guid="' + guid + '"]')
        .join(",\n") + "{ background-color: #9118 }\n";
  }

  elm.textContent = content;
}

function reparsePublicData() {
  const publicTab = window.chat._public;
  $.each(publicTab.data, function (ind, msg) {
    if (msg[4]["comm-filter"] === undefined) reParseData(msg[4]);
  });

  computeMUs(publicTab.guids, publicTab.data);
  findVirus(publicTab.guids, publicTab.data);

  commFilter.hidden = computeHidden();

  updateCSS();
  renderChatFilter(true);
}

function renderChatFilter(old) {
  const publicTab = window.chat._public;
  if (!publicTab.guids) publicTab.guids = [];
  else
    window.chat.renderData(
      publicTab.data,
      "chatfilter",
      old,
      publicTab.guids.filter((guid) => !commFilter.hidden.has(guid))
    );
}

// filter tab
function tabToogle() {
  $("#chat, #chatinput").show();
  $("#chatinput mark").css("cssText", "color: #bbb !important").text("");
  $("#chat > div").hide();
  $("#chat-filters").show();
  $("#chatfilter").show();
  $("#chatcontrols .active").removeClass("active");
  $("#chatcontrols a:contains('Filter')").addClass("active");
  renderChatFilter(true);
}

function tabCreate() {
  $("#chat").append('<div id="chat-filters"></div>');

  if (window.chat.addCommTab) {
    window.chat.addCommTab({
      channel: "filter",
      name: "Filter",
      inputPrompt: "",
      sendMessage: () => {},
      request: (_, old) => window.chat.requestChannel("all", old),
      render: (c, old) => {
        $("#chat-filters").show();
        renderChatFilter(old);
      },
      localBounds: true,
    });
    // bind filter to all
    window.chat._channels["filter"] = window.chat._channels["all"];
  } else {
    $("#chatcontrols").append("<a>Filter</a>");
    $("#chatcontrols a:last").click(tabToogle);
    $("#chat").append(
      '<div style="display: none" id="chatfilter"><table></table></div>'
    );

    $("#chatfilter").scroll(function () {
      const t = $(this);
      if (t.data("ignoreNextScroll")) return t.data("ignoreNextScroll", false);
      if (t.scrollTop() < window.CHAT_REQUEST_SCROLL_TOP)
        window.chat.requestPublic(true);
      if (scrollBottom(t) === 0) window.chat.requestPublic(false);
    });

    if (window.useAndroidPanes()) {
      window.android.addPane(
        "comm-filter-tab",
        "Comm Filter",
        "ic_action_view_as_list"
      );
      window.addHook("paneChanged", function (id) {
        if (id == "comm-filter-tab") {
          tabToogle();
        }
      });
    }
  }

  const events = new Set([
    "all",
    "chat all",
    "chat public",
    "chat faction",
    "virus",
  ]);
  for (const rule of commFilter.rules) {
    events.add(rule.type);
  }
  events.add("unknown");

  commFilter.filtersDiv = document.querySelector("#chat-filters");
  commFilter.filtersDiv.innerHTML =
    '<input id="filter-text" placeholder="Portal or Agent">' +
    '<select id="filter-type" multiple size="1">' +
    Array.from(events).map(
      (s) => '<option value="' + s + '">' + s + "</option>"
    ) +
    "</select>";
  $("#filter-text").on("change", function (ev) {
    commFilter.filters.text = ev.target.value;
    commFilter.hidden = computeHidden();
    renderChatFilter(false);
  });
  $("#filter-type").on("change", function (ev) {
    commFilter.filters.type = Array.from(ev.target.options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    commFilter.hidden = computeHidden();
    renderChatFilter(false);
  });

  if (!window.isSmartphone()) commFilter.filtersDiv.classList.add("desktop");
}

// setup

window.plugin.commFilter = commFilter;

function setup() {
  styleInject(style);

  // injection
  window.chat.renderDivider = renderDivider;
  window.chat.writeDataToHash = writeDataToHash;
  window.chat.renderData = renderData;
  window.scrollBottom = scrollBottom;

  // plugin
  commFilter.filters = {
    text: "",
    type: ["all"],
  };
  buildRules();
  tabCreate();

  window.addHook("publicChatDataAvailable", reparsePublicData);
}

export default setup;
