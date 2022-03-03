/**
 * Type declarations
 */

/** The probabilities of any team being in a given sector */
export type Probabilities = {
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

/** The config of the viterbi lapper */
export type Config = {
    TRACK_LENGTH: number;
    SECTOR_STARTS: number[];
    AVERAGE_RUNNER_SPEED: number;
    DETECTIONS_PER_SECOND: number;
    STATION_RANGE_SIGMA: number;
    RESTART_PROBABILITY: number;
};

/** The data needed for the draw function */
export type DrawData = {
	ctx: CanvasRenderingContext2D,
	team_colors: [number, number, number][],
	sector_interval_map: {[key: string]: [number, number]},
	team_interval_map: {[key: string]: [number, number]},
	prb: Probabilities,
};
