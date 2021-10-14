// @author         Zaso
// @name           LocalStorage Manager
// @category       Debug
// @version        0.1.2
// @description    Manage LocalStorage: import, export and delete.

// PlUGIN START ////////////////////////////////////////////////////////
// History
// 0.1.2 Show/sort by entry size
// 0.1.1 Headers changed. Ready for IITC-CE
// 0.1.0 Original sript

// use own namespace for plugin
var manageStorage = {};
window.plugin.manageStorage = manageStorage;

function generateFile(type, filename, text){
	var pom = document.createElement('a');
	pom.setAttribute('href', type + encodeURIComponent(text));
	pom.setAttribute('download', filename);

	pom.style.display = 'none';
	document.body.appendChild(pom);

	pom.click();
	document.body.removeChild(pom);
}

function importFile(){
	var fileInput = document.getElementById('manage-localstorage-import');
	var file = fileInput.files[0];
	var textType = /text.*/;

	if (file.type.match(textType)){
		var reader = new FileReader();

		reader.onload = function(e){
			window.newData = JSON.parse(reader.result);

			for(storageName in newData){
				window.localStorage[storageName] = newData[storageName];
			}
		}
		reader.readAsText(file);
		alert('Import successful! Refresh the page.');
	}else{
		alert('File not supported!');
	}
}

function createFile(){
	var type = 'data:text/plain;charset=utf-8,';
	var selectedStorage = getSelectedKey();
	var title = 'localstorage-'+selectedStorage+'-'+new Date().getTime();
	if(title == ''){ title = 'untitled'; }
	var filename = title+'.txt';

	var str = {};

	var store = window.localStorage[selectedStorage];

	var text = '{"'+selectedStorage+'":'+JSON.stringify(store)+'}';

	generateFile(type, filename, text);
}

function importData(){
	window.dialog({
		html: '<div class="local-storage-import"><p>Selected a single or global data file. <input type="file" id="manage-localstorage-import" accept="text/plain" onchange="window.plugin.manageStorage.importFile();return false;" /></div>',
		dialogClass: 'ui-dialog-local-storage-import',
		title: 'LocalStorage Manager - Import'
	});
}

function reset(){
	var KEY = getSelectedKey();
	var promptAction = prompt('"'+KEY+'" data will be deleted. Are you sure? [Y/N]', '');
	if(promptAction !== null && (promptAction === 'Y' || promptAction === 'y')){
		delete localStorage[KEY];
		$('a.localData:contains(\''+KEY+'\')').remove();
	}
}

function createFileAll(){
	var type = 'data:text/plain;charset=utf-8,';
	var title = 'localstorage-ALL-'+new Date().getTime();
	if(title == ''){ title = 'untitled'; }
	var filename = title+'.txt';

	var text = JSON.stringify(window.localStorage);

	generateFile(type, filename, text);
}

function resetAll(){
	var promptAction = prompt('WARNING: All localStorage will be deleted. Are you sure? [Y/N]', '');
	if(promptAction !== null && (promptAction === 'Y' || promptAction === 'y')){
		var promptAction2 = prompt('WARNING: all, all, all your localStorage will be deleted. Are you really really really sure? [Y/N]', '');
		if(promptAction2 !== null && (promptAction2 === 'Y' || promptAction2 === 'y')){
			localStorage.clear();
			$('a.localData').remove();
		}
	}
}

function selectKey(elem){
	$('.manage-local-storage a.localData').removeClass('selected');
	$(elem).addClass('selected');
}
function getSelectedKey(){
	return $('.manage-local-storage a.localData.selected').data('key')
}

function setupContent(){
	var txt = '';

	var items = [];

	for(var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		var size = localStorage.getItem(key).length;
		items.push([key, size]);
	}

	items.sort((a,b) => b[1] - a[1]);

	for (var i=0; i < items.length; i++) {
		txt += '<a class="localData" onclick="window.plugin.manageStorage.selectKey(this);return false;" data-key="' + items[i][0] + '">'+items[i][0]+' (' + items[i][1].toLocaleString() +')</a>';
	}

	var warn = '- Don\'t import with this plugin data exported by a different plugin.<br/>';
	warn += '- Don\'t import the data exported by a different plugin with this plugin.';

	return warn+'<div class="manage-local-storage">'+txt+'</div>';
}

function dialog(){
	window.dialog({
		html: setupContent,
		dialogClass: 'ui-dialog-local-storage',
		title: 'LocalStorage Manager',
		width: 'auto',
		buttons:{
			'EXPORT': function(){
				if($('.manage-local-storage a.localData.selected').length){
					createFile();
				}
			},
			'DELETE': function(){
				if($('.manage-local-storage a.localData.selected').length){
					reset();
				}
			},
			'IMPORT': function(){
					importData();
			},
			'EXPORT ALL': function(){
				createFileAll();
			},
			'DELETE ALL': function(){
				resetAll();
			}
		}
	});
	$('.ui-dialog-local-storage button:contains(\'DELETE ALL\')').addClass('warning');
}

function setupCSS(){
	$('<style>').prop('type', 'text/css').html(''
		+'.manage-local-storage .localData{display:block; border:1px solid #aaa; color:#aaa; padding:4px 4px 2px; text-align:center; margin:7px 2px;}'
		+'.manage-local-storage .localData:hover{text-decoration:none;background:rgba(8,48,78,.85);}'
		+'.manage-local-storage .localData.selected,#manage-localstorage-import{border:1px solid #ffce00;color:#ffce00;background:rgba(8,48,78,.85);}'
		+'.ui-dialog-local-storage button{margin:4px 0;margin-left:6px;padding: 5px 5px 4px;}'
		+'.ui-dialog-local-storage button.warning{border-color:#FF5454; color:#FF5454;}'
		+'.local-storage-import #manage-localstorage-import{margin-top:10px;}'
	).appendTo('head');
}

var setup = function(){
	setupCSS();

	/* expose api for click event */
	manageStorage.selectKey = selectKey;
	manageStorage.importFile = importFile;
	manageStorage.dialog = dialog;

	$('#toolbox').append('<a class="list-group-item" onclick="window.plugin.manageStorage.dialog();return false;" title="Manage Storage"><i class="fa fa-hdd-o"></i>LocalStorage</a>');
}

// PLUGIN END //////////////////////////////////////////////////////////

