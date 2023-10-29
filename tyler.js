// Convert to the nearest even number
const toEven = x => 2 * Math.round(x / 2);

// Clamp number
const clamp = (value, minValue, maxValue) => {
    return Math.min(maxValue, Math.max(minValue, value));
};

// Calculate the number of tiles for the given zoom level
const numTiles = z => Math.pow(2, z);

const lon2tile = lon => {
    return (lon + 180) / 360;
};

const lat2tile = lat => {
    const radians = lat * Math.PI / 180;
    return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
};

const latlon2xy = (lat, lon, z) => {
    const n = numTiles(z);
    return [n*lon2tile(lon), n*lat2tile(lat)];
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

const getMapTemplate = () => {
    const templateContent = [
        `<div class="tyler">`,
        `    <canvas class="tyler-canvas" width="0" height="0"></canvas>`,
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
        zoom: clamp(options?.zoom ?? 10, minZoom, maxZoom),
    };
    parent.appendChild(getMapTemplate());
    parent.querySelector(".tyler").style.width = options?.width || "100%";
    parent.querySelector(".tyler").style.height = options?.height || "400px";
    parent.querySelector(".tyler-attribution").innerHTML = attribution;
    const canvas = parent.querySelector("canvas");

    const resize = () => {
        const {width, height} = canvas.parentElement.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
    };

    const render = async (center) => {
        const {width, height} = canvas;
        const context = canvas.getContext("2d");

        const tilesX = toEven(parseInt(Math.ceil(width / tileWidth)) + 2);
        const tilesY = toEven(parseInt(Math.ceil(height / tileHeight)) + 2);

        const xRange = [-parseInt(Math.floor(tilesX / 2)), parseInt(Math.ceil(tilesX / 2))];
        const yRange = [-parseInt(Math.floor(tilesY / 2)), parseInt(Math.ceil(tilesY / 2))];

        const [xAbsolute, yAbsolute] = latlon2xy(center[0], center[1], state.zoom);
        const xOffset = ((tilesX * tileWidth) - width) / 2;
        const yOffset = ((tilesY * tileHeight) - height) / 2;

        const xCenterDiff = parseInt((xAbsolute - parseInt(xAbsolute)) * tileWidth);
        const yCenterDiff = parseInt((yAbsolute - parseInt(yAbsolute)) * tileHeight);

        // Generate tiles list
        const tiles = [];
        for (let y = yRange[0]; y < yRange[1]; y++) {
            for (let x = xRange[0]; x < xRange[1]; x++) {
                tiles.push([parseInt(xAbsolute) + x, parseInt(yAbsolute) + y]);
            }
        }

        // Render tiles
        const firstTile = tiles[0];
        await Promise.all(tiles.map(tile => {
            const imageUrl = getTileUrl(tileUrl, tile[0], tile[1], state.zoom);
            return loadImageAsync(imageUrl).then(image => {
                const imageX = ((tile[0] - firstTile[0]) * tileWidth) - xOffset - xCenterDiff;
                const imageY = ((tile[1] - firstTile[1]) * tileHeight) - yOffset - yCenterDiff;
                context.drawImage(image, imageX, imageY, tileWidth, tileHeight);
            });
        }));

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

    resize();
    render(options?.center ?? [10, 10]);

    return {};
};

// Just a tiny wrapper for generating markers
export const marker = (position, label) => {
    return {position, label};
};
