import {
    requireAdmin,
    logoutUser,
    registerUser,
    getAllUsers
} from "./auth.js";

import {
    loadTasksForUser,
    saveTasksForUser,
    loadProjectsForUser,
    saveProjectsForUser
} from "./storage.js";


/* =========================
   AUTH GUARD
   (Redirects to login.html if
   not logged in, or index.html
   if logged in but not an admin.)
========================= */

const currentAdmin = requireAdmin();

if (!currentAdmin) {

    throw new Error(
        "Not authorized - redirecting."
    );
}


/* =========================
   DOM ELEMENTS
========================= */

const currentUserLabel =
    document.getElementById(
        "currentUserLabel"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const addUserForm =
    document.getElementById(
        "addUserForm"
    );

const newUsername =
    document.getElementById(
        "newUsername"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const newRole =
    document.getElementById(
        "newRole"
    );

const addUserMessage =
    document.getElementById(
        "addUserMessage"
    );


const assignTaskForm =
    document.getElementById(
        "assignTaskForm"
    );

const assignUserSelect =
    document.getElementById(
        "assignUserSelect"
    );

const assignTaskText =
    document.getElementById(
        "assignTaskText"
    );

const assignCategory =
    document.getElementById(
        "assignCategory"
    );

const assignPriority =
    document.getElementById(
        "assignPriority"
    );

const assignStatus =
    document.getElementById(
        "assignStatus"
    );

const assignDueDate =
    document.getElementById(
        "assignDueDate"
    );

const assignTaskMessage =
    document.getElementById(
        "assignTaskMessage"
    );


const usersOverview =
    document.getElementById(
        "usersOverview"
    );


/* =========================
   HEADER
========================= */

if (currentUserLabel) {

    currentUserLabel.textContent =
        currentAdmin;
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            logoutUser();

            window.location.href =
                "login.html";
        }
    );
}


/* =========================
   INIT
========================= */

populateAssignUserSelect();

renderUsersOverview();


/* =========================
   ADD USER
========================= */

addUserForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const username =
            newUsername.value.trim();

        const password =
            newPassword.value;

        const role =
            newRole.value;

        const result =
            registerUser(
                username,
                password,
                role
            );

        if (!result.success) {

            showMessage(
                addUserMessage,
                result.message,
                true
            );

            return;
        }

        showMessage(
            addUserMessage,
            `User "${username}" created successfully.`,
            false
        );

        newUsername.value = "";
        newPassword.value = "";
        newRole.value = "user";

        populateAssignUserSelect();

        renderUsersOverview();
    }
);


/* =========================
   ASSIGN TASK
========================= */

assignTaskForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const targetUser =
            assignUserSelect.value;

        const text =
            assignTaskText.value.trim();

        if (!targetUser) {

            showMessage(
                assignTaskMessage,
                "Please add a user first.",
                true
            );

            return;
        }

        if (!text) {

            showMessage(
                assignTaskMessage,
                "Please enter a task.",
                true
            );

            return;
        }


        /*
           Make sure the target user
           has at least one project
           to hold the assigned task.
        */

        let projects =
            loadProjectsForUser(
                targetUser
            );

        if (projects.length === 0) {

            projects = [
                {
                    id:
                        crypto.randomUUID(),
                    name:
                        "My Project"
                }
            ];

            saveProjectsForUser(
                targetUser,
                projects
            );
        }

        const targetProjectId =
            projects[0].id;


        const tasks =
            loadTasksForUser(
                targetUser
            );

        tasks.push({

            id:
                crypto.randomUUID(),

            projectId:
                targetProjectId,

            text:
                text,

            category:
                assignCategory.value,

            status:
                assignStatus.value,

            done:
                assignStatus.value ===
                "Done",

            description:
                "",

            dueDate:
                assignDueDate.value ||
                "",

            priority:
                assignPriority.value,

            notes:
                "",

            subtasks:
                [],

            assignedBy:
                currentAdmin,

            createdAt:
                Date.now()
        });

        saveTasksForUser(
            targetUser,
            tasks
        );

        showMessage(
            assignTaskMessage,
            `Task assigned to "${targetUser}".`,
            false
        );

        assignTaskText.value = "";
        assignDueDate.value = "";
        assignStatus.value = "To Do";

        renderUsersOverview();
    }
);


/* =========================
   POPULATE "ASSIGN TO" DROPDOWN
========================= */

function populateAssignUserSelect() {

    const users =
        getAllUsers().filter(
            user =>
                user.username !==
                currentAdmin
        );

    assignUserSelect.innerHTML = "";

    if (users.length === 0) {

        const option =
            document.createElement(
                "option"
            );

        option.value = "";

        option.textContent =
            "No other users yet";

        assignUserSelect.appendChild(
            option
        );

        return;
    }

    users.forEach(user => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            user.username;

        option.textContent =
            `${user.username} (${user.role})`;

        assignUserSelect.appendChild(
            option
        );
    });
}


/* =========================
   RENDER USERS OVERVIEW
========================= */

function renderUsersOverview() {

    const users = getAllUsers();

    usersOverview.innerHTML = "";

    if (users.length === 0) {

        usersOverview.innerHTML =
            `<p class="admin-empty">No users yet.</p>`;

        return;
    }

    users.forEach(user => {

        const tasks =
            loadTasksForUser(
                user.username
            );

        const totalTasks =
            tasks.length;

        const doneTasks =
            tasks.filter(
                task =>
                    task.status === "Done"
            ).length;


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "user-row";

        row.innerHTML = `

            <div class="user-row-header">

                <div>

                    <strong>${escapeHTML(user.username)}</strong>

                    <span class="role-badge role-${escapeHTML(user.role)}">
                        ${escapeHTML(user.role)}
                    </span>

                    ${
                        user.username === currentAdmin
                            ? `<span class="you-badge">You</span>`
                            : ""
                    }

                </div>

                <span class="user-row-stats">
                    ${doneTasks} of ${totalTasks} tasks done
                </span>

            </div>

        `;


        if (totalTasks > 0) {

            const list =
                document.createElement(
                    "ul"
                );

            list.className =
                "user-task-list";

            tasks.forEach(task => {

                const item =
                    document.createElement(
                        "li"
                    );

                item.className =
                    "user-task-item";

                item.innerHTML = `

                    <span class="task-title">
                        ${escapeHTML(task.text)}
                    </span>

                    <span class="status-badge">
                        ${escapeHTML(task.status || "To Do")}
                    </span>

                    ${
                        task.assignedBy
                            ? `<span class="assigned-badge">Assigned by ${escapeHTML(task.assignedBy)}</span>`
                            : ""
                    }

                `;

                list.appendChild(item);
            });

            row.appendChild(list);

        } else {

            const emptyMessage =
                document.createElement(
                    "p"
                );

            emptyMessage.className =
                "user-task-empty";

            emptyMessage.textContent =
                "No tasks yet.";

            row.appendChild(
                emptyMessage
            );
        }


        usersOverview.appendChild(
            row
        );
    });
}


/* =========================
   MESSAGE HELPER
========================= */

function showMessage(
    element,
    text,
    isError
) {

    element.textContent = text;

    element.hidden = false;

    element.classList.toggle(
        "admin-message-error",
        Boolean(isError)
    );

    element.classList.toggle(
        "admin-message-success",
        !isError
    );
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(text ?? "");

    return div.innerHTML;
}
