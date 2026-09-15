// ========================================
// APP.JS
// Task Manager V2
// Week 2 + Week 3 + Master Admin
// ========================================

import {
    loadUsers,
    registerUser,
    loginUser,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    isAdmin,
    loadTasks,
    saveTasks,
    createTask,
    deleteTask,
    loadProjects,
    saveProjects,
    createProject,
    ensureDefaultProject,
    deleteProject,
    createAssignedTask,
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


// ========================================
// STATE
// ========================================

let currentUser = null;

let tasks = [];
let projects = [];

let activeProjectId = "";

let currentView = "list";
let currentCategory = "All";
let searchText = "";
let sortValue = "newest";

let selectedTaskId = null;

let deletedTaskBackup = null;
let undoTimer = null;


// ========================================
// DOM HELPERS
// ========================================

const $ = id => document.getElementById(id);

const authScreen = $("authScreen");
const loginSection = $("loginSection");
const registerSection = $("registerSection");

const appScreen = $("appScreen");
const adminDashboard = $("adminDashboard");
const userTaskManager = $("userTaskManager");


// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", init);

function init() {

    attachAuthEvents();
    attachUserEvents();
    attachAdminEvents();
    attachDialogEvents();
    attachKeyboardEvents();

    const session = getCurrentUser();

    if (session) {
        openApplication(session);
    } else {
        showLogin();
    }
}


// ========================================
// AUTH EVENTS
// ========================================

function attachAuthEvents() {

    $("loginForm")?.addEventListener(
        "submit",
        handleLogin
    );

    $("registerForm")?.addEventListener(
        "submit",
        handleRegister
    );

    $("showRegisterBtn")?.addEventListener(
        "click",
        showRegister
    );

    $("showLoginBtn")?.addEventListener(
        "click",
        showLogin
    );

    $("logoutBtn")?.addEventListener(
        "click",
        handleLogout
    );
}


// ========================================
// LOGIN
// ========================================

function handleLogin(event) {

    event.preventDefault();

    const email =
        $("loginEmail").value.trim();

    const password =
        $("loginPassword").value;

    const error =
        $("loginError");

    error.textContent = "";

    if (!email || !password) {

        error.textContent =
            "Please enter email and password.";

        return;
    }

    const user =
        loginUser(email, password);

    if (!user) {

        error.textContent =
            "Invalid email or password.";

        return;
    }

    setCurrentUser(user);

    openApplication(user);
}


// ========================================
// REGISTER
// ========================================

function handleRegister(event) {

    event.preventDefault();

    const name =
        $("registerName").value.trim();

    const email =
        $("registerEmail").value.trim();

    const password =
        $("registerPassword").value;

    const error =
        $("registerError");

    error.textContent = "";

    if (!name || !email || !password) {

        error.textContent =
            "Please fill all fields.";

        return;
    }

    if (password.length < 4) {

        error.textContent =
            "Password must contain at least 4 characters.";

        return;
    }

    const result =
        registerUser(
            name,
            email,
            password
        );

    if (!result.success) {

        error.textContent =
            result.message ||
            "Registration failed.";

        return;
    }

    const user = result.user;

    setCurrentUser(user);

    $("registerForm").reset();

    openApplication(user);
}


// ========================================
// SHOW LOGIN
// ========================================

function showLogin() {

    authScreen.hidden = false;

    loginSection.hidden = false;
    registerSection.hidden = true;

    appScreen.hidden = true;

    $("loginError").textContent = "";
}


// ========================================
// SHOW REGISTER
// ========================================

function showRegister() {

    authScreen.hidden = false;

    loginSection.hidden = true;
    registerSection.hidden = false;

    appScreen.hidden = true;

    $("registerError").textContent = "";
}


// ========================================
// LOGOUT
// ========================================

function handleLogout() {

    clearCurrentUser();

    currentUser = null;

    tasks = [];
    projects = [];

    activeProjectId = "";

    selectedTaskId = null;

    showLogin();

    $("loginForm")?.reset();
}


// ========================================
// OPEN APPLICATION
// ========================================

function openApplication(user) {

    currentUser = user;

    authScreen.hidden = true;
    appScreen.hidden = false;

    $("welcomeMessage").textContent =
        `Welcome, ${user.name}`;

    $("currentUserRole").textContent =
        user.role === "admin"
            ? "Master Admin"
            : "User";

    if (isAdmin(user)) {

        adminDashboard.hidden = false;
        userTaskManager.hidden = true;

        loadAdminDashboard();

    } else {

        adminDashboard.hidden = true;
        userTaskManager.hidden = false;

        loadUserDashboard();
    }
}


// ========================================
// USER DASHBOARD
// ========================================

function loadUserDashboard() {

    projects =
        ensureDefaultProject(
            currentUser.id
        );

    tasks =
        loadTasks(currentUser.id);

    if (!projects.length) {

        projects =
            ensureDefaultProject(
                currentUser.id
            );
    }

    if (!activeProjectId ||
        !projects.some(
            project =>
                project.id === activeProjectId
        )
    ) {

        activeProjectId =
            projects[0]?.id || "";
    }

    renderUserDashboard();
}


// ========================================
// RENDER USER DASHBOARD
// ========================================

function renderUserDashboard() {

    renderProjects(
        $("projectSwitcher"),
        projects,
        activeProjectId
    );

    const activeProject =
        projects.find(
            project =>
                project.id === activeProjectId
        );

    $("activeProjectName").textContent =
        activeProject?.name ||
        "My Tasks";

    const projectTasks =
        getActiveProjectTasks();

    const filteredTasks =
        getFilteredTasks(projectTasks);

    renderProgress(
        $("progressText"),
        $("progressFill"),
        $("progressPercentage"),
        projectTasks
    );

    renderTasks(
        $("taskList"),
        filteredTasks
    );

    renderEmptyState(
        $("emptyState"),
        filteredTasks.length > 0
    );

    renderBoard(
        filteredTasks,
        {
            todo: $("todoColumn"),
            inProgress: $("inProgressColumn"),
            inReview: $("inReviewColumn"),
            done: $("doneColumn"),

            todoCount: $("todoCount"),
            inProgressCount: $("inProgressCount"),
            inReviewCount: $("inReviewCount"),
            doneCount: $("doneCount")
        }
    );

    updateViewButtons();
    updateViewVisibility();
}


// ========================================
// ACTIVE PROJECT TASKS
// ========================================

function getActiveProjectTasks() {

    if (!activeProjectId) {
        return tasks;
    }

    const projectTasks =
        tasks.filter(
            task =>
                task.projectId ===
                activeProjectId
        );

    /*
       Tasks created by Admin without
       a project are shown in the
       default project.
    */

    if (
        projects.length &&
        activeProjectId === projects[0].id
    ) {

        return tasks.filter(
            task =>
                task.projectId ===
                    activeProjectId ||
                !task.projectId
        );
    }

    return projectTasks;
}


// ========================================
// FILTER + SEARCH + SORT
// ========================================

function getFilteredTasks(sourceTasks) {

    let result = [...sourceTasks];

    // Category
    if (currentCategory !== "All") {

        result =
            result.filter(
                task =>
                    task.category ===
                    currentCategory
            );
    }

    // Search
    if (searchText) {

        const query =
            searchText.toLowerCase();

        result =
            result.filter(task => {

                const title =
                    String(
                        task.title || ""
                    ).toLowerCase();

                const description =
                    String(
                        task.description || ""
                    ).toLowerCase();

                const category =
                    String(
                        task.category || ""
                    ).toLowerCase();

                return (
                    title.includes(query) ||
                    description.includes(query) ||
                    category.includes(query)
                );
            });
    }

    // Sort
    result.sort(
        (a, b) => {

            if (sortValue === "newest") {

                return (
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
                );
            }

            if (sortValue === "oldest") {

                return (
                    new Date(
                        a.createdAt || 0
                    ) -
                    new Date(
                        b.createdAt || 0
                    )
                );
            }

            if (sortValue === "title") {

                return String(
                    a.title || ""
                ).localeCompare(
                    String(
                        b.title || ""
                    )
                );
            }

            if (sortValue === "priority") {

                const priorityOrder = {
                    High: 1,
                    Medium: 2,
                    Low: 3
                };

                return (
                    (priorityOrder[a.priority] || 2) -
                    (priorityOrder[b.priority] || 2)
                );
            }

            return 0;
        }
    );

    return result;
}


// ========================================
// USER EVENTS
// ========================================

function attachUserEvents() {

    $("addTaskBtn")?.addEventListener(
        "click",
        handleAddTask
    );

    $("searchInput")?.addEventListener(
        "input",
        event => {

            searchText =
                event.target.value.trim();

            renderUserDashboard();
        }
    );

    $("sortSelect")?.addEventListener(
        "change",
        event => {

            sortValue =
                event.target.value;

            renderUserDashboard();
        }
    );

    document
        .querySelectorAll("[data-category]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentCategory =
                        button.dataset.category ||
                        "All";

                    document
                        .querySelectorAll(
                            "[data-category]"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    renderUserDashboard();
                }
            );
        });

    $("listViewBtn")?.addEventListener(
        "click",
        () => {

            currentView = "list";

            updateViewButtons();
            updateViewVisibility();
        }
    );

    $("boardViewBtn")?.addEventListener(
        "click",
        () => {

            currentView = "board";

            updateViewButtons();
            updateViewVisibility();
        }
    );

    $("projectSwitcher")?.addEventListener(
        "click",
        handleProjectClick
    );

    $("exportBtn")?.addEventListener(
        "click",
        handleExport
    );

    $("importFileInput")?.addEventListener(
        "change",
        handleImport
    );

    $("createProjectBtn")?.addEventListener(
        "click",
        handleCreateProject
    );

    $("cancelProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    $("closeNewProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    $("taskList")?.addEventListener(
        "click",
        handleTaskListClick
    );

    $("kanbanBoard")?.addEventListener(
        "click",
        handleTaskBoardClick
    );

    attachDragAndDrop();
}


// ========================================
// ADD TASK
// ========================================

function handleAddTask() {

    const input =
        $("taskInput");

    const title =
        input.value.trim();

    if (!title) {

        input.focus();

        return;
    }

    const category =
        $("categorySelect").value ||
        "Personal";

    const status =
        $("statusSelect").value ||
        "To Do";

    const task =
        createTask(
            currentUser.id,
            {
                title,
                description: "",
                category,
                status,
                priority: "Medium",
                dueDate: "",
                projectId: activeProjectId
            }
        );

    tasks.push(task);

    saveTasks(
        currentUser.id,
        tasks
    );

    input.value = "";

    input.focus();

    renderUserDashboard();
}


// ========================================
// PROJECT CLICK
// ========================================

function handleProjectClick(event) {

    const item =
        event.target.closest(
            "[data-project-id]"
        );

    if (!item) return;

    activeProjectId =
        item.dataset.projectId;

    currentCategory = "All";
    searchText = "";

    if ($("searchInput")) {
        $("searchInput").value = "";
    }

    renderUserDashboard();
}


// ========================================
// TASK LIST CLICK
// ========================================

function handleTaskListClick(event) {

    const deleteButton =
        event.target.closest(
            "[data-delete-task]"
        );

    if (deleteButton) {

        deleteUserTask(
            deleteButton.dataset.deleteTask
        );

        return;
    }

    const openButton =
        event.target.closest(
            "[data-open-task]"
        );

    if (openButton) {

        openTaskDetail(
            openButton.dataset.openTask
        );
    }
}


// ========================================
// KANBAN CLICK
// ========================================

function handleTaskBoardClick(event) {

    const deleteButton =
        event.target.closest(
            "[data-delete-task]"
        );

    if (deleteButton) {

        deleteUserTask(
            deleteButton.dataset.deleteTask
        );

        return;
    }

    const openButton =
        event.target.closest(
            "[data-open-task]"
        );

    if (openButton) {

        openTaskDetail(
            openButton.dataset.openTask
        );
    }
}


// ========================================
// DELETE TASK
// ========================================

function deleteUserTask(taskId) {

    const index =
        tasks.findIndex(
            task =>
                task.id === taskId
        );

    if (index === -1) return;

    deletedTaskBackup = {
        task: {
            ...tasks[index]
        },
        index
    };

    tasks.splice(index, 1);

    saveTasks(
        currentUser.id,
        tasks
    );

    showUndoToast();

    renderUserDashboard();
}


// ========================================
// UNDO
// ========================================

function showUndoToast() {

    const toast =
        $("undoToast");

    const message =
        $("undoMessage");

    if (!toast) return;

    if (message) {
        message.textContent =
            "Task deleted — Undo";
    }

    toast.hidden = false;

    clearTimeout(undoTimer);

    undoTimer =
        setTimeout(
            () => {

                toast.hidden = true;

                deletedTaskBackup = null;

            },
            5000
        );
}


// ========================================
// UNDO BUTTON
// ========================================

function attachUndoEvent() {

    $("undoBtn")?.addEventListener(
        "click",
        () => {

            if (!deletedTaskBackup) {
                return;
            }

            const {
                task,
                index
            } = deletedTaskBackup;

            tasks.splice(
                Math.min(index, tasks.length),
                0,
                task
            );

            saveTasks(
                currentUser.id,
                tasks
            );

            deletedTaskBackup = null;

            clearTimeout(undoTimer);

            $("undoToast").hidden = true;

            renderUserDashboard();
        }
    );
}


// ========================================
// VIEW SWITCH
// ========================================

function updateViewButtons() {

    $("listViewBtn")
        ?.classList.toggle(
            "active",
            currentView === "list"
        );

    $("boardViewBtn")
        ?.classList.toggle(
            "active",
            currentView === "board"
        );
}

function updateViewVisibility() {

    const list =
        $("taskList");

    const empty =
        $("emptyState");

    const board =
        $("kanbanBoard");

    if (currentView === "list") {

        if (list) list.hidden = false;
        if (empty) empty.hidden = false;
        if (board) board.hidden = true;

    } else {

        if (list) list.hidden = true;
        if (empty) empty.hidden = true;
        if (board) board.hidden = false;
    }
}


// ========================================
// DRAG AND DROP
// ========================================

function attachDragAndDrop() {

    document.addEventListener(
        "dragstart",
        event => {

            const card =
                event.target.closest(
                    ".task-card"
                );

            if (!card) return;

            card.classList.add(
                "dragging"
            );

            event.dataTransfer.setData(
                "text/plain",
                card.dataset.taskId
            );
        }
    );

    document.addEventListener(
        "dragend",
        event => {

            const card =
                event.target.closest(
                    ".task-card"
                );

            if (!card) return;

            card.classList.remove(
                "dragging"
            );
        }
    );

    document.addEventListener(
        "dragover",
        event => {

            const column =
                event.target.closest(
                    ".kanban-column"
                );

            if (!column) return;

            event.preventDefault();
        }
    );

    document.addEventListener(
        "drop",
        event => {

            const column =
                event.target.closest(
                    ".kanban-column"
                );

            if (!column) return;

            event.preventDefault();

            const taskId =
                event.dataTransfer.getData(
                    "text/plain"
                );

            if (!taskId) return;

            const newStatus =
                getStatusFromColumn(
                    column
                );

            if (!newStatus) return;

            updateTaskStatus(
                taskId,
                newStatus
            );
        }
    );
}


// ========================================
// STATUS FROM COLUMN
// ========================================

function getStatusFromColumn(column) {

    if (
        column.id === "todoColumn" ||
        column.id === "adminTodoColumn"
    ) {
        return "To Do";
    }

    if (
        column.id === "inProgressColumn" ||
        column.id === "adminInProgressColumn"
    ) {
        return "In Progress";
    }

    if (
        column.id === "inReviewColumn" ||
        column.id === "adminInReviewColumn"
    ) {
        return "In Review";
    }

    if (
        column.id === "doneColumn" ||
        column.id === "adminDoneColumn"
    ) {
        return "Done";
    }

    return null;
}


// ========================================
// UPDATE USER TASK STATUS
// ========================================

function updateTaskStatus(
    taskId,
    newStatus
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) return;

    task.status = newStatus;

    task.completed =
        newStatus === "Done";

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    renderUserDashboard();
}


// ========================================
// TASK DETAIL DIALOG
// ========================================

function attachDialogEvents() {

    attachUndoEvent();

    $("closeTaskDetailBtn")
        ?.addEventListener(
            "click",
            closeTaskDetail
        );

    $("closeTaskDetailBtnBottom")
        ?.addEventListener(
            "click",
            closeTaskDetail
        );

    $("saveNotesBtn")
        ?.addEventListener(
            "click",
            saveTaskDetails
        );

    $("addSubtaskBtn")
        ?.addEventListener(
            "click",
            addSubtask
        );

    $("subtaskList")
        ?.addEventListener(
            "click",
            handleSubtaskClick
        );

    $("subtaskList")
        ?.addEventListener(
            "change",
            handleSubtaskChange
        );
}


// ========================================
// OPEN TASK DETAIL
// ========================================

function openTaskDetail(taskId) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) return;

    selectedTaskId = taskId;

    renderTaskDetail(
        task,
        {
            title: $("detailTaskTitle"),
            description: $("detailDescription"),
            status: $("detailStatus"),
            priority: $("detailPriority"),
            dueDate: $("detailDueDate"),
            category: $("detailCategory"),
            notes: $("taskNotes")
        }
    );

    renderSubtasks(
        $("subtaskList"),
        task.subtasks || []
    );

    const dialog =
        $("taskDetailDialog");

    if (dialog) {

        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.hidden = false;
        }
    }
}


// ========================================
// CLOSE TASK DETAIL
// ========================================

function closeTaskDetail() {

    const dialog =
        $("taskDetailDialog");

    if (!dialog) return;

    if (
        typeof dialog.close === "function"
    ) {
        dialog.close();
    } else {
        dialog.hidden = true;
    }

    selectedTaskId = null;
}


// ========================================
// SAVE TASK DETAILS
// ========================================

function saveTaskDetails() {

    if (!selectedTaskId) return;

    const task =
        tasks.find(
            item =>
                item.id ===
                selectedTaskId
        );

    if (!task) return;

    task.title =
        $("detailTaskTitle").value.trim() ||
        task.title;

    task.description =
        $("detailDescription").value.trim();

    task.notes =
        $("taskNotes").value;

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    renderUserDashboard();

    closeTaskDetail();
}


// ========================================
// ADD SUBTASK
// ========================================

function addSubtask() {

    if (!selectedTaskId) return;

    const input =
        $("subtaskInput");

    const title =
        input.value.trim();

    if (!title) return;

    const task =
        tasks.find(
            item =>
                item.id ===
                selectedTaskId
        );

    if (!task) return;

    if (!Array.isArray(task.subtasks)) {
        task.subtasks = [];
    }

    task.subtasks.push({
        id: createId(),
        title,
        completed: false
    });

    saveTasks(
        currentUser.id,
        tasks
    );

    input.value = "";

    renderSubtasks(
        $("subtaskList"),
        task.subtasks
    );
}


// ========================================
// SUBTASK CLICK
// ========================================

function handleSubtaskClick(event) {

    const button =
        event.target.closest(
            "[data-delete-subtask]"
        );

    if (!button) return;

    if (!selectedTaskId) return;

    const task =
        tasks.find(
            item =>
                item.id ===
                selectedTaskId
        );

    if (!task) return;

    task.subtasks =
        (task.subtasks || [])
            .filter(
                subtask =>
                    subtask.id !==
                    button.dataset.deleteSubtask
            );

    saveTasks(
        currentUser.id,
        tasks
    );

    renderSubtasks(
        $("subtaskList"),
        task.subtasks
    );
}


// ========================================
// SUBTASK CHANGE
// ========================================

function handleSubtaskChange(event) {

    const checkbox =
        event.target.closest(
            "[data-subtask-id]"
        );

    if (!checkbox) return;

    if (!selectedTaskId) return;

    const task =
        tasks.find(
            item =>
                item.id ===
                selectedTaskId
        );

    if (!task) return;

    const subtask =
        (task.subtasks || [])
            .find(
                item =>
                    item.id ===
                    checkbox.dataset.subtaskId
            );

    if (!subtask) return;

    subtask.completed =
        checkbox.checked;

    saveTasks(
        currentUser.id,
        tasks
    );

    renderSubtasks(
        $("subtaskList"),
        task.subtasks
    );
}


// ========================================
// NEW PROJECT
// ========================================

function openNewProjectDialog() {

    const dialog =
        $("newProjectDialog");

    if (!dialog) return;

    $("projectNameInput").value = "";
    $("projectError").textContent = "";

    if (
        typeof dialog.showModal === "function"
    ) {
        dialog.showModal();
    } else {
        dialog.hidden = false;
    }
}

function closeNewProjectDialog() {

    const dialog =
        $("newProjectDialog");

    if (!dialog) return;

    if (
        typeof dialog.close === "function"
    ) {
        dialog.close();
    } else {
        dialog.hidden = true;
    }
}


// ========================================
// CREATE PROJECT
// ========================================

function handleCreateProject() {

    const input =
        $("projectNameInput");

    const error =
        $("projectError");

    const name =
        input.value.trim();

    error.textContent = "";

    if (!name) {

        error.textContent =
            "Please enter project name.";

        return;
    }

    const duplicate =
        projects.some(
            project =>
                project.name.toLowerCase() ===
                name.toLowerCase()
        );

    if (duplicate) {

        error.textContent =
            "Project already exists.";

        return;
    }

    const project =
        createProject(
            currentUser.id,
            name
        );

    projects.push(project);

    saveProjects(
        currentUser.id,
        projects
    );

    activeProjectId =
        project.id;

    closeNewProjectDialog();

    renderUserDashboard();
}


// ========================================
// NEW PROJECT BUTTON
// ========================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                "#newProjectBtn"
            )
        ) {
            openNewProjectDialog();
        }
    }
);


// ========================================
// EXPORT
// ========================================

function handleExport() {

    const data =
        getUserDataForExport(
            currentUser.id
        );

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "tasks.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


// ========================================
// IMPORT
// ========================================

async function handleImport(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;

    try {

        const text =
            await file.text();

        const data =
            JSON.parse(text);

        const result =
            importUserData(
                currentUser.id,
                data
            );

        if (!result.success) {

            alert(
                result.message ||
                "Import failed."
            );

            return;
        }

        tasks =
            loadTasks(
                currentUser.id
            );

        projects =
            ensureDefaultProject(
                currentUser.id
            );

        if (
            !projects.some(
                project =>
                    project.id ===
                    activeProjectId
            )
        ) {
            activeProjectId =
                projects[0]?.id || "";
        }

        renderUserDashboard();

        alert(
            "Tasks imported successfully."
        );

    } catch (error) {

        alert(
            "Invalid JSON file."
        );

    } finally {

        event.target.value = "";
    }
}


// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function attachKeyboardEvents() {

    document.addEventListener(
        "keydown",
        event => {

            const active =
                document.activeElement;

            const isTyping =
                active &&
                (
                    active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.tagName === "SELECT"
                );

            // N = focus task input
            if (
                event.key.toLowerCase() === "n" &&
                !isTyping &&
                !appScreen.hidden &&
                !userTaskManager.hidden
            ) {

                event.preventDefault();

                $("taskInput")?.focus();

                return;
            }

            // Escape = clear search
            if (
                event.key === "Escape" &&
                !isTyping
            ) {

                if (
                    searchText &&
                    $("searchInput")
                ) {

                    searchText = "";

                    $("searchInput").value = "";

                    renderUserDashboard();
                }
            }
        }
    );
}


// ========================================
// ADMIN EVENTS
// ========================================

function attachAdminEvents() {

    $("adminAssignTaskForm")
        ?.addEventListener(
            "submit",
            handleAdminAssignTask
        );

    $("refreshAdminReportsBtn")
        ?.addEventListener(
            "click",
            loadAdminDashboard
        );

    $("adminOpenTaskManagerBtn")
        ?.addEventListener(
            "click",
            () => {

                $("adminDashboard")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });
            }
        );

    $("adminUserSelect")
        ?.addEventListener(
            "change",
            () => {

                $("adminAssignMessage")
                    .textContent = "";
            }
        );

    attachAdminDragAndDrop();
}


// ========================================
// ADMIN DASHBOARD
// ========================================

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

    const allTasks = [];

    const userStats = [];

    regularUsers.forEach(user => {

        const userTasks =
            loadTasks(user.id);

        allTasks.push(
            ...userTasks.map(task => ({
                ...task,
                assignedTo: user.id,
                assignedToName: user.name
            }))
        );

        const total =
            userTasks.length;

        const completed =
            userTasks.filter(
                task =>
                    task.status === "Done" ||
                    task.completed === true
            ).length;

        const pending =
            total - completed;

        const progress =
            total
                ? Math.round(
                    (completed / total) * 100
                )
                : 0;

        userStats.push({
            user,
            total,
            completed,
            pending,
            progress
        });
    });

    renderAdminSummary(
        {
            totalUsers:
                $("adminTotalUsers"),

            totalTasks:
                $("adminTotalTasks"),

            pendingTasks:
                $("adminPendingTasks"),

            completedTasks:
                $("adminCompletedTasks")
        },
        regularUsers,
        allTasks
    );

    renderAdminUsers(
        $("adminUsersList"),
        userStats
    );

    renderAdminReports(
        $("adminReportsList"),
        userStats
    );

    renderUserSelect(
        $("adminUserSelect"),
        regularUsers
    );

    renderAdminBoard(
        allTasks,
        regularUsers,
        {
            todo:
                $("adminTodoColumn"),

            inProgress:
                $("adminInProgressColumn"),

            inReview:
                $("adminInReviewColumn"),

            done:
                $("adminDoneColumn"),

            todoCount:
                $("adminTodoTasks"),

            inProgressCount:
                $("adminInProgressTasks"),

            inReviewCount:
                $("adminInReviewTasks"),

            doneCount:
                $("adminDoneTasks")
        }
    );
}


// ========================================
// ADMIN ASSIGN TASK
// ========================================

function handleAdminAssignTask(event) {

    event.preventDefault();

    const userId =
        $("adminUserSelect").value;

    const title =
        $("adminTaskTitle")
            .value
            .trim();

    const description =
        $("adminTaskDescription")
            .value
            .trim();

    const category =
        $("adminTaskCategory").value ||
        "Personal";

    const priority =
        $("adminTaskPriority").value ||
        "Medium";

    const dueDate =
        $("adminTaskDueDate").value ||
        "";

    const projectId =
        $("adminTaskProject").value ||
        "";

    const message =
        $("adminAssignMessage");

    message.textContent = "";

    if (!userId) {

        message.textContent =
            "Please select a user.";

        return;
    }

    if (!title) {

        message.textContent =
            "Please enter task title.";

        return;
    }

    const task =
        createAssignedTask(
            userId,
            {
                title,
                description,
                category,
                priority,
                dueDate,
                projectId,
                status: "To Do"
            },
            currentUser.id
        );

    if (!task) {

        message.textContent =
            "Task could not be assigned.";

        return;
    }

    message.textContent =
        "Task assigned successfully.";

    $("adminTaskTitle").value = "";
    $("adminTaskDescription").value = "";
    $("adminTaskDueDate").value = "";

    loadAdminDashboard();
}


// ========================================
// ADMIN DRAG AND DROP
// ========================================

function attachAdminDragAndDrop() {

    document.addEventListener(
        "dragover",
        event => {

            const column =
                event.target.closest(
                    ".admin-board-column"
                );

            if (!column) return;

            event.preventDefault();
        }
    );

    document.addEventListener(
        "drop",
        event => {

            const column =
                event.target.closest(
                    ".admin-board-column"
                );

            if (!column) return;

            event.preventDefault();

            const taskId =
                event.dataTransfer.getData(
                    "text/plain"
                );

            if (!taskId) return;

            const newStatus =
                getStatusFromColumn(
                    column
                );

            if (!newStatus) return;

            updateAdminTaskStatus(
                taskId,
                newStatus
            );
        }
    );
}


// ========================================
// UPDATE ADMIN TASK STATUS
// ========================================

function updateAdminTaskStatus(
    taskId,
    newStatus
) {

    const users =
        loadUsers();

    for (const user of users) {

        if (user.role === "admin") {
            continue;
        }

        const userTasks =
            loadTasks(user.id);

        const task =
            userTasks.find(
                item =>
                    item.id === taskId
            );

        if (!task) continue;

        task.status =
            newStatus;

        task.completed =
            newStatus === "Done";

        task.updatedAt =
            new Date().toISOString();

        saveTasks(
            user.id,
            userTasks
        );

        break;
    }

    loadAdminDashboard();
}


// ========================================
// CREATE ID
// ========================================

function createId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}
