/**
 * Visualiser for viterbi probability data in 12ul
 */

import { interpolate_hsl, interpolate_rgb, hex2rgb } from "./color";
import { Config, Probabilities } from "./types";

const VITERBI_CONFIG_URL = "http://10.1.0.200:8080/lappers/viterbi/configuration";
const VITERBI_PROBABILITIES_URL = "http://10.1.0.200:8080/lappers/viterbi/probabilities";

const _PROBABILITY_STUB: Probabilities = {"1":{"0":0.5,"1":0.3,"2":0.1,"3":0.05,"4":0.05},"2":{"0":0.05,"1":0.1,"2":0.15,"3":0.4,"4":0.3},"3":{"0":0.2,"1":0.2,"2":0.2,"3":0.2,"4":0.2},"4":{"0":0.005,"1":0.005,"2":0.09,"3":0.7,"4":0.2},"5":{"0":0.1,"1":0.2,"2":0.3,"3":0.2,"4":0.2}};
const _CONFIG_STUB: Config = {"TRACK_LENGTH":500,"SECTOR_STARTS":[0,100,150,250,350],"AVERAGE_RUNNER_SPEED":100.0,"DETECTIONS_PER_SECOND":1.0,"STATION_RANGE_SIGMA":50.0,"RESTART_PROBABILITY":0.001};

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

/**
 * Draw lines on the x-axis to mark where each sector starts and ends
 *
 * Returns a map between sector names and x-axis interval
 */
function draw_sector_boundaries(
	ctx: CanvasRenderingContext2D,
	origin: [number, number],
	x_interval: [number, number],
	normalised_sector_map: {[key: string]: number},
	y_spacer: number,
): {[key: string]: [number, number]} {
	const sector_interval_map: {[key: string]: [number, number]} = {};
	const sector_names = Object.keys(normalised_sector_map);
	const sector_starts = [...Object.values(normalised_sector_map), 1.0];
	let scaled_boundary = origin[0];
	let next_boundary = origin[0] + sector_starts[0] * (x_interval[1] - x_interval[0]);

	for (let i=0; i<sector_starts.length; i++) {
		scaled_boundary = next_boundary;
		next_boundary = origin[0] + sector_starts[i+1] * (x_interval[1] - x_interval[0])

		// Draw boundary line
		ctx.moveTo(scaled_boundary, origin[1] - 10);
		ctx.lineTo(scaled_boundary, origin[1] + 10);
		ctx.stroke();

		const text_width = ctx.measureText(sector_names[i]).width;

		ctx.fillText(sector_names[i], (scaled_boundary + next_boundary)/2 - text_width/2, origin[1] + y_spacer);

		sector_interval_map[sector_names[i]] = [scaled_boundary, next_boundary];
	}

	return sector_interval_map;
}

/**
 * Draw lines on the y-axis to mark where each teams probability data will be shown
 *
 * Returns a map between team names and y-axis interval
 */
function draw_team_boundaries (
	ctx: CanvasRenderingContext2D,
	origin: [number, number],
	y_interval: [number, number],
	teams: string[],
	x_spacer: number,
): {[key: string]: [number, number]} {
	const team_interval_map: {[key: string]: [number, number]} = {};
	const team_count = teams.length;
	const interval = (y_interval[0] - y_interval[1]) / team_count;
	let pos = origin[1];

	for (let i=0; i<team_count; i++) {
		ctx.moveTo(origin[0] - 10, pos);
		ctx.lineTo(origin[0] + 10, pos);
		ctx.stroke();

		const text_metrics = ctx.measureText(teams[i]);
		const text_width = text_metrics.width;
		const text_height = text_metrics.actualBoundingBoxAscent - text_metrics.actualBoundingBoxDescent;
		ctx.fillText(teams[i], origin[0] - text_width - x_spacer, pos + interval/2 + text_height/2);

		team_interval_map[teams[i]] = [pos, pos+interval];

		pos += interval;
	}

	// Draw final boundary
	ctx.moveTo(origin[0] - 10, pos);
	ctx.lineTo(origin[0] + 10, pos);
	ctx.stroke();

	return team_interval_map;
}

function draw_probabilities(
	ctx: CanvasRenderingContext2D,
	background: [number, number, number],
	colors: [number, number, number][],
	sector_interval_map: {[key: string]: [number, number]},
	team_interval_map: {[key: string]: [number, number]},
	probabilities: Probabilities,
) {
	let color_idx = 0;

	for (const [team, probs] of Object.entries(probabilities)) {
		for (const [sector, prob] of Object.entries(probs)) {
			ctx.fillStyle = interpolate_rgb(background, colors[color_idx], prob);
			ctx.fillRect(
				sector_interval_map[sector][0] + 5,
				team_interval_map[team][1] + 5,
				sector_interval_map[sector][1] - sector_interval_map[sector][0] - 10,
				team_interval_map[team][0] - team_interval_map[team][1] - 10,
			);
		}
		color_idx++;
	}
}

async function main() {
	const cvs = <HTMLCanvasElement>document.getElementById("canvas");
	const ctx = cvs.getContext("2d")!;

	const background = "#0E0E0E";

	// Start awaiting viterbi data
	const [prb_promise, cfg_promise] = [get_probabilities(), get_config()];

	// Initial canvas setup
	cvs.width = window.innerWidth;
	cvs.height = window.innerHeight;
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, cvs.width, cvs.height);
	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#FFFFFF";
	ctx.lineWidth = 2.0;
	ctx.lineCap = "butt";
	ctx.font = "18px sans-serif"

	const x_spacer = cvs.width / 20;
	const y_spacer = cvs.height / 20;

	const [prb, cfg] = await Promise.all([prb_promise, cfg_promise]);


	// Used to calculate x offset of origin
	const max_text_len = Math.max(...Object.keys(prb).map((team) => ctx.measureText(team).width))

	// Used to calculate y offset of origin
	const sector_max_text_height = Math.max(...Object.keys(Object.values(prb)[0]).map((sector) => {
		let metrics = ctx.measureText(sector);
		return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	}));
	const team_max_text_height = Math.max(...Object.keys(prb).map((team) => {
		let metrics = ctx.measureText(team);
		return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	}));
	const max_text_height = Math.max(sector_max_text_height, team_max_text_height);

	/** Origin coordinates */
	const origin: [number, number] = [x_spacer*2 + max_text_len, cvs.height - y_spacer*2 - max_text_height]
	/** Start and end coordinates of x axis */
	const x_interval: [number, number] = [origin[0], cvs.width - x_spacer];
	/** Start and end coordinates of y axis */
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

	/** Map between sector name and normalised sector start position */
	const normalised_sector_map: {[key: string]: number} = {};
	for (const [idx, start] of Object.entries(cfg.SECTOR_STARTS)) {
		normalised_sector_map[idx] = start / cfg.TRACK_LENGTH;
	}

	// Draw sectors on graph and get intervals
	const sector_interval_map = draw_sector_boundaries(ctx, origin, x_interval, normalised_sector_map, y_spacer);
	// Draw teams on graph and get intervals
	const team_interval_map = draw_team_boundaries(ctx, origin, y_interval, Object.keys(prb), x_spacer);

	// Get array of colors to use for drawing probabilites
	const team_colors: [number, number, number][] = [];
	const color_interval = 1 / (Object.keys(prb).length-1);
	let color_factor = 0;
	for (let i=0; i<Object.keys(prb).length; i++) {
		team_colors.push(interpolate_hsl([255, 0, 0], [0, 255, 255], color_factor));
		color_factor += color_interval;
	}

	draw_probabilities(ctx, hex2rgb(background), team_colors, sector_interval_map, team_interval_map, prb);
}

window.onload = main;
