#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const hljs = require('highlight.js');
const marked = require('marked');

marked.setOptions({
	highlight: (code, lang) => {
		if (lang === 'none') { return code; }
		return hljs.highlightAuto(code).value;
	}
});
const heartrate = 10 * 1000;
const version = require('./package.json').version;
const styles = fs.readdirSync(path.join(__dirname, 'styles')).map((f) => path.basename(f, '.css')).sort();

const displayHelp = () => {
	console.log();
	console.log('  Available styles:');
	console.log();
	styles.forEach((name) =>
		console.log('    %s', name)
	);
	console.log();
}

const displayErrorAndExit = (msg) => {
		console.error();
		console.error(`  error: ${msg}`);
		console.error();
		process.exit(1);
};

const program = require('commander');
program
	.arguments('<file>')
	.option('-s, --style <style>', 'specify style', (style, fallback) => styles.find(s => s === style) || fallback, 'markdown')
	.option('-v, --verbose', 'increase verbosity (may be used multiple times)', (_, total) => total + 1, 0)
	.on('--help', displayHelp)
	.version(version)
	.parse(process.argv);

if (!program.args[0]) { return displayErrorAndExit('missing required <file>'); }
if (!fs.existsSync(program.args[0])) { return displayErrorAndExit(`<file> not found: ${program.args[0]}`); }
const file = path.resolve(program.args[0]);


const info = (...args) => {
	if (program.verbose > 0) {
		console.log(...args);
	}
};

const debug = (msg, ...args) => {
	if (program.verbose > 1) {
		console.log('[DEBUG] ' + msg, ...args);
	}
};

const trace = (msg, ...args) => {
	if (program.verbose > 2) {
		console.log('[TRACE] ' + msg, ...args);
	}
};

const debounce = (fn, timeout = 100) => {
	let waiting;
	return (...args) => {
		if (waiting) {
			trace('debouncing');
			clearTimeout(waiting);
		}
		waiting = setTimeout(() => fn(...args), timeout);
	};
};

const sendFile = (filename, res) => {
	const mime = {
		'css': 'text',
		'html': 'text',
		'png': 'image',
		'gif': 'image',
		'jpg': 'image',
	};
	const ext = path.extname(filename).substring(1);
	const type = mime[ext] + `/${ext}` || 'application/octet-stream';
	const stat = fs.statSync(filename);
	trace(`sendfile: ${path.relative(__dirname, filename)}`);
	trace(`Content-Type: ${type}`);
	res.writeHead(200, {
		'Content-Type': type,
		'Content-Length': stat.size,
	});
	return fs.createReadStream(filename).pipe(res);
}

const clients = new Set();
const send = (event, data) => {
	trace(`send: ${event}`);
	let content = `event: ${event}\n`;
	if (typeof data === 'object') {
		data = JSON.stringify(data);
	}
	if (typeof data !== 'string') {
		data = `${data}`;
	}
	content += data.split('\n').map(d => `data: ${d}`).join('\n');
	content += '\n\n';
	clients.forEach((res) => res.write(content));
};

const update = () => {
	send('update', marked(fs.readFileSync(file).toString()));
};

const server = http.createServer((req, res) => {
	debug(req.method, req.url);

	if (req.url === '/events') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});
		clients.add(res);
		debug('client connected');
		req.once('close', () => {
			debug('client disconnected');
			clients.delete(res);
		});
		update();
		return;
	}

	if (req.url === '/') {
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Cache-Control': 'no-cache',
		});
		return res.end(`
			<!doctype html>
			<html lang="en">
				<head>
					<title>Marky - ${file}</title>
					<link rel="stylesheet" href="styles/${program.style}.css"/>
					<link rel="icon" href="icon.png"/>
					<style>
						body.disconnected .alert {
							display: block;
						}
						.alert {
							display: none;
							position: fixed;
							top: 0; left: 0; width: 100%; height: 100%;
							background-color: rgba(0,0,0,.1);
							box-shadow: inset 0 0 10px #333;
							text-align: center;
							font-family: sans-serif;
						}
						.alert header {
							background-color: #fff;
							padding: 1em;
							margin: 2em 25%;
							border-radius: 4px;
							border: 2px solid #ccc;
							min-width: 300px;
						}
						.alert h1:before {
							content: '\\26a1';
							display: block;
							font-size: 5em;
							color: #f00;
						}
						.alert h1 {
							font-size: 2em;
							font-weight: bold;
							font-family: sans-serif;
							color: #000;
							text-transform: uppercase;
						}
						.alert button {
							padding: 4px 14px;
							border-radius: 4px;
							font-size: 13px;
							line-height: 18px;
							background-color: #0064cd;
							color: #fff;
							border: 1px solid #004b9a;
							border-color: #0064cd #0064cd #003f81;
							border-bottom-color: #003f81;
							background-repeat: repeat-x;
							background-image: -khtml-gradient(linear, left top, left bottom, from(#049cdb), to(#0064cd));
							background-image: -moz-linear-gradient(top, #049cdb, #0064cd);
							background-image: -ms-linear-gradient(top, #049cdb, #0064cd);
							background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #049cdb), color-stop(100%, #0064cd));
							background-image: -webkit-linear-gradient(top, #049cdb, #0064cd);
							background-image: -o-linear-gradient(top, #049cdb, #0064cd);
							background-image: linear-gradient(top, #049cdb, #0064cd);
						}
					</style>
				</head>
				<body>
					<div class="alert">
						<header>
							<h1>Disconnected</h1>
							<button onclick="connect();">re-connect</button>
						</header>
					</div>
					<main id="content" class="markdown-body"></main>
					<script>
						function connect () {
							heartbeat();
							${program.verbose > 1 ? `console.log('connecting to server');`:''}
							var src = new EventSource('/events');
							src.onopen = function () {
								${program.verbose > 1 ? `console.log('connected to server');`:''}
								document.body.classList.remove('disconnected');
							};
							src.onerror = function (e) {
								console.log('got error, closing down.', e);
								document.body.classList.add('disconnected');
								src.close();
							};
							const content = document.getElementById('content');
							src.addEventListener('update', function (event) {
								${program.verbose > 2 ? `console.log('received update event');`:''}
								content.innerHTML = event.data;
							});
							src.addEventListener('heartbeat', heartbeat);
						}
						var keepalive;
						function heartbeat () {
							if (keepalive) { clearTimeout(keepalive); }
							keepalive = setTimeout(connect, ${heartrate + 500});
						}
						connect();
					</script>
				</body>
			</html>
		`.trim());
	}

	const asset = path.join(__dirname, req.url);
	if (fs.existsSync(asset)) {
		debug(`serving asset: ${asset}`);
		return sendFile(asset, res);
	}

	debug('not found');
	res.writeHead(404);
	res.end();
}).on('error', (err) => {
	if (!err.code === 'EADDRINUSE') { return; }
	info('default port (6502) in use, picking a new one');
	server.close();
	server.listen(0);
}).listen(6502, () => {
	setInterval(() => send('heartbeat', Date.now()), heartrate);

	fs.watch(file, debounce((...args) => {
		trace(...args);
		debug(`${file} changed`);
		update();
	}));

	[
		'',
		'  ---===[   Welcome to Marky   ]===---',
		'',
		`   watching: ${path.relative(process.cwd(), file)}`,
		`   preview : http://localhost:${server.address().port}/`,
		'',
	].forEach((l) => console.log(l));
	debug(`heartrate ${heartrate}ms`);
});
