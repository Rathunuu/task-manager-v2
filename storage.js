/* =========================================================
   TASK MANAGER
   STORAGE.JS

   Handles:
   - Users
   - Login session
   - Master Admin
   - Tasks
   - Projects
   - Admin assigned tasks
   - localStorage
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const USERS_KEY = "tm_users";
const SESSION_KEY = "tm_session";
const TASKS_KEY = "tm_tasks";
const PROJECTS_KEY = "tm_projects";


/* =========================================================
   MASTER ADMIN LOGIN
========================================================= */

const MASTER_EMAIL = "admin@taskmanager.com";
const MASTER_PASSWORD = "admin123";


/* =========================================================
   SMALL HELPERS
========================================================= */

function makeId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );
}


function safeParse(value, fallback) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}


/* =========================================================
   USERS
========================================================= */

export function loadUsers() {

    const data = localStorage.getItem(USERS_KEY);

    if (!data) {
        return [];
    }

    const users = safeParse(data, []);

    return Array.isArray(users) ? users : [];
}


export function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(Array.isArray(users) ? users : [])
    );
}


export function findUserByEmail(email) {

    const cleanEmail = String(email || "")
        .trim()
        .toLowerCase();

    return (
        loadUsers().find(
            user =>
                String(user.email || "")
                    .trim()
                    .toLowerCase() === cleanEmail
        ) || null
    );
}


/* =========================================================
   REGISTER USER
========================================================= */

export function registerUser(name, email, password) {

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "")
        .trim()
        .toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanName || !cleanEmail || !cleanPassword) {
        return {
            success: false,
            message: "Please fill all fields."
        };
    }

    if (cleanEmail === MASTER_EMAIL) {
        return {
            success: false,
            message: "This email is reserved for Master Admin."
        };
    }

    if (findUserByEmail(cleanEmail)) {
        return {
            success: false,
            message: "An account with this email already exists."
        };
    }

    const newUser = {
        id: makeId(),
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: "user",
        createdAt: new Date().toISOString()
    };

    const users = loadUsers();

    users.push(newUser);

    saveUsers(users);

    return {
        success: true,
        user: newUser
    };
}


/* =========================================================
   MASTER ADMIN
========================================================= */

export function isMasterCredentials(email, password) {

    return (
        String(email || "")
            .trim()
            .toLowerCase() === MASTER_EMAIL &&
        String(password || "") === MASTER_PASSWORD
    );
}


export function getMasterUser() {

    return {
        id: "master-admin",
        name: "Master Admin",
        email: MASTER_EMAIL,
        role: "admin",
        createdAt: "system"
    };
}


export function isAdmin(user) {

    return Boolean(
        user &&
        user.role === "admin"
    );
}


export function getAllRegularUsers() {

    return loadUsers().filter(
        user => user.role !== "admin"
    );
}


/* =========================================================
   LOGIN
========================================================= */

export function loginUser(email, password) {

    if (isMasterCredentials(email, password)) {

        return {
            success: true,
            user: getMasterUser()
        };
    }

    const user = findUserByEmail(email);

    if (!user) {

        return {
            success: false,
            message: "Account not found."
        };
    }

    if (user.password !== password) {

        return {
            success: false,
            message: "Incorrect password."
        };
    }

    return {
        success: true,
        user
    };
}


/* =========================================================
   SESSION
========================================================= */

export function getCurrentUser() {

    const data = localStorage.getItem(SESSION_KEY);

    if (!data) {
        return null;
    }

    const user = safeParse(data, null);

    return user || null;
}


export function setCurrentUser(user) {

    if (!user) {
        return;
    }

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(user)
    );
}


export function clearCurrentUser() {

    localStorage.removeItem(SESSION_KEY);
}


/* =========================================================
   TASK STORAGE
========================================================= */

function getTasksKey(userId) {

    return `${TASKS_KEY}_${userId}`;
}


export function loadTasks(userId) {

    if (!userId) {
        return [];
    }

    const data = localStorage.getItem(
        getTasksKey(userId)
    );

    if (!data) {
        return [];
    }

    const tasks = safeParse(data, []);

    return Array.isArray(tasks) ? tasks : [];
}


export function saveTasks(userId, tasks) {

    if (!userId) {
        return;
    }

    localStorage.setItem(
        getTasksKey(userId),
        JSON.stringify(
            Array.isArray(tasks) ? tasks : []
        )
    );
}


/* =========================================================
   CREATE TASK
========================================================= */

export function createTask(userId, taskData = {}) {

    if (!userId) {
        return null;
    }

    const now = new Date().toISOString();

    const task = {

        id: makeId(),

        text:
            String(taskData.text || "").trim() ||
            "New Task",

        description:
            String(taskData.description || ""),

        category:
            taskData.category || "Work",

        status:
            taskData.status || "To Do",

        priority:
            taskData.priority || "Normal",

        dueDate:
            taskData.dueDate || "",

        projectId:
            taskData.projectId || null,

        notes:
            taskData.notes || "",

        subtasks:
            Array.isArray(taskData.subtasks)
                ? taskData.subtasks
                : [],

        createdAt: now,

        updatedAt: now,

        order:
            typeof taskData.order === "number"
                ? taskData.order
                : Date.now()
    };

    const tasks = loadTasks(userId);

    tasks.unshift(task);

    saveTasks(userId, tasks);

    return task;
}


/* =========================================================
   ADMIN TASK HELPERS
========================================================= */

export function loadUserTasksForAdmin(userId) {

    return loadTasks(userId);
}


export function saveUserTasksForAdmin(userId, tasks) {

    saveTasks(userId, tasks);
}


/* =========================================================
   CREATE ASSIGNED TASK
========================================================= */

export function createAssignedTask(
    userId,
    taskData = {}
) {

    if (!userId) {
        return null;
    }

    const now = new Date().toISOString();

    const task = {

        id: makeId(),

        text:
            String(taskData.text || "").trim() ||
            "Assigned Task",

        description:
            String(taskData.description || ""),

        category:
            taskData.category || "Work",

        status:
            taskData.status || "To Do",

        priority:
            taskData.priority || "Normal",

        dueDate:
            taskData.dueDate || "",

        projectId:
            taskData.projectId || null,

        notes: "",

        subtasks: [],

        assignedBy: "master-admin",

        assignedTo: userId,

        assignedAt: now,

        createdAt: now,

        updatedAt: now,

        order: Date.now()
    };

    const tasks = loadTasks(userId);

    tasks.unshift(task);

    saveTasks(userId, tasks);

    return task;
}


/* =========================================================
   DELETE TASK
========================================================= */

export function deleteTask(userId, taskId) {

    if (!userId || !taskId) {
        return false;
    }

    const tasks = loadTasks(userId);

    const updatedTasks = tasks.filter(
        task => task.id !== taskId
    );

    saveTasks(userId, updatedTasks);

    return updatedTasks.length !== tasks.length;
}


/* =========================================================
   PROJECT STORAGE
========================================================= */

function getProjectsKey(userId) {

    return `${PROJECTS_KEY}_${userId}`;
}


export function loadProjects(userId) {

    if (!userId) {
        return [];
    }

    const data = localStorage.getItem(
        getProjectsKey(userId)
    );

    if (!data) {
        return [];
    }

    const projects = safeParse(data, []);

    return Array.isArray(projects)
        ? projects
        : [];
}


export function saveProjects(userId, projects) {

    if (!userId) {
        return;
    }

    localStorage.setItem(
        getProjectsKey(userId),
        JSON.stringify(
            Array.isArray(projects)
                ? projects
                : []
        )
    );
}


/* =========================================================
   CREATE PROJECT
========================================================= */

export function createProject(
    userId,
    projectName
) {

    if (!userId) {
        return null;
    }

    const name = String(projectName || "").trim();

    if (!name) {
        return null;
    }

    const now = new Date().toISOString();

    const project = {

        id: makeId(),

        name,

        description: "",

        createdAt: now,

        updatedAt: now
    };

    const projects = loadProjects(userId);

    projects.push(project);

    saveProjects(userId, projects);

    return project;
}


/* =========================================================
   DEFAULT PROJECT
========================================================= */

export function ensureDefaultProject(userId) {

    if (!userId) {
        return null;
    }

    let projects = loadProjects(userId);

    if (projects.length > 0) {
        return projects[0];
    }

    const defaultProject = {

        id: makeId(),

        name: "My Tasks",

        description:
            "Default task project.",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };

    projects = [defaultProject];

    saveProjects(userId, projects);

    return defaultProject;
}


/* =========================================================
   DELETE PROJECT
========================================================= */

export function deleteProject(
    userId,
    projectId
) {

    if (!userId || !projectId) {
        return false;
    }

    const projects = loadProjects(userId);

    const updatedProjects = projects.filter(
        project => project.id !== projectId
    );

    saveProjects(
        userId,
        updatedProjects
    );

    return (
        updatedProjects.length !==
        projects.length
    );
}


/* =========================================================
   RESET USER DATA
========================================================= */

export function clearUserData(userId) {

    if (!userId) {
        return;
    }

    localStorage.removeItem(
        getTasksKey(userId)
    );

    localStorage.removeItem(
        getProjectsKey(userId)
    );
}


/* =========================================================
   EXPORT USER DATA
========================================================= */

export function getUserDataForExport(userId) {

    return {

        tasks: loadTasks(userId),

        projects: loadProjects(userId),

        exportedAt:
            new Date().toISOString()
    };
}


/* =========================================================
   IMPORT USER DATA
========================================================= */

export function importUserData(
    userId,
    data
) {

    if (!userId || !data) {
        return false;
    }

    if (Array.isArray(data.tasks)) {

        saveTasks(
            userId,
            data.tasks
        );
    }

    if (Array.isArray(data.projects)) {

        saveProjects(
            userId,
            data.projects
        );
    }

    return true;
}
