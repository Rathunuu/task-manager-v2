import {
    loadUsers,
    saveUsers,
    findUserByEmail,
    registerUser,
    loginUser,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    isAdmin,

    loadTasks,
    saveTasks,
    createTask,
    createAssignedTask,
    updateTask,
    deleteTask,
    undoDeleteTask,

    loadProjects,
    saveProjects,
    createProject,
    deleteProject,
    ensureDefaultProject,

    getUserDataForExport,
    importUserData
} from "./storage.js";

import {
    renderProjects,
    renderProgress,
    renderTasks,
    renderEmptyState,
    renderBoard,
    renderTaskDetail,
    renderSubtasks,
    renderAdminSummary,
    renderAdminUsers,
    renderAdminReports,
    renderAdminBoard,
    renderUserSelect
} from "./render.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let tasks = [];
let projects = [];

let activeProjectId = "";

let currentView = "list";
let currentCategory = "all";
let currentSearch = "";
let currentSort = "newest";

let selectedTaskId = null;

let deletedTaskBackup = null;
let undoTimer = null;


// =====================================================
// HELPERS
// =====================================================

function $(id) {
    return document.getElementById(id);
}

function show(element, visible = true) {
    if (!element) return;

    element.hidden = !visible;
    element.classList.toggle("hidden", !visible);
}

function normalizeStatus(status) {
    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (
        value === "todo" ||
        value === "to-do" ||
        value === "to do"
    ) {
        return "To Do";
    }

    if (
        value === "in-progress" ||
        value === "in progress"
    ) {
        return "In Progress";
    }

    if (
        value === "in-review" ||
        value === "in review"
    ) {
        return "In Review";
    }

    if (value === "done") {
        return "Done";
    }

    return "To Do";
}

function getUserById(userId) {
    const users = loadUsers();

    return users.find(
        user => String(user.id) === String(userId)
    ) || null;
}


// =====================================================
// AUTH ELEMENTS
// =====================================================

const authScreen = $("authScreen");

const loginSection = $("loginSection");
const loginForm = $("loginForm");
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginError = $("loginError");
const showRegisterBtn = $("showRegisterBtn");

const registerSection = $("registerSection");
const registerForm = $("registerForm");
const registerName = $("registerName");
const registerEmail = $("registerEmail");
const registerPassword = $("registerPassword");
const registerError = $("registerError");
const showLoginBtn = $("showLoginBtn");


// =====================================================
// APPLICATION ELEMENTS
// =====================================================

const appScreen = $("appScreen");

const welcomeMessage = $("welcomeMessage");
const currentUserRole = $("currentUserRole");
const logoutBtn = $("logoutBtn");


// =====================================================
// ADMIN ELEMENTS
// =====================================================

const adminDashboard = $("adminDashboard");

const adminTotalUsers = $("adminTotalUsers");
const adminTotalTasks = $("adminTotalTasks");
const adminPendingTasks = $("adminPendingTasks");
const adminCompletedTasks = $("adminCompletedTasks");

const adminUsersList = $("adminUsersList");

const adminAssignTaskForm = $("adminAssignTaskForm");
const adminUserSelect = $("adminUserSelect");
const adminTaskTitle = $("adminTaskTitle");
const adminTaskDescription = $("adminTaskDescription");
const adminTaskCategory = $("adminTaskCategory");
const adminTaskPriority = $("adminTaskPriority");
const adminTaskDueDate = $("adminTaskDueDate");
const adminTaskProject = $("adminTaskProject");
const adminAssignMessage = $("adminAssignMessage");

const adminTodoTasks = $("adminTodoTasks");
const adminInProgressTasks = $("adminInProgressTasks");
const adminInReviewTasks = $("adminInReviewTasks");
const adminDoneTasks = $("adminDoneTasks");

const adminTodoColumn = $("adminTodoColumn");
const adminInProgressColumn = $("adminInProgressColumn");
const adminInReviewColumn = $("adminInReviewColumn");
const adminDoneColumn = $("adminDoneColumn");

const adminReportsList = $("adminReportsList");
const refreshAdminReportsBtn = $("refreshAdminReportsBtn");

const adminOpenTaskManagerBtn = $("adminOpenTaskManagerBtn");


// =====================================================
// USER ELEMENTS
// =====================================================

const userTaskManager = $("userTaskManager");

const projectSwitcher = $("projectSwitcher");
const activeProjectName = $("activeProjectName");

const progressText = $("progressText");
const progressFill = $("progressFill");
const progressPercentage = $("progressPercentage");

const newProjectBtn = $("newProjectBtn");

const taskInput = $("taskInput");
const categorySelect = $("categorySelect");
const statusSelect = $("statusSelect");
const addTaskBtn = $("addTaskBtn");

const searchInput = $("searchInput");

const filterButtons = document.querySelectorAll(
    "[data-category]"
);

const sortSelect = $("sortSelect");

const listViewBtn = $("listViewBtn");
const boardViewBtn = $("boardViewBtn");

const taskListView = $("taskListView");
const taskList = $("taskList");
const emptyState = $("emptyState");
const kanbanBoard = $("kanbanBoard");


// =====================================================
// USER KANBAN COLUMNS
// =====================================================

const todoColumn = document.querySelector(
    '#kanbanBoard .kanban-column[data-status="To Do"]'
);

const inProgressColumn = document.querySelector(
    '#kanbanBoard .kanban-column[data-status="In Progress"]'
);

const inReviewColumn = document.querySelector(
    '#kanbanBoard .kanban-column[data-status="In Review"]'
);

const doneColumn = document.querySelector(
    '#kanbanBoard .kanban-column[data-status="Done"]'
);


// =====================================================
// DATA ACTIONS
// =====================================================

const exportBtn = $("exportBtn");
const importFileInput = $("importFileInput");


// =====================================================
// TASK DETAIL
// =====================================================

const taskDetailDialog = $("taskDetailDialog");

const detailTaskTitle = $("detailTaskTitle");
const detailDescription = $("detailDescription");
const detailStatus = $("detailStatus");
const detailPriority = $("detailPriority");
const detailDueDate = $("detailDueDate");
const detailCategory = $("detailCategory");

const taskNotes = $("taskNotes");
const saveNotesBtn = $("saveNotesBtn");

const subtaskInput = $("subtaskInput");
const addSubtaskBtn = $("addSubtaskBtn");
const subtaskList = $("subtaskList");

const closeTaskDetailBtn = $("closeTaskDetailBtn");
const cancelTaskDetailBtn = $("cancelTaskDetailBtn");


// =====================================================
// NEW PROJECT
// =====================================================

const newProjectDialog = $("newProjectDialog");

const closeNewProjectBtn = $("closeNewProjectBtn");
const projectNameInput = $("projectNameInput");
const projectError = $("projectError");
const cancelProjectBtn = $("cancelProjectBtn");
const createProjectBtn = $("createProjectBtn");


// =====================================================
// UNDO
// =====================================================

const undoToast = $("undoToast");
const undoMessage = $("undoMessage");
const undoBtn = $("undoBtn");


// =====================================================
// AUTH SCREEN
// =====================================================

function showAuthScreen() {
    show(authScreen, true);
    show(appScreen, false);

    show(loginSection, true);
    show(registerSection, false);

    if (loginError) {
        loginError.textContent = "";
    }

    if (registerError) {
        registerError.textContent = "";
    }
}

function showLoginForm() {
    show(loginSection, true);
    show(registerSection, false);

    if (loginError) {
        loginError.textContent = "";
    }
}

function showRegisterForm() {
    show(loginSection, false);
    show(registerSection, true);

    if (registerError) {
        registerError.textContent = "";
    }
}


// =====================================================
// LOGIN
// =====================================================

function handleLogin(event) {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
        return;
    }

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (loginError) {
        loginError.textContent = "";
    }

    if (!email || !password) {
        if (loginError) {
            loginError.textContent =
                "Please enter email and password.";
        }

        return;
    }

    const result = loginUser(email, password);

    if (!result || !result.success) {

        if (loginError) {
            loginError.textContent =
                result?.message ||
                "Invalid email or password.";
        }

        return;
    }

    currentUser = result.user;

    setCurrentUser(currentUser);

    openApplication(currentUser);
}


// =====================================================
// REGISTER
// =====================================================

function handleRegister(event) {
    event.preventDefault();

    const name = registerName?.value.trim();
    const email = registerEmail?.value.trim();
    const password = registerPassword?.value;

    if (registerError) {
        registerError.textContent = "";
    }

    if (!name || !email || !password) {

        if (registerError) {
            registerError.textContent =
                "Please fill all fields.";
        }

        return;
    }

    if (password.length < 6) {

        if (registerError) {
            registerError.textContent =
                "Password must be at least 6 characters.";
        }

        return;
    }

    const existingUser = findUserByEmail(email);

    if (existingUser) {

        if (registerError) {
            registerError.textContent =
                "An account with this email already exists.";
        }

        return;
    }

    const result = registerUser(
        name,
        email,
        password
    );

    if (!result || !result.success) {

        if (registerError) {
            registerError.textContent =
                result?.message ||
                "Unable to create account.";
        }

        return;
    }

    if (registerForm) {
        registerForm.reset();
    }

    showLoginForm();

    if (loginError) {
        loginError.textContent =
            "Account created successfully. Please login.";
    }

    if (loginEmail) {
        loginEmail.value = email;
    }

    if (loginPassword) {
        loginPassword.value = "";
    }
}


// =====================================================
// OPEN APPLICATION
// =====================================================

function openApplication(user) {

    currentUser = user;

    show(authScreen, false);
    show(appScreen, true);

    if (welcomeMessage) {
        welcomeMessage.textContent =
            `Welcome, ${user.name}`;
    }

    if (currentUserRole) {
        currentUserRole.textContent =
            isAdmin(user) ? "Master Admin" : "User";
    }

    if (isAdmin(user)) {

        show(adminDashboard, true);
        show(userTaskManager, false);

        loadAdminDashboard();

    } else {

        show(adminDashboard, false);
        show(userTaskManager, true);

        loadUserDashboard();
    }
}


// =====================================================
// USER DASHBOARD
// =====================================================

function loadUserDashboard() {

    if (!currentUser) {
        return;
    }

    const defaultProject =
        ensureDefaultProject(currentUser.id);

    projects = loadProjects(currentUser.id);

    if (!projects || projects.length === 0) {

        if (defaultProject) {
            projects = [defaultProject];
        } else {
            projects = [];
        }
    }

    tasks = loadTasks(currentUser.id);

    if (!activeProjectId ||
        !projects.some(
            project =>
                String(project.id) ===
                String(activeProjectId)
        )
    ) {

        activeProjectId =
            projects[0]?.id || "";
    }

    renderUserInterface();
}


// =====================================================
// USER INTERFACE
// =====================================================

function renderUserInterface() {

    renderProjects(
        projectSwitcher,
        projects,
        activeProjectId
    );

    const activeProject =
        projects.find(
            project =>
                String(project.id) ===
                String(activeProjectId)
        );

    if (activeProjectName) {

        activeProjectName.textContent =
            activeProject?.name || "My Tasks";
    }

    refreshTaskUI();
}


// =====================================================
// FILTER TASKS
// =====================================================

function getFilteredTasks() {

    let result = [...tasks];

    if (activeProjectId) {

        result = result.filter(
            task =>
                String(task.projectId || "") ===
                String(activeProjectId)
        );
    }

    if (
        currentCategory &&
        currentCategory !== "all"
    ) {

        result = result.filter(
            task =>
                String(task.category || "")
                    .toLowerCase() ===
                currentCategory.toLowerCase()
        );
    }

    if (currentSearch) {

        const search =
            currentSearch.toLowerCase();

        result = result.filter(task => {

            const title =
                String(task.title || "")
                    .toLowerCase();

            const description =
                String(task.description || "")
                    .toLowerCase();

            const category =
                String(task.category || "")
                    .toLowerCase();

            return (
                title.includes(search) ||
                description.includes(search) ||
                category.includes(search)
            );
        });
    }

    result.sort((a, b) => {

        if (currentSort === "oldest") {

            return (
                new Date(a.createdAt || 0) -
                new Date(b.createdAt || 0)
            );
        }

        if (currentSort === "az") {

            return String(a.title || "")
                .localeCompare(
                    String(b.title || "")
                );
        }

        if (currentSort === "za") {

            return String(b.title || "")
                .localeCompare(
                    String(a.title || "")
                );
        }

        if (currentSort === "priority") {

            const priorityMap = {
                High: 3,
                Medium: 2,
                Low: 1
            };

            return (
                (priorityMap[b.priority] || 0) -
                (priorityMap[a.priority] || 0)
            );
        }

        if (currentSort === "dueDate") {

            const aDate =
                a.dueDate
                    ? new Date(a.dueDate).getTime()
                    : Number.MAX_SAFE_INTEGER;

            const bDate =
                b.dueDate
                    ? new Date(b.dueDate).getTime()
                    : Number.MAX_SAFE_INTEGER;

            return aDate - bDate;
        }

        return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );
    });

    return result;
}


// =====================================================
// REFRESH USER TASK UI
// =====================================================

function refreshTaskUI() {

    const filteredTasks =
        getFilteredTasks();

    renderTasks(
        taskList,
        filteredTasks
    );

    renderEmptyState(
        emptyState,
        filteredTasks
    );

    const projectTasks =
        activeProjectId
            ? tasks.filter(
                task =>
                    String(task.projectId || "") ===
                    String(activeProjectId)
            )
            : [];

    renderProgress(
        progressText,
        progressFill,
        progressPercentage,
        projectTasks
    );

    renderBoard(
        projectTasks,
        {
            todo: todoColumn,
            inProgress: inProgressColumn,
            inReview: inReviewColumn,
            done: doneColumn
        }
    );

    updateKanbanCounts(projectTasks);

    attachDragAndDrop();
}


// =====================================================
// KANBAN COUNTS
// =====================================================

function updateKanbanCounts(projectTasks) {

    const columns = [
        {
            element: todoColumn,
            status: "To Do"
        },
        {
            element: inProgressColumn,
            status: "In Progress"
        },
        {
            element: inReviewColumn,
            status: "In Review"
        },
        {
            element: doneColumn,
            status: "Done"
        }
    ];

    columns.forEach(({ element, status }) => {

        if (!element) return;

        const count =
            projectTasks.filter(
                task =>
                    normalizeStatus(task.status) ===
                    status
            ).length;

        const countElement =
            element.querySelector(
                ".column-count"
            );

        if (countElement) {
            countElement.textContent = count;
        }
    });
}


// =====================================================
// ADD TASK
// =====================================================

function handleAddTask() {

    if (!currentUser) {
        return;
    }

    const title =
        taskInput?.value.trim();

    if (!title) {

        taskInput?.focus();

        return;
    }

    if (!activeProjectId) {

        alert(
            "Please create or select a project first."
        );

        return;
    }

    const newTask =
        createTask(
            currentUser.id,
            {
                title,
                description: "",
                category:
                    categorySelect?.value ||
                    "Work",
                status:
                    normalizeStatus(
                        statusSelect?.value ||
                        "To Do"
                    ),
                priority: "Medium",
                dueDate: "",
                projectId: activeProjectId
            }
        );

    if (!newTask) {
        return;
    }

    tasks = loadTasks(currentUser.id);

    if (taskInput) {
        taskInput.value = "";
        taskInput.focus();
    }

    refreshTaskUI();
}


// =====================================================
// PROJECT SWITCH
// =====================================================

function handleProjectSwitch(event) {

    const button =
        event.target.closest(
            "[data-project-id]"
        );

    if (!button) {
        return;
    }

    const projectId =
        button.dataset.projectId;

    if (!projectId) {
        return;
    }

    activeProjectId = projectId;

    renderUserInterface();
}


// =====================================================
// NEW PROJECT
// =====================================================

function openNewProjectDialog() {

    if (!newProjectDialog) {
        return;
    }

    if (projectError) {
        projectError.textContent = "";
    }

    if (projectNameInput) {
        projectNameInput.value = "";
    }

    newProjectDialog.showModal();

    projectNameInput?.focus();
}

function closeNewProjectDialog() {

    if (
        newProjectDialog &&
        newProjectDialog.open
    ) {
        newProjectDialog.close();
    }
}

function handleCreateProject() {

    if (!currentUser) {
        return;
    }

    const name =
        projectNameInput?.value.trim();

    if (!name) {

        if (projectError) {
            projectError.textContent =
                "Please enter a project name.";
        }

        return;
    }

    const duplicate =
        projects.some(
            project =>
                String(project.name || "")
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );

    if (duplicate) {

        if (projectError) {
            projectError.textContent =
                "A project with this name already exists.";
        }

        return;
    }

    const project =
        createProject(
            currentUser.id,
            name
        );

    if (!project) {
        return;
    }

    projects = loadProjects(
        currentUser.id
    );

    activeProjectId = project.id;

    closeNewProjectDialog();

    renderUserInterface();
}


// =====================================================
// TASK DETAIL
// =====================================================

function openTaskDetail(taskId) {

    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );

    if (!task || !taskDetailDialog) {
        return;
    }

    selectedTaskId = task.id;

    renderTaskDetail(
        task,
        {
            detailTaskTitle,
            detailDescription,
            detailStatus,
            detailPriority,
            detailDueDate,
            detailCategory,
            taskNotes
        }
    );

    renderSubtasks(
        subtaskList,
        task.subtasks || []
    );

    taskDetailDialog.showModal();
}

function closeTaskDetail() {

    if (
        taskDetailDialog &&
        taskDetailDialog.open
    ) {
        taskDetailDialog.close();
    }

    selectedTaskId = null;
}

function handleSaveTaskDetails() {

    if (!currentUser || !selectedTaskId) {
        return;
    }

    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(selectedTaskId)
        );

    if (!task) {
        return;
    }

    const updatedTask = {
        ...task,
        description:
            detailDescription?.value.trim() ||
            "",
        notes:
            taskNotes?.value ||
            task.notes ||
            ""
    };

    const result =
        updateTask(
            currentUser.id,
            selectedTaskId,
            updatedTask
        );

    if (!result) {
        return;
    }

    tasks = loadTasks(
        currentUser.id
    );

    closeTaskDetail();

    refreshTaskUI();
}


// =====================================================
// SUBTASK
// =====================================================

function handleAddSubtask() {

    if (!currentUser || !selectedTaskId) {
        return;
    }

    const text =
        subtaskInput?.value.trim();

    if (!text) {
        return;
    }

    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(selectedTaskId)
        );

    if (!task) {
        return;
    }

    const subtasks =
        Array.isArray(task.subtasks)
            ? [...task.subtasks]
            : [];

    subtasks.push({
        id:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
        title: text,
        completed: false
    });

    const updated =
        updateTask(
            currentUser.id,
            selectedTaskId,
            {
                ...task,
                subtasks
            }
        );

    if (!updated) {
        return;
    }

    tasks = loadTasks(
        currentUser.id
    );

    if (subtaskInput) {
        subtaskInput.value = "";
    }

    renderSubtasks(
        subtaskList,
        subtasks
    );
}


// =====================================================
// TASK LIST ACTIONS
// =====================================================

function handleTaskListClick(event) {

    const openButton =
        event.target.closest(
            "[data-open-task]"
        );

    if (openButton) {

        openTaskDetail(
            openButton.dataset.openTask
        );

        return;
    }

    const deleteButton =
        event.target.closest(
            "[data-delete-task]"
        );

    if (deleteButton) {

        handleDeleteTask(
            deleteButton.dataset.deleteTask
        );
    }
}


// =====================================================
// DELETE TASK
// =====================================================

function handleDeleteTask(taskId) {

    if (!currentUser) {
        return;
    }

    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );

    if (!task) {
        return;
    }

    deletedTaskBackup = {
        ...task
    };

    const result =
        deleteTask(
            currentUser.id,
            taskId
        );

    if (!result) {
        deletedTaskBackup = null;
        return;
    }

    tasks = loadTasks(
        currentUser.id
    );

    showUndoToast(
        `Task "${task.title}" deleted.`
    );

    refreshTaskUI();
}


// =====================================================
// UNDO DELETE
// =====================================================

function showUndoToast(message) {

    if (undoMessage) {
        undoMessage.textContent = message;
    }

    show(undoToast, true);

    clearTimeout(undoTimer);

    undoTimer =
        setTimeout(() => {

            deletedTaskBackup = null;

            show(undoToast, false);

        }, 5000);
}

function handleUndoDelete() {

    if (!currentUser || !deletedTaskBackup) {
        return;
    }

    const restored =
        undoDeleteTask(
            currentUser.id,
            deletedTaskBackup
        );

    if (restored) {

        tasks = loadTasks(
            currentUser.id
        );

        deletedTaskBackup = null;

        clearTimeout(undoTimer);

        show(undoToast, false);

        refreshTaskUI();
    }
}


// =====================================================
// VIEW SWITCH
// =====================================================

function switchView(view) {

    currentView = view;

    if (view === "board") {

        show(taskListView, false);
        show(kanbanBoard, true);

        listViewBtn?.classList.remove("active");
        boardViewBtn?.classList.add("active");

    } else {

        show(taskListView, true);
        show(kanbanBoard, false);

        listViewBtn?.classList.add("active");
        boardViewBtn?.classList.remove("active");
    }
}


// =====================================================
// CATEGORY FILTER
// =====================================================

function handleCategoryFilter(event) {

    const button =
        event.target.closest(
            "[data-category]"
        );

    if (!button) {
        return;
    }

    const category =
        button.dataset.category;

    if (!category) {
        return;
    }

    currentCategory =
        category.toLowerCase();

    document
        .querySelectorAll(
            ".filter-btn[data-category]"
        )
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn === button
            );
        });

    refreshTaskUI();
}


// =====================================================
// SEARCH
// =====================================================

function handleSearch(event) {

    currentSearch =
        event.target.value.trim();

    refreshTaskUI();
}


// =====================================================
// SORT
// =====================================================

function handleSort(event) {

    currentSort =
        event.target.value;

    refreshTaskUI();
}


// =====================================================
// DRAG & DROP - USER
// =====================================================

function attachDragAndDrop() {

    const columns =
        document.querySelectorAll(
            "#kanbanBoard .kanban-column"
        );

    columns.forEach(column => {

        column.ondragover = event => {
            event.preventDefault();
        };

        column.ondrop = event => {

            event.preventDefault();

            const taskId =
                event.dataTransfer
                    ?.getData("text/plain");

            const newStatus =
                column.dataset.status;

            if (!taskId || !newStatus) {
                return;
            }

            updateTaskStatus(
                taskId,
                newStatus
            );
        };
    });
}


// =====================================================
// UPDATE USER TASK STATUS
// =====================================================

function updateTaskStatus(
    taskId,
    newStatus
) {

    if (!currentUser) {
        return;
    }

    const task =
        tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );

    if (!task) {
        return;
    }

    const result =
        updateTask(
            currentUser.id,
            taskId,
            {
                ...task,
                status:
                    normalizeStatus(newStatus)
            }
        );

    if (!result) {
        return;
    }

    tasks = loadTasks(
        currentUser.id
    );

    refreshTaskUI();
}


// =====================================================
// TASK DETAIL SUBTASK CLICK
// =====================================================

function handleSubtaskClick(event) {

    const item =
        event.target.closest(
            "[data-subtask-id]"
        );

    if (!item || !selectedTaskId) {
        return;
    }

    if (!event.target.matches(
        'input[type="checkbox"]'
    )) {
        return;
    }

    const task =
        tasks.find(
            currentTask =>
                String(currentTask.id) ===
                String(selectedTaskId)
        );

    if (!task) {
        return;
    }

    const subtasks =
        Array.isArray(task.subtasks)
            ? [...task.subtasks]
            : [];

    const subtask =
        subtasks.find(
            sub =>
                String(sub.id) ===
                String(
                    item.dataset.subtaskId
                )
        );

    if (!subtask) {
        return;
    }

    subtask.completed =
        event.target.checked;

    updateTask(
        currentUser.id,
        selectedTaskId,
        {
            ...task,
            subtasks
        }
    );

    tasks = loadTasks(
        currentUser.id
    );

    renderSubtasks(
        subtaskList,
        subtasks
    );
}


// =====================================================
// EXPORT
// =====================================================

function handleExport() {

    if (!currentUser) {
        return;
    }

    const data =
        getUserDataForExport(
            currentUser.id
        );

    if (!data) {
        return;
    }

    const blob =
        new Blob(
            [JSON.stringify(data, null, 2)],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = url;

    anchor.download =
        `task-manager-${currentUser.name
            .replace(/\s+/g, "-")
            .toLowerCase()}.json`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
}


// =====================================================
// IMPORT
// =====================================================

function handleImport(event) {

    if (!currentUser) {
        return;
    }

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = () => {

        try {

            const importedData =
                JSON.parse(
                    reader.result
                );

            const result =
                importUserData(
                    currentUser.id,
                    importedData
                );

            if (!result) {

                alert(
                    "Unable to import tasks."
                );

                return;
            }

            projects =
                loadProjects(
                    currentUser.id
                );

            tasks =
                loadTasks(
                    currentUser.id
                );

            if (!projects.some(
                project =>
                    String(project.id) ===
                    String(activeProjectId)
            )) {

                activeProjectId =
                    projects[0]?.id || "";
            }

            renderUserInterface();

            alert(
                "Tasks imported successfully."
            );

        } catch (error) {

            console.error(
                "Import error:",
                error
            );

            alert(
                "Invalid JSON file."
            );
        }

        event.target.value = "";
    };

    reader.readAsText(file);
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================

function loadAdminDashboard() {

    if (!currentUser || !isAdmin(currentUser)) {
        return;
    }

    const users =
        loadUsers();

    const regularUsers =
        users.filter(
            user =>
                user.role !== "admin"
        );

    let allTasks = [];

    regularUsers.forEach(user => {

        const userTasks =
            loadTasks(user.id);

        allTasks.push(
            ...userTasks.map(task => ({
                ...task,
                userId:
                    task.userId ||
                    user.id,
                userName:
                    user.name,
                userEmail:
                    user.email
            }))
        );
    });


    // SUMMARY

    renderAdminSummary(
        {
            totalUsers:
                adminTotalUsers,

            totalTasks:
                adminTotalTasks,

            pendingTasks:
                adminPendingTasks,

            completedTasks:
                adminCompletedTasks
        },
        regularUsers,
        allTasks
    );


    // USERS

    renderAdminUsers(
        adminUsersList,
        regularUsers,
        allTasks
    );


    // REPORTS

    renderAdminReports(
        adminReportsList,
        regularUsers,
        allTasks
    );


    // USER SELECT

    renderUserSelect(
        adminUserSelect,
        regularUsers
    );


    // ADMIN BOARD

    const grouped = {
        todo: allTasks.filter(
            task =>
                normalizeStatus(task.status) ===
                "To Do"
        ),

        inProgress: allTasks.filter(
            task =>
                normalizeStatus(task.status) ===
                "In Progress"
        ),

        inReview: allTasks.filter(
            task =>
                normalizeStatus(task.status) ===
                "In Review"
        ),

        done: allTasks.filter(
            task =>
                normalizeStatus(task.status) ===
                "Done"
        )
    };

    renderAdminBoard(
        {
            todo: adminTodoColumn,
            inProgress: adminInProgressColumn,
            inReview: adminInReviewColumn,
            done: adminDoneColumn
        },
        allTasks,
        regularUsers
    );

    updateAdminBoardCounts(
        allTasks
    );

    populateAdminProjects();

    attachAdminDragAndDrop();
}


// =====================================================
// ADMIN PROJECT SELECT
// =====================================================

function populateAdminProjects() {

    if (!adminTaskProject) {
        return;
    }

    const selectedUserId =
        adminUserSelect?.value;

    adminTaskProject.innerHTML = "";

    const noProjectOption =
        document.createElement("option");

    noProjectOption.value = "";

    noProjectOption.textContent =
        "No Project";

    adminTaskProject.appendChild(
        noProjectOption
    );

    if (!selectedUserId) {
        return;
    }

    const userProjects =
        loadProjects(
            selectedUserId
        );

    userProjects.forEach(project => {

        const option =
            document.createElement("option");

        option.value =
            project.id;

        option.textContent =
            project.name;

        adminTaskProject.appendChild(
            option
        );
    });
}


// =====================================================
// ADMIN USER CHANGE
// =====================================================

function handleAdminUserChange() {
    populateAdminProjects();
}


// =====================================================
// ADMIN ASSIGN TASK
// =====================================================

function handleAdminAssignTask(event) {

    event.preventDefault();

    if (!currentUser || !isAdmin(currentUser)) {
        return;
    }

    const userId =
        adminUserSelect?.value;

    const title =
        adminTaskTitle?.value.trim();

    if (!userId) {

        showAdminMessage(
            "Please select a user.",
            true
        );

        return;
    }

    if (!title) {

        showAdminMessage(
            "Please enter a task title.",
            true
        );

        return;
    }

    let projectId =
        adminTaskProject?.value || "";

    if (!projectId) {

        const userProjects =
            loadProjects(userId);

        projectId =
            userProjects[0]?.id || "";
    }

    const task =
        createAssignedTask(
            userId,
            {
                title,
                description:
                    adminTaskDescription?.value.trim() ||
                    "",
                category:
                    adminTaskCategory?.value ||
                    "Work",
                priority:
                    adminTaskPriority?.value ||
                    "Medium",
                dueDate:
                    adminTaskDueDate?.value ||
                    "",
                status: "To Do",
                projectId
            }
        );

    if (!task) {

        showAdminMessage(
            "Unable to assign task.",
            true
        );

        return;
    }

    showAdminMessage(
        "Task assigned successfully.",
        false
    );

    adminAssignTaskForm?.reset();

    populateAdminProjects();

    loadAdminDashboard();
}


// =====================================================
// ADMIN MESSAGE
// =====================================================

function showAdminMessage(
    message,
    isError = false
) {

    if (!adminAssignMessage) {
        return;
    }

    adminAssignMessage.textContent =
        message;

    adminAssignMessage.classList.toggle(
        "error-message",
        isError
    );

    adminAssignMessage.classList.toggle(
        "success-message",
        !isError
    );

    clearTimeout(
        showAdminMessage.timer
    );

    showAdminMessage.timer =
        setTimeout(() => {

            if (adminAssignMessage) {
                adminAssignMessage.textContent =
                    "";
            }

        }, 4000);
}


// =====================================================
// ADMIN BOARD COUNTS
// =====================================================

function updateAdminBoardCounts(
    allTasks
) {

    const statusData = [
        {
            column: adminTodoColumn,
            countElement: adminTodoTasks,
            status: "To Do"
        },
        {
            column: adminInProgressColumn,
            countElement: adminInProgressTasks,
            status: "In Progress"
        },
        {
            column: adminInReviewColumn,
            countElement: adminInReviewTasks,
            status: "In Review"
        },
        {
            column: adminDoneColumn,
            countElement: adminDoneTasks,
            status: "Done"
        }
    ];

    statusData.forEach(item => {

        const count =
            allTasks.filter(
                task =>
                    normalizeStatus(task.status) ===
                    item.status
            ).length;

        if (item.countElement) {
            item.countElement.textContent =
                count;
        }

        if (item.column) {

            const columnCount =
                item.column.querySelector(
                    ".admin-column-count"
                );

            if (columnCount) {
                columnCount.textContent =
                    count;
            }
        }
    });
}


// =====================================================
// ADMIN DRAG & DROP
// =====================================================

function attachAdminDragAndDrop() {

    const columns =
        document.querySelectorAll(
            "#adminDashboard .admin-board-column"
        );

    columns.forEach(column => {

        column.ondragover = event => {
            event.preventDefault();
        };

        column.ondrop = event => {

            event.preventDefault();

            const data =
                event.dataTransfer
                    ?.getData("text/plain");

            if (!data) {
                return;
            }

            let taskId = data;
            let userId = "";

            try {

                const parsed =
                    JSON.parse(data);

                if (parsed) {

                    taskId =
                        parsed.taskId ||
                        taskId;

                    userId =
                        parsed.userId ||
                        "";
                }

            } catch {
                // Plain task ID is also supported.
            }

            const status =
                column.dataset.status;

            if (!taskId || !status) {
                return;
            }

            updateAdminTaskStatus(
                taskId,
                userId,
                status
            );
        };
    });
}


// =====================================================
// UPDATE ADMIN TASK STATUS
// =====================================================

function updateAdminTaskStatus(
    taskId,
    userId,
    newStatus
) {

    const users =
        loadUsers();

    const regularUsers =
        users.filter(
            user =>
                user.role !== "admin"
        );

    let targetUser = null;

    if (userId) {

        targetUser =
            regularUsers.find(
                user =>
                    String(user.id) ===
                    String(userId)
            );
    }

    if (!targetUser) {

        for (const user of regularUsers) {

            const userTasks =
                loadTasks(user.id);

            const found =
                userTasks.find(
                    task =>
                        String(task.id) ===
                        String(taskId)
                );

            if (found) {

                targetUser = user;

                break;
            }
        }
    }

    if (!targetUser) {
        return;
    }

    const userTasks =
        loadTasks(
            targetUser.id
        );

    const task =
        userTasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );

    if (!task) {
        return;
    }

    const updated =
        updateTask(
            targetUser.id,
            taskId,
            {
                ...task,
                status:
                    normalizeStatus(
                        newStatus
                    )
            }
        );

    if (!updated) {
        return;
    }

    loadAdminDashboard();
}


// =====================================================
// ADMIN REPORT REFRESH
// =====================================================

function refreshAdminDashboard() {
    loadAdminDashboard();
}


// =====================================================
// ADMIN OPEN TASK MANAGER
// =====================================================

function openUserTaskManager() {

    if (!currentUser) {
        return;
    }

    if (isAdmin(currentUser)) {
        return;
    }

    show(adminDashboard, false);
    show(userTaskManager, true);

    loadUserDashboard();
}


// =====================================================
// LOGOUT
// =====================================================

function handleLogout() {

    clearCurrentUser();

    currentUser = null;

    tasks = [];
    projects = [];

    activeProjectId = "";

    selectedTaskId = null;

    deletedTaskBackup = null;

    clearTimeout(undoTimer);

    show(undoToast, false);

    if (loginForm) {
        loginForm.reset();
    }

    if (registerForm) {
        registerForm.reset();
    }

    showAuthScreen();
}


// =====================================================
// EVENT BINDING
// =====================================================

function bindAuthEvents() {

    loginForm?.addEventListener(
        "submit",
        handleLogin
    );

    registerForm?.addEventListener(
        "submit",
        handleRegister
    );

    showRegisterBtn?.addEventListener(
        "click",
        showRegisterForm
    );

    showLoginBtn?.addEventListener(
        "click",
        showLoginForm
    );
}


// =====================================================
// APP EVENTS
// =====================================================

function bindAppEvents() {

    logoutBtn?.addEventListener(
        "click",
        handleLogout
    );

    addTaskBtn?.addEventListener(
        "click",
        handleAddTask
    );

    taskInput?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                handleAddTask();
            }
        }
    );

    searchInput?.addEventListener(
        "input",
        handleSearch
    );

    sortSelect?.addEventListener(
        "change",
        handleSort
    );

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            handleCategoryFilter
        );
    });

    listViewBtn?.addEventListener(
        "click",
        () => switchView("list")
    );

    boardViewBtn?.addEventListener(
        "click",
        () => switchView("board")
    );

    projectSwitcher?.addEventListener(
        "click",
        handleProjectSwitch
    );

    newProjectBtn?.addEventListener(
        "click",
        openNewProjectDialog
    );

    createProjectBtn?.addEventListener(
        "click",
        handleCreateProject
    );

    cancelProjectBtn?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    closeNewProjectBtn?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    projectNameInput?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                handleCreateProject();
            }
        }
    );

    taskList?.addEventListener(
        "click",
        handleTaskListClick
    );

    saveNotesBtn?.addEventListener(
        "click",
        handleSaveTaskDetails
    );

    closeTaskDetailBtn?.addEventListener(
        "click",
        closeTaskDetail
    );

    cancelTaskDetailBtn?.addEventListener(
        "click",
        closeTaskDetail
    );

    addSubtaskBtn?.addEventListener(
        "click",
        handleAddSubtask
    );

    subtaskInput?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                handleAddSubtask();
            }
        }
    );

    subtaskList?.addEventListener(
        "change",
        handleSubtaskClick
    );

    exportBtn?.addEventListener(
        "click",
        handleExport
    );

    importFileInput?.addEventListener(
        "change",
        handleImport
    );

    undoBtn?.addEventListener(
        "click",
        handleUndoDelete
    );
}


// =====================================================
// ADMIN EVENTS
// =====================================================

function bindAdminEvents() {

    adminAssignTaskForm?.addEventListener(
        "submit",
        handleAdminAssignTask
    );

    adminUserSelect?.addEventListener(
        "change",
        handleAdminUserChange
    );

    refreshAdminReportsBtn?.addEventListener(
        "click",
        refreshAdminDashboard
    );

    adminOpenTaskManagerBtn?.addEventListener(
        "click",
        openUserTaskManager
    );
}


// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        bindAuthEvents();

        bindAppEvents();

        bindAdminEvents();

        const savedUser =
            getCurrentUser();

        if (savedUser) {

            currentUser =
                savedUser;

            openApplication(
                savedUser
            );

        } else {

            showAuthScreen();
        }
    }
);
