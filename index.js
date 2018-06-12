const path = require('path')
const notifier = require('node-notifier')
const stripAnsi = require('strip-ansi')
const {charSizes} = require('./font.js')


// Ugly hack. There are two problems (not 100% sure but this is what's most likely going on)
// 1) Rollup apparently terminates the process immediately after error occurs.
//    It calls the buildEnd callback but does not give us enough time to create the notification asynchronously.
// 2) node-notifier creates the notification by calling child_process.execFile() which is not as reliable
//    as just child_process.exec(). But exec() wouldn't support multiline notifications due to inability to pass
//    EOLs in cmd arguments.
// This hack creates the notification synchronously and bypassess node-notifier's internals.
// Tested on Windows 10. Not sure if the same problem/hack occurs/is-needed on other systems too.
const os = require('os')
if (os.platform() === 'win32' && os.release().startsWith('10.')) {
	notifier.notify = function(options) {
		var {title, message, icon} = options
		var cp = require('child_process')
		var path = require('path')
		var snorePath = './node_modules/node-notifier/vendor/snoreToast/SnoreToast.exe'
		snorePath = path.join(__dirname, snorePath)
		var args = []
		if (icon)
			args.push('-p', icon)
		if (title)
			args.push('-t', title)
		if (message)
			args.push('-m', message)
		cp.spawnSync(snorePath, args)
	}
}

var icon = path.join(__dirname, 'rollup.png')

function makeDummyLine(char, size) {
	return char.repeat(Math.round(52 / size))
}

function getLength(string) {
	var characters = 0
	string
		.split('')
		.forEach(char => {
			var size = charSizes.get(char) || 1
			characters += size
		})
	return Math.round(characters)
}

// Babel is the worst offender.
function sanitizeLines(frame) {
	// Sanitize newlines & replace tabs.
	lines = stripAnsi(frame)
		.replace(/\r/g, '')
		.split('\n')
		.map(l => l.replace(/\t/g, '  '))
	// Remove left carret.
	var leftCaretLine = lines.find(l => l.startsWith('>'))
	if (leftCaretLine) {
		lines[lines.indexOf(leftCaretLine)] = leftCaretLine.replace('>', ' ')
	}
	// Remove left padding.
	// Loop while all lines start with space and strip the space from all lines.
	while (lines.find(l => !l.startsWith(' ')) == undefined) {
		lines = lines.map(l => l.slice(1))
	}
	return lines
}

function getMessage(error) {
	var {message} = error
	if (error.plugin === 'babel') {
		// Hey Babel, you're not helping!
		var filepath = error.id
		var message = error.message
		function stripFilePath() {
			var index = message.indexOf(filepath)
			console.log(index, filepath.length)
			message = message.slice(0, index) + message.slice(filepath.length + 1)
			message = message.trim()
		}
		if (message.includes(filepath)) {
			stripFilePath()
		} else {
			filepath = filepath.replace(/\\/g, '/')
			if (message.includes(filepath))
				stripFilePath()
		}
	}
	return message
}

// TODO. Works great with basic rollup error and seems to work ok with babel, but could use more logic.
function getCaretLine(lines) {
	return lines
		.find(line => {
			return line.startsWith('  ')
				&& line.includes('^')
				&& !line.includes(':')
		})
}

function createCodeBlock(frame) {
	var lines = sanitizeLines(frame)
	var caretLineOriginal = getCaretLine(lines)
	var codeLine = lines[lines.indexOf(caretLineOriginal) - 1]
	var caretStart = caretLineOriginal.indexOf('^')
	var caretCountOriginal = (caretLineOriginal.match(/\^/g) || []).length
	var toBeReplacedBySpaces = codeLine.substr(0, caretStart)
	var spaceCount = getLength(toBeReplacedBySpaces)
	var spaces = ' '.repeat(spaceCount)
	if (caretCountOriginal === 1) {
		var carets = '^'
	} else {
		var toBeReplacedByMarkers = codeLine.substr(caretStart, caretCountOriginal)
		var caretCountNew = getLength(toBeReplacedByMarkers)
		var carets = '^'.repeat(caretCountNew / charSizes.get('^'))
	}
	var caretLine = spaces + carets
	return [codeLine, caretLine].join('\n')
}

function processError(error) {
	var message = getMessage(error)
	if (error.plugin === undefined && error.frame) {
		message += '\n' + createCodeBlock(error.frame)
	} else if (error.codeFrame) {
		message += '\n' + createCodeBlock(error.codeFrame)
	}
	var line
	var column
	var filepath
	if (error.loc) {
		// Default Rollup error when code is malformed.
		if (error.loc.file)		filepath = path.resolve(error.loc.file)
		if (error.loc.line)		line = error.loc.line
		if (error.loc.column)	column = error.loc.column
		if (error.loc.col)		column = error.loc.col
	}
	// Wild guessing any other way plugins might tell us where the error occured.
	// Inspired by babel (it has loc object but without file, that is in error.id)
	if (error.line)		line = error.line
	if (error.column)	column = error.column
	if (error.col)		column = error.col
	if (error.id) {
		// babel puts filename here
		try {
			filepath = path.resolve(error.id)
		} catch(err) {}
	}
	// Make title from available information
	var sections = []
	if (filepath)
		sections.push(getFileName(filepath))
	if (line !== undefined && column !== undefined)
		sections.push(`(${line}:${column})`)
	if (error.plugin)
		sections.push(error.plugin)
	else if (error.code)
		sections.push(error.code)
	var title = sections.filter(a => a).join(' ') || `Rollup error: ${error.code}`
	// Show notification
	notifier.notify({title, message, icon})
}

function getFileName(filepath) {
	if (typeof filepath === 'string')
		return path.parse(filepath).base
}

module.exports = function notify(options) {
	return {
		buildEnd(err) {
			if (err)
				processError(err)
		}
	}
}
