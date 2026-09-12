# Development

The website uses Astro and TypeScript, with static output deployed to GitHub Pages. Community submission instructions are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Setup

Use the Node.js version specified in [.nvmrc](../.nvmrc). Run commands from the repository root.

Install dependencies after cloning the repository or when `package.json` or `package-lock.json` changes:

```sh
npm install
```

For a clean install using the exact versions in `package-lock.json`, use `npm ci` instead. This replaces the existing `node_modules` directory and leaves the lockfile unchanged.

Start the development server:

```sh
npm run dev
```

Development URL: [http://localhost:4321/](http://localhost:4321/).

Development commands use `--base /`. Builds and production preview keep `/firelight/` from `astro.config.mjs` to match GitHub Pages.

Override the port with `npm run dev -- --port 4322`.

## Project structure

| Path | Contents |
| --- | --- |
| [src/pages](../src/pages/) | Pages and download endpoints |
| [src/components](../src/components/) | Shared UI components |
| [src/layouts](../src/layouts/) | Page layouts |
| [src/styles](../src/styles/) | Shared styles |
| [src/scripts](../src/scripts/) | Clipboard and Playground interactions |
| [src/lib](../src/lib/) | Palette utilities, colour calculations, and directory validation |
| [downloads](../downloads/) | Palette CSS and JSON |
| [resources](../resources/) | Palette schema, website guidance, and community data |
| [public/assets](../public/assets/) | Images, icons, and fonts |
| [test](../test/) | Automated tests |

## Sample data

Preview the Community page using [community.samples.json](../resources/community.samples.json):

```sh
npm run dev -- stop
npm run dev:samples
```

Sample mode is development-only. Production builds use [community.json](../resources/community.json).

## Validation

```sh
npm run check
npm test
```

Running `npm test` builds the site first, then checks palette data, community submissions, and downloadable files. Empty and populated community directories are also built in temporary folders. For production preview, stop the development server and run `npm run preview`, then open [http://localhost:4321/firelight/](http://localhost:4321/firelight/).
