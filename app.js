#!/usr/bin/env node
var program = require('commander');
var package = require('./package.json');
var glob    = require('glob');
var path    = require('path');
var fs      = require('fs');
var util    = require('util');
var spawn   = require('child_process').spawn;
var nw      = require('nodewebkit').findpath();

var displayHotkeys = function () {
	console.log('  Hotkeys:');
	console.log();
	console.log('    ESC - close the preview window and quit.');
	console.log();
};

var builtinStyles = glob.sync(path.join(__dirname, 'styles', '*.css'))
	.reduce(function (acc, style) {
		acc[path.basename(style, '.css')] = path.join('styles', path.basename(style));
		return acc;
	}, {});

var displayBuiltinStyles = function () {
	console.log('  Builtin styles (default is "markdown"):');
	console.log();
	for (var style in builtinStyles) {
		console.log('    %s', style);
	}
	console.log();
};

var displayErrorAndExit = function () {
	console.error();
	console.error('  error: %s', util.format.apply(undefined, arguments));
	console.error();
	process.exit(1);
};

var validateStyle = function (style) {
	if (builtinStyles.hasOwnProperty(style)) { return builtinStyles[style]; }
	if (fs.existsSync(style)) { return path.resolve(style); }
	displayErrorAndExit('style not found: %s.', style);
};

program
	.version(package.version)
	.usage('[options] <file>')
	.option('-s, --style <style>', 'specify custom .css or builtin style', validateStyle)
	.on('--help', displayHotkeys)
	.on('--help', displayBuiltinStyles)
	.parse(process.argv);

var style = program.style || 'styles/markdown.css';
if (program.args.length !== 1) { return displayErrorAndExit('No single <file> specified.'); }
if (!fs.existsSync(program.args[0])) { return displayErrorAndExit('<file> not found: %s', program.args[0]); }
var file = path.resolve(program.args[0]);

var env = process.env;
env.LD_LIBRARY_PATH = path.resolve('lib/');
spawn(nw, [__dirname, style, file], { env: env });
