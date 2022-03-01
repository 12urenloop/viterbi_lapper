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

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#0E0E0E";
ctx.fillRect(0, 0, canvas.width, canvas.height);

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

async function main() {
	const cfg = await get_config();
	const prb = await get_probabilities();

	console.log(cfg);
	console.log(prb);
}

window.onload = main;
