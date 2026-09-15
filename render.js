/* =========================================================
   TASK MANAGER V2
   RENDER.JS

   Handles all UI rendering.
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getStatusClass(status) {
    return String(status || "To Do")
        .toLowerCase()
        .replace(/\s+/g, "-");
}


function formatDate(date) {

    if (!date) {
        return "No due date";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =========================================================
   TASK CARD
========================================================= */

function createTaskCard(task) {

    const completedSubtasks = Array.isArray(task.subtasks)
        ? task.subtasks.filter(item => item.done).length
        : 0;

    const totalSubtasks = Array.isArray(task.subtasks)
        ? task.subtasks.length
        : 0;

    const subtaskText =
        totalSubtasks > 0
            ? `${completedSubtasks}/${totalSubtasks} subtasks`
            : "";

    return `
        <article
            class="task-card"
            data-task-id="${escapeHTML(task.id)}"
            draggable="true"
        >

            <div class="task-main">

                <div class="task-title-row">

                    <h3 class="task-title">
                        ${escapeHTML(task.text)}
                    </h3>

                    <span class="task-badge ${getStatusClass(task.status)}">
                        ${escapeHTML(task.status)}
                    </span>

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

                    <span class="task-badge">
                        ${escapeHTML(task.category)}
                    </span>

                    <span class="task-badge">
                        ${escapeHTML(task.priority || "Normal")}
                    </span>

                    ${
                        task.dueDate
                            ? `
                                <span class="task-badge">
                                    Due: ${escapeHTML(formatDate(task.dueDate))}
                                </span>
                            `
                            : ""
                    }

                    ${
                        subtaskText
                            ? `
                                <span class="task-badge">
                                    ${subtaskText}
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="task-actions">

                <button
                    type="button"
                    class="task-action-btn view-task-btn"
                    data-task-id="${escapeHTML(task.id)}"
                    title="Open task"
                >
                    Open
                </button>


                <button
                    type="button"
                    class="task-action-btn delete-task-btn"
                    data-delete-task="${escapeHTML(task.id)}"
                    title="Delete task"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   RENDER TASK LIST
========================================================= */

export function renderTasks(
    container,
    tasks,
    emptyState
) {

    if (!container) {
        return;
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {

        container.innerHTML = "";

        if (emptyState) {
            emptyState.hidden = false;
        }

        return;
    }

    if (emptyState) {
        emptyState.hidden = true;
    }

    container.innerHTML = tasks
        .map(task => createTaskCard(task))
        .join("");
}


/* =========================================================
   RENDER PROJECTS
========================================================= */

export function renderProjects(
    container,
    projects,
    activeProjectId
) {

    if (!container) {
        return;
    }

    const safeProjects = Array.isArray(projects)
        ? projects
        : [];

    container.innerHTML = safeProjects
        .map(project => {

            const active =
                project.id === activeProjectId
                    ? "active"
                    : "";

            return `
                <button
                    type="button"
                    class="project-item ${active}"
                    data-project-id="${escapeHTML(project.id)}"
                >
                    <span class="project-name">
                        ${escapeHTML(project.name)}
                    </span>
                </button>
            `;
        })
        .join("");


    const newProjectButton = document.createElement("button");

    newProjectButton.type = "button";
    newProjectButton.className = "new-project-btn";
    newProjectButton.id = "newProjectBtn";
    newProjectButton.textContent = "+ New Project";

    container.appendChild(newProjectButton);
}


/* =========================================================
   RENDER PROJECT PROGRESS
========================================================= */

export function renderProgress(
    progressText,
    progressFill,
    tasks
) {

    if (!Array.isArray(tasks)) {
        tasks = [];
    }

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.status === "Done"
    ).length;

    const percentage =
        total > 0
            ? Math.round((completed / total) * 100)
            : 0;


    if (progressText) {

        progressText.textContent =
            `${completed} of ${total} tasks done`;
    }


    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   KANBAN BOARD
========================================================= */

export function renderBoard(
    boardElements,
    tasks
) {

    if (!boardElements) {
        return;
    }

    const safeTasks = Array.isArray(tasks)
        ? tasks
        : [];


    const columns = {
        "To Do": boardElements.todoColumn,
        "In Progress": boardElements.inProgressColumn,
        "In Review": boardElements.inReviewColumn,
        "Done": boardElements.doneColumn
    };


    const counts = {
        "To Do": boardElements.todoCount,
        "In Progress": boardElements.inProgressCount,
        "In Review": boardElements.inReviewCount,
        "Done": boardElements.doneCount
    };


    Object.values(columns).forEach(column => {

        if (column) {
            column.innerHTML = "";
        }
    });


    Object.values(counts).forEach(count => {

        if (count) {
            count.textContent = "0";
        }
    });


    safeTasks.forEach(task => {

        const column = columns[task.status];

        if (!column) {
            return;
        }


        const boardCard =
            document.createElement("div");

        boardCard.className = "board-task";

        boardCard.draggable = true;

        boardCard.dataset.taskId = task.id;


        boardCard.innerHTML = `

            <div class="board-task-title">
                ${escapeHTML(task.text)}
            </div>

            <div class="board-task-meta">

                <span>
                    ${escapeHTML(task.category)}
                </span>

                <span>
                    ${escapeHTML(task.priority || "Normal")}
                </span>

            </div>

        `;


        column.appendChild(boardCard);


        if (counts[task.status]) {

            const current =
                Number(counts[task.status].textContent) || 0;

            counts[task.status].textContent =
                String(current + 1);
        }
    });
}


/* =========================================================
   TASK DETAIL
========================================================= */

export function renderTaskDetail(
    task,
    elements
) {

    if (!task || !elements) {
        return;
    }


    if (elements.title) {

        elements.title.value =
            task.text || "";
    }


    if (elements.description) {

        elements.description.value =
            task.description || "";
    }


    if (elements.status) {

        elements.status.textContent =
            task.status || "To Do";
    }


    if (elements.priority) {

        elements.priority.textContent =
            task.priority || "Normal";
    }


    if (elements.dueDate) {

        elements.dueDate.textContent =
            task.dueDate
                ? formatDate(task.dueDate)
                : "No due date";
    }


    if (elements.category) {

        elements.category.textContent =
            task.category || "Work";
    }


    if (elements.notes) {

        elements.notes.value =
            task.notes || "";
    }
}


/* =========================================================
   SUBTASKS
========================================================= */

export function renderSubtasks(
    container,
    subtasks
) {

    if (!container) {
        return;
    }

    const safeSubtasks =
        Array.isArray(subtasks)
            ? subtasks
            : [];


    if (safeSubtasks.length === 0) {

        container.innerHTML = `
            <p class="empty-subtasks">
                No subtasks yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        safeSubtasks
            .map(subtask => {

                const checked =
                    subtask.done
                        ? "checked"
                        : "";

                return `
                    <div
                        class="subtask-item"
                        data-subtask-id="${escapeHTML(subtask.id)}"
                    >

                        <label>

                            <input
                                type="checkbox"
                                class="subtask-checkbox"
                                data-subtask-id="${escapeHTML(subtask.id)}"
                                ${checked}
                            >

                            <span class="${
                                subtask.done
                                    ? "completed"
                                    : ""
                            }">
                                ${escapeHTML(subtask.text)}
                            </span>

                        </label>


                        <button
                            type="button"
                            class="delete-subtask-btn"
                            data-subtask-id="${escapeHTML(subtask.id)}"
                        >
                            Delete
                        </button>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   ADMIN USERS
========================================================= */

export function renderAdminUsers(
    container,
    users,
    taskStats = {}
) {

    if (!container) {
        return;
    }


    const safeUsers =
        Array.isArray(users)
            ? users
            : [];


    if (safeUsers.length === 0) {

        container.innerHTML = `
            <p class="empty-state-text">
                No users registered yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        safeUsers
            .map(user => {

                const stats =
                    taskStats[user.id] || {};

                const total =
                    Number(stats.total) || 0;

                const completed =
                    Number(stats.completed) || 0;

                const progress =
                    total > 0
                        ? Math.round(
                            (completed / total) * 100
                        )
                        : 0;


                return `
                    <div
                        class="admin-user-card"
                        data-user-id="${escapeHTML(user.id)}"
                    >

                        <div>

                            <h3>
                                ${escapeHTML(user.name)}
                            </h3>

                            <p>
                                ${escapeHTML(user.email)}
                            </p>

                        </div>


                        <div class="admin-user-stats">

                            <span>
                                ${total} Tasks
                            </span>

                            <span>
                                ${completed} Done
                            </span>

                            <span>
                                ${progress}%
                            </span>

                        </div>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   ADMIN REPORTS
========================================================= */

export function renderAdminReports(
    container,
    userStats
) {

    if (!container) {
        return;
    }


    const safeStats =
        Array.isArray(userStats)
            ? userStats
            : [];


    if (safeStats.length === 0) {

        container.innerHTML = `
            <p class="empty-state-text">
                No report data available.
            </p>
        `;

        return;
    }


    container.innerHTML =
        safeStats
            .map(item => {

                const user = item.user || {};

                const total =
                    Number(item.total) || 0;

                const completed =
                    Number(item.completed) || 0;

                const pending =
                    Number(item.pending) || 0;

                const progress =
                    total > 0
                        ? Math.round(
                            (completed / total) * 100
                        )
                        : 0;


                return `
                    <div class="report-card">

                        <div class="report-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        user.name ||
                                        "Unknown User"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        user.email || ""
                                    )}
                                </p>

                            </div>

                            <strong>
                                ${progress}%
                            </strong>

                        </div>


                        <div class="report-progress">

                            <div
                                class="report-progress-fill"
                                style="width:${progress}%"
                            ></div>

                        </div>


                        <div class="report-stats">

                            <span>
                                Total: ${total}
                            </span>

                            <span>
                                Completed: ${completed}
                            </span>

                            <span>
                                Pending: ${pending}
                            </span>

                        </div>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   ADMIN SUMMARY
========================================================= */

export function renderAdminSummary(
    elements,
    summary
) {

    if (!elements || !summary) {
        return;
    }


    if (elements.totalUsers) {

        elements.totalUsers.textContent =
            String(summary.totalUsers || 0);
    }


    if (elements.totalTasks) {

        elements.totalTasks.textContent =
            String(summary.totalTasks || 0);
    }


    if (elements.pendingTasks) {

        elements.pendingTasks.textContent =
            String(summary.pendingTasks || 0);
    }


    if (elements.completedTasks) {

        elements.completedTasks.textContent =
            String(summary.completedTasks || 0);
    }


    if (elements.todoTasks) {

        elements.todoTasks.textContent =
            String(summary.todoTasks || 0);
    }


    if (elements.inProgressTasks) {

        elements.inProgressTasks.textContent =
            String(summary.inProgressTasks || 0);
    }


    if (elements.inReviewTasks) {

        elements.inReviewTasks.textContent =
            String(summary.inReviewTasks || 0);
    }


    if (elements.doneTasks) {

        elements.doneTasks.textContent =
            String(summary.doneTasks || 0);
    }
}
