const program = require('commander');
const version = require('./package.json').version;
const { app, BrowserWindow } = require('electron');
const glob = require('glob');
const path = require('path');
const hljs = require('highlight.js');
const marked = require('marked');
const fs = require('fs');
const util = require('util');

const builtinStyles = glob.sync(path.join(__dirname, 'styles', '*.css'))
	.reduce((styles, filename) => {
		styles[path.basename(filename, '.css')] = path.join('styles', path.basename(filename));
		return styles;
	}, {});

function displayHelp () {
	console.log();
	console.log('  Hotkeys:');
	console.log();
	console.log('    ESC - close the preview window and quit.');
	console.log();
	console.log('  Builtin styles (default is "markdown"):');
	console.log();
	for (var name in builtinStyles) {
		console.log('    %s', name);
	}
	console.log();
}

function displayErrorAndExit () {
	console.error();
	console.error('  error: %s', util.format.apply(undefined, arguments));
	console.error();
	app.exit(1);
}

function validateStyle (filename) {
	if (builtinStyles.hasOwnProperty(filename)) { return builtinStyles[filename]; }
	if (fs.existsSync(filename)) { return path.resolve(filename); }
	displayErrorAndExit('style not found: %s', filename);
}

program
	.version(version)
	.usage('[options] <file>')
	.option('-s, --style <style>', 'specify custom .css or builtin style', validateStyle)
	.option('-v, --verbose', 'display additional information (use multiple time to increase)', (_, total) => total + 1, 0)
	.option('-d, --dev-tools', 'enable dev tools')
	.on('--help', displayHelp)
	.parse(process.argv);

function info () {
	if (program.verbose > 0) {
		console.log.apply(console, arguments);
	}
};

function debug () {
	if (program.verbose > 1) {
		console.log.apply(console, arguments);
	}
};

const style = program.style || 'styles/markdown.css';
info('style: %s', style);

if (program.args.length !== 1) { return displayErrorAndExit('No single <file> specified.'); }
if (!fs.existsSync(program.args[0])) { return displayErrorAndExit('<file> not found: %s', program.args[0]); }
var file = path.resolve(program.args[0]);
info('file: %s', file);

marked.setOptions({
	highlight: (code, lang) => {
		if (lang === 'none') { return code; }
		return hljs.highlightAuto(code).value;
	}
});

let win;
function createWindow () {
	win = new BrowserWindow({ center: true, icon: './icon.png' });
	win.setMenu(null);
	win.loadURL(`file://${__dirname}/index.html#style=${style}&file=${file}`);
	win.on('closed', () => win = null);
	win.webContents.on('before-input-event', (event, input) => {
		if (input.type === 'keyDown' && input.code === 'Escape') { app.quit(); }
	});
	win.webContents.once('did-finish-load', update);
	if (program.devTools) { win.webContents.openDevTools(); }
}

function update () {
	fs.readFile(file, (err, data) => {
		if (err) { return console.error(err); }
		win.webContents.send('content', marked(data.toString()));
	});
}

app.on('ready', () => {
	createWindow();
	fs.watch(file, (eventType, _) => {
		debug('event: %s', eventType);
		if (eventType === 'change') {
			info('changed: %s', file);
			update();
		}
	});
});
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') { app.quit(); }
});
app.on('activate', () => {
	if (!win) { createWindow(); }
});
