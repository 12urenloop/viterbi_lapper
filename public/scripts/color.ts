/**
 * Color related functions
 */

/** Convert `#rrggbb` to [r, g, b] */
export function hex2rgb(color: string): [number, number, number] {
	return [
		parseInt(color.slice(1, 3), 16),
		parseInt(color.slice(3, 5), 16),
		parseInt(color.slice(5, 7), 16),
	];
}

/** Convert [r, g, b] to [h, s, l] */
export function rgb2hsl(color: [number, number, number]): [number, number, number] {
	const r = color[0]/255;
	const g = color[1]/255;
	const b = color[2]/255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h, s;
	const l = (max + min) / 2;

	if (max == min) {
		h = 0;
		s = 0;
	} else {
		const d = max - min;
		s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
			default: h = 0; break;
		}
		h /= 6;
	}

	return [h, s, l];
}

/** Convert [h, s, l] to [r, g, b] */
export function hsl2rgb(color: [number, number, number]): [number, number, number] {
	let l = color[2];

	if (color[1] == 0) {
		l = Math.round(l*255);
		return [l, l, l];
	} else {
		function hue2rgb(p: number, q: number, t: number) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		const s = color[1];
		const q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
		const p = 2 * l - q;
		const r = hue2rgb(p, q, color[0] + 1/3);
		const g = hue2rgb(p, q, color[0]);
		const b = hue2rgb(p, q, color[0] - 1/3);
		return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
	}
}

/**
 * Interpolate between color1 and color2 using hsl interpolation
 * Color1 and color2 are [r, g, b]
 */
export function interpolate_hsl(
	color1: [number, number, number],
	color2: [number, number, number],
	factor: number
): [number, number, number] {
	const hsl1 = rgb2hsl(color1);
	const hsl2 = rgb2hsl(color2);

	for (let i=0; i<3; i++) {
		hsl1[i] += factor*(hsl2[i] - hsl1[i]);
	}

	return hsl2rgb(hsl1);
}

/**
 * Interpolate between color1 and color2 using rgb interpolation
 * Color1 and color2 are [r, g, b]
 */
export function interpolate_rgb(color1: [number, number, number], color2: [number, number, number], factor: number): string {
	const result: [number, number, number] = [...color1];

	for (let i=0; i<3; i++) {
		result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
	}

	return "#" + ((1 << 24) + (result[0] << 16) + (result[1] << 8) + result[2]).toString(16).slice(1);
}
