
//const QUIZ_URL = "http://127.0.0.1:8000";
const QUIZ_URL = "https://codenixia-joining-16-09.onrender.com";

// ==============================
// COMMON FUNCTIONS
// ==============================

function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

function openPage(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==============================
// LEADERBOARD STYLES
// ==============================

function addRankConfettiStyles() {
    if (document.getElementById("rankConfettiStyles")) return;

    const style = document.createElement("style");
    style.id = "rankConfettiStyles";

    style.innerHTML = `
        .rank-cell {
            position: relative;
            overflow: visible !important;
        }

        .rank-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 70px;
        }

        .rank-value {
            position: relative;
            z-index: 2;
        }

        .rank-confetti {
            position: absolute;
            left: 50%;
            bottom: 100%;
            width: 1px;
            height: 1px;
            pointer-events: none;
            overflow: visible;
            z-index: 5;
        }

        .rank-confetti-piece {
            position: absolute;
            left: 0;
            top: 0;
            width: 6px;
            height: 10px;
            border-radius: 2px;
            animation: rankConfettiBurst 1.8s ease-out forwards;
        }

        @keyframes rankConfettiBurst {
            0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 1;
            }

            100% {
                transform: translate(var(--x), var(--y))
                           rotate(var(--rotation));
                opacity: 0;
            }
        }
    `;

    document.head.appendChild(style);
}

// ==============================
// API REQUEST
// ==============================

async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
        logout();
        throw new Error("Please login first.");
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
        throw new Error(
            data.detail || data.message || "Request failed."
        );
    }

    return data;
}

// ==============================
// PAGE INITIALIZATION
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }

    const dashboard = document.getElementById("dashboardPage");

    if (dashboard) {
        const role = getRole();
        const roleElement = document.getElementById("userRole");

        if (roleElement) {
            roleElement.textContent = role || "User";
        }

        const addButton =
            document.getElementById("addQuestionButton");

        const deleteButton =
            document.getElementById("deleteQuestionButton");

        if (role !== "admin") {
            if (addButton) addButton.style.display = "none";
            if (deleteButton) deleteButton.style.display = "none";
        }

        if (role === "student") {
            const getQuestionsButton =
                document.getElementById("getQuestionsButton");

            if (getQuestionsButton) {
                getQuestionsButton.style.display = "none";
            }

            const options = dashboard.querySelector(".options");

            if (
                options &&
                !document.getElementById("startQuizButton")
            ) {
                const quizButton = document.createElement("button");

                quizButton.id = "startQuizButton";
                quizButton.textContent = "Start Quiz";

                quizButton.onclick = () => {
                    openPage("get_questions.html");
                };

                options.insertBefore(quizButton, options.firstChild);
            }
        }

        loadLeaderboard();
    }

    if (
        document.getElementById("leaderboardBody") &&
        !dashboard
    ) {
        loadLeaderboard();
    }

    if (document.getElementById("quizForm")) {
        loadQuizQuestions();
        setupQuizSubmit();
    }
});

// ==============================
// LEADERBOARD
// ==============================

async function loadLeaderboard() {
    const tbody = document.getElementById("leaderboardBody");

    if (!tbody) return;

    addRankConfettiStyles();

    tbody.innerHTML =
        "<tr><td colspan='4'>Loading leaderboard...</td></tr>";

    try {
        const data = await apiRequest("/quiz/leadrbord");
        const students = data.leaderboard || [];

        if (!students.length) {
            tbody.innerHTML =
                "<tr><td colspan='4'>No results available.</td></tr>";
            return;
        }

        tbody.innerHTML = students.map((student, index) => {
            let rankHTML;

            if (index === 0) {
                rankHTML = `
                    <div class="rank-wrapper">
                        <div class="rank-confetti"></div>
                        <span class="rank-value">🏆 1</span>
                    </div>`;
            } else if (index === 1) {
                rankHTML = "🥈 2";
            } else if (index === 2) {
                rankHTML = "🥉 3";
            } else {
                rankHTML = index + 1;
            }

            return `
                <tr>
                    <td class="rank-cell">${rankHTML}</td>
                    <td>${escapeHTML(
                        student.name || student.email || "Student"
                    )}</td>
                    <td>${escapeHTML(student.marks ?? 0)}</td>
                    <td>${formatTime(Number(student.total_time ?? 0))}</td>
                </tr>`;
        }).join("");

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">${escapeHTML(error.message)}</td>
            </tr>`;

        console.error("Leaderboard error:", error);
    }
}
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return minutes > 0
        ? `${minutes} min ${remainingSeconds} sec`
        : `${remainingSeconds} sec`;
}

// ==============================
// QUIZ VARIABLES
// ==============================

let quizQuestions = [];
let currentQuestionIndex = 0;
let questionTimerInterval = null;
let questionStartedAt = 0;
let remainingSeconds = 0;
let quizAnswers = [];
let quizSubmitted = false;

// ==============================
// QUESTION TIME
// ==============================

function getQuestionTime(question) {
    const value = Number(question.time);

    if (Number.isFinite(value) && value > 0) {
        return Math.floor(value);
    }

    return 30;
}

// ==============================
// LOAD QUIZ QUESTIONS
// ==============================

async function loadQuizQuestions() {
    const container =
        document.getElementById("questionsContainer");

    if (!container) return;

    container.innerHTML = "<p>Loading questions...</p>";

    try {
        const data = await apiRequest("/quiz/get");

        quizQuestions = data.question || [];

        if (!quizQuestions.length) {
            container.innerHTML =
                "<p>No questions available.</p>";
            return;
        }

        currentQuestionIndex = 0;
        quizAnswers = quizQuestions.map(() => null);
        quizSubmitted = false;

        renderCurrentQuestion();

    } catch (error) {
        container.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;

        console.error("Load questions error:", error);
    }
}

// ==============================
// DISPLAY ONE QUESTION
// ==============================

function renderCurrentQuestion() {
    const container =
        document.getElementById("questionsContainer");

    const form = document.getElementById("quizForm");

    if (
        !container ||
        !form ||
        !quizQuestions.length ||
        quizSubmitted
    ) {
        return;
    }

    clearInterval(questionTimerInterval);

    const q = quizQuestions[currentQuestionIndex];

    remainingSeconds = getQuestionTime(q);
    questionStartedAt = Date.now();

    const savedAnswer =
        quizAnswers[currentQuestionIndex]?.answer || "";

    const optionsHTML = ["a", "b", "c", "d"].map(option => `
        <label>
            <input
                type="radio"
                name="answer_${q.id}"
                value="${option.toUpperCase()}"
                ${savedAnswer === option.toUpperCase() ? "checked" : ""}
            >
            ${escapeHTML(q[`option_${option}`])}
        </label>
        <br>
    `).join("");

    container.innerHTML = `
        <div class="quiz-progress">
            Question ${currentQuestionIndex + 1}
            of ${quizQuestions.length}
        </div>

        <div
            class="quiz-timer"
            id="questionTimer"
            role="status"
            aria-live="polite"
        >
            Time remaining: ${remainingSeconds} seconds
        </div>

        <div class="question-card question-box">
            <h3>
                ${currentQuestionIndex + 1}.
                ${escapeHTML(q.question)}
            </h3>

            <p>Marks: ${escapeHTML(q.marks ?? 1)}</p>

            <div>${optionsHTML}</div>
        </div>

        <div class="quiz-navigation">
            <button type="button" id="skipQuestionButton">
                Skip
            </button>

            <button type="button" id="nextQuestionButton">
                ${
                    currentQuestionIndex === quizQuestions.length - 1
                        ? "Finish Quiz"
                        : "Next"
                }
            </button>
        </div>
    `;

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
        submitButton.style.display = "none";
    }

    document
        .getElementById("skipQuestionButton")
        .addEventListener("click", () => {
            saveCurrentAnswer(true);
            goToNextQuestion();
        });

    document
        .getElementById("nextQuestionButton")
        .addEventListener("click", () => {
            const selected = form.querySelector(
                `input[name="answer_${q.id}"]:checked`
            );

            if (!selected) {
                alert("Select an answer or click Skip.");
                return;
            }

            saveCurrentAnswer(false);
            goToNextQuestion();
        });

    startQuestionTimer();
}

// ==============================
// START COUNTDOWN TIMER
// ==============================

function startQuestionTimer() {
    updateQuestionTimerDisplay();

    questionTimerInterval = setInterval(() => {
        remainingSeconds -= 1;

        updateQuestionTimerDisplay();

        if (remainingSeconds <= 0) {
            clearInterval(questionTimerInterval);

            saveCurrentAnswer(true);
            goToNextQuestion();
        }
    }, 1000);
}

// ==============================
// UPDATE TIMER DISPLAY
// ==============================

function updateQuestionTimerDisplay() {
    const timerElement =
        document.getElementById("questionTimer");

    if (timerElement) {
        timerElement.textContent =
            `Time remaining: ${Math.max(0, remainingSeconds)} seconds`;

        if (remainingSeconds <= 5) {
            timerElement.style.color = "red";
        }
    }
}

// ==============================
// SAVE CURRENT ANSWER AND TIME
// ==============================

function saveCurrentAnswer(skipped) {
    const form = document.getElementById("quizForm");
    const q = quizQuestions[currentQuestionIndex];

    if (
        !form ||
        !q ||
        quizAnswers[currentQuestionIndex]
    ) {
        return;
    }

    const selected = form.querySelector(
        `input[name="answer_${q.id}"]:checked`
    );

    const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - questionStartedAt) / 1000)
    );

    quizAnswers[currentQuestionIndex] = {
        question_id: q.id,
        answer: skipped
            ? "SKIPPED"
            : selected?.value || "SKIPPED",
        time: Math.min(
            getQuestionTime(q),
            elapsedSeconds
        )
    };
}

// ==============================
// NEXT QUESTION
// ==============================

function goToNextQuestion() {
    clearInterval(questionTimerInterval);

    if (quizSubmitted) return;

    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex += 1;
        renderCurrentQuestion();
    } else {
        submitQuiz();
    }
}

// ==============================
// QUIZ SUBMIT EVENT
// ==============================

function setupQuizSubmit() {
    const form = document.getElementById("quizForm");

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (
            quizSubmitted ||
            !quizQuestions.length ||
            currentQuestionIndex !== quizQuestions.length - 1
        ) {
            return;
        }

        const q = quizQuestions[currentQuestionIndex];

        const selected = form.querySelector(
            `input[name="answer_${q.id}"]:checked`
        );

        if (!selected) {
            alert("Select an answer or click Skip.");
            return;
        }

        saveCurrentAnswer(false);
        submitQuiz();
    });
}

// ==============================
// SUBMIT QUIZ TO BACKEND
// ==============================

async function submitQuiz() {
    if (quizSubmitted) return;

    clearInterval(questionTimerInterval);

    quizAnswers = quizAnswers.map((answer, index) => {
        return answer || {
            question_id: quizQuestions[index].id,
            answer: "SKIPPED",
            time: 0
        };
    });

    const form = document.getElementById("quizForm");

    const container =
        document.getElementById("questionsContainer");

    const navigation =
        container?.querySelector(".quiz-navigation");

    if (navigation) {
        navigation.remove();
    }

    if (container) {
        container.insertAdjacentHTML(
            "beforeend",
            "<p>Submitting quiz...</p>"
        );
    }

    const buttons =
        form?.querySelectorAll(
            "button, input[type='submit']"
        ) || [];

    buttons.forEach(button => {
        button.disabled = true;
    });

    quizSubmitted = true;

    try {
        const result = await apiRequest("/quiz/submit", {
            method: "POST",
            body: JSON.stringify({
                answers: quizAnswers
            })
        });

        // alert(
        //     `Quiz submitted!\n` +
        //     `Correct: ${result.correct}\n` +
        //     `Wrong: ${result.wrong}\n` +
        //     `Marks: ${result.marks}\n` +
        //     `Result: ${result.result}\n` +
        //     `Time: ${result.time} seconds`
        // );

//       
//showReport();
localStorage.setItem("quizResult", JSON.stringify(result));

window.location.replace(
    new URL("report.html", window.location.href).href
);

    } catch (error) {
        quizSubmitted = false;

        alert(error.message);

        if (container) {
            const message =
                container.querySelector("p:last-child");

            if (message) {
                message.textContent =
                    "Quiz submission failed. Please try again.";
            }
        }

        buttons.forEach(button => {
            button.disabled = false;
        });

        console.error("Quiz submission error:", error);
    }
}
