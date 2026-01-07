# Asana module (asana@1.0.0)

This module lets you work with Asana from a workflow. Use it to read and update tasks, projects, and comments without writing your own API calls.

It is helpful when you want to:
- Create or update tasks from another system.
- List projects, tags, or stories.
- Add comments or move tasks into sections.

## Quick start

1) Get an Asana personal access token.
2) Note your workspace ID (and project ID if you need one).
3) Configure the module with your token.
4) Call a helper like `listProjects` or `createTask`.

## What it needs

- Access token: a valid Asana personal access token.
- Workspace ID: required for many list and search actions.
- Project ID, task ID, section ID, tag ID: only needed for actions that target those items.

## Examples

List projects:

```js
const asana = require('asana@1.0.0');
asana.configure({ accessToken: env.ASANA_TOKEN, defaultWorkspace: env.ASANA_WORKSPACE });

const projects = await asana.listProjects({ optFields: ['gid', 'name'] });
if (!projects.ok) console.error(projects.error);
```

Create a task:

```js
const task = await asana.createTask({
  name: 'Draft release notes',
  projects: [env.ASANA_PROJECT_ID],
  notes: 'First pass of the release notes.'
});
if (!task.ok) console.error(task.error);
```

Add a comment to a task:

```js
const comment = await asana.addComment({
  taskId: env.ASANA_TASK_ID,
  text: 'Marked complete via automation.'
});
if (!comment.ok) console.error(comment.error);
```
