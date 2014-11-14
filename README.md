# Marky
The little markdown previewer.

He watches a file for changes and updates a HTML preview,
possible styled with a custom css.

Pressing ESC makes him go away.

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

#### With custom stylesheet
```
$ marky --style mystyles.css README.md
```

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
