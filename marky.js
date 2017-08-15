#!/usr/bin/env node
const electron = require('electron');
const proc = require('child_process');
let e = proc.spawn(electron,  [__dirname].concat(process.argv.slice(2)));
e.stdout.on('data', data => process.stdout.write(data));
e.stderr.on('data', data => process.stderr.write(data));
e.on('close', code => process.exit(code));
