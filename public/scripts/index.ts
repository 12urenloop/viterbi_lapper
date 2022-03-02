const VITERBI_CONFIG_URL = "http://10.1.0.200:8080/lappers/viterbi/configuration";
const VITERBI_PROBABILITIES_URL = "http://10.1.0.200:8080/lappers/viterbi/probabilities";

/**
 * The probabilities of any team being in a given sector
 */
type Probabilities = {
	/**
	 * The name of the team
	 */
	[key: string]: {
		/**
		 * The name of the sector
		 */
		[key: string]: number
	}
};

/**
 * The config of the viterbi lapper
 */
type Config = {
    TRACK_LENGTH: number;
    SECTOR_STARTS: number[];
    AVERAGE_RUNNER_SPEED: number;
    DETECTIONS_PER_SECOND: number;
    STATION_RANGE_SIGMA: number;
    RESTART_PROBABILITY: number;
};

const _PROBABILITY_STUB: Probabilities = {"1":{"0":0.996,"1":0.001,"2":0.001,"3":0.001,"4":0.001},"2":{"0":0.996,"1":0.001,"2":0.001,"3":0.001,"4":0.001},"3":{"0":0.996,"1":0.001,"2":0.001,"3":0.001,"4":0.001},"4":{"0":0.996,"1":0.001,"2":0.001,"3":0.001,"4":0.001},"5":{"0":0.996,"1":0.001,"2":0.001,"3":0.001,"4":0.001}};
const _CONFIG_STUB: Config = {"TRACK_LENGTH":500,"SECTOR_STARTS":[0,100,150,250,350],"AVERAGE_RUNNER_SPEED":100.0,"DETECTIONS_PER_SECOND":1.0,"STATION_RANGE_SIGMA":50.0,"RESTART_PROBABILITY":0.001};

const CANVAS = <HTMLCanvasElement>document.getElementById("canvas");
const CONTEXT = CANVAS.getContext("2d")!;

/**
 * Get the viterbi config from the server or use stub data on failure
 */
async function get_config(): Promise<Config> {
	try {
		let res = await fetch(VITERBI_CONFIG_URL, { redirect: "follow", mode: "no-cors" });
		if (!(res.ok)) {
			console.error(`ERROR: could not get config from ${VITERBI_CONFIG_URL}\n${res.status}\n${res.body}\nUsing stub data...`);
			return _CONFIG_STUB;
		}
		return res.json();
	} catch (err) {
		console.error(`ERROR: could not get config from ${VITERBI_CONFIG_URL}\n${err}\nUsing stub data...`);
		return _CONFIG_STUB;
	}
}

/**
 * Get the current team position probabilities or use stub data on failure
 */
async function get_probabilities(): Promise<Probabilities> {
	try {
		let res = await fetch(VITERBI_PROBABILITIES_URL, { redirect: "follow", mode: "no-cors" });
		if (!(res.ok)) {
			console.error(`ERROR: could not get probabilities from ${VITERBI_PROBABILITIES_URL}\n${res.status}\n${res.body}\nUsing stub data...`);
			return _PROBABILITY_STUB;
		}
		return res.json();
	} catch (err) {
		console.error(`ERROR: could not get probabilities from ${VITERBI_PROBABILITIES_URL}\n${err}\nUsing stub data...`);
		return _PROBABILITY_STUB;
	}
}

function draw_sector_boundaries(
	ctx: CanvasRenderingContext2D,
	origin: [number, number],
	x_interval: [number, number],
	normalised_sector_boundaries: number[],
) {
	ctx.lineWidth = 2.0;

	for (const boundary of normalised_sector_boundaries) {
		const scaled_boundary = origin[0] + boundary * (x_interval[1] - x_interval[0]);

		ctx.moveTo(scaled_boundary, origin[1] - 10);
		ctx.lineTo(scaled_boundary, origin[1] + 10);
		ctx.stroke();
	}

	// Draw final boundary
	ctx.moveTo(x_interval[1], origin[1] - 10);
	ctx.lineTo(x_interval[1], origin[1] + 10);
	ctx.stroke();
}

function draw_team_boundaries (
	ctx: CanvasRenderingContext2D,
	origin: [number, number],
	y_interval: [number, number],
	team_count: number,
) {
	ctx.lineWidth = 2.0;

	const interval = (y_interval[0] - y_interval[1]) / team_count;
	let pos = origin[1];

	for (let i=0; i<team_count; i++) {
		ctx.moveTo(origin[0] - 10, pos);
		ctx.lineTo(origin[0] + 10, pos);
		ctx.stroke();

		pos += interval;
	}

	// Draw final boundary
	ctx.moveTo(origin[0] - 10, pos);
	ctx.lineTo(origin[0] + 10, pos);
	ctx.stroke();
}

async function main(cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	// Start awaiting viterbi data
	const [prb_promise, cfg_promise] = [get_probabilities(), get_config()];

	// Initial canvas setup
	cvs.width = window.innerWidth*2/3;
	cvs.height = window.innerHeight;
	ctx.fillStyle = "#0E0E0E";
	ctx.fillRect(0, 0, cvs.width, cvs.height);
	ctx.strokeStyle = "#FFFFFF";
	ctx.lineWidth = 2.0;
	ctx.lineCap = "butt";

	const x_spacer = cvs.width / 20;
	const y_spacer = cvs.height / 20;

	const [prb, cfg] = await Promise.all([prb_promise, cfg_promise]);

	const max_text_len = Math.max(...Object.keys(prb).map((team) => ctx.measureText(team).width))
	const origin: [number, number] = [x_spacer*2 + max_text_len, cvs.height - y_spacer]
	const x_interval: [number, number] = [origin[0], cvs.width - x_spacer];
	const y_interval: [number, number] = [y_spacer, origin[1]];

	// Sector axis
	ctx.beginPath();
	ctx.moveTo(...origin);
	ctx.lineTo(x_interval[1], y_interval[1]);
	ctx.stroke();

	// Team axis
	ctx.beginPath();
	ctx.moveTo(...origin);
	ctx.lineTo(x_interval[0], y_interval[0]);
	ctx.stroke();

	const normalised_sector_boundaries = cfg.SECTOR_STARTS.map((start) => start / cfg.TRACK_LENGTH);

	console.log(Object.keys(prb).length);

	draw_sector_boundaries(ctx, origin, x_interval, normalised_sector_boundaries);
	draw_team_boundaries(ctx, origin, y_interval, Object.keys(prb).length);

	console.log(cfg);
	console.log(prb);
}

window.onload = async () => await main(CANVAS, CONTEXT);
