const fs = require('fs');
const _colors = require('colors');
const minimist = require('minimist');
const { generate } = require('./sudoku');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'random'];

const usage = `usage: node cli.js -n <number> -d difficulty -c <file> -o <file>
	-n - Number of sudokus to test
	-d - Difficulty
	-c - Output file c code
	-o - Output file solutions`;

const argv = minimist(process.argv.slice(2));

const n = Number(argv.n);

if (isNaN(n) || n <= 0) {
	console.log(usage);
	process.exit();
}

const writeToFileWrapper = (filename) => (data) => fs.writeFileSync(filename, data);
const warnIfMissing = (argv, field, msg = `${field} param is missing`) => {
	if (argv[field] === undefined)
		console.warn(_colors.yellow(msg));
}

warnIfMissing(argv, 'c', 'C output file is missing. Will print c code in the stdout');
warnIfMissing(argv, 'o', 'Soution output file is missing. Will print c code in the stdout');

const difficulty = DIFFICULTIES.indexOf(argv.d) === -1 ? 'random' : argv.d;
const outCfunc = argv.c ? writeToFileWrapper(argv.c) : console.log;
const outSolutionFunc = argv.o ? writeToFileWrapper(argv.o) : console.log;

generate(n, difficulty).then(sudokus => {
	let ccodeStr = '';
	let solutionStr = '';

	sudokus.forEach((s, idx) => {
		const charptr = s.board.map(r => r.reduce((res, col) => res += col == 0 ? '.' : col, ''))
			.map(r => `\t"${r}",`).join('\n');
		ccodeStr += `
char *valid_${idx}[11] =
{
	SUDOKU_PATH,
${charptr}
	NULL
};
`;
		solutionStr += s.solution.map(r => r.reduce((res, col) => res += col, '')).join('\n') + '\n';
	});
	outCfunc(ccodeStr);
	outSolutionFunc(solutionStr);
});
