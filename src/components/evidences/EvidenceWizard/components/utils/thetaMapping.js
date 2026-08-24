export const buildThetaBands = (states) => {

    if (!states || states.length === 0) return [];

    const sorted = [...states].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
    );

    const min = -3;
    const max = 3;

    const step = (max - min) / sorted.length;

    return sorted.map((state, i) => {

        const lower = min + i * step;
        const upper = i === sorted.length - 1
            ? max
            : lower + step;

        return {
            ...state,
            lower,
            upper
        };

    });

};

export const mapThetaToState = (theta, bands) => {

    if (!bands.length) return null;

    return bands.find(b =>
        theta >= b.lower && theta <= b.upper
    ) || bands[bands.length - 1];

};

