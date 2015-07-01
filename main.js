'use strict';

var gui      = require('nw.gui');
var chokidar = require('chokidar');
var path     = require('path');
var fs       = require('fs');
var marked   = require('marked');
var hljs     = require('highlight.js');
var util     = require('util');

console.log('arguments received: ', gui.App.argv);

marked.setOptions({
	highlight: function (code, lang) {
		if (lang === 'none') { return code; }
		if (hljs.getLanguage(lang)) { return hljs.fixMarkup(hljs.highlight(lang, code, true).value); }
		return hljs.fixMarkup(hljs.highlightAuto(code).value);
	}
});

var render = function (content) {
	document.getElementById('content').innerHTML = marked(content);
};
var renderFile = function (file) {
	console.log('rendering: ' + file);
	fs.readFile(file, function (err, content) {
		render(content.toString());
	});
};

var style = gui.App.argv[0];
var file  = gui.App.argv[1];

gui.Window.get().show();
if (JSON.parse(gui.App.argv[2])) {
	gui.Window.get().showDevTools();
}

document.onkeyup = function (e) {
	if (e.keyCode == 27) {
		console.log('exiting');
		gui.App.closeAllWindows();
	}
};
document.getElementById('style').href = style;
document.title = 'Marky: ' + path.basename(file);

chokidar
.watch(file)
.on('error', function (err) {
	console.log('error: %s', err.toString());
	render(util.format('### Error\n```none\n%s\n```', err.toString()));
})
.on('change', function (path) {
	console.log('changed: %s', path);
	renderFile(path);
})
.on('unlink', function (path) {
	console.log('deleted: %s', path);
	render(util.format('### %s was deleted', path));
})
.on('ready', function () {
	console.log('ready');
	renderFile(file);
});
