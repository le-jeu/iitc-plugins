const URI =
  "https://mapapi.what3words.com/api/convert-to-coordinates?format=json&words=";
const queryRegex = /[a-z]+\.[a-z]+\.[a-z]+/;

export default function () {
  window.addHook("search", function (query) {
    if (!query.confirmed) return;
    const text = query.term.toLowerCase().replace(/ /g, "");
    if (text.match(queryRegex)) {
      fetch(URI + text)
        .then((r) => r.json())
        .then((json) =>
          query.addResult({
            title: json.nearestPlace,
            position: json.coordinates,
            description: text,
          })
        );
    }
  });
}
