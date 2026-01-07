# module/asana - V8 module

Keep Asana work moving with simple, reusable building blocks for everyday automations like listing projects, creating tasks, and posting updates. This module keeps your workflow steps short while still covering the common Asana actions teams reach for.

For more on the platform and tooling, visit https://instago.ai.

## Technical reference

### Exports

`{ configure, request, getUser, listWorkspaces, getWorkspace, listUsers, listTeams, getTeam, listProjects, getProject, updateProject, createProject, listProjectMemberships, listTasks, searchTasks, getTask, listSubtasks, createTask, updateTask, addProjectToTask, removeProjectFromTask, addComment, listStories, getStory, addSubtask, listSections, createSection, addTaskToSection, listTags, getTag, createTag, listAttachments, getAttachment, selfTest }`

### Usage

```js
const asana = require('asana@latest');
```

### Configuration

`env.json` keys:

- `asana.accessToken` (optional)
- `asana.baseUrl` (optional)
- `asana.defaultWorkspace` (optional)

You can also call `configure({ accessToken, baseUrl, defaultWorkspace })` to override defaults. If `baseUrl` is not set, it defaults to `https://app.asana.com/api/1.0`.

### API

- `request({ method, pathName, query, data, optFields, debug })`
- `getUser({ userId, optFields, debug })`
- `listWorkspaces({ optFields, debug })`
- `getWorkspace({ workspaceId, optFields, debug })`
- `listUsers({ workspace, team, limit, offset, optFields, debug })`
- `listTeams({ organization, workspace, limit, offset, optFields, debug })`
- `getTeam({ teamId, optFields, debug })`
- `listProjects({ workspace, team, archived, limit, offset, optFields, debug })`
- `getProject({ projectId, optFields, debug })`
- `updateProject({ projectId, data, optFields, debug })`
- `createProject({ workspace, name, team, notes, public, privacy_setting, color, due_on, start_on, current_status, optFields, debug })`
- `listProjectMemberships({ projectId, user, limit, offset, optFields, debug })`
- `listTasks({ project, assignee, workspace, completed_since, modified_since, section, tag, userTaskList, limit, offset, optFields, debug })`
- `searchTasks({ workspace, text, limit, offset, query, optFields, debug })`
- `getTask({ taskId, optFields, debug })`
- `listSubtasks({ taskId, limit, offset, optFields, debug })`
- `createTask({ name, workspace, projects, assignee, due_on, due_at, notes, start_on, start_at, followers, parent, memberships, optFields, debug })`
- `updateTask({ taskId, data, optFields, debug })`
- `addProjectToTask({ taskId, projectId, sectionId, insert_before, insert_after, optFields, debug })`
- `removeProjectFromTask({ taskId, projectId, optFields, debug })`
- `addComment({ taskId, text, optFields, debug })`
- `listStories({ taskId, limit, offset, optFields, debug })`
- `getStory({ storyId, optFields, debug })`
- `addSubtask({ taskId, name, notes, assignee, due_on, due_at, start_on, start_at, followers, optFields, debug })`
- `listSections({ projectId, optFields, debug })`
- `createSection({ projectId, name, insert_before, insert_after, optFields, debug })`
- `addTaskToSection({ sectionId, taskId, optFields, debug })`
- `listTags({ workspace, limit, offset, optFields, debug })`
- `getTag({ tagId, optFields, debug })`
- `createTag({ workspace, name, notes, color, optFields, debug })`
- `listAttachments({ taskId, limit, offset, optFields, debug })`
- `getAttachment({ attachmentId, optFields, debug })`
- `selfTest()`

### Examples

List projects and create a task:

```js
const asana = require('asana@latest');
asana.configure({
  accessToken: env['asana.accessToken'],
  defaultWorkspace: env['asana.defaultWorkspace']
});

const projects = await asana.listProjects({ optFields: ['gid', 'name'] });
if (projects.ok) console.log('projects:', projects.data);

const task = await asana.createTask({
  name: 'Draft release notes',
  projects: [env.ASANA_PROJECT_ID],
  notes: 'First pass of the release notes.'
});
if (!task.ok) console.error('createTask failed:', task.error);
```

Update a task and add a comment:

```js
const update = await asana.updateTask({
  taskId: env.ASANA_TASK_ID,
  data: { completed: true }
});
if (!update.ok) console.error(update.error);

const comment = await asana.addComment({
  taskId: env.ASANA_TASK_ID,
  text: 'Marked complete via automation.'
});
if (!comment.ok) console.error(comment.error);
```

Search tasks and add to a project section:

```js
const results = await asana.searchTasks({
  workspace: env['asana.defaultWorkspace'],
  text: 'release notes',
  optFields: ['gid', 'name']
});
if (results.ok && results.data && results.data.data && results.data.data[0]) {
  const taskId = results.data.data[0].gid;
  await asana.addProjectToTask({
    taskId,
    projectId: env.ASANA_PROJECT_ID,
    sectionId: env.ASANA_SECTION_ID
  });
}
```

List tags and stories:

```js
const tags = await asana.listTags({
  workspace: env['asana.defaultWorkspace'],
  optFields: ['gid', 'name']
});
if (!tags.ok) console.error(tags.error);

const stories = await asana.listStories({
  taskId: env.ASANA_TASK_ID,
  optFields: ['gid', 'text', 'created_at']
});
if (!stories.ok) console.error(stories.error);
```
