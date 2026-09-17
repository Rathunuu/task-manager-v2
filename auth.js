/* =========================
   AUTH STORAGE KEYS
========================= */

const USERS_KEY = "task-manager-users";
const SESSION_KEY = "task-manager-current-user";


/* =========================
   SIMPLE HASH
   (Not cryptographically secure -
   fine for a client-only student
   project. Never use this for a
   real production login system.)
========================= */

function simpleHash(text) {

    let hash = 0;

    for (let i = 0; i < text.length; i++) {

        hash =
            (hash << 5) -
            hash +
            text.charCodeAt(i);

        hash |= 0;
    }

    return hash.toString(36);
}


/* =========================
   LOAD / SAVE USERS
========================= */

export function loadUsers() {

    const stored =
        localStorage.getItem(USERS_KEY);

    if (!stored) {
        return [];
    }

    try {

        const users =
            JSON.parse(stored);

        return Array.isArray(users)
            ? users
            : [];

    } catch (error) {

        console.error(
            "Could not load users:",
            error
        );

        return [];
    }
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


/* =========================
   REGISTER
========================= */

export function registerUser(
    username,
    password,
    role = "user"
) {

    username =
        String(username || "").trim();

    /*
       Only "admin" or "user" are
       valid roles. Anything else
       falls back to "user".
    */

    role =
        role === "admin"
            ? "admin"
            : "user";

    if (!username || !password) {

        return {
            success: false,
            message:
                "Username and password are required."
        };
    }

    const users = loadUsers();

    const alreadyExists =
        users.some(
            user =>
                user.username.toLowerCase() ===
                username.toLowerCase()
        );

    if (alreadyExists) {

        return {
            success: false,
            message:
                "That username is already taken."
        };
    }

    users.push({
        username,
        passwordHash:
            simpleHash(password),
        role
    });

    saveUsers(users);

    return { success: true };
}


/* =========================
   LOGIN
========================= */

export function loginUser(
    username,
    password
) {

    username =
        String(username || "").trim();

    const users = loadUsers();

    const user =
        users.find(
            item =>
                item.username.toLowerCase() ===
                username.toLowerCase()
        );

    if (
        !user ||
        user.passwordHash !==
            simpleHash(password)
    ) {

        return {
            success: false,
            message:
                "Invalid username or password."
        };
    }

    sessionStorage.setItem(
        SESSION_KEY,
        user.username
    );

    return { success: true };
}


/* =========================
   CURRENT USER / SESSION
========================= */

export function getCurrentUser() {

    return sessionStorage.getItem(
        SESSION_KEY
    );
}


export function logoutUser() {

    sessionStorage.removeItem(
        SESSION_KEY
    );
}


/*
   Call this at the top of any
   protected page. Redirects to
   login.html if nobody is logged in.
*/

export function requireAuth() {

    const user = getCurrentUser();

    if (!user) {

        window.location.href =
            "login.html";

        return null;
    }

    return user;
}


/* =========================
   ROLES
========================= */

export function getCurrentUserRole() {

    const username =
        getCurrentUser();

    if (!username) {
        return null;
    }

    const users = loadUsers();

    const user =
        users.find(
            item =>
                item.username ===
                username
        );

    /*
       Users created before roles
       existed default to "user".
    */

    return user
        ? (user.role || "user")
        : "user";
}


/*
   Returns every registered user
   without their password hashes -
   safe to show on the admin page.
*/

export function getAllUsers() {

    return loadUsers().map(
        user => ({
            username:
                user.username,
            role:
                user.role || "user"
        })
    );
}


/*
   Call this at the top of the
   admin page. Sends non-admins
   back to index.html.
*/

export function requireAdmin() {

    const username =
        requireAuth();

    if (!username) {

        /*
           requireAuth() already
           redirected to login.html.
        */

        return null;
    }

    const role =
        getCurrentUserRole();

    if (role !== "admin") {

        window.location.href =
            "index.html";

        return null;
    }

    return username;
}
