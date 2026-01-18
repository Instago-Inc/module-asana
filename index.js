(function(){
  const httpx = require('http@latest');
  const auth = require('auth@latest');
  const qs = require('qs@latest');
  const path = require('path@latest');
  const json = require('json@latest');
  const log = require('log@latest').create('asana');

  const cfg = {
    baseUrl: 'https://app.asana.com/api/1.0',
    accessToken: null,
    defaultWorkspace: null
  };

  function configure(opts){
    if (!opts || typeof opts !== 'object') return;
    if (opts.baseUrl) cfg.baseUrl = String(opts.baseUrl).replace(/\/$/, '');
    if (opts.accessToken) cfg.accessToken = String(opts.accessToken);
    if (opts.defaultWorkspace) cfg.defaultWorkspace = String(opts.defaultWorkspace);
  }

  function pickBase(){
    return (cfg.baseUrl || sys.env.get('asana.baseUrl') || 'https://app.asana.com/api/1.0').replace(/\/$/, '');
  }

  function pickToken(){
    return cfg.accessToken || sys.env.get('asana.accessToken') || '';
  }

  function normalizeOptFields(optFields){
    if (!optFields) return null;
    if (Array.isArray(optFields)) return optFields.filter(Boolean).join(',');
    if (typeof optFields === 'string') return optFields;
    return null;
  }

  function buildQuery(query, optFields){
    const out = Object.assign({}, query || {});
    const fields = normalizeOptFields(optFields);
    if (fields) out.opt_fields = fields;
    return out;
  }

  async function request({ method, pathName, query, data, optFields, debug }){
    try {
      const token = pickToken();
      if (!token) return { ok:false, error:'asana: missing accessToken' };
      const base = pickBase();
      const urlPath = path.joinURL(base, pathName);
      const queryStr = qs.encode(buildQuery(query, optFields));
      const url = queryStr ? (urlPath + '?' + queryStr) : urlPath;
      const headers = Object.assign({ 'Content-Type':'application/json' }, auth.bearer(token));
      if (debug) log.debug('request', { method, url });
      const res = await httpx.json({
        url,
        method,
        headers,
        bodyObj: (data ? { data: data } : undefined),
        debug: debug
      });
      const payload = res && (res.json || json.parseSafe(res.raw, res.raw));
      const ok = res && res.status >= 200 && res.status < 300;
      if (!ok) return { ok:false, error: payload || res.raw || 'asana: request failed', data: payload };
      return { ok:true, data: payload };
    } catch (e){
      log.error('request:error', (e && (e.message || e)) || 'unknown');
      return { ok:false, error:(e && (e.message || String(e))) || 'unknown' };
    }
  }

  function requireId(id, label){
    if (!id) return { ok:false, error:'asana: missing ' + label };
    return null;
  }

  async function getUser({ userId, optFields, debug } = {}){
    const id = userId || 'me';
    return request({ method:'GET', pathName:'users/' + encodeURIComponent(id), optFields, debug });
  }

  async function listWorkspaces({ optFields, debug } = {}){
    return request({ method:'GET', pathName:'workspaces', optFields, debug });
  }

  async function getWorkspace({ workspaceId, optFields, debug } = {}){
    const missing = requireId(workspaceId, 'workspaceId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'workspaces/' + encodeURIComponent(workspaceId), optFields, debug });
  }

  async function listUsers({ workspace, team, limit, offset, optFields, debug } = {}){
    const query = {};
    if (workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace')) {
      query.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    }
    if (team) query.team = team;
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'users', query, optFields, debug });
  }

  async function listTeams({ organization, workspace, limit, offset, optFields, debug } = {}){
    const org = organization || workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (!org) return { ok:false, error:'asana.listTeams: missing organization/workspace' };
    const query = {};
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'organizations/' + encodeURIComponent(org) + '/teams', query, optFields, debug });
  }

  async function getTeam({ teamId, optFields, debug } = {}){
    const missing = requireId(teamId, 'teamId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'teams/' + encodeURIComponent(teamId), optFields, debug });
  }

  async function listProjects({ workspace, team, archived, limit, offset, optFields, debug } = {}){
    const query = {};
    if (workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace')) {
      query.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    }
    if (team) query.team = team;
    if (typeof archived !== 'undefined') query.archived = archived ? 'true' : 'false';
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'projects', query, optFields, debug });
  }

  async function getProject({ projectId, optFields, debug } = {}){
    const missing = requireId(projectId, 'projectId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'projects/' + encodeURIComponent(projectId), optFields, debug });
  }

  async function updateProject({ projectId, data, optFields, debug } = {}){
    const missing = requireId(projectId, 'projectId');
    if (missing) return missing;
    if (!data || typeof data !== 'object') return { ok:false, error:'asana.updateProject: missing data' };
    return request({ method:'PUT', pathName:'projects/' + encodeURIComponent(projectId), data, optFields, debug });
  }

  async function createProject({ workspace, name, team, notes, public, privacy_setting, color, due_on, start_on, current_status, optFields, debug } = {}){
    const payload = {};
    payload.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (name) payload.name = String(name);
    if (team) payload.team = String(team);
    if (notes) payload.notes = String(notes);
    if (typeof public !== 'undefined') payload.public = !!public;
    if (privacy_setting) payload.privacy_setting = String(privacy_setting);
    if (color) payload.color = String(color);
    if (due_on) payload.due_on = String(due_on);
    if (start_on) payload.start_on = String(start_on);
    if (current_status) payload.current_status = current_status;
    if (!payload.workspace || !payload.name) return { ok:false, error:'asana.createProject: missing workspace or name' };
    return request({ method:'POST', pathName:'projects', data: payload, optFields, debug });
  }

  async function listProjectMemberships({ projectId, user, limit, offset, optFields, debug } = {}){
    const missing = requireId(projectId, 'projectId');
    if (missing) return missing;
    const query = {};
    if (user) query.user = user;
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'projects/' + encodeURIComponent(projectId) + '/project_memberships', query, optFields, debug });
  }

  async function listTasks({ project, assignee, workspace, completed_since, modified_since, section, tag, userTaskList, limit, offset, optFields, debug } = {}){
    const query = {};
    if (project) query.project = project;
    if (assignee) query.assignee = assignee;
    if (workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace')) {
      query.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    }
    if (completed_since) query.completed_since = completed_since;
    if (modified_since) query.modified_since = modified_since;
    if (section) query.section = section;
    if (tag) query.tag = tag;
    if (userTaskList) query.user_task_list = userTaskList;
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'tasks', query, optFields, debug });
  }

  async function searchTasks({ workspace, text, limit, offset, query, optFields, debug } = {}){
    const workspaceId = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (!workspaceId) return { ok:false, error:'asana.searchTasks: missing workspace' };
    const mergedQuery = Object.assign({}, query || {});
    if (text) mergedQuery.text = text;
    if (limit) mergedQuery.limit = limit;
    if (offset) mergedQuery.offset = offset;
    return request({ method:'GET', pathName:'workspaces/' + encodeURIComponent(workspaceId) + '/tasks/search', query: mergedQuery, optFields, debug });
  }

  async function getTask({ taskId, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'tasks/' + encodeURIComponent(taskId), optFields, debug });
  }

  async function listSubtasks({ taskId, limit, offset, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    const query = {};
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'tasks/' + encodeURIComponent(taskId) + '/subtasks', query, optFields, debug });
  }

  async function createTask({ name, workspace, projects, assignee, due_on, due_at, notes, start_on, start_at, followers, parent, memberships, optFields, debug } = {}){
    const payload = {};
    if (name) payload.name = String(name);
    payload.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (Array.isArray(projects)) payload.projects = projects;
    if (assignee) payload.assignee = assignee;
    if (due_on) payload.due_on = String(due_on);
    if (due_at) payload.due_at = String(due_at);
    if (notes) payload.notes = String(notes);
    if (start_on) payload.start_on = String(start_on);
    if (start_at) payload.start_at = String(start_at);
    if (Array.isArray(followers)) payload.followers = followers;
    if (parent) payload.parent = parent;
    if (Array.isArray(memberships)) payload.memberships = memberships;
    if (!payload.name) return { ok:false, error:'asana.createTask: missing name' };
    return request({ method:'POST', pathName:'tasks', data: payload, optFields, debug });
  }

  async function updateTask({ taskId, data, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    if (!data || typeof data !== 'object') return { ok:false, error:'asana.updateTask: missing data' };
    return request({ method:'PUT', pathName:'tasks/' + encodeURIComponent(taskId), data, optFields, debug });
  }

  async function addProjectToTask({ taskId, projectId, sectionId, insert_before, insert_after, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId') || requireId(projectId, 'projectId');
    if (missing) return missing;
    const payload = { project: projectId };
    if (sectionId) payload.section = sectionId;
    if (insert_before) payload.insert_before = insert_before;
    if (insert_after) payload.insert_after = insert_after;
    return request({ method:'POST', pathName:'tasks/' + encodeURIComponent(taskId) + '/addProject', data: payload, optFields, debug });
  }

  async function removeProjectFromTask({ taskId, projectId, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId') || requireId(projectId, 'projectId');
    if (missing) return missing;
    return request({ method:'POST', pathName:'tasks/' + encodeURIComponent(taskId) + '/removeProject', data:{ project: projectId }, optFields, debug });
  }

  async function addComment({ taskId, text, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    if (!text) return { ok:false, error:'asana.addComment: missing text' };
    return request({ method:'POST', pathName:'tasks/' + encodeURIComponent(taskId) + '/stories', data:{ text: String(text) }, optFields, debug });
  }

  async function listStories({ taskId, limit, offset, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    const query = {};
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'tasks/' + encodeURIComponent(taskId) + '/stories', query, optFields, debug });
  }

  async function getStory({ storyId, optFields, debug } = {}){
    const missing = requireId(storyId, 'storyId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'stories/' + encodeURIComponent(storyId), optFields, debug });
  }

  async function addSubtask({ taskId, name, notes, assignee, due_on, due_at, start_on, start_at, followers, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    if (!name) return { ok:false, error:'asana.addSubtask: missing name' };
    const payload = { name: String(name) };
    if (notes) payload.notes = String(notes);
    if (assignee) payload.assignee = assignee;
    if (due_on) payload.due_on = String(due_on);
    if (due_at) payload.due_at = String(due_at);
    if (start_on) payload.start_on = String(start_on);
    if (start_at) payload.start_at = String(start_at);
    if (Array.isArray(followers)) payload.followers = followers;
    return request({ method:'POST', pathName:'tasks/' + encodeURIComponent(taskId) + '/subtasks', data: payload, optFields, debug });
  }

  async function listSections({ projectId, optFields, debug } = {}){
    const missing = requireId(projectId, 'projectId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'projects/' + encodeURIComponent(projectId) + '/sections', optFields, debug });
  }

  async function createSection({ projectId, name, insert_before, insert_after, optFields, debug } = {}){
    const missing = requireId(projectId, 'projectId');
    if (missing) return missing;
    if (!name) return { ok:false, error:'asana.createSection: missing name' };
    const payload = { name: String(name) };
    if (insert_before) payload.insert_before = insert_before;
    if (insert_after) payload.insert_after = insert_after;
    return request({ method:'POST', pathName:'projects/' + encodeURIComponent(projectId) + '/sections', data: payload, optFields, debug });
  }

  async function addTaskToSection({ sectionId, taskId, optFields, debug } = {}){
    const missing = requireId(sectionId, 'sectionId') || requireId(taskId, 'taskId');
    if (missing) return missing;
    return request({ method:'POST', pathName:'sections/' + encodeURIComponent(sectionId) + '/addTask', data:{ task: taskId }, optFields, debug });
  }

  async function listTags({ workspace, limit, offset, optFields, debug } = {}){
    const workspaceId = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (!workspaceId) return { ok:false, error:'asana.listTags: missing workspace' };
    const query = { workspace: workspaceId };
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'tags', query, optFields, debug });
  }

  async function getTag({ tagId, optFields, debug } = {}){
    const missing = requireId(tagId, 'tagId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'tags/' + encodeURIComponent(tagId), optFields, debug });
  }

  async function createTag({ workspace, name, notes, color, optFields, debug } = {}){
    const payload = {};
    payload.workspace = workspace || cfg.defaultWorkspace || sys.env.get('asana.defaultWorkspace');
    if (name) payload.name = String(name);
    if (notes) payload.notes = String(notes);
    if (color) payload.color = String(color);
    if (!payload.workspace || !payload.name) return { ok:false, error:'asana.createTag: missing workspace or name' };
    return request({ method:'POST', pathName:'tags', data: payload, optFields, debug });
  }

  async function listAttachments({ taskId, limit, offset, optFields, debug } = {}){
    const missing = requireId(taskId, 'taskId');
    if (missing) return missing;
    const query = {};
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;
    return request({ method:'GET', pathName:'tasks/' + encodeURIComponent(taskId) + '/attachments', query, optFields, debug });
  }

  async function getAttachment({ attachmentId, optFields, debug } = {}){
    const missing = requireId(attachmentId, 'attachmentId');
    if (missing) return missing;
    return request({ method:'GET', pathName:'attachments/' + encodeURIComponent(attachmentId), optFields, debug });
  }

  async function selfTest(){
    const token = pickToken();
    if (!token) return 'skipped: missing accessToken';
    const res = await listWorkspaces({ optFields:'gid,name' });
    if (!res || res.ok !== true) throw new Error('selfTest failed');
    return 'ok';
  }

  module.exports = {
    configure,
    request,
    getUser,
    listWorkspaces,
    getWorkspace,
    listUsers,
    listTeams,
    getTeam,
    listProjects,
    getProject,
    updateProject,
    createProject,
    listProjectMemberships,
    listTasks,
    searchTasks,
    getTask,
    listSubtasks,
    createTask,
    updateTask,
    addProjectToTask,
    removeProjectFromTask,
    addComment,
    listStories,
    getStory,
    addSubtask,
    listSections,
    createSection,
    addTaskToSection,
    listTags,
    getTag,
    createTag,
    listAttachments,
    getAttachment,
    selfTest
  };
})();
