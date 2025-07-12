// Simple implementation of DBSCAN algorithm
// Based on https://en.wikipedia.org/wiki/DBSCAN

type Point = [number, number]; // [latitude, longitude]

// Haversine distance for geographical coordinates
function haversineDistance(p1: Point, p2: Point): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * 
        (1 - Math.cos(dLon)) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

// For this project's scale (a single town), a simpler distance calculation is sufficient and faster.
// We'll use Euclidean distance on degrees, which is a good approximation for small areas.
// 1 degree of latitude is ~111km. 1 degree of longitude is also ~111km at the equator.
function euclideanDistance(p1: Point, p2: Point): number {
    const latDiff = p1[0] - p2[0];
    const lonDiff = p1[1] - p2[1];
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}


function rangeQuery(points: Point[], pointIndex: number, eps: number, distanceFunc: (a: Point, b: Point) => number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < points.length; i++) {
        if (i !== pointIndex && distanceFunc(points[pointIndex], points[i]) <= eps) {
            neighbors.push(i);
        }
    }
    return neighbors;
}

export function dbscan(points: Point[], eps: number, minPts: number): number[] {
    const labels: number[] = new Array(points.length).fill(-2); // -2: unvisited, -1: noise
    let clusterId = 0;

    for (let i = 0; i < points.length; i++) {
        if (labels[i] !== -2) { // Already visited
            continue;
        }

        const neighbors = rangeQuery(points, i, eps, euclideanDistance);

        if (neighbors.length < minPts -1) { // -1 because the point itself is not in neighbors
            labels[i] = -1; // Mark as noise
            continue;
        }

        labels[i] = clusterId;
        let seedSet = [...neighbors];

        for (let j = 0; j < seedSet.length; j++) {
            const currentPointIndex = seedSet[j];

            if (labels[currentPointIndex] === -1) { // Is noise, now part of a cluster
                labels[currentPointIndex] = clusterId;
            }

            if (labels[currentPointIndex] !== -2) { // Already visited
                continue;
            }

            labels[currentPointIndex] = clusterId;
            const newNeighbors = rangeQuery(points, currentPointIndex, eps, euclideanDistance);

            if (newNeighbors.length >= minPts -1) {
                seedSet = [...seedSet, ...newNeighbors];
            }
        }
        clusterId++;
    }
    return labels;
}
