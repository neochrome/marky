# Marky
The little markdown previewer.

Starts a minimal webserver which renders a HTML preview
of the specified markdown file with auto refresh on changes.

## Installation
```
$ npm install --global neochrome/marky
```

## Usage
#### Basic usage
```
$ marky README.md
```

#### With github styling
```
$ marky --style github README.md
```

#### Code highlighting
Code highlighting is done using [hightlight.js](https://highlightjs.org/)

## Acknowledgements
- https://github.com/dcurtis/markdown-mark
- http://kevinburke.bitbucket.org/markdowncss/
- https://github.com/sindresorhus/github-markdown-css
- https://github.com/thomasf/solarized-css


## Release notes
1. make sure wc is clean and all commited
2. execute: `npm version major | minor | patch`
3. execute: `git push --all; git push --tags`
4. profit
