const https = require('https');
const _colors = require('colors');
const _cliProgress = require('cli-progress');

const API_URI = 'https://sugoku.herokuapp.com/';

const encodeBoard = (board) => board.reduce((result, row, i) => result + `%5B${encodeURIComponent(row)}%5D${i === board.length -1 ? '' : '%2C'}`, '')

const encodeParams = (params) => 
	Object.keys(params)
	.map(key => key + '=' + `%5B${encodeBoard(params[key])}%5D`)
	.join('&');

const getSudoku = (difficulty) => {
	return new Promise((resolve, reject) => {
		let data = '';

		https.get(`${API_URI}board?difficulty=${difficulty}`, (resp) => {
			resp.on('data', chunk => data += chunk);
			resp.on('end', () => resolve(JSON.parse(data)));
		}).on('error', reject);
	});
};

const solveSudoku = (json) => {

	const options = {
		hostname: 'sugoku.herokuapp.com',
		port: 443,
		path: '/solve',
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	};

	return new Promise((resolve, reject) => {
		let data = '';

		const req = https.request(options, (resp) => {
			resp.on('data', chunk => data += chunk);
			resp.on('error', reject);
			resp.on('end', () => resolve(JSON.parse(data)))
		});
		req.on('error', reject);
		req.write(encodeParams(json));
		req.end();
	});
};

const validateSudoku = (board) => {
	const url = new URL(`${API_URI}validate?board=${encodeBoard(board)}`);
	return new Promise((resolve, reject) => {
		let data = '';

		https.request(url, (resp) => {
			resp.on('data', chunk => data += chunk);
			resp.on('end', () => resolve(JSON.parse(data)))
		}).on('error', reject);
	});
};

const generate = async (n, difficulty) => {
	const boards = [];
	const progressBar = new _cliProgress.SingleBar({
		format: 'Progress |' + _colors.cyan('{bar}') + '| {percentage}%',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true,
	});

	progressBar.start(n * 2, 0);
	for (let i = 0; i < n; i++) {
		const sudoku = await getSudoku(difficulty);
		progressBar.increment();
		const solution = await solveSudoku({ ...sudoku });
		progressBar.increment();

		boards.push({ ...sudoku, ...solution });
	}
	progressBar.stop();
	return boards;
}

module.exports = {
	generate,
};