/**
 * Type declarations
 */

/**
 * The probabilities of any team being in a given sector
 */
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

/**
 * The config of the viterbi lapper
 */
export type Config = {
    TRACK_LENGTH: number;
    SECTOR_STARTS: number[];
    AVERAGE_RUNNER_SPEED: number;
    DETECTIONS_PER_SECOND: number;
    STATION_RANGE_SIGMA: number;
    RESTART_PROBABILITY: number;
};

