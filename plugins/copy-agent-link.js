// @author         jaiperdu
// @name           Copy agent profile link
// @category       Misc
// @version        0.1.0
// @description    Copy to clipboard agent profile link on click

const baseUrl = "https://link.ingress.com/?link=https://intel.ingress.com/agent/";
function copyToClipboard(nick) {
  window.app.copy(baseUrl + nick);
}

function setup() {
  if (window.isApp && window.app.copy) {
    $(document).on('click', '.nickname', function(event) {
      return copyToClipboard($(this).text());
    });
  } else {
    alert("[Copy agent profile link] doesn't support desktop yet");
  }
}