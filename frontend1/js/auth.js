
const API_URL = "http://127.0.0.1:8000";

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("registerMessage");

        const userData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            college: document.getElementById("college").value.trim(),
            division: document.getElementById("division").value.trim(),
            degree: document.getElementById("degree").value.trim(),
            role: document.getElementById("role").value,
            password: document.getElementById("password").value
        };

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Registration failed");
            }

            if (message) {
                message.textContent = "Registration successful!";
            }

            registerForm.reset();

            // Open login page after successful registration
            window.location.href = "login.html";

        } catch (error) {
            if (message) {
                message.textContent = error.message;
            }
        }
    });
}


// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("loginMessage");

        const loginData = {
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        };

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);

            if (message) {
                message.textContent = "Login successful!";
            }

            if (data.role === "admin" || data.role === "student") {
                window.location.href = "dashboard.html";
            } else {
                if (message) {
                    message.textContent = "Unknown user role";
                }
            }

        } catch (error) {
            if (message) {
                message.textContent = error.message;
            }
        }
    });
}
