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

For production preview, stop or override the development server and run:

```sh
npm run preview
```

Preview URL: [http://localhost:4321/firelight/](http://localhost:4321/firelight/).

You can override the port with `npm run dev -- --port 4322`.

Development commands use `--base /`. Builds and production preview keep `/firelight/` from `astro.config.mjs` to match GitHub Pages.

So basically, all dev environments use direct URL: [http://localhost:4321/](http://localhost:4321/), while production or preview needs a `/firelight` after base URL: [http://localhost:4321/firelight](http://localhost:4321/firelight).

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

`npm test` builds the site first, then runs everything in [test](../test/). It checks four things:

- The palette in [downloads](../downloads/) against its schema, and the hex, RGB, HSL, and OKLCH values against each other.
- The colour helpers in [src/lib/colour.ts](../src/lib/colour.ts).
- The community directory against its schema and the submission rules.
- The built site in `dist/`: every local link points at a file that was actually published, the downloads match their sources, and no sample data made it into production.

The last group is why the build runs first. If a test mentions `dist/`, it is reading the real build output, so a stale build gives you a stale result.

## Build

Simple, just run:

```shell
npm run build
```

`npm test` already does this, so you only need it on its own before `npm run preview`. If both pass, you can open a pull request. 
