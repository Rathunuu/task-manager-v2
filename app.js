/* =========================================================
   TASK MANAGER V2
   APP.JS

   Main application logic:
   - Login / Register
   - Master Admin
   - User dashboard
   - Tasks
   - Projects
   - Kanban
   - Search / Filter / Sort
   - Task details
   - Subtasks
   - Import / Export
   - Undo delete
   - Admin assignment
   - Admin reports
========================================================= */

import {
    loadUsers,
    registerUser,
    loginUser,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    isAdmin,
    getAllRegularUsers,
    loadTasks,
    saveTasks,
    createTask,
    createAssignedTask,
    loadProjects,
    saveProjects,
    createProject,
    ensureDefaultProject,
    getUserDataForExport,
    importUserData
} from "./storage.js";

import {
    renderTasks,
    renderProjects,
    renderProgress,
    renderBoard,
    renderTaskDetail,
    renderSubtasks,
    renderAdminUsers,
    renderAdminReports,
    renderAdminSummary
} from "./render.js";


/* =========================================================
   APP STATE
========================================================= */

let currentUser = null;

let tasks = [];

let projects = [];

let activeProjectId = null;

let currentView = "list";

let currentCategory = "All";

let searchText = "";

let sortValue = "newest";

let selectedTaskId = null;

let deletedTaskBackup = null;

let undoTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    [...document.querySelectorAll(selector)];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const authScreen = $("#authScreen");
const loginSection = $("#loginSection");
const registerSection = $("#registerSection");

const loginForm = $("#loginForm");
const registerForm = $("#registerForm");

const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");

const registerName = $("#registerName");
const registerEmail = $("#registerEmail");
const registerPassword = $("#registerPassword");

const loginError = $("#loginError");
const registerError = $("#registerError");

const showRegisterBtn = $("#showRegisterBtn");
const showLoginBtn = $("#showLoginBtn");

const appScreen = $("#appScreen");

const welcomeMessage = $("#welcomeMessage");
const currentUserRole = $("#currentUserRole");
const logoutBtn = $("#logoutBtn");

const adminDashboard = $("#adminDashboard");
const userTaskManager = $("#userTaskManager");


/* =========================================================
   SHOW / HIDE
========================================================= */

function show(element) {

    if (element) {
        element.hidden = false;
    }
}


function hide(element) {

    if (element) {
        element.hidden = true;
    }
}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLogin() {

    show(loginSection);
    hide(registerSection);

    if (loginError) {
        loginError.textContent = "";
    }

    if (registerError) {
        registerError.textContent = "";
    }
}


function showRegister() {

    hide(loginSection);
    show(registerSection);

    if (loginError) {
        loginError.textContent = "";
    }

    if (registerError) {
        registerError.textContent = "";
    }
}


/* =========================================================
   LOGIN
========================================================= */

function handleLogin(event) {

    event.preventDefault();

    const email = loginEmail?.value.trim() || "";
    const password = loginPassword?.value || "";

    if (!email || !password) {

        if (loginError) {
            loginError.textContent =
                "Please enter email and password.";
        }

        return;
    }

    const result = loginUser(
        email,
        password
    );

    if (!result.success) {

        if (loginError) {
            loginError.textContent =
                result.message;
        }

        return;
    }

    currentUser = result.user;

    setCurrentUser({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        createdAt: currentUser.createdAt
    });

    if (loginForm) {
        loginForm.reset();
    }

    openApplication();
}


/* =========================================================
   REGISTER
========================================================= */

function handleRegister(event) {

    event.preventDefault();

    const name = registerName?.value.trim() || "";
    const email = registerEmail?.value.trim() || "";
    const password = registerPassword?.value || "";

    if (!name || !email || !password) {

        if (registerError) {
            registerError.textContent =
                "Please fill all fields.";
        }

        return;
    }

    if (password.length < 4) {

        if (registerError) {
            registerError.textContent =
                "Password must be at least 4 characters.";
        }

        return;
    }

    const result = registerUser(
        name,
        email,
        password
    );

    if (!result.success) {

        if (registerError) {
            registerError.textContent =
                result.message;
        }

        return;
    }

    currentUser = result.user;

    setCurrentUser({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        createdAt: currentUser.createdAt
    });

    if (registerForm) {
        registerForm.reset();
    }

    openApplication();
}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

    clearCurrentUser();

    currentUser = null;

    tasks = [];
    projects = [];
    activeProjectId = null;
    selectedTaskId = null;

    hide(appScreen);
    show(authScreen);

    showLogin();
}


/* =========================================================
   OPEN APPLICATION
========================================================= */

function openApplication() {

    hide(authScreen);
    show(appScreen);

    if (welcomeMessage) {

        welcomeMessage.textContent =
            `Welcome, ${currentUser.name}`;
    }

    if (currentUserRole) {

        currentUserRole.textContent =
            isAdmin(currentUser)
                ? "Master Admin"
                : "User";
    }

    if (isAdmin(currentUser)) {

        show(adminDashboard);
        hide(userTaskManager);

        loadAdminDashboard();

    } else {

        hide(adminDashboard);
        show(userTaskManager);

        loadUserDashboard();
    }
}


/* =========================================================
   USER DASHBOARD
========================================================= */

function loadUserDashboard() {

    tasks = loadTasks(currentUser.id);

    projects = loadProjects(currentUser.id);

    const defaultProject =
        ensureDefaultProject(currentUser.id);

    if (projects.length === 0 && defaultProject) {
        projects = loadProjects(currentUser.id);
    }

    if (!activeProjectId) {

        activeProjectId =
            projects[0]?.id || null;
    }

    if (
        activeProjectId &&
        !projects.some(
            project =>
                project.id === activeProjectId
        )
    ) {

        activeProjectId =
            projects[0]?.id || null;
    }

    renderUserInterface();
}


/* =========================================================
   USER INTERFACE
========================================================= */

function renderUserInterface() {

    const projectSwitcher =
        $("#projectSwitcher");

    const activeProjectName =
        $("#activeProjectName");

    const progressText =
        $("#progressText");

    const progressFill =
        $("#progressFill");

    renderProjects(
        projectSwitcher,
        projects,
        activeProjectId
    );

    const activeProject =
        projects.find(
            project =>
                project.id === activeProjectId
        );

    if (activeProjectName) {

        activeProjectName.textContent =
            activeProject
                ? activeProject.name
                : "My Tasks";
    }

    renderFilteredTasks();

    renderProgress(
        progressText,
        progressFill,
        getProjectTasks()
    );
}


/* =========================================================
   PROJECT TASKS
========================================================= */

function getProjectTasks() {

    if (!activeProjectId) {
        return tasks;
    }

    return tasks.filter(
        task =>
            !task.projectId ||
            task.projectId === activeProjectId
    );
}


/* =========================================================
   FILTER TASKS
========================================================= */

function getFilteredTasks() {

    let result = getProjectTasks();

    /* Category */

    if (currentCategory !== "All") {

        result = result.filter(
            task =>
                task.category === currentCategory
        );
    }


    /* Search */

    if (searchText) {

        const query =
            searchText.toLowerCase();

        result = result.filter(task => {

            const title =
                String(task.text || "")
                    .toLowerCase();

            const description =
                String(task.description || "")
                    .toLowerCase();

            const category =
                String(task.category || "")
                    .toLowerCase();

            return (
                title.includes(query) ||
                description.includes(query) ||
                category.includes(query)
            );
        });
    }


    /* Sort */

    result = [...result];

    if (sortValue === "newest") {

        result.sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        );

    } else if (sortValue === "oldest") {

        result.sort(
            (a, b) =>
                new Date(a.createdAt || 0) -
                new Date(b.createdAt || 0)
        );

    } else if (sortValue === "a-z") {

        result.sort(
            (a, b) =>
                String(a.text)
                    .localeCompare(String(b.text))
        );

    } else if (sortValue === "z-a") {

        result.sort(
            (a, b) =>
                String(b.text)
                    .localeCompare(String(a.text))
        );

    } else if (sortValue === "priority") {

        const priorityOrder = {
            Urgent: 1,
            High: 2,
            Normal: 3,
            Low: 4
        };

        result.sort(
            (a, b) =>
                (priorityOrder[a.priority] || 5) -
                (priorityOrder[b.priority] || 5)
        );
    }

    return result;
}


/* =========================================================
   RENDER LIST + BOARD
========================================================= */

function renderFilteredTasks() {

    const taskList =
        $("#taskList");

    const emptyState =
        $("#emptyState");

    const filtered =
        getFilteredTasks();

    renderTasks(
        taskList,
        filtered,
        emptyState
    );


    renderBoard(
        {
            todoColumn: $("#todoColumn"),
            inProgressColumn: $("#inProgressColumn"),
            inReviewColumn: $("#inReviewColumn"),
            doneColumn: $("#doneColumn"),

            todoCount: $("#todoCount"),
            inProgressCount: $("#inProgressCount"),
            inReviewCount: $("#inReviewCount"),
            doneCount: $("#doneCount")
        },
        filtered
    );


    if (currentView === "list") {

        show($("#taskList"));
        hide($("#kanbanBoard"));

    } else {

        hide($("#taskList"));
        show($("#kanbanBoard"));
    }
}


/* =========================================================
   ADD TASK
========================================================= */

function handleAddTask() {

    const taskInput =
        $("#taskInput");

    const categorySelect =
        $("#categorySelect");

    const statusSelect =
        $("#statusSelect");

    const text =
        taskInput?.value.trim() || "";

    if (!text) {

        taskInput?.focus();

        return;
    }

    const category =
        categorySelect?.value || "Work";

    const status =
        statusSelect?.value || "To Do";


    const task =
        createTask(
            currentUser.id,
            {
                text,
                category,
                status,
                priority: "Normal",
                projectId: activeProjectId
            }
        );

    if (!task) {
        return;
    }

    tasks = loadTasks(currentUser.id);

    if (taskInput) {
        taskInput.value = "";
    }

    renderUserInterface();

    taskInput?.focus();
}


/* =========================================================
   PROJECT SELECTION
========================================================= */

function handleProjectClick(event) {

    const button =
        event.target.closest(
            "[data-project-id]"
        );

    if (!button) {
        return;
    }

    activeProjectId =
        button.dataset.projectId;

    renderUserInterface();
}


/* =========================================================
   NEW PROJECT DIALOG
========================================================= */

function openNewProjectDialog() {

    const dialog =
        $("#newProjectDialog");

    const input =
        $("#projectNameInput");

    const error =
        $("#projectError");

    if (error) {
        error.textContent = "";
    }

    if (input) {
        input.value = "";
    }

    if (dialog) {
        dialog.showModal();
    }

    setTimeout(() => {
        input?.focus();
    }, 50);
}


function closeNewProjectDialog() {

    const dialog =
        $("#newProjectDialog");

    if (dialog?.open) {
        dialog.close();
    }
}


function handleCreateProject() {

    const input =
        $("#projectNameInput");

    const error =
        $("#projectError");

    const name =
        input?.value.trim() || "";

    if (!name) {

        if (error) {
            error.textContent =
                "Please enter a project name.";
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

    projects =
        loadProjects(currentUser.id);

    activeProjectId =
        project.id;

    closeNewProjectDialog();

    renderUserInterface();
}


/* =========================================================
   TASK OPEN
========================================================= */

function openTaskDetail(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    selectedTaskId = taskId;

    renderTaskDetail(
        task,
        {
            title: $("#detailTaskTitle"),
            description: $("#detailDescription"),
            status: $("#detailStatus"),
            priority: $("#detailPriority"),
            dueDate: $("#detailDueDate"),
            category: $("#detailCategory"),
            notes: $("#taskNotes")
        }
    );

    renderSubtasks(
        $("#subtaskList"),
        task.subtasks
    );

    const dialog =
        $("#taskDetailDialog");

    if (dialog) {
        dialog.showModal();
    }
}


/* =========================================================
   CLOSE TASK DETAIL
========================================================= */

function closeTaskDetail() {

    const dialog =
        $("#taskDetailDialog");

    if (dialog?.open) {
        dialog.close();
    }

    selectedTaskId = null;
}


/* =========================================================
   SAVE TASK DETAIL
========================================================= */

function saveTaskDetail() {

    if (!selectedTaskId) {
        return;
    }

    const task =
        tasks.find(
            item =>
                item.id === selectedTaskId
        );

    if (!task) {
        return;
    }

    const title =
        $("#detailTaskTitle");

    const description =
        $("#detailDescription");

    const notes =
        $("#taskNotes");


    const newTitle =
        title?.value.trim() || "";

    if (newTitle) {
        task.text = newTitle;
    }

    task.description =
        description?.value || "";

    task.notes =
        notes?.value || "";

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    tasks =
        loadTasks(currentUser.id);

    renderUserInterface();

    closeTaskDetail();
}


/* =========================================================
   ADD SUBTASK
========================================================= */

function handleAddSubtask() {

    if (!selectedTaskId) {
        return;
    }

    const task =
        tasks.find(
            item =>
                item.id === selectedTaskId
        );

    if (!task) {
        return;
    }

    const input =
        $("#subtaskInput");

    const text =
        input?.value.trim() || "";

    if (!text) {
        input?.focus();
        return;
    }

    if (!Array.isArray(task.subtasks)) {
        task.subtasks = [];
    }

    task.subtasks.push({
        id:
            `${Date.now()}-${Math.random()}`,
        text,
        done: false
    });

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    tasks =
        loadTasks(currentUser.id);

    if (input) {
        input.value = "";
    }

    renderSubtasks(
        $("#subtaskList"),
        task.subtasks
    );
}


/* =========================================================
   SUBTASK CLICK
========================================================= */

function handleSubtaskClick(event) {

    if (!selectedTaskId) {
        return;
    }

    const task =
        tasks.find(
            item =>
                item.id === selectedTaskId
        );

    if (!task) {
        return;
    }


    const checkbox =
        event.target.closest(
            ".subtask-checkbox"
        );

    if (checkbox) {

        const subtaskId =
            checkbox.dataset.subtaskId;

        const subtask =
            task.subtasks?.find(
                item =>
                    item.id === subtaskId
            );

        if (subtask) {

            subtask.done =
                checkbox.checked;

            task.updatedAt =
                new Date().toISOString();

            saveTasks(
                currentUser.id,
                tasks
            );

            renderSubtasks(
                $("#subtaskList"),
                task.subtasks
            );
        }

        return;
    }


    const deleteButton =
        event.target.closest(
            ".delete-subtask-btn"
        );

    if (deleteButton) {

        const subtaskId =
            deleteButton.dataset.subtaskId;

        task.subtasks =
            task.subtasks.filter(
                item =>
                    item.id !== subtaskId
            );

        task.updatedAt =
            new Date().toISOString();

        saveTasks(
            currentUser.id,
            tasks
        );

        renderSubtasks(
            $("#subtaskList"),
            task.subtasks
        );
    }
}


/* =========================================================
   DELETE TASK
========================================================= */

function handleTaskDelete(event) {

    const button =
        event.target.closest(
            "[data-delete-task]"
        );

    if (!button) {
        return;
    }

    const taskId =
        button.dataset.deleteTask;

    const index =
        tasks.findIndex(
            task =>
                task.id === taskId
        );

    if (index === -1) {
        return;
    }

    deletedTaskBackup = {
        task: {
            ...tasks[index],
            subtasks: Array.isArray(
                tasks[index].subtasks
            )
                ? tasks[index].subtasks.map(
                    item => ({ ...item })
                )
                : []
        },
        index
    };

    tasks.splice(index, 1);

    saveTasks(
        currentUser.id,
        tasks
    );

    renderUserInterface();

    showUndoToast();

    clearTimeout(undoTimer);

    undoTimer =
        setTimeout(() => {
            deletedTaskBackup = null;
            hideUndoToast();
        }, 5000);
}


/* =========================================================
   UNDO DELETE
========================================================= */

function handleUndo() {

    if (!deletedTaskBackup) {
        return;
    }

    const backup =
        deletedTaskBackup;

    tasks.splice(
        backup.index,
        0,
        backup.task
    );

    saveTasks(
        currentUser.id,
        tasks
    );

    deletedTaskBackup = null;

    clearTimeout(undoTimer);

    hideUndoToast();

    renderUserInterface();
}


function showUndoToast() {

    const toast =
        $("#undoToast");

    const message =
        $("#undoMessage");

    if (message) {
        message.textContent =
            "Task deleted — Undo";
    }

    if (toast) {
        toast.hidden = false;
    }
}


function hideUndoToast() {

    const toast =
        $("#undoToast");

    if (toast) {
        toast.hidden = true;
    }
}


/* =========================================================
   STATUS UPDATE
========================================================= */

function updateTaskStatus(
    taskId,
    newStatus
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {
        return;
    }

    task.status =
        newStatus;

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    renderUserInterface();
}


/* =========================================================
   KANBAN DRAG & DROP
========================================================= */

let draggedTaskId = null;


function handleDragStart(event) {

    const card =
        event.target.closest(
            "[data-task-id]"
        );

    if (!card) {
        return;
    }

    draggedTaskId =
        card.dataset.taskId;

    event.dataTransfer.effectAllowed =
        "move";

    event.dataTransfer.setData(
        "text/plain",
        draggedTaskId
    );
}


function handleBoardDragOver(event) {

    const column =
        event.target.closest(
            "[data-status]"
        );

    if (!column) {
        return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
        "move";
}


function handleBoardDrop(event) {

    const column =
        event.target.closest(
            "[data-status]"
        );

    if (!column) {
        return;
    }

    event.preventDefault();

    const taskId =
        event.dataTransfer.getData(
            "text/plain"
        ) || draggedTaskId;

    const newStatus =
        column.dataset.status;

    if (taskId && newStatus) {

        updateTaskStatus(
            taskId,
            newStatus
        );
    }

    draggedTaskId = null;
}


/* =========================================================
   LIST DRAG & DROP
========================================================= */

function handleListDragStart(event) {

    const card =
        event.target.closest(
            ".task-card"
        );

    if (!card) {
        return;
    }

    draggedTaskId =
        card.dataset.taskId;

    event.dataTransfer.effectAllowed =
        "move";

    event.dataTransfer.setData(
        "text/plain",
        draggedTaskId
    );
}


function handleListDragOver(event) {

    const card =
        event.target.closest(
            ".task-card"
        );

    if (!card) {
        return;
    }

    event.preventDefault();
}


function handleListDrop(event) {

    const targetCard =
        event.target.closest(
            ".task-card"
        );

    if (!targetCard) {
        return;
    }

    event.preventDefault();

    const draggedId =
        event.dataTransfer.getData(
            "text/plain"
        ) || draggedTaskId;

    const targetId =
        targetCard.dataset.taskId;

    if (!draggedId || !targetId) {
        return;
    }

    if (draggedId === targetId) {
        return;
    }

    const draggedIndex =
        tasks.findIndex(
            task =>
                task.id === draggedId
        );

    const targetIndex =
        tasks.findIndex(
            task =>
                task.id === targetId
        );

    if (
        draggedIndex === -1 ||
        targetIndex === -1
    ) {
        return;
    }

    const [movedTask] =
        tasks.splice(
            draggedIndex,
            1
        );

    tasks.splice(
        targetIndex,
        0,
        movedTask
    );

    saveTasks(
        currentUser.id,
        tasks
    );

    renderUserInterface();

    draggedTaskId = null;
}


/* =========================================================
   SEARCH
========================================================= */

function handleSearch(event) {

    searchText =
        event.target.value.trim();

    renderFilteredTasks();
}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function handleCategoryFilter(event) {

    const button =
        event.target.closest(
            "[data-category]"
        );

    if (!button) {
        return;
    }

    currentCategory =
        button.dataset.category;

    $$("[data-category]").forEach(
        item => {
            item.classList.toggle(
                "active",
                item.dataset.category ===
                    currentCategory
            );
        }
    );

    renderFilteredTasks();
}


/* =========================================================
   SORT
========================================================= */

function handleSort(event) {

    sortValue =
        event.target.value;

    renderFilteredTasks();
}


/* =========================================================
   VIEW SWITCH
========================================================= */

function setView(view) {

    currentView = view;

    const listButton =
        $("#listViewBtn");

    const boardButton =
        $("#boardViewBtn");

    if (listButton) {

        listButton.classList.toggle(
            "active",
            view === "list"
        );
    }

    if (boardButton) {

        boardButton.classList.toggle(
            "active",
            view === "board"
        );
    }

    renderFilteredTasks();
}


/* =========================================================
   EXPORT
========================================================= */

function handleExport() {

    const data =
        getUserDataForExport(
            currentUser.id
        );

    const blob =
        new Blob(
            [JSON.stringify(data, null, 2)],
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


/* =========================================================
   IMPORT
========================================================= */

function handleImport(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = () => {

        try {

            const data =
                JSON.parse(
                    reader.result
                );

            if (
                !Array.isArray(data.tasks) &&
                !Array.isArray(data.projects)
            ) {

                alert(
                    "Invalid task manager JSON file."
                );

                return;
            }

            importUserData(
                currentUser.id,
                data
            );

            tasks =
                loadTasks(currentUser.id);

            projects =
                loadProjects(currentUser.id);

            if (projects.length === 0) {

                const defaultProject =
                    ensureDefaultProject(
                        currentUser.id
                    );

                projects =
                    loadProjects(
                        currentUser.id
                    );

                activeProjectId =
                    defaultProject?.id || null;
            } else if (
                !projects.some(
                    project =>
                        project.id ===
                        activeProjectId
                )
            ) {

                activeProjectId =
                    projects[0].id;
            }

            renderUserInterface();

            alert(
                "Tasks imported successfully."
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not import the JSON file."
            );
        }
    };

    reader.readAsText(file);

    event.target.value = "";
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function loadAdminDashboard() {

    const users =
        getAllRegularUsers();

    const stats = {};

    let totalTasks = 0;
    let pendingTasks = 0;
    let completedTasks = 0;

    let todoTasks = 0;
    let inProgressTasks = 0;
    let inReviewTasks = 0;
    let doneTasks = 0;


    users.forEach(user => {

        const userTasks =
            loadTasks(user.id);

        const total =
            userTasks.length;

        const completed =
            userTasks.filter(
                task =>
                    task.status === "Done"
            ).length;

        const pending =
            total - completed;

        stats[user.id] = {
            total,
            completed,
            pending
        };


        totalTasks += total;

        completedTasks += completed;

        pendingTasks += pending;


        userTasks.forEach(task => {

            if (task.status === "To Do") {
                todoTasks++;
            }

            if (task.status === "In Progress") {
                inProgressTasks++;
            }

            if (task.status === "In Review") {
                inReviewTasks++;
            }

            if (task.status === "Done") {
                doneTasks++;
            }
        });
    });


    renderAdminSummary(
        {
            totalUsers:
                $("#adminTotalUsers"),

            totalTasks:
                $("#adminTotalTasks"),

            pendingTasks:
                $("#adminPendingTasks"),

            completedTasks:
                $("#adminCompletedTasks"),

            todoTasks:
                $("#adminTodoTasks"),

            inProgressTasks:
                $("#adminInProgressTasks"),

            inReviewTasks:
                $("#adminInReviewTasks"),

            doneTasks:
                $("#adminDoneTasks")
        },
        {
            totalUsers: users.length,
            totalTasks,
            pendingTasks,
            completedTasks,
            todoTasks,
            inProgressTasks,
            inReviewTasks,
            doneTasks
        }
    );


    renderAdminUsers(
        $("#adminUsersList"),
        users,
        stats
    );


    const reports =
        users.map(user => {

            const userTasks =
                loadTasks(user.id);

            const total =
                userTasks.length;

            const completed =
                userTasks.filter(
                    task =>
                        task.status === "Done"
                ).length;

            return {
                user,
                tasks: userTasks,
                total,
                completed,
                pending:
                    total - completed,
                progress:
                    total > 0
                        ? Math.round(
                            (completed / total) * 100
                        )
                        : 0
            };
        });


    renderAdminReports(
        $("#adminReportsList"),
        reports
    );


    renderAdminBoard();
    populateAdminUserSelect();
}


/* =========================================================
   ADMIN USER SELECT
========================================================= */

function populateAdminUserSelect() {

    const select =
        $("#adminUserSelect");

    if (!select) {
        return;
    }

    const users =
        getAllRegularUsers();

    select.innerHTML =
        `<option value="">
            Select a user
        </option>` +
        users
            .map(
                user => `
                    <option value="${escapeAttribute(user.id)}">
                        ${escapeHTML(user.name)}
                    </option>
                `
            )
            .join("");
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


/* =========================================================
   ADMIN ASSIGN TASK
========================================================= */

function handleAdminAssignTask(event) {

    event.preventDefault();

    const userId =
        $("#adminUserSelect")?.value || "";

    const title =
        $("#adminTaskTitle")?.value.trim() || "";

    const description =
        $("#adminTaskDescription")?.value || "";

    const category =
        $("#adminTaskCategory")?.value || "Work";

    const priority =
        $("#adminTaskPriority")?.value || "Normal";

    const dueDate =
        $("#adminTaskDueDate")?.value || "";

    const projectId =
        $("#adminTaskProject")?.value || null;

    const message =
        $("#adminAssignMessage");


    if (!userId) {

        if (message) {
            message.textContent =
                "Please select a user.";
        }

        return;
    }


    if (!title) {

        if (message) {
            message.textContent =
                "Please enter a task title.";
        }

        return;
    }


    const task =
        createAssignedTask(
            userId,
            {
                text: title,
                description,
                category,
                priority,
                dueDate,
                projectId,
                status: "To Do"
            }
        );


    if (!task) {

        if (message) {
            message.textContent =
                "Could not assign task.";
        }

        return;
    }


    if (message) {

        message.textContent =
            "Task assigned successfully.";
    }


    const form =
        $("#adminAssignTaskForm");

    if (form) {
        form.reset();
    }


    loadAdminDashboard();
}


/* =========================================================
   ADMIN BOARD
========================================================= */

function renderAdminBoard() {

    const users =
        getAllRegularUsers();

    const allTasks = [];

    users.forEach(user => {

        const userTasks =
            loadTasks(user.id);

        userTasks.forEach(task => {

            allTasks.push({
                ...task,
                assignedUserName:
                    user.name
            });
        });
    });


    const columns = {
        "To Do": $("#adminTodoColumn"),
        "In Progress": $("#adminInProgressColumn"),
        "In Review": $("#adminInReviewColumn"),
        "Done": $("#adminDoneColumn")
    };


    Object.values(columns).forEach(
        column => {

            if (column) {
                column.innerHTML = "";
            }
        }
    );


    const counts = {
        "To Do": 0,
        "In Progress": 0,
        "In Review": 0,
        "Done": 0
    };


    allTasks.forEach(task => {

        const column =
            columns[task.status];

        if (!column) {
            return;
        }

        counts[task.status]++;


        const card =
            document.createElement("div");

        card.className =
            "board-task";


        card.innerHTML = `

            <div class="board-task-title">
                ${escapeHTML(task.text)}
            </div>

            <div class="board-task-meta">

                <span>
                    ${escapeHTML(
                        task.assignedUserName
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        task.priority || "Normal"
                    )}
                </span>

            </div>
        `;


        column.appendChild(card);
    });


    const todoCount =
        $("#adminTodoTasks");

    const inProgressCount =
        $("#adminInProgressTasks");

    const inReviewCount =
        $("#adminInReviewTasks");

    const doneCount =
        $("#adminDoneTasks");


    if (todoCount) {
        todoCount.textContent =
            counts["To Do"];
    }

    if (inProgressCount) {
        inProgressCount.textContent =
            counts["In Progress"];
    }

    if (inReviewCount) {
        inReviewCount.textContent =
            counts["In Review"];
    }

    if (doneCount) {
        doneCount.textContent =
            counts["Done"];
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {


    /* Auth */

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
        showRegister
    );

    showLoginBtn?.addEventListener(
        "click",
        showLogin
    );

    logoutBtn?.addEventListener(
        "click",
        handleLogout
    );


    /* User tasks */

    $("#addTaskBtn")?.addEventListener(
        "click",
        handleAddTask
    );


    $("#searchInput")?.addEventListener(
        "input",
        handleSearch
    );


    $("#sortSelect")?.addEventListener(
        "change",
        handleSort
    );


    $("#listViewBtn")?.addEventListener(
        "click",
        () =>
            setView("list")
    );


    $("#boardViewBtn")?.addEventListener(
        "click",
        () =>
            setView("board")
    );


    /* Category */

    document.addEventListener(
        "click",
        event => {

            const categoryButton =
                event.target.closest(
                    "[data-category]"
                );

            if (categoryButton) {
                handleCategoryFilter(event);
            }
        }
    );


    /* Projects */

    $("#projectSwitcher")?.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#newProjectBtn"
                )
            ) {

                openNewProjectDialog();

                return;
            }

            handleProjectClick(event);
        }
    );


    $("#closeNewProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );


    $("#cancelProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );


    $("#createProjectBtn")?.addEventListener(
        "click",
        handleCreateProject
    );


    /* Task list */

    $("#taskList")?.addEventListener(
        "click",
        event => {

            const openButton =
                event.target.closest(
                    ".view-task-btn"
                );

            if (openButton) {

                openTaskDetail(
                    openButton.dataset.taskId
                );

                return;
            }

            handleTaskDelete(event);
        }
    );


    /* Board */

    $("#kanbanBoard")?.addEventListener(
        "dragover",
        handleBoardDragOver
    );

    $("#kanbanBoard")?.addEventListener(
        "drop",
        handleBoardDrop
    );


    $("#kanbanBoard")?.addEventListener(
        "dragstart",
        handleDragStart
    );


    /* List drag */

    $("#taskList")?.addEventListener(
        "dragstart",
        handleListDragStart
    );

    $("#taskList")?.addEventListener(
        "dragover",
        handleListDragOver
    );

    $("#taskList")?.addEventListener(
        "drop",
        handleListDrop
    );


    /* Task detail */

    $("#closeTaskDetailBtn")?.addEventListener(
        "click",
        closeTaskDetail
    );


    $("#closeTaskDetailBtnBottom")?.addEventListener(
        "click",
        closeTaskDetail
    );


    $("#saveNotesBtn")?.addEventListener(
        "click",
        saveTaskDetail
    );


    $("#addSubtaskBtn")?.addEventListener(
        "click",
        handleAddSubtask
    );


    $("#subtaskList")?.addEventListener(
        "click",
        handleSubtaskClick
    );


    /* Undo */

    $("#undoBtn")?.addEventListener(
        "click",
        handleUndo
    );


    /* Import / Export */

    $("#exportBtn")?.addEventListener(
        "click",
        handleExport
    );


    $("#importFileInput")?.addEventListener(
        "change",
        handleImport
    );


    /* Admin */

    $("#adminAssignTaskForm")?.addEventListener(
        "submit",
        handleAdminAssignTask
    );


    $("#refreshAdminReportsBtn")?.addEventListener(
        "click",
        loadAdminDashboard
    );


    $("#adminOpenTaskManagerBtn")?.addEventListener(
        "click",
        () => {

            hide(adminDashboard);
            show(userTaskManager);

            loadUserDashboard();
        }
    );
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            const target =
                event.target;

            const isTyping =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement;


            /* N = focus task input */

            if (
                event.key.toLowerCase() === "n" &&
                !isTyping &&
                !isAdmin(currentUser)
            ) {

                event.preventDefault();

                $("#taskInput")?.focus();

                return;
            }


            /* Escape = clear search */

            if (
                event.key === "Escape" &&
                target === $("#searchInput")
            ) {

                if (
                    $("#searchInput").value
                ) {

                    $("#searchInput").value =
                        "";

                    searchText = "";

                    renderFilteredTasks();
                }
            }
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

    setupEventListeners();

    setupKeyboardShortcuts();

    currentUser =
        getCurrentUser();


    if (currentUser) {

        openApplication();

    } else {

        show(authScreen);
        hide(appScreen);

        showLogin();
    }
}


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);
