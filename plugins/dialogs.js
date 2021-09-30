// @author         jaiperdu
// @name           Dialog List
// @category       Misc
// @version        0.1.0
// @description    List open dialogs in the sidebar

function itemOnClick(ev) {
  var id = ev.target.closest('tr').dataset.id;
  var dialog = $(window.DIALOGS[id]);
  dialog.dialog('moveToTop');
}

function itemOnClose(ev) {
  var id = ev.target.closest('tr').dataset.id;
  var dialog = $(window.DIALOGS[id]);
  dialog.dialog('close');
}

function dialogListItem(id) {
  var dialog = $(window.DIALOGS[id]);
  var option = dialog.dialog('option');
  var text = option.title;
  var tr = document.createElement('tr');
  tr.dataset.id = id;
  var title = document.createElement('td');
  tr.appendChild(title);
  title.textContent = text;
  if (!dialog.is(':hidden'))
    title.classList.add('ui-dialog-title-inactive');
  title.addEventListener('click', itemOnClick);
  var closeButton = document.createElement('td');
  tr.appendChild(closeButton);
  closeButton.textContent = "X";
  closeButton.addEventListener('click', itemOnClose);

  return tr;
}

function updateList() {
  var list = document.getElementById('dialog-list');
  list.textContent = '';
  Object.keys(window.DIALOGS).forEach((id) => {
    list.appendChild(dialogListItem(id));
  });
}

var dialogMonitor = {
  set: function(obj, prop, valeur) {
    obj[prop] = valeur;
    updateList();
    return true;
  },
  deleteProperty: function (obj, prop) {
    delete obj[prop];
    updateList();
    return true;
  }
};

function setup() {
  window.DIALOGS = new Proxy(window.DIALOGS, dialogMonitor);

  $('<style>').prop('type', 'text/css').html(`
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
}`).appendTo('head');

  var sidebar = document.getElementById('sidebar');
  var dialogList = document.createElement('div');
  sidebar.appendChild(dialogList);
  dialogList.id = "dialog-list";
}