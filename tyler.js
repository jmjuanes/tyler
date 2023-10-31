// Convert to the nearest even number
const toEven = x => 2 * Math.round(x / 2);

// Clamp number
const clamp = (value, minValue, maxValue) => {
    return Math.min(maxValue, Math.max(minValue, value));
};

const lon2tile = lon => {
    return (lon + 180) / 360;
};

const lat2tile = lat => {
    const radians = lat * Math.PI / 180;
    return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
};

const getTileUrl = (url, x, y, z) => {
    const shardedUrl = url.replace(/\[(.*)\]/, (match, shards) => {
        return shards.charAt(Math.floor(Math.random() * shards.length));
    });
    // Replace in the url the data matched
    // return `http://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    const reducer = (res, entry) => {
        return res.replace(new RegExp(`{\\s*${entry[0]}\\s*}`, "g"), entry[1]);
    };
    return Object.entries({x, y, z})
        .reduce(reducer, shardedUrl);
};

const loadImageAsync = imageUrl => {
    const image = new Image;
    return new Promise((resolve, reject) => {
        image.addEventListener("error", reject);
        image.addEventListener("load", () => resolve(image));
        image.src = imageUrl;
    });
};

const markerColors = {
    default: ["#35889E", "#3BB2D0"],
};

const getMarkerImage = (color = "default", size = 48) => {
    const c = markerColors[color];
    const image = document.createElement("img");
    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px">`,
        `<g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">`,
        `<path fill="${c[1]}" stroke="${c[0]}" d="M12 3C5 3 5 10 5 10C5 16 12 21 12 21C12 21 19 16 19 10C19 10 19 3 12 3Z" />`,
        `<path fill="#fff" stroke="${c[0]}" d="M9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10Z" />`,
        `</g>`,
        `</svg>`,
    ].join("");
    const svgBlob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8",
    });
    image.src = (window.URL || window.webkitURL || window).createObjectURL(svgBlob);
    image.setAttribute("width", `${size}px`);
    image.setAttribute("height", `${size}px`);
    return image;
};

const getMapTemplate = () => {
    const templateContent = [
        `<div class="tyler">`,
        `    <canvas class="tyler-canvas" width="0" height="0"></canvas>`,
        `    <div class="tyler-marks"></div>`,
        `    <div class="tyler-attribution"></div>`,
        `    <div class="tyler-zooming" style="display:none;">`,
        `        <div class="tyler-zooming-button zoom-in">+</div>`,
        `        <div class="tyler-zooming-button zoom-out">-</div>`,
        `    </div>`,
        `</div>`,
    ];
    const templateElement = document.createElement("template");
    templateElement.innerHTML = templateContent.join("").trim();
    return templateElement.content.firstChild;
};

// Create a tyler map
export const create = (parent, options = {}) => {
    const tileWidth = options?.tileWidth || 256;
    const tileHeight = options?.tileHeight || 256;
    const tileUrl = options?.tileUrl || "http://[abc].tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution = options?.attribution || `&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors`;
    const minZoom = options?.minZoom ?? 2;
    const maxZoom = options?.maxZoom ?? 18;
    const zooming = options?.zooming ?? true;
    const state = {
        ready: false,
        x: lon2tile(options?.center?.[1] ?? 0),
        y: lat2tile(options?.center?.[0] ?? 0),
        zoom: clamp(options?.zoom ?? 10, minZoom, maxZoom),
        marks: Array.isArray(options?.marks) ? options.marks : [],
    };
    parent.appendChild(getMapTemplate());
    parent.querySelector(".tyler").style.width = options?.width || "100%";
    parent.querySelector(".tyler").style.height = options?.height || "400px";
    parent.querySelector(".tyler-attribution").innerHTML = `<a href="https://josemi.xyz/tyler" target="_blank">Tyler</a> | ` + attribution;
    const canvas = parent.querySelector(`canvas`);
    const resize = () => {
        const size = canvas.parentElement.getBoundingClientRect();
        canvas.width = size.width;
        canvas.height = size.height;
    };
    const render = async () => {
        const numTiles = Math.pow(2, state.zoom);
        const xAbsolute = state.x * numTiles, yAbsolute = state.y * numTiles;
        const {width, height} = canvas;
        const context = canvas.getContext("2d");

        const tilesX = toEven(parseInt(Math.ceil(width / tileWidth)) + 2);
        const tilesY = toEven(parseInt(Math.ceil(height / tileHeight)) + 2);

        const xRange = [-parseInt(Math.floor(tilesX / 2)), parseInt(Math.ceil(tilesX / 2))];
        const yRange = [-parseInt(Math.floor(tilesY / 2)), parseInt(Math.ceil(tilesY / 2))];

        const xOffset = ((tilesX * tileWidth) - width) / 2;
        const yOffset = ((tilesY * tileHeight) - height) / 2;

        const xCenterDiff = (xAbsolute - parseInt(xAbsolute)) * tileWidth;
        const yCenterDiff = (yAbsolute - parseInt(yAbsolute)) * tileHeight;

        // We need first tile to place the other tiles in the correct position
        const firstTile = [parseInt(xAbsolute) + xRange[0], parseInt(yAbsolute) + yRange[0]];
        // Render marks
        state.marks.forEach((mark, index) => {
            const x = lon2tile(mark.position[1]) * numTiles, y = lat2tile(mark.position[0]) * numTiles;
            const centerX = ((x - firstTile[0]) * tileWidth) - xOffset - xCenterDiff;
            const centerY = ((y - firstTile[1]) * tileHeight) - yOffset - yCenterDiff;
            const markImage = document.querySelector(`img[data-role="marker"][data-index="${index}"]`);
            markImage.setAttribute("data-visible", (0 < centerX && centerX < width && 0 < centerY && centerY < height) ? "true" : "false");
            markImage.style.top = `${clamp(centerY, 0, height)}px`;
            markImage.style.left = `${clamp(centerX, 0, width)}px`;
        });
        // Render tiles
        for (let y = yRange[0]; y < yRange[1]; y++) {
            for (let x = xRange[0]; x < xRange[1]; x++) {
                const tile = [parseInt(xAbsolute) + x, parseInt(yAbsolute) + y];
                const imageUrl = getTileUrl(tileUrl, tile[0], tile[1], state.zoom);
                const image = await loadImageAsync(imageUrl);
                const imageX = ((tile[0] - firstTile[0]) * tileWidth) - xOffset - xCenterDiff;
                const imageY = ((tile[1] - firstTile[1]) * tileHeight) - yOffset - yCenterDiff;
                context.drawImage(image, imageX, imageY, tileWidth, tileHeight);
            }
        }
        // Render finished
        state.ready = true;
    };
    // Enable zooming
    if (zooming) {
        const changeZoom = newZoom => {
            state.zoom = clamp(newZoom, minZoom, maxZoom);
            state.ready = false;
            render(options?.center ?? [10, 10]);
        };
        const zoomingElement = parent.querySelector(".tyler-zooming");
        zoomingElement.style.display = "";
        zoomingElement.querySelector(".zoom-in").addEventListener("click", () => {
            return state.ready && changeZoom(state.zoom + 1);
        });
        zoomingElement.querySelector(".zoom-out").addEventListener("click", () => {
            return state.ready && changeZoom(state.zoom - 1);
        });
    }
    // Render marks
    state.marks.forEach((mark, index) => {
        const markImage = getMarkerImage();
        markImage.setAttribute("data-role", "marker");
        markImage.setAttribute("data-index", index);
        markImage.setAttribute("data-latitude", mark.position[0]);
        markImage.setAttribute("data-longitude", mark.position[1]);
        markImage.setAttribute("data-visible", "false");
        parent.querySelector(".tyler-marks").appendChild(markImage);
    });
    resize();
    render();

    return {};
};

// Just a tiny wrapper for generating markers
export const marker = (position, label) => {
    return {position, label};
};
