#!/usr/bin/env node
'use strict';
var program = require('commander');
var version = require('./package.json').version;
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
	.reduce(function (styles, filename) {
		styles[path.basename(filename, '.css')] = path.join('styles', path.basename(filename));
		return styles;
	}, {});

var displayBuiltinStyles = function () {
	console.log('  Builtin styles (default is "markdown"):');
	console.log();
	for (var name in builtinStyles) {
		console.log('    %s', name);
	}
	console.log();
};

var displayErrorAndExit = function () {
	console.error();
	console.error('  error: %s', util.format.apply(undefined, arguments));
	console.error();
	process.exit(1);
};

var validateStyle = function (filename) {
	if (builtinStyles.hasOwnProperty(filename)) { return builtinStyles[filename]; }
	if (fs.existsSync(filename)) { return path.resolve(filename); }
	displayErrorAndExit('style not found: %s.', filename);
};

var increaseVerbosity = function (v, total) {
	return total + 1;
};

program
	.version(version)
	.usage('[options] <file>')
	.option('-s, --style <style>', 'specify custom .css or builtin style', validateStyle)
	.option('-v, --verbose', 'display additional information (use multiple time to increase)', increaseVerbosity, 0)
	.option('-d, --dev-tools', 'enable dev tools')
	.on('--help', displayHotkeys)
	.on('--help', displayBuiltinStyles)
	.parse(process.argv);

var info = function () {
	if (program.verbose > 0) {
		console.log.apply(console, arguments);
	}
};

var debug = function () {
	if (program.verbose > 1) {
		console.log.apply(console, arguments);
	}
};

var style = program.style || 'styles/markdown.css';
info('style: %s', style);

if (program.args.length !== 1) { return displayErrorAndExit('No single <file> specified.'); }
if (!fs.existsSync(program.args[0])) { return displayErrorAndExit('<file> not found: %s', program.args[0]); }
var file = path.resolve(program.args[0]);
info('file: %s', file);

var env = process.env;
env.LD_LIBRARY_PATH = path.join(__dirname, 'lib/');
debug('LD_LIBRARY_PATH: %s', env.LD_LIBRARY_PATH);

var args = [__dirname, style, file, program.devTools || false];
debug('spawning: %s %s', nw, JSON.stringify(args));
var nwProcess = spawn(nw, args, { env: env });
nwProcess.stdout.on('data', function (data) { debug('stdout: %s', data.toString()); });
nwProcess.stderr.on('data', function (data) { debug('stderr: %s', data.toString()); });
