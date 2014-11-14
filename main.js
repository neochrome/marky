var gui    = require('nw.gui');
var watch  = require('node-watch');
var path   = require('path');
var fs     = require('fs');
var marked = require('marked');
var hljs   = require('highlight.js');

marked.setOptions({
	highlight: function (code, lang) {
		if (lang === 'none') { return code; }
		if (hljs.getLanguage(lang)) { return hljs.fixMarkup(hljs.highlight(lang, code, true).value); }
		return hljs.fixMarkup(hljs.highlightAuto(code).value);
	}
});

var render = function (file) {
	fs.readFile(file, function (err, content) {
		document.getElementById('content').innerHTML = marked(content.toString());
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
