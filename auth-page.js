import {
    registerUser,
    loginUser,
    getCurrentUser
} from "./auth.js";


/* =========================
   ALREADY LOGGED IN?
========================= */

if (getCurrentUser()) {

    window.location.href =
        "index.html";
}


/* =========================
   STATE
========================= */

let mode = "login";


/* =========================
   DOM ELEMENTS
========================= */

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authForm =
    document.getElementById("authForm");

const usernameInput =
    document.getElementById("usernameInput");

const passwordInput =
    document.getElementById("passwordInput");

const authSubmitBtn =
    document.getElementById("authSubmitBtn");

const authToggleBtn =
    document.getElementById("authToggleBtn");

const authToggleLabel =
    document.getElementById("authToggleLabel");

const authError =
    document.getElementById("authError");

const roleGroup =
    document.getElementById("roleGroup");

const roleSelect =
    document.getElementById("roleSelect");


/* =========================
   UPDATE UI FOR MODE
========================= */

function updateUIForMode() {

    if (mode === "login") {

        authTitle.textContent =
            "Welcome Back";

        authSubtitle.textContent =
            "Log in to manage your tasks.";

        authSubmitBtn.textContent =
            "Log In";

        authToggleLabel.textContent =
            "Don't have an account?";

        authToggleBtn.textContent =
            "Sign Up";

        if (roleGroup) {
            roleGroup.hidden = true;
        }

    } else {

        authTitle.textContent =
            "Create Account";

        authSubtitle.textContent =
            "Sign up to start managing your tasks.";

        authSubmitBtn.textContent =
            "Sign Up";

        authToggleLabel.textContent =
            "Already have an account?";

        authToggleBtn.textContent =
            "Log In";

        if (roleGroup) {
            roleGroup.hidden = false;
        }
    }

    hideError();
}


/* =========================
   TOGGLE LOGIN / SIGNUP
========================= */

authToggleBtn.addEventListener(
    "click",
    () => {

        mode =
            mode === "login"
                ? "signup"
                : "login";

        updateUIForMode();
    }
);


/* =========================
   SUBMIT FORM
========================= */

authForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        if (!username || !password) {

            showError(
                "Please fill in both fields."
            );

            return;
        }


        if (mode === "login") {

            const result =
                loginUser(
                    username,
                    password
                );

            if (!result.success) {

                showError(
                    result.message
                );

                return;
            }

            window.location.href =
                "index.html";

        } else {

            const selectedRole =
                roleSelect
                    ? roleSelect.value
                    : "user";

            const registerResult =
                registerUser(
                    username,
                    password,
                    selectedRole
                );

            if (!registerResult.success) {

                showError(
                    registerResult.message
                );

                return;
            }


            const loginResult =
                loginUser(
                    username,
                    password
                );

            if (loginResult.success) {

                window.location.href =
                    "index.html";

            } else {

                mode = "login";

                updateUIForMode();

                showError(
                    "Account created. Please log in."
                );
            }
        }
    }
);


/* =========================
   ERROR HELPERS
========================= */

function showError(message) {

    authError.textContent =
        message;

    authError.hidden = false;
}


function hideError() {

    authError.hidden = true;

    authError.textContent = "";
}


/* =========================
   INIT
========================= */

updateUIForMode();
