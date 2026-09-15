// ==========================================
// TASK MANAGER V2 - STORAGE
// Week 2 + Week 3
// Master Admin + Multi User + Task Assignment
// ==========================================


// ==========================================
// STORAGE KEYS
// ==========================================

const USERS_KEY = "tm_users";
const SESSION_KEY = "tm_session";
const TASKS_KEY = "tm_tasks";
const PROJECTS_KEY = "tm_projects";


// ==========================================
// MASTER ADMIN
// ==========================================

const MASTER_ADMIN = {
    id: "master-admin",
    name: "Master Admin",
    email: "admin@taskmanager.com",
    password: "admin123",
    role: "admin"
};


// ==========================================
// ID GENERATOR
// ==========================================

function makeId(prefix = "id") {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}`;
}


// ==========================================
// SAFE STORAGE HELPERS
// ==========================================

function readJSON(key, fallback = []) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed = JSON.parse(value);

        return parsed;
    } catch (error) {
        console.error(`Storage read error for ${key}:`, error);
        return fallback;
    }
}


function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Storage write error for ${key}:`, error);
        return false;
    }
}


// ==========================================
// USERS
// ==========================================

export function loadUsers() {
    const users = readJSON(USERS_KEY, []);

    return Array.isArray(users) ? users : [];
}


export function saveUsers(users) {
    return writeJSON(USERS_KEY, users);
}


export function findUserByEmail(email) {
    if (!email) {
        return null;
    }

    const cleanEmail = email.trim().toLowerCase();

    const users = loadUsers();

    return (
        users.find(
            user =>
                user.email &&
                user.email.toLowerCase() === cleanEmail
        ) || null
    );
}


// ==========================================
// REGISTER
// ==========================================

export function registerUser(name, email, password) {

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanName) {
        return {
            success: false,
            message: "Please enter your name."
        };
    }

    if (!cleanEmail) {
        return {
            success: false,
            message: "Please enter your email."
        };
    }

    if (!cleanPassword) {
        return {
            success: false,
            message: "Please enter a password."
        };
    }

    if (cleanPassword.length < 4) {
        return {
            success: false,
            message: "Password must contain at least 4 characters."
        };
    }

    if (cleanEmail === MASTER_ADMIN.email) {
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
        id: makeId("user"),
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: "user",
        createdAt: new Date().toISOString()
    };

    const users = loadUsers();

    users.push(newUser);

    saveUsers(users);

    // Create empty user storage
    saveTasks(newUser.id, []);
    saveProjects(newUser.id, []);

    ensureDefaultProject(newUser.id);

    return {
        success: true,
        user: newUser
    };
}


// ==========================================
// MASTER / ADMIN
// ==========================================

export function isMasterCredentials(email, password) {

    return (
        String(email || "").trim().toLowerCase() ===
            MASTER_ADMIN.email &&
        String(password || "") === MASTER_ADMIN.password
    );
}


export function getMasterUser() {
    return {
        ...MASTER_ADMIN
    };
}


export function isAdmin(user) {
    return Boolean(
        user &&
        user.role === "admin"
    );
}


export function getAllRegularUsers() {
    return loadUsers();
}


// ==========================================
// LOGIN
// ==========================================

export function loginUser(email, password) {

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    // MASTER ADMIN LOGIN
    if (
        cleanEmail === MASTER_ADMIN.email &&
        cleanPassword === MASTER_ADMIN.password
    ) {
        const adminUser = getMasterUser();

        setCurrentUser(adminUser);

        return {
            success: true,
            user: adminUser
        };
    }

    // NORMAL USER LOGIN
    const user = findUserByEmail(cleanEmail);

    if (!user) {
        return {
            success: false,
            message: "No account found with this email."
        };
    }

    if (user.password !== cleanPassword) {
        return {
            success: false,
            message: "Incorrect password."
        };
    }

    setCurrentUser(user);

    return {
        success: true,
        user
    };
}


// ==========================================
// SESSION
// ==========================================

export function getCurrentUser() {

    try {
        const value = localStorage.getItem(SESSION_KEY);

        if (!value) {
            return null;
        }

        const user = JSON.parse(value);

        return user || null;

    } catch (error) {
        console.error("Session read error:", error);
        return null;
    }
}


export function setCurrentUser(user) {

    if (!user) {
        localStorage.removeItem(SESSION_KEY);
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


// ==========================================
// TASK STORAGE
// ==========================================

export function loadTasks(userId) {

    if (!userId) {
        return [];
    }

    const allTasks = readJSON(TASKS_KEY, {});

    if (!allTasks || typeof allTasks !== "object") {
        return [];
    }

    const userTasks = allTasks[userId];

    return Array.isArray(userTasks)
        ? userTasks
        : [];
}


export function saveTasks(userId, tasks) {

    if (!userId) {
        return false;
    }

    const allTasks = readJSON(TASKS_KEY, {});

    if (!allTasks || typeof allTasks !== "object") {
        return false;
    }

    allTasks[userId] = Array.isArray(tasks)
        ? tasks
        : [];

    return writeJSON(TASKS_KEY, allTasks);
}


// ==========================================
// CREATE TASK
// ==========================================

export function createTask(userId, taskData = {}) {

    if (!userId) {
        return null;
    }

    const task = {
        id: makeId("task"),

        title: String(taskData.title || "").trim(),

        description:
            String(taskData.description || "").trim(),

        category:
            taskData.category || "Work",

        status:
            taskData.status || "To Do",

        priority:
            taskData.priority || "Medium",

        dueDate:
            taskData.dueDate || "",

        projectId:
            taskData.projectId || null,

        assignedTo:
            taskData.assignedTo || userId,

        createdBy:
            taskData.createdBy || userId,

        createdAt:
            taskData.createdAt || new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        notes:
            String(taskData.notes || ""),

        subtasks:
            Array.isArray(taskData.subtasks)
                ? taskData.subtasks
                : []
    };

    const tasks = loadTasks(userId);

    tasks.push(task);

    saveTasks(userId, tasks);

    return task;
}


// ==========================================
// ADMIN - LOAD USER TASKS
// ==========================================

export function loadUserTasksForAdmin(userId) {

    if (!userId) {
        return [];
    }

    return loadTasks(userId);
}


// ==========================================
// ADMIN - SAVE USER TASKS
// ==========================================

export function saveUserTasksForAdmin(userId, tasks) {

    if (!userId) {
        return false;
    }

    return saveTasks(userId, tasks);
}


// ==========================================
// ADMIN - ASSIGN TASK
// ==========================================

export function createAssignedTask(
    userId,
    taskData = {},
    adminId = MASTER_ADMIN.id
) {

    if (!userId) {
        return null;
    }

    const assignedTask = {
        id: makeId("task"),

        title:
            String(taskData.title || "").trim(),

        description:
            String(taskData.description || "").trim(),

        category:
            taskData.category || "Work",

        status:
            taskData.status || "To Do",

        priority:
            taskData.priority || "Medium",

        dueDate:
            taskData.dueDate || "",

        projectId:
            taskData.projectId || null,

        assignedTo:
            userId,

        createdBy:
            adminId,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        notes: "",

        subtasks: []
    };

    const tasks = loadTasks(userId);

    tasks.push(assignedTask);

    saveTasks(userId, tasks);

    return assignedTask;
}


// ==========================================
// DELETE TASK
// ==========================================

export function deleteTask(userId, taskId) {

    if (!userId || !taskId) {
        return null;
    }

    const tasks = loadTasks(userId);

    const index = tasks.findIndex(
        task => task.id === taskId
    );

    if (index === -1) {
        return null;
    }

    const deletedTask = tasks[index];

    tasks.splice(index, 1);

    saveTasks(userId, tasks);

    return deletedTask;
}


// ==========================================
// PROJECT STORAGE
// ==========================================

export function loadProjects(userId) {

    if (!userId) {
        return [];
    }

    const allProjects = readJSON(
        PROJECTS_KEY,
        {}
    );

    if (
        !allProjects ||
        typeof allProjects !== "object"
    ) {
        return [];
    }

    const projects = allProjects[userId];

    return Array.isArray(projects)
        ? projects
        : [];
}


export function saveProjects(userId, projects) {

    if (!userId) {
        return false;
    }

    const allProjects = readJSON(
        PROJECTS_KEY,
        {}
    );

    if (
        !allProjects ||
        typeof allProjects !== "object"
    ) {
        return false;
    }

    allProjects[userId] =
        Array.isArray(projects)
            ? projects
            : [];

    return writeJSON(
        PROJECTS_KEY,
        allProjects
    );
}


// ==========================================
// CREATE PROJECT
// ==========================================

export function createProject(
    userId,
    projectName
) {

    if (!userId) {
        return null;
    }

    const cleanName =
        String(projectName || "").trim();

    if (!cleanName) {
        return null;
    }

    const project = {
        id: makeId("project"),

        name: cleanName,

        createdAt:
            new Date().toISOString()
    };

    const projects =
        loadProjects(userId);

    projects.push(project);

    saveProjects(userId, projects);

    return project;
}


// ==========================================
// DEFAULT PROJECT
// ==========================================

export function ensureDefaultProject(userId) {

    if (!userId) {
        return null;
    }

    let projects =
        loadProjects(userId);

    if (projects.length > 0) {
        return projects[0];
    }

    const defaultProject = {
        id: makeId("project"),

        name: "My Tasks",

        createdAt:
            new Date().toISOString()
    };

    projects = [defaultProject];

    saveProjects(
        userId,
        projects
    );

    return defaultProject;
}


// ==========================================
// DELETE PROJECT
// ==========================================

export function deleteProject(
    userId,
    projectId
) {

    if (!userId || !projectId) {
        return false;
    }

    const projects =
        loadProjects(userId);

    const filteredProjects =
        projects.filter(
            project =>
                project.id !== projectId
        );

    if (
        filteredProjects.length ===
        projects.length
    ) {
        return false;
    }

    saveProjects(
        userId,
        filteredProjects
    );

    // Remove project reference from tasks
    const tasks =
        loadTasks(userId);

    const updatedTasks =
        tasks.map(task => {

            if (task.projectId === projectId) {
                return {
                    ...task,
                    projectId: null
                };
            }

            return task;
        });

    saveTasks(
        userId,
        updatedTasks
    );

    return true;
}


// ==========================================
// CLEAR USER DATA
// ==========================================

export function clearUserData(userId) {

    if (!userId) {
        return false;
    }

    const allTasks =
        readJSON(TASKS_KEY, {});

    const allProjects =
        readJSON(PROJECTS_KEY, {});

    delete allTasks[userId];
    delete allProjects[userId];

    writeJSON(
        TASKS_KEY,
        allTasks
    );

    writeJSON(
        PROJECTS_KEY,
        allProjects
    );

    return true;
}


// ==========================================
// EXPORT USER DATA
// ==========================================

export function getUserDataForExport(userId) {

    if (!userId) {
        return null;
    }

    return {
        exportedAt:
            new Date().toISOString(),

        userId,

        tasks:
            loadTasks(userId),

        projects:
            loadProjects(userId)
    };
}


// ==========================================
// IMPORT USER DATA
// ==========================================

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
