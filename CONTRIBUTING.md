# Contributing

Contributions include community listings, bug reports, documentation, and website changes.

## Community submissions

Submit a project through the [issue form](https://github.com/ridusaini/firelight/issues/new?template=community.yml) or a pull request updating [resources/community.json](resources/community.json).

Include the project name, description, URL, and creator names with profile links. For app themes, also include the application, supported variants, a screenshot, and installation instructions. Note any limitations or palette changes, and provide a project licence.

Submissions are reviewed before publication. Projects remain hosted and maintained by their creators. Multiple projects for the same application and themes supporting a single variant are welcome.

## JSON format

Add entries to the `entries` array and retain `schemaVersion: 1`.

| Field | Requirement |
| --- | --- |
| `id` | Unique lowercase identifier using letters, numbers, and hyphens |
| `name` | Project name |
| `description` | Short project description |
| `url` | Main project URL |
| `kind` | `"theme"` or `"project"` |
| `authors` | At least one creator, with `name` and profile `url` |
| `app`, `variants` | Required for themes, optional for projects |
| `category`, `notes`, `links` | Optional |

Supported variants are `coal`, `smoulder`, and `ash`. Each additional link has a `label` and `url`. URLs must use HTTPS. IDs and main project URLs must be unique.

See the [schema](resources/community.schema.json) for validation rules and [sample file](resources/community.samples.json) for examples.

## Listing updates

Open an [issue](https://github.com/ridusaini/firelight/issues) or pull request with the project URL and proposed changes. Use the same process for broken links or removal requests.

## Website contributions

See [Development](docs/development.md) for setup and validation commands. A short description will help with review. Screenshots are useful for layout changes. For substantial website changes, an issue is a good place to start the discussion.
