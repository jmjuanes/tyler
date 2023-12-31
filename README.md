# Tyler 🗺️

**Tyler** is a super simple JavaScript package that allows you to easily generate interactive maps in the browser. With Tyler, you can quickly create maps with multiple markers, and it's designed to be lightweight with less than 300 lines of code and zero external dependencies.

## Features

- **Simple and Lightweight**: Tyler is designed to be incredibly easy to use and maintain, with less than 300 lines of code. There are no external dependencies, making it a hassle-free choice for adding interactive maps to your projects.

- **OpenStreetMap Integration**: By default, Tyler uses OpenStreetMap tiles for rendering your maps. This provides a reliable and free source of map data for your projects.

- **Zooming**: Tyler supports zoom in and out on the map for a more detailed view.

- **Multiple Markers**: Easily add multiple markers to your map to pinpoint specific locations of interest.

- **Pan and Move (Future)**: We're also working on adding the ability to pan and move around the map, giving users the flexibility to explore different areas.


## Installation

You can add **Tyler** to your project using a package manager or importing it directly from a CDN.

### Installing Tyler using a Package Manager

You can easily install Tyler using a package manager like npm or yarn. Just execute one of the following commands inside your project forlder:

```bash
## Install using NPM
$ npm install --save tyler-js

## Or install using yarn
$ yarn add tyler-js
```

### Using Tyler from a CDN

If you prefer to use Tyler directly from a CDN like unpkg, you can do so by including the Tyler JavaScript and CSS files in your HTML file directly from the unpkg CDN.

To include the CSS, add the following line in the `<head>` section of  your HTML file:

```html
<link rel="stylesheet" href="https://unpkg.com/tyler-js@latest/tyler.css">
```

Create a new `<script type="module">` tag and import Tyler as a module:

```javascript
<script type="module">
    import * as Tyler from "https://unpkg.com/tyler-js@latest/tyler.js";

    // Map initialization...
</script>
```

## Usage

Create a map instance using `Tyler.create`:

```javascript
const parent = document.getElementById("root");

const map = Tyler.create(parent, {
    center: [39.4698, -0.3764],
    zoom: 10,
    marks: [
        Tyler.marker([51.505, -0.09]),
    ],
});
```

## API

### Tyler.create(parent, options)

Creates an interactive map and appends it to the specified DOM element.

- `parent` (DOM Element): The DOM element where the map will be placed.
- `options` (Object, default `{}`): An object containing the configuration options for the map.

#### Options

- `center` (Array): an array specifying the initial geographic center of the map. The first element is the latitude, and the second element is the longitude. For example: `[51.505, -0.09]`.
- `zoom` (Number, default `10`): the initial zoom level of the map. It determines the scale of the map's view.
- `zooming` (Boolean, default `true`): display or hide zooming buttons in the map.
- `minZoom` (Number, default `2`): minimum zooming value.
- `maxZoom` (Number, default `18`): maximum zooming value.
- `marks` (Array, default `[]`): a list of marks to add into the map. Use `Tyler.marker` function to generate marks objects.

### Tyler.marker(position)

A utility function that creates a new marker object. Accepts the following arguments:

- `position` (Array): An array specifying the geographic position of the marker. The first element is the latitude, and the second element is the longitude. For example: `[51.505, -0.09]`.

## License

Tyler is licensed under the [MIT License](./LICENSE), so you are free to use it in your projects, commercial or personal.
