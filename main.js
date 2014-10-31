var gui      = require('nw.gui');
var watch    = require('node-watch');
var path     = require('path');
var fs       = require('fs');
var markdown = require('markdown').markdown;

var render = function (file) {
	fs.readFile(file, function (err, content) {
		var html = markdown.toHTML(content.toString());
		document.getElementById('content').innerHTML = html;
	});
};

var style = gui.App.argv[0];
var file  = gui.App.argv[1];

gui.Window.get().show();
document.onkeyup = function (e) { if (e.keyCode == 27) { gui.App.closeAllWindows(); } };
document.getElementById('style').href = style;
document.title = 'Marky: ' + path.basename(file);

watch(file, render);
render(file);
