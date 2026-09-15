// ========================================
// RENDER.JS
// Task Manager V2
// Week 2 + Week 3 + Admin
// ========================================

// ---------- SECURITY ----------
export function escapeHTML(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ---------- HELPERS ----------
export function getStatusClass(status = "To Do") {
    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}

export function formatDate(date) {
    if (!date) return "No due date";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return date;
    }

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

export function getProgress(tasks = []) {
    if (!tasks.length) return 0;

    const completed = tasks.filter(task =>
        task.status === "Done" || task.completed === true
    ).length;

    return Math.round((completed / tasks.length) * 100);
}


// ========================================
// PROJECTS
// ========================================

export function renderProjects(
    container,
    projects = [],
    activeProjectId = ""
) {
    if (!container) return;

    container.innerHTML = "";

    if (!projects.length) {
        container.innerHTML = `
            <div class="project-empty">
                No projects yet.
            </div>
        `;
        return;
    }

    projects.forEach(project => {
        const button = document.createElement("button");

        button.className =
            `project-item ${
                project.id === activeProjectId ? "active" : ""
            }`;

        button.dataset.projectId = project.id;

        button.innerHTML = `
            <span class="project-icon">📁</span>
            <span class="project-name">
                ${escapeHTML(project.name)}
            </span>
        `;

        container.appendChild(button);
    });
}


// ========================================
// PROJECT PROGRESS
// ========================================

export function renderProgress(
    progressText,
    progressFill,
    progressPercentage,
    tasks = []
) {
    const percentage = getProgress(tasks);

    if (progressText) {
        progressText.textContent =
            `${tasks.filter(task =>
                task.status === "Done" ||
                task.completed === true
            ).length} of ${tasks.length} tasks done`;
    }

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }
}


// ========================================
// TASK CARD
// ========================================

function createTaskCard(task) {
    const card = document.createElement("article");

    card.className = "task-card";
    card.draggable = true;

    card.dataset.taskId = task.id;

    const status = task.status || "To Do";
    const category = task.category || "Personal";
    const priority = task.priority || "Medium";

    card.innerHTML = `
        <div class="task-card-top">

            <div class="task-title-wrap">
                <h3 class="task-title">
                    ${escapeHTML(task.title || "Untitled Task")}
                </h3>
            </div>

            <button
                class="task-delete-btn"
                type="button"
                data-delete-task="${escapeHTML(task.id)}"
                title="Delete task"
            >
                ×
            </button>

        </div>

        ${
            task.description
                ? `
                    <p class="task-description">
                        ${escapeHTML(task.description)}
                    </p>
                `
                : ""
        }

        <div class="task-meta">

            <span class="task-category category-${getStatusClass(category)}">
                ${escapeHTML(category)}
            </span>

            <span class="task-priority priority-${getStatusClass(priority)}">
                ${escapeHTML(priority)}
            </span>

            <span class="task-status status-${getStatusClass(status)}">
                ${escapeHTML(status)}
            </span>

        </div>

        <div class="task-card-bottom">

            <span class="task-due-date">
                📅 ${escapeHTML(formatDate(task.dueDate))}
            </span>

            <button
                class="task-open-btn"
                type="button"
                data-open-task="${escapeHTML(task.id)}"
            >
                View
            </button>

        </div>
    `;

    return card;
}


// ========================================
// TASK LIST
// ========================================

export function renderTasks(
    container,
    tasks = []
) {
    if (!container) return;

    container.innerHTML = "";

    if (!tasks.length) {
        return;
    }

    tasks.forEach(task => {
        container.appendChild(
            createTaskCard(task)
        );
    });
}


// ========================================
// EMPTY STATE
// ========================================

export function renderEmptyState(
    emptyState,
    hasTasks
) {
    if (!emptyState) return;

    emptyState.hidden = hasTasks;
}


// ========================================
// KANBAN BOARD
// ========================================

export function renderBoard(
    tasks = [],
    columns = {}
) {
    const todoColumn = columns.todo;
    const inProgressColumn = columns.inProgress;
    const inReviewColumn = columns.inReview;
    const doneColumn = columns.done;

    const todoCount = columns.todoCount;
    const inProgressCount = columns.inProgressCount;
    const inReviewCount = columns.inReviewCount;
    const doneCount = columns.doneCount;

    const allColumns = [
        todoColumn,
        inProgressColumn,
        inReviewColumn,
        doneColumn
    ];

    allColumns.forEach(column => {
        if (column) {
            column.innerHTML = "";
        }
    });

    const grouped = {
        "To Do": [],
        "In Progress": [],
        "In Review": [],
        "Done": []
    };

    tasks.forEach(task => {
        const status = task.status || "To Do";

        if (!grouped[status]) {
            grouped["To Do"].push(task);
        } else {
            grouped[status].push(task);
        }
    });

    grouped["To Do"].forEach(task => {
        if (todoColumn) {
            todoColumn.appendChild(
                createTaskCard(task)
            );
        }
    });

    grouped["In Progress"].forEach(task => {
        if (inProgressColumn) {
            inProgressColumn.appendChild(
                createTaskCard(task)
            );
        }
    });

    grouped["In Review"].forEach(task => {
        if (inReviewColumn) {
            inReviewColumn.appendChild(
                createTaskCard(task)
            );
        }
    });

    grouped["Done"].forEach(task => {
        if (doneColumn) {
            doneColumn.appendChild(
                createTaskCard(task)
            );
        }
    });

    if (todoCount) {
        todoCount.textContent =
            grouped["To Do"].length;
    }

    if (inProgressCount) {
        inProgressCount.textContent =
            grouped["In Progress"].length;
    }

    if (inReviewCount) {
        inReviewCount.textContent =
            grouped["In Review"].length;
    }

    if (doneCount) {
        doneCount.textContent =
            grouped["Done"].length;
    }
}


// ========================================
// TASK DETAIL
// ========================================

export function renderTaskDetail(
    task,
    elements = {}
) {
    if (!task) return;

    const {
        title,
        description,
        status,
        priority,
        dueDate,
        category,
        notes
    } = elements;

    if (title) {
        title.value = task.title || "";
    }

    if (description) {
        description.value =
            task.description || "";
    }

    if (status) {
        status.textContent =
            task.status || "To Do";
    }

    if (priority) {
        priority.textContent =
            task.priority || "Medium";
    }

    if (dueDate) {
        dueDate.textContent =
            formatDate(task.dueDate);
    }

    if (category) {
        category.textContent =
            task.category || "Personal";
    }

    if (notes) {
        notes.value =
            task.notes || "";
    }
}


// ========================================
// SUBTASKS
// ========================================

export function renderSubtasks(
    container,
    subtasks = []
) {
    if (!container) return;

    container.innerHTML = "";

    if (!subtasks.length) {
        container.innerHTML = `
            <div class="subtask-empty">
                No subtasks yet.
            </div>
        `;

        return;
    }

    subtasks.forEach(subtask => {
        const item = document.createElement("div");

        item.className = "subtask-item";

        const completed =
            subtask.completed === true ||
            subtask.done === true;

        item.innerHTML = `
            <label class="subtask-label">

                <input
                    type="checkbox"
                    data-subtask-id="${escapeHTML(subtask.id)}"
                    ${completed ? "checked" : ""}
                >

                <span class="${
                    completed
                        ? "subtask-completed"
                        : ""
                }">
                    ${escapeHTML(
                        subtask.title ||
                        subtask.text ||
                        ""
                    )}
                </span>

            </label>

            <button
                type="button"
                class="subtask-delete-btn"
                data-delete-subtask="${escapeHTML(subtask.id)}"
            >
                ×
            </button>
        `;

        container.appendChild(item);
    });
}


// ========================================
// ADMIN SUMMARY
// ========================================

export function renderAdminSummary(
    elements,
    users = [],
    tasks = []
) {
    const totalUsers = users.length;
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(task =>
        task.status === "Done" ||
        task.completed === true
    ).length;

    const pendingTasks =
        totalTasks - completedTasks;

    if (elements.totalUsers) {
        elements.totalUsers.textContent =
            totalUsers;
    }

    if (elements.totalTasks) {
        elements.totalTasks.textContent =
            totalTasks;
    }

    if (elements.pendingTasks) {
        elements.pendingTasks.textContent =
            pendingTasks;
    }

    if (elements.completedTasks) {
        elements.completedTasks.textContent =
            completedTasks;
    }
}


// ========================================
// ADMIN USER LIST
// ========================================

export function renderAdminUsers(
    container,
    userStats = []
) {
    if (!container) return;

    container.innerHTML = "";

    if (!userStats.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No registered users yet.
            </div>
        `;

        return;
    }

    userStats.forEach(stat => {
        const card = document.createElement("div");

        card.className = "admin-user-card";

        const progress =
            Number(stat.progress || 0);

        card.innerHTML = `
            <div class="admin-user-header">

                <div>
                    <h3>
                        ${escapeHTML(
                            stat.user?.name ||
                            stat.name ||
                            "Unknown User"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            stat.user?.email ||
                            stat.email ||
                            ""
                        )}
                    </p>
                </div>

                <span class="admin-progress-badge">
                    ${progress}%
                </span>

            </div>

            <div class="admin-user-stats">

                <div>
                    <strong>
                        ${stat.total || 0}
                    </strong>
                    <span>Total</span>
                </div>

                <div>
                    <strong>
                        ${stat.completed || 0}
                    </strong>
                    <span>Done</span>
                </div>

                <div>
                    <strong>
                        ${stat.pending || 0}
                    </strong>
                    <span>Pending</span>
                </div>

            </div>

            <div class="admin-progress-bar">
                <div
                    class="admin-progress-fill"
                    style="width:${progress}%"
                ></div>
            </div>
        `;

        container.appendChild(card);
    });
}


// ========================================
// ADMIN REPORTS
// ========================================

export function renderAdminReports(
    container,
    userStats = []
) {
    if (!container) return;

    container.innerHTML = "";

    if (!userStats.length) {
        container.innerHTML = `
            <div class="admin-empty">
                No report data available.
            </div>
        `;

        return;
    }

    const table = document.createElement("div");

    table.className = "reports-table";

    table.innerHTML = `
        <div class="reports-row reports-header">

            <div>User</div>
            <div>Total</div>
            <div>Completed</div>
            <div>Pending</div>
            <div>Progress</div>

        </div>
    `;

    userStats.forEach(stat => {
        const row = document.createElement("div");

        row.className = "reports-row";

        const progress =
            Number(stat.progress || 0);

        row.innerHTML = `
            <div>
                <strong>
                    ${escapeHTML(
                        stat.user?.name ||
                        stat.name ||
                        "Unknown"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        stat.user?.email ||
                        stat.email ||
                        ""
                    )}
                </small>
            </div>

            <div>
                ${stat.total || 0}
            </div>

            <div>
                ${stat.completed || 0}
            </div>

            <div>
                ${stat.pending || 0}
            </div>

            <div>
                <strong>
                    ${progress}%
                </strong>
            </div>
        `;

        table.appendChild(row);
    });

    container.appendChild(table);
}


// ========================================
// ADMIN TASK CARD
// ========================================

export function createAdminTaskCard(
    task,
    user = null
) {
    const card = document.createElement("article");

    card.className = "task-card admin-task-card";

    card.draggable = true;

    card.dataset.taskId = task.id;

    if (user?.id) {
        card.dataset.userId = user.id;
    }

    const status = task.status || "To Do";
    const category = task.category || "Personal";
    const priority = task.priority || "Medium";

    card.innerHTML = `
        <div class="task-card-top">

            <div>
                <h3 class="task-title">
                    ${escapeHTML(
                        task.title ||
                        "Untitled Task"
                    )}
                </h3>
            </div>

        </div>

        ${
            task.description
                ? `
                    <p class="task-description">
                        ${escapeHTML(
                            task.description
                        )}
                    </p>
                `
                : ""
        }

        <div class="admin-assigned-user">

            👤
            ${escapeHTML(
                user?.name ||
                task.assignedToName ||
                "Unknown User"
            )}

        </div>

        <div class="task-meta">

            <span class="task-category">
                ${escapeHTML(category)}
            </span>

            <span class="task-priority">
                ${escapeHTML(priority)}
            </span>

            <span class="task-status status-${getStatusClass(status)}">
                ${escapeHTML(status)}
            </span>

        </div>

        <div class="task-card-bottom">

            <span>
                📅 ${escapeHTML(
                    formatDate(task.dueDate)
                )}
            </span>

        </div>
    `;

    return card;
}


// ========================================
// ADMIN BOARD
// ========================================

export function renderAdminBoard(
    tasks = [],
    users = [],
    columns = {}
) {
    const todoColumn = columns.todo;
    const inProgressColumn = columns.inProgress;
    const inReviewColumn = columns.inReview;
    const doneColumn = columns.done;

    const todoCount = columns.todoCount;
    const inProgressCount = columns.inProgressCount;
    const inReviewCount = columns.inReviewCount;
    const doneCount = columns.doneCount;

    [
        todoColumn,
        inProgressColumn,
        inReviewColumn,
        doneColumn
    ].forEach(column => {
        if (column) {
            column.innerHTML = "";
        }
    });

    const userMap = new Map();

    users.forEach(user => {
        userMap.set(user.id, user);
    });

    const grouped = {
        "To Do": [],
        "In Progress": [],
        "In Review": [],
        "Done": []
    };

    tasks.forEach(task => {
        const status = task.status || "To Do";

        if (grouped[status]) {
            grouped[status].push(task);
        } else {
            grouped["To Do"].push(task);
        }
    });

    function addTasks(
        taskList,
        column
    ) {
        if (!column) return;

        taskList.forEach(task => {
            const user =
                userMap.get(task.assignedTo);

            column.appendChild(
                createAdminTaskCard(
                    task,
                    user
                )
            );
        });
    }

    addTasks(
        grouped["To Do"],
        todoColumn
    );

    addTasks(
        grouped["In Progress"],
        inProgressColumn
    );

    addTasks(
        grouped["In Review"],
        inReviewColumn
    );

    addTasks(
        grouped["Done"],
        doneColumn
    );

    if (todoCount) {
        todoCount.textContent =
            grouped["To Do"].length;
    }

    if (inProgressCount) {
        inProgressCount.textContent =
            grouped["In Progress"].length;
    }

    if (inReviewCount) {
        inReviewCount.textContent =
            grouped["In Review"].length;
    }

    if (doneCount) {
        doneCount.textContent =
            grouped["Done"].length;
    }
}


// ========================================
// ADMIN USER SELECT
// ========================================

export function renderUserSelect(
    select,
    users = []
) {
    if (!select) return;

    select.innerHTML = `
        <option value="">
            Select a user
        </option>
    `;

    users.forEach(user => {
        const option =
            document.createElement("option");

        option.value = user.id;

        option.textContent =
            `${user.name} (${user.email})`;

        select.appendChild(option);
    });
}
