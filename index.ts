/**
 * FIRST VALUE IS Y
 * SECOND VALUE IS X
 *
 * DO NOT ASK WHY
 */

/* CHANGE BEFORE RUNNING CODE */
/*                   ⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄ */
const VITERBI_URL = "http://viterbi:8080";
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

const VITERBI_PROBABILITIES_URL: string = "http://10.1.0.200:8080/lappers/viterbi/probabilities";

async function get_probabilities() {
	const res = await fetch(VITERBI_PROBABILITIES_URL);
	if (!(res.ok)) {
		throw new Error(`Could not get probabilities:\nstatus: ${res.status}\nbody: ${res.body}`);
	}

	return res.json();
}

async function setup() {
	const wrapper = <HTMLDivElement>document.querySelector(".wrapper")!;
	const width = wrapper.offsetWidth;
	const height = wrapper.offsetHeight;

	let max_y = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[0]));
	const max_x = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[1]));

	// Normalise station locations
	Object.entries(STATION_LOCATIONS).forEach(([name, coords]) => {
		STATION_LOCATIONS[name] = [coords[0] / max_y, coords[1] / max_x];
	});

	max_y = Math.max(...Object.values(STATION_LOCATIONS).map(coords => coords[0]));
	const min_x = Math.min(...Object.values(STATION_LOCATIONS).map(coords => coords[1]));

	Object.entries(STATION_LOCATIONS).forEach(([name, coords]) => {
		STATION_LOCATIONS[name] = [-(coords[0] - max_y), coords[1] - min_x];
	});

	console.log(STATION_LOCATIONS);

	const g = document.querySelector("g")!;

	for (let i = 0; i < Object.keys(STATION_LOCATIONS).length; i++) {
		let start_name = Object.keys(STATION_LOCATIONS)[i];
		let end_name;
		if (i == Object.keys(STATION_LOCATIONS).length - 1) {
			end_name = Object.keys(STATION_LOCATIONS)[0];
		} else {
			end_name = Object.keys(STATION_LOCATIONS)[i + 1];
		}

		const start_coords = STATION_LOCATIONS[start_name];
		const end_coords = STATION_LOCATIONS[end_name];

		start_name = start_name.replaceAll(" ", "_");
		end_name = end_name.replaceAll(" ", "_");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", "black");
		path.setAttribute("stroke-width", "1rem");
		path.setAttribute("stroke-linecap", "square");
		path.setAttribute("fill", "none");
		path.id = `${start_name}-${end_name}`

		const start_x = (start_coords[1] * width * 0.8) + (width * 0.05);
		const start_y = (start_coords[0] * height * 0.8) + (height * 0.05);

		const end_x = (end_coords[1] * width * 0.8) + (width * 0.05);
		const end_y = (end_coords[0] * height * 0.8) + (height * 0.05);

		path.setAttribute(
			"d",
			`M ${start_x} ${start_y} L ${end_x} ${end_y}`
		);

		g.appendChild(path);
	}
}

async function loop() {

}

setup();
window.setInterval(loop, 10000);
