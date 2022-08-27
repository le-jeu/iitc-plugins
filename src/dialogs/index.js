const W = window;
let DIALOGS = {};

function itemOnClick(ev) {
  const id = ev.target.closest("tr").dataset.id;
  const dialog = $(DIALOGS[id]);
  dialog.dialog("moveToTop");
}

function itemOnClose(ev) {
  const id = ev.target.closest("tr").dataset.id;
  const dialog = $(DIALOGS[id]);
  dialog.dialog("close");
}

function dialogListItem(id) {
  const dialog = $(DIALOGS[id]);
  const option = dialog.dialog("option");
  const text = option.title;
  const tr = document.createElement("tr");
  tr.dataset.id = id;
  const title = document.createElement("td");
  tr.appendChild(title);
  title.textContent = text;
  if (!dialog.is(":hidden")) title.classList.add("ui-dialog-title-inactive");
  title.addEventListener("click", itemOnClick);
  const closeButton = document.createElement("td");
  tr.appendChild(closeButton);
  closeButton.textContent = "X";
  closeButton.addEventListener("click", itemOnClose);

  return tr;
}

function updateList() {
  const list = document.getElementById("dialog-list");
  list.textContent = "";
  Object.keys(DIALOGS).forEach((id) => {
    list.appendChild(dialogListItem(id));
  });
}

const dialogMonitor = {
  set: function (obj, prop, valeur) {
    obj[prop] = valeur;
    updateList();
    return true;
  },
  deleteProperty: function (obj, prop) {
    delete obj[prop];
    updateList();
    return true;
  },
};

export default function () {
  DIALOGS = W.DIALOGS = new Proxy(W.DIALOGS, dialogMonitor);

  $("<style>")
    .prop("type", "text/css")
    .html(
      `
#dialog-list {
  padding: 3px;
}
#dialog-list tr:nth-last-child(n+2) td {
  border-bottom: 1px white dotted;
}
#dialog-list tr td:first-child {
  width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#dialog-list tr td:first-child:hover {
  color: #03fe03; /*bookmark hover*/
}
#dialog-list tr td:last-child {
  color: red;
  font-weight: bold;
}`
    )
    .appendTo("head");

  const sidebar = document.getElementById("sidebar");
  const dialogList = document.createElement("div");
  sidebar.appendChild(dialogList);
  dialogList.id = "dialog-list";
}
