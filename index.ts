/**
 * FIRST VALUE IS Y
 * SECOND VALUE IS X
 *
 * DO NOT ASK WHY
 */

/* CHANGE BEFORE RUNNING CODE */
/*                   ⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄ */
const TELRAAM_URL = "http://172.12.50.21:8080";
/*                   ⌃⌃⌃⌃⌃⌃⌃⌃⌃⌃⌃⌃⌃⌃ */

const STATION_LOCATIONS: {[key: string]: [number, number]} = {
	"Telpunt 1": [-12.2, -0.3],
	"Telpunt 2": [-13.5, 30.0],
	"Telpunt 3": [31.6, 46.0],
	"Telpunt 4": [93.0, 48.0],
	"Telpunt 5": [121.0, 9.0],
	"Telpunt 6": [79.4, -1.1],
	"Telpunt 7": [17.7, -1.2],
};
/* CHANGE BEFORE RUNNING CODE */

const VITERBI_PROBABILITIES_URL: string = `${TELRAAM_URL}/lappers/viterbi/probabilities`;
const TELRAAM_TEAM_URL: string = `${TELRAAM_URL}/team`;
const SECTOR_IDS: Array<string> = [];
let CURRENT_ID: string = "";

type TeamProbabilities = {
	[key: string]: {
		[key: string]: number
	}
};

async function get_probabilities(): Promise<TeamProbabilities> {
	const res = await fetch(VITERBI_PROBABILITIES_URL);
	if (!(res.ok)) {
		throw new Error(`Could not get probabilities:\nstatus: ${res.status}\nbody: ${res.body}`);
	}

	return res.json();
}

async function get_team_names(): Promise<{[key: string]: string}> {
	const res = await fetch(TELRAAM_TEAM_URL);
	if (!(res.ok)) {
		throw new Error(`Could not get team names:\nstatus: ${res.status}\nbody: ${res.body}`);
	}

	const json: {[key: string]: {id: number, name: string, batonId: number}} = await res.json();

	const name_map: {[key: string]: string} = {};
	for (const value of Object.values(json)) {
		name_map[value.id.toString()] = value.name;
	}

	return name_map;
}

function get_hsl(h: number, s: number): string {
	return `hsl(${h}, ${Math.round(s * 100)}%, 50%)`;
}

async function setup() {
	let max_y = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[0]));
	const max_x = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[1]));

	// Normalise coordinates to max magnitude 1
	Object.entries(STATION_LOCATIONS).forEach(([name, coords]) => {
		STATION_LOCATIONS[name] = [coords[0] / max_y, coords[1] / max_x];
	});

	max_y = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[0]));
	const min_x = Math.min(...Object.values(STATION_LOCATIONS).map(coords => coords[1]));

	// translate coordinates so upper left corner has smallest x and y
	Object.entries(STATION_LOCATIONS).forEach(([name, coords]) => {
		STATION_LOCATIONS[name] = [-(coords[0] - max_y), coords[1] - min_x];
	});

	const wrapper = <HTMLDivElement>document.querySelector(".svg-wrapper")!;
	const width = wrapper.offsetWidth;
	const height = wrapper.offsetHeight;

	const selector = <HTMLSelectElement>document.getElementById("team-selector")!;

	const probabilities = await get_probabilities();
	const team_ids = Object.keys(probabilities);
	const team_names = await get_team_names();

	CURRENT_ID = team_ids[0];

	for (const id of team_ids) {
		const name = team_names[id];
		const option = document.createElement("option");
		option.setAttribute("value", id);
		option.innerText = name;

		selector.appendChild(option);
	}

	const g = document.querySelector("g")!;
	for (let i = 0; i < Object.keys(STATION_LOCATIONS).length; i++) {
		// Draw from halfway between previous point to current point, then
		// from between current point to halfway between next point

		let names = Object.keys(STATION_LOCATIONS);
		let len = names.length;

		let prev_name: string;
		let next_name: string;

		if (i == 0){
			prev_name = names[len - 1];
		} else {
			prev_name = names[i - 1];
		}

		const curr_name = names[i];

		if (i == len - 1) {
			next_name = names[0];
		} else {
			next_name = names[i + 1];
		}

		const prev_coords = STATION_LOCATIONS[prev_name];
		const curr_coords = STATION_LOCATIONS[curr_name];
		const next_coords = STATION_LOCATIONS[next_name];

		const sector_start = [(prev_coords[0] + curr_coords[0]) / 2, (prev_coords[1] + curr_coords[1]) / 2];
		const sector_end = [(curr_coords[0] + next_coords[0]) / 2, (curr_coords[1] + next_coords[1]) / 2];

		// Removes spaces to have a valid classname
		const sector_name = curr_name.replaceAll(" ", "_");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", "black");
		path.setAttribute("stroke-width", "1rem");
		path.setAttribute("fill", "none");
		path.id = sector_name;
		SECTOR_IDS[i] = sector_name

		// prev -> center
		const pc_start_x = (sector_start[1] * width * 0.8) + (width * 0.05);
		const pc_start_y = (sector_start[0] * height * 0.8) + (height * 0.05);

		// center
		const center_x = (curr_coords[1] * width * 0.8) + (width * 0.05);
		const center_y = (curr_coords[0] * height * 0.8) + (height * 0.05);

		// center -> next
		const cn_end_x = (sector_end[1] * width * 0.8) + (width * 0.05);
		const cn_end_y = (sector_end[0] * height * 0.8) + (height * 0.05);

		path.setAttribute(
			"d",
			`M ${pc_start_x} ${pc_start_y} L ${center_x} ${center_y} L ${cn_end_x} ${cn_end_y}`
		);

		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", center_x.toString());
		circle.setAttribute("cy", center_y.toString());
		circle.setAttribute("r", "10");
		circle.setAttribute("stroke", "black");
		circle.setAttribute("fill", "black");

		g.appendChild(path);
		g.appendChild(circle);
	}
}

async function loop() {
	try {
		const team_probabilities = await get_probabilities();
		const probabilities = team_probabilities[CURRENT_ID];

		for (let i = 0; i < Object.keys(probabilities).length; i++) {
			const hsl = get_hsl(0, probabilities[i.toString()]);

			const sector_name = SECTOR_IDS[i];

			const path = document.getElementById(sector_name)!;
			path.setAttribute("stroke", hsl);
		}
	} catch (err) {
		console.error(`Error getting probabilities:\n${err}`);
	}
}

async function update_current_id() {
	const selector = <HTMLOptionElement>document.getElementById("team-selector")!;
	CURRENT_ID = selector.value;

	await loop();
}

window.onload = async () => {
	try {
		await setup();
		await loop();
	} catch (err) {
		console.error(err);
	}
};
window.setInterval(async () => {
	try {
		await loop();
	} catch (err) {
		console.error(err);
	}
}, 5000);
