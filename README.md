# NodeExplorer

Interactive visualization tool for exploring JSON-based node and edge graphs through dynamic content maps and relationship views.

NodeExplorer is a static, browser-only single-page app: drop a JSON file in, get an interactive WebGL graph out. The first-class adapter understands C# call graphs (e.g. those produced by Roslyn analysers), but the core works on any `{nodes, edges}` JSON.

## Running the app

Prerequisites: **Node.js ≥ 20** and **npm**.

```sh
git clone https://github.com/<you>/NodeExplorer.git
cd NodeExplorer
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173/`), then drop a JSON file onto the page or click **Choose file…**.

### Other scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run the TypeScript project references with `--noEmit` |

The production build in `dist/` is a static site — drop it on GitHub Pages, S3, Netlify, or any static host.

## JSON format

NodeExplorer expects a single JSON object with two arrays: `nodes` and `edges`. Anything else in the document is preserved but ignored.

### Minimum required shape

```json
{
  "nodes": [
    { "id": "A" },
    { "id": "B" }
  ],
  "edges": [
    { "from": "A", "to": "B" }
  ]
}
```

- **`nodes[].id`** *(string, required)* — Unique identifier for the node. Used as the edge endpoint key.
- **`edges[].from`** and **`edges[].to`** *(string, required)* — IDs that match a node `id`. If an edge references an unknown id, NodeExplorer creates a placeholder node for it automatically.

That's it. With just those fields you get a working graph: search, grouping by *Kind* / *File* (when present), filtering, light/dark mode, and per-group node sizing by in-degree.

### Optional fields used by the generic adapter

```json
{
  "nodes": [
    { "id": "A", "kind": "Service",   "file": "src/a.ts", "line": 10 },
    { "id": "B", "kind": "Component", "file": "src/b.ts", "line": 25 }
  ],
  "edges": [
    { "from": "A", "to": "B", "file": "src/a.ts", "line": 14 }
  ]
}
```

| Field | Type | Used for |
|---|---|---|
| `nodes[].kind` | string | Grouping & filtering by **Kind**, shown in the detail panel |
| `nodes[].file` | string | Grouping by **File**, shown in the detail panel |
| `nodes[].line` | number | Shown in the detail panel |
| `edges[].file`, `edges[].line` | string, number | Stored on the edge; used by the call-site detail view |

Any extra properties on a node or edge are kept on the in-memory graph and visible to future adapters, but the generic adapter doesn't surface them in the UI.

### C# call-graph format (auto-detected)

If node ids look like fully-qualified C# member signatures (e.g. `Foo.Bar.Baz.Method(System.String)`), NodeExplorer auto-selects the **C# adapter**, which derives extra facets from the data:

```json
{
  "solution": "C:/repos/Service/Service.sln",
  "generatedAt": "2026-05-10T14:13:00Z",
  "nodes": [
    {
      "id": "MyApp.Api.Controllers.UsersController.Get(System.Threading.CancellationToken)",
      "kind": "Method",
      "file": "MyApp.Api/Controllers/UsersController.cs",
      "line": 25
    },
    {
      "id": "MyApp.Api.Controllers.UsersController..ctor(MyApp.DataAccess.IUserRepository)",
      "kind": "Constructor",
      "file": "MyApp.Api/Controllers/UsersController.cs",
      "line": 18
    },
    {
      "id": "MyApp.DataAccess.IUserRepository.GetAll",
      "kind": "Property",
      "file": "MyApp.DataAccess/IUserRepository.cs",
      "line": 9
    }
  ],
  "edges": [
    {
      "from": "MyApp.Api.Controllers.UsersController.Get(System.Threading.CancellationToken)",
      "to":   "MyApp.DataAccess.IUserRepository.GetAll",
      "file": "MyApp.Api/Controllers/UsersController.cs",
      "line": 31
    }
  ]
}
```

The C# adapter parses each `id` into:

- **Namespace** — everything before the class (e.g. `MyApp.Api.Controllers`)
- **Class** — the type (e.g. `UsersController`)
- **Member** — method, constructor (`.ctor`), or property name
- **Signature** — the parameter list, including generics (e.g. `(ILogger<UsersController>, IRepository)`)

…and from the `file` field:

- **Project** — the first path segment of a relative file path (e.g. `MyApp.Api`). Absolute paths (drive letters, leading slash) are treated as external dependencies and don't get a project.
- **Folder** — the directory portion of `file`.

These facets light up the **Group by** options (Project, Namespace, Class, Folder, Kind) and the filter sidebar.

#### Recognised `kind` values

The C# adapter recognises `"Method"`, `"Constructor"`, and `"Property"`. Other values still work — they're shown verbatim and become available as a filter.

### How adapter selection works

On load, each adapter's `detect()` is called against your JSON in priority order. The first one that returns `true` wins. If none match, the generic adapter is used as a fallback. Today the order is:

1. **C# adapter** — wins if any of the first 10 nodes has a dotted `id` and either a paren'd signature or `kind` ∈ {`Method`, `Constructor`, `Property`}.
2. **Generic adapter** — always matches.

Adding a new adapter (e.g. for Python imports, dependency graphs, or trace data) is a single file under `src/core/adapters/`.

## Features

- **Three navigation modes** *(Overview shipped; Focus + Path coming in M3)*: full graph with neighborhood highlight, drill-down expansion, source→target path-finding.
- **Search** — fuzzy + prefix search across node ids, labels, classes, namespaces, members, and files.
- **Grouping** — by Project, Namespace, Class, Folder, or Kind (C# adapter); by Kind or File (generic).
- **Filters** — toggle node Kind, Project, or Namespace.
- **Size by usage** — checkbox under *Group by* scales nodes by incoming-edge count, normalised within the current grouping (so the most-used node in each group is the largest).
- **Light / dark mode** — auto-detects `prefers-color-scheme`, persists choice.
- **Compact UI** — function-first layout: dense sidebar, small icon toolbar, no chrome competing with the graph.

## Tech stack

React 19 · TypeScript · Vite 6 · Tailwind v4 · Zustand · Sigma.js v3 (WebGL) · graphology · MiniSearch · Zod

## Project layout

```
src/
  core/        Pure TS — graph model, adapters, search, filters, grouping, sizing
  renderer/    Sigma.js host, themed label renderer, view-mode visual reducers
  ui/          React shell — toolbar, sidebar (search/filter/grouping), detail panel, file picker
  state/       Zustand store
```

The boundaries are hard: `core/` has no React or Sigma imports and is fully unit-testable; `renderer/` owns pixels and camera; `ui/` orchestrates by dispatching commands.

## License

See [LICENSE](LICENSE).
