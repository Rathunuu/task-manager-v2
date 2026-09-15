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
    updateProject,
    deleteProject,
    ensureDefaultProject,
    exportTasks,
    importTasks
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

const $ = (id) => document.getElementById(id);

let currentUser = null;
let tasks = [];
let projects = [];
let activeProjectId = null;

let currentView = "list";
let currentCategory = "all";
let currentSearch = "";
let currentSort = "newest";

let selectedTaskId = null;
let deletedTaskBackup = null;
let undoTimer = null;


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    bindAuthEvents();
    bindAppEvents();
    bindAdminEvents();

    const savedUser = getCurrentUser();

    if (savedUser) {
        currentUser = savedUser;
        openApplication(savedUser);
    } else {
        showAuthScreen();
    }
});


/* =========================================================
   COMMON HELPERS
========================================================= */

function show(element, visible = true) {
    if (!element) return;

    element.hidden = !visible;
}

function showAuthScreen() {
    show($("authScreen"), true);
    show($("appScreen"), false);
    show($("loginSection"), true);
    show($("registerSection"), false);
}

function showRegisterScreen() {
    show($("loginSection"), false);
    show($("registerSection"), true);

    $("registerName")?.focus();
}

function showLoginScreen() {
    show($("registerSection"), false);
    show($("loginSection"), true);

    $("loginEmail")?.focus();
}

function clearError(id) {
    const element = $(id);

    if (element) {
        element.textContent = "";
    }
}


/* =========================================================
   AUTH EVENTS
========================================================= */

function bindAuthEvents() {

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
        showRegisterScreen
    );

    $("showLoginBtn")?.addEventListener(
        "click",
        showLoginScreen
    );
}


/* =========================================================
   LOGIN
========================================================= */

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

    const result =
        loginUser(email, password);

    if (!result || !result.success) {

        error.textContent =
            result?.message ||
            "Invalid email or password.";

        return;
    }

    const user = result.user;

    if (!user) {

        error.textContent =
            "Login failed. User data not found.";

        return;
    }

    currentUser = user;

    setCurrentUser(user);

    openApplication(user);
}


/* =========================================================
   REGISTER
========================================================= */

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
            "Password must be at least 4 characters.";

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

    currentUser = user;

    setCurrentUser(user);

    openApplication(user);
}


/* =========================================================
   OPEN APPLICATION
========================================================= */

function openApplication(user) {

    currentUser = user;

    show($("authScreen"), false);
    show($("appScreen"), true);

    if ($("welcomeMessage")) {

        $("welcomeMessage").textContent =
            `Welcome, ${user.name}`;
    }

    if ($("currentUserRole")) {

        $("currentUserRole").textContent =
            isAdmin(user)
                ? "Master Admin"
                : "User";
    }

    if (isAdmin(user)) {

        show($("adminDashboard"), true);
        show($("userTaskManager"), false);

        loadAdminDashboard();

    } else {

        show($("adminDashboard"), false);
        show($("userTaskManager"), true);

        loadUserDashboard();
    }
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

    show($("appScreen"), false);
    show($("authScreen"), true);

    showLoginScreen();

    if ($("loginForm")) {
        $("loginForm").reset();
    }
}


/* =========================================================
   APP EVENTS
========================================================= */

function bindAppEvents() {

    $("logoutBtn")?.addEventListener(
        "click",
        handleLogout
    );

    $("addTaskBtn")?.addEventListener(
        "click",
        handleAddTask
    );

    $("searchInput")?.addEventListener(
        "input",
        handleSearch
    );

    $("sortSelect")?.addEventListener(
        "change",
        handleSort
    );

    document
        .querySelectorAll("[data-category]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentCategory =
                        button.dataset.category;

                    document
                        .querySelectorAll("[data-category]")
                        .forEach(btn =>
                            btn.classList.remove("active")
                        );

                    button.classList.add("active");

                    refreshTaskUI();
                }
            );
        });

    $("listViewBtn")?.addEventListener(
        "click",
        () => switchView("list")
    );

    $("boardViewBtn")?.addEventListener(
        "click",
        () => switchView("board")
    );

    $("exportBtn")?.addEventListener(
        "click",
        handleExport
    );

    $("importFileInput")?.addEventListener(
        "change",
        handleImport
    );

    $("closeTaskDetailBtn")?.addEventListener(
        "click",
        closeTaskDetail
    );

    $("closeTaskDetailBtnBottom")?.addEventListener(
        "click",
        closeTaskDetail
    );

    $("saveNotesBtn")?.addEventListener(
        "click",
        saveTaskNotes
    );

    $("addSubtaskBtn")?.addEventListener(
        "click",
        addSubtask
    );

    $("closeNewProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    $("cancelProjectBtn")?.addEventListener(
        "click",
        closeNewProjectDialog
    );

    $("createProjectBtn")?.addEventListener(
        "click",
        createNewProject
    );

    $("undoBtn")?.addEventListener(
        "click",
        handleUndo
    );


    /* Task list buttons */

    $("taskList")?.addEventListener(
        "click",
        handleTaskListClick
    );


    /* Kanban buttons */

    $("kanbanBoard")?.addEventListener(
        "click",
        handleTaskListClick
    );


    /* Project switch */

    $("projectSwitcher")?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-project-id]"
                );

            if (!button) return;

            activeProjectId =
                button.dataset.projectId;

            saveActiveProject();

            refreshTaskUI();
        }
    );


    /* New project */

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


    /* Keyboard shortcuts */

    document.addEventListener(
        "keydown",
        handleKeyboardShortcuts
    );
}


/* =========================================================
   USER DASHBOARD
========================================================= */

function loadUserDashboard() {

    if (!currentUser) return;

    ensureDefaultProject(
        currentUser.id
    );

    projects =
        loadProjects(
            currentUser.id
        );

    tasks =
        loadTasks(
            currentUser.id
        );

    if (!projects.length) {

        ensureDefaultProject(
            currentUser.id
        );

        projects =
            loadProjects(
                currentUser.id
            );
    }

    if (
        !activeProjectId ||
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
   RENDER USER INTERFACE
========================================================= */

function renderUserInterface() {

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

    if ($("activeProjectName")) {

        $("activeProjectName").textContent =
            activeProject?.name ||
            "My Project";
    }

    refreshTaskUI();
}


/* =========================================================
   TASK FILTERING
========================================================= */

function getFilteredTasks() {

    let filtered =
        tasks.filter(
            task =>
                task.projectId === activeProjectId
        );

    if (currentCategory !== "all") {

        filtered =
            filtered.filter(
                task =>
                    task.category === currentCategory
            );
    }

    if (currentSearch) {

        const search =
            currentSearch.toLowerCase();

        filtered =
            filtered.filter(task => {

                return (
                    task.title
                        ?.toLowerCase()
                        .includes(search) ||

                    task.description
                        ?.toLowerCase()
                        .includes(search)
                );
            });
    }

    filtered.sort(
        (a, b) => {

            if (currentSort === "oldest") {

                return (
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
                );
            }

            if (currentSort === "az") {

                return (
                    (a.title || "")
                        .localeCompare(
                            b.title || ""
                        )
                );
            }

            if (currentSort === "za") {

                return (
                    (b.title || "")
                        .localeCompare(
                            a.title || ""
                        )
                );
            }

            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );
        }
    );

    return filtered;
}


/* =========================================================
   REFRESH TASK UI
========================================================= */

function refreshTaskUI() {

    const filteredTasks =
        getFilteredTasks();

    renderTasks(
        $("taskList"),
        filteredTasks
    );

    renderEmptyState(
        $("emptyState"),
        filteredTasks.length > 0
    );

    renderProgress(
        $("progressText"),
        $("progressFill"),
        $("progressPercentage"),
        filteredTasks
    );

    renderBoard(
        filteredTasks,
        {
            todo: $("todoColumn"),
            inProgress: $("inProgressColumn"),
            inReview: $("inReviewColumn"),
            done: $("doneColumn")
        }
    );

    updateKanbanCounts(
        filteredTasks
    );

    attachDragAndDrop();
}


/* =========================================================
   ADD TASK
========================================================= */

function handleAddTask() {

    if (!currentUser) return;

    const input =
        $("taskInput");

    const title =
        input.value.trim();

    if (!title) {

        input.focus();

        return;
    }

    const category =
        $("categorySelect")?.value ||
        "Work";

    const status =
        $("statusSelect")?.value ||
        "todo";

    const newTask =
        createTask(
            currentUser.id,
            {
                title,
                category,
                status,
                projectId: activeProjectId
            }
        );

    tasks.push(newTask);

    saveTasks(
        currentUser.id,
        tasks
    );

    input.value = "";

    refreshTaskUI();

    input.focus();
}


/* =========================================================
   SEARCH
========================================================= */

function handleSearch(event) {

    currentSearch =
        event.target.value.trim();

    refreshTaskUI();
}


/* =========================================================
   SORT
========================================================= */

function handleSort(event) {

    currentSort =
        event.target.value;

    refreshTaskUI();
}


/* =========================================================
   VIEW SWITCH
========================================================= */

function switchView(view) {

    currentView = view;

    const listView =
        $("taskList");

    const boardView =
        $("kanbanBoard");

    if (view === "list") {

        show(listView, true);
        show(boardView, false);

        $("listViewBtn")
            ?.classList.add("active");

        $("boardViewBtn")
            ?.classList.remove("active");

    } else {

        show(listView, false);
        show(boardView, true);

        $("boardViewBtn")
            ?.classList.add("active");

        $("listViewBtn")
            ?.classList.remove("active");
    }
}


/* =========================================================
   KANBAN COUNTS
========================================================= */

function updateKanbanCounts(taskList) {

    const counts = {
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0
    };

    taskList.forEach(task => {

        if (task.status === "todo") {
            counts.todo++;
        }

        if (task.status === "in-progress") {
            counts.inProgress++;
        }

        if (task.status === "in-review") {
            counts.inReview++;
        }

        if (task.status === "done") {
            counts.done++;
        }
    });

    if ($("todoCount"))
        $("todoCount").textContent = counts.todo;

    if ($("inProgressCount"))
        $("inProgressCount").textContent =
            counts.inProgress;

    if ($("inReviewCount"))
        $("inReviewCount").textContent =
            counts.inReview;

    if ($("doneCount"))
        $("doneCount").textContent =
            counts.done;
}


/* =========================================================
   TASK CLICK HANDLER
========================================================= */

function handleTaskListClick(event) {

    const deleteButton =
        event.target.closest(
            "[data-delete-task]"
        );

    if (deleteButton) {

        const taskId =
            deleteButton.dataset.deleteTask;

        handleDeleteTask(taskId);

        return;
    }

    const openButton =
        event.target.closest(
            "[data-open-task]"
        );

    if (openButton) {

        const taskId =
            openButton.dataset.openTask;

        openTaskDetail(taskId);

        return;
    }

    const statusButton =
        event.target.closest(
            "[data-status-task]"
        );

    if (statusButton) {

        const taskId =
            statusButton.dataset.statusTask;

        const status =
            statusButton.dataset.status;

        changeTaskStatus(
            taskId,
            status
        );
    }
}


/* =========================================================
   CHANGE TASK STATUS
========================================================= */

function changeTaskStatus(
    taskId,
    status
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) return;

    task.status = status;

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    refreshTaskUI();
}


/* =========================================================
   TASK DETAIL
========================================================= */

function openTaskDetail(taskId) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) return;

    selectedTaskId =
        taskId;

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

    if (dialog?.showModal) {
        dialog.showModal();
    } else {
        show(dialog, true);
    }
}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeTaskDetail() {

    const dialog =
        $("taskDetailDialog");

    if (dialog?.open) {

        dialog.close();

    } else {

        show(dialog, false);
    }

    selectedTaskId = null;
}


/* =========================================================
   SAVE TASK NOTES
========================================================= */

function saveTaskNotes() {

    if (!selectedTaskId) return;

    const task =
        tasks.find(
            item =>
                item.id === selectedTaskId
        );

    if (!task) return;

    task.notes =
        $("taskNotes")?.value || "";

    task.updatedAt =
        new Date().toISOString();

    saveTasks(
        currentUser.id,
        tasks
    );

    refreshTaskUI();
}


/* =========================================================
   ADD SUBTASK
========================================================= */

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
                item.id === selectedTaskId
        );

    if (!task) return;

    if (!Array.isArray(task.subtasks)) {
        task.subtasks = [];
    }

    task.subtasks.push({
        id:
            "subtask-" +
            Date.now(),

        title,

        done: false
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


/* =========================================================
   DELETE TASK
========================================================= */

function handleDeleteTask(taskId) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) return;

    deletedTaskBackup = {
        ...task,
        subtasks: [
            ...(task.subtasks || [])
        ]
    };

    tasks =
        tasks.filter(
            item =>
                item.id !== taskId
        );

    saveTasks(
        currentUser.id,
        tasks
    );

    showUndoToast(
        "Task deleted — Undo"
    );

    refreshTaskUI();
}


/* =========================================================
   UNDO DELETE
========================================================= */

function showUndoToast(message) {

    if ($("undoMessage")) {
        $("undoMessage").textContent =
            message;
    }

    show($("undoToast"), true);

    clearTimeout(undoTimer);

    undoTimer =
        setTimeout(
            () => {

                deletedTaskBackup = null;

                show(
                    $("undoToast"),
                    false
                );

            },
            5000
        );
}


function handleUndo() {

    if (!deletedTaskBackup) return;

    tasks.push(
        deletedTaskBackup
    );

    saveTasks(
        currentUser.id,
        tasks
    );

    deletedTaskBackup = null;

    clearTimeout(undoTimer);

    show(
        $("undoToast"),
        false
    );

    refreshTaskUI();
}


/* =========================================================
   DRAG & DROP
========================================================= */

function attachDragAndDrop() {

    const cards =
        document.querySelectorAll(
            "#taskList .task-card, #kanbanBoard .task-card"
        );

    cards.forEach(card => {

        card.draggable = true;

        card.addEventListener(
            "dragstart",
            () => {

                card.classList.add(
                    "dragging"
                );
            }
        );

        card.addEventListener(
            "dragend",
            () => {

                card.classList.remove(
                    "dragging"
                );
            }
        );
    });

    const columns =
        document.querySelectorAll(
            ".kanban-column"
        );

    columns.forEach(column => {

        column.addEventListener(
            "dragover",
            event => {

                event.preventDefault();
            }
        );

        column.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                const dragging =
                    document.querySelector(
                        ".task-card.dragging"
                    );

                if (!dragging) return;

                const taskId =
                    dragging.dataset.taskId;

                const newStatus =
                    column.dataset.status;

                if (taskId && newStatus) {

                    changeTaskStatus(
                        taskId,
                        newStatus
                    );
                }
            }
        );
    });
}


/* =========================================================
   PROJECTS
========================================================= */

function openNewProjectDialog() {

    const dialog =
        $("newProjectDialog");

    if (!dialog) return;

    show(dialog, true);

    $("projectNameInput")?.focus();
}


function closeNewProjectDialog() {

    const dialog =
        $("newProjectDialog");

    show(dialog, false);

    if ($("projectNameInput")) {
        $("projectNameInput").value = "";
    }

    clearError(
        "projectError"
    );
}


function createNewProject() {

    if (!currentUser) return;

    const input =
        $("projectNameInput");

    const name =
        input.value.trim();

    if (!name) {

        $("projectError").textContent =
            "Please enter a project name.";

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

    saveActiveProject();

    closeNewProjectDialog();

    renderUserInterface();
}


/* =========================================================
   ACTIVE PROJECT
========================================================= */

function saveActiveProject() {

    if (!currentUser) return;

    localStorage.setItem(
        `tm_active_project_${currentUser.id}`,
        activeProjectId || ""
    );
}


/* =========================================================
   EXPORT
========================================================= */

function handleExport() {

    if (!currentUser) return;

    exportTasks(
        currentUser.id
    );
}


/* =========================================================
   IMPORT
========================================================= */

function handleImport(event) {

    const file =
        event.target.files?.[0];

    if (!file || !currentUser) return;

    const reader =
        new FileReader();

    reader.onload = () => {

        try {

            const imported =
                JSON.parse(
                    reader.result
                );

            const importedTasks =
                Array.isArray(imported)
                    ? imported
                    : imported.tasks;

            if (
                !Array.isArray(
                    importedTasks
                )
            ) {
                throw new Error(
                    "Invalid file"
                );
            }

            tasks =
                importedTasks.map(
                    task => ({
                        ...task,
                        id:
                            task.id ||
                            "task-" +
                            Date.now() +
                            Math.random(),

                        projectId:
                            task.projectId ||
                            activeProjectId,

                        assignedTo:
                            task.assignedTo ||
                            currentUser.id
                    })
                );

            saveTasks(
                currentUser.id,
                tasks
            );

            ensureDefaultProject(
                currentUser.id
            );

            projects =
                loadProjects(
                    currentUser.id
                );

            refreshTaskUI();

        } catch {

            alert(
                "Unable to import this JSON file."
            );
        }

        event.target.value = "";
    };

    reader.readAsText(file);
}


/* =========================================================
   ADMIN EVENTS
========================================================= */

function bindAdminEvents() {

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
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function loadAdminDashboard() {

    if (
        !currentUser ||
        !isAdmin(currentUser)
    ) return;

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
            ...userTasks
        );
    });


    /* Summary */

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


    /* Users */

    renderAdminUsers(
        $("adminUsersList"),
        regularUsers,
        allTasks
    );


    /* Reports */

    renderAdminReports(
        $("adminReportsList"),
        regularUsers,
        allTasks
    );


    /* User select */

    renderUserSelect(
        $("adminUserSelect"),
        regularUsers
    );


    /* Admin board */

    renderAdminBoard(
        {
            todo:
                $("adminTodoColumn"),

            inProgress:
                $("adminInProgressColumn"),

            inReview:
                $("adminInReviewColumn"),

            done:
                $("adminDoneColumn")
        },
        allTasks
    );


    updateAdminBoardCounts(
        allTasks
    );

    attachAdminDragAndDrop();
}


/* =========================================================
   ADMIN ASSIGN TASK
========================================================= */

function handleAdminAssignTask(event) {

    event.preventDefault();

    if (
        !currentUser ||
        !isAdmin(currentUser)
    ) return;

    const userId =
        $("adminUserSelect")?.value;

    const title =
        $("adminTaskTitle")?.value.trim();

    const description =
        $("adminTaskDescription")?.value.trim();

    const category =
        $("adminTaskCategory")?.value ||
        "Work";

    const priority =
        $("adminTaskPriority")?.value ||
        "Medium";

    const dueDate =
        $("adminTaskDueDate")?.value || "";

    const projectId =
        $("adminTaskProject")?.value || "";


    if (!userId) {

        showAdminMessage(
            "Please select a user."
        );

        return;
    }

    if (!title) {

        showAdminMessage(
            "Please enter task title."
        );

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
                assignedTo: userId,
                createdBy:
                    currentUser.id
            }
        );


    const userTasks =
        loadTasks(userId);

    userTasks.push(task);

    saveTasks(
        userId,
        userTasks
    );


    showAdminMessage(
        "Task assigned successfully."
    );


    $("adminAssignTaskForm")
        ?.reset();

    loadAdminDashboard();
}


function showAdminMessage(message) {

    const element =
        $("adminAssignMessage");

    if (!element) return;

    element.textContent =
        message;

    setTimeout(
        () => {

            element.textContent = "";

        },
        3000
    );
}


/* =========================================================
   ADMIN BOARD COUNTS
========================================================= */

function updateAdminBoardCounts(allTasks) {

    const counts = {
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0
    };

    allTasks.forEach(task => {

        if (task.status === "todo") {
            counts.todo++;
        }

        if (
            task.status ===
            "in-progress"
        ) {
            counts.inProgress++;
        }

        if (
            task.status ===
            "in-review"
        ) {
            counts.inReview++;
        }

        if (task.status === "done") {
            counts.done++;
        }
    });


    if ($("adminTodoTasks"))
        $("adminTodoTasks").textContent =
            counts.todo;

    if ($("adminInProgressTasks"))
        $("adminInProgressTasks").textContent =
            counts.inProgress;

    if ($("adminInReviewTasks"))
        $("adminInReviewTasks").textContent =
            counts.inReview;

    if ($("adminDoneTasks"))
        $("adminDoneTasks").textContent =
            counts.done;
}


/* =========================================================
   ADMIN DRAG & DROP
========================================================= */

function attachAdminDragAndDrop() {

    const cards =
        document.querySelectorAll(
            ".admin-task-card"
        );

    cards.forEach(card => {

        card.draggable = true;

        card.addEventListener(
            "dragstart",
            () => {

                card.classList.add(
                    "dragging"
                );
            }
        );

        card.addEventListener(
            "dragend",
            () => {

                card.classList.remove(
                    "dragging"
                );
            }
        );
    });


    const columns =
        document.querySelectorAll(
            ".admin-board-column"
        );

    columns.forEach(column => {

        column.addEventListener(
            "dragover",
            event => {

                event.preventDefault();
            }
        );

        column.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                const card =
                    document.querySelector(
                        ".admin-task-card.dragging"
                    );

                if (!card) return;

                const taskId =
                    card.dataset.taskId;

                const newStatus =
                    column.dataset.status;

                if (!taskId || !newStatus)
                    return;


                const users =
                    loadUsers();

                users
                    .filter(
                        user =>
                            user.role !== "admin"
                    )
                    .forEach(user => {

                        const userTasks =
                            loadTasks(
                                user.id
                            );

                        const task =
                            userTasks.find(
                                item =>
                                    item.id ===
                                    taskId
                            );

                        if (task) {

                            task.status =
                                newStatus;

                            task.updatedAt =
                                new Date()
                                    .toISOString();

                            saveTasks(
                                user.id,
                                userTasks
                            );
                        }
                    });


                loadAdminDashboard();
            }
        );
    });
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function handleKeyboardShortcuts(event) {

    const tag =
        event.target?.tagName;

    const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";


    if (
        event.key.toLowerCase() === "n" &&
        !isTyping
    ) {

        event.preventDefault();

        $("taskInput")?.focus();
    }


    if (
        event.key === "Escape" &&
        !isTyping
    ) {

        if ($("searchInput")) {

            $("searchInput").value = "";

            currentSearch = "";

            refreshTaskUI();
        }
    }
}
