
const QUESTIONS_API_URL = "http://127.0.0.1:8000";

// ==============================
// API REQUEST
// ==============================
async function questionApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Please login first.");
    }

    const response = await fetch(`${QUESTIONS_API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "login.html";
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
// ESCAPE HTML
// ==============================
function escapeQuestionHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==============================
// ADD QUESTION FORM
// ==============================
function addQuestionForm() {
    const questionList = document.getElementById("questionList");

    if (!questionList) return;

    const card = document.createElement("div");

    // CSS classes from the reference styling
    card.className = "question-card question-box";

    card.innerHTML = `
        <hr>

        <h3>Question</h3>

        <label>Question:</label>
        <textarea class="questionText" required></textarea>

        <label>Option A:</label>
        <input type="text" class="optionA" required>

        <label>Option B:</label>
        <input type="text" class="optionB" required>

        <label>Option C:</label>
        <input type="text" class="optionC" required>

        <label>Option D:</label>
        <input type="text" class="optionD" required>

        <label>Correct Answer:</label>
        <select class="correctAnswer" required>
            <option value="">Select correct answer</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
        </select>

        <label>Marks:</label>
        <input type="number" class="questionMarks"
               value="1" min="1" required>

        <label>Time (seconds):</label>
        <input type="number" class="questionTime"
               value="30" min="1" required>

        <button type="button" class="removeQuestionButton">
            Remove Question
        </button>
    `;

    card.querySelector(".removeQuestionButton").addEventListener(
        "click",
        () => card.remove()
    );

    questionList.appendChild(card);
}

// ==============================
// INITIALIZE PAGE
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    const role = localStorage.getItem("role");

    // ADD QUESTIONS
    const questionForm = document.getElementById("questionForm");

    if (questionForm) {
        if (role !== "admin") {
            questionForm.innerHTML =
                "<p>Only admin can add questions.</p>";
            return;
        }

        addQuestionForm();

        questionForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const message = document.getElementById("questionMessage");
            const cards = questionForm.querySelectorAll(".question-card");

            if (cards.length === 0) {
                message.textContent = "Please add at least one question.";
                message.style.color = "red";
                return;
            }

            const submitButton = questionForm.querySelector(
                'button[type="submit"]'
            );

            let saved = 0;

            if (submitButton) submitButton.disabled = true;

            try {
                for (const card of cards) {
                    const questionData = {
                        question: card.querySelector(".questionText").value.trim(),
                        option_a: card.querySelector(".optionA").value.trim(),
                        option_b: card.querySelector(".optionB").value.trim(),
                        option_c: card.querySelector(".optionC").value.trim(),
                        option_d: card.querySelector(".optionD").value.trim(),
                        correct_answer: card.querySelector(".correctAnswer").value,
                        marks: Number(card.querySelector(".questionMarks").value),
                        time: Number(card.querySelector(".questionTime").value)
                    };

                    const result = await questionApiRequest(
                        "/quiz/questions",
                        {
                            method: "POST",
                            body: JSON.stringify(questionData)
                        }
                    );

                    if (/only admin/i.test(result.message || "")) {
                        throw new Error(result.message);
                    }

                    saved++;
                }

                message.textContent =
                    `${saved} question(s) added successfully!`;
                message.style.color = "green";

                questionForm.reset();
                document.getElementById("questionList").innerHTML = "";
                addQuestionForm();

            } catch (error) {
                message.textContent =
                    saved > 0
                        ? `${saved} question(s) saved. Error: ${error.message}`
                        : error.message;

                message.style.color = "red";
                console.error("Add question error:", error);

            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // DELETE QUESTION
    const deleteForm = document.getElementById("deleteForm");

    if (deleteForm) {
        if (role !== "admin") {
            deleteForm.innerHTML =
                "<p>Only admin can delete questions.</p>";
            return;
        }

        deleteForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const message = document.getElementById("deleteMessage");
            const questionId = document.getElementById("questionId").value.trim();

            const submitButton = deleteForm.querySelector(
                'button[type="submit"]'
            );

            if (submitButton) submitButton.disabled = true;

            try {
                const result = await questionApiRequest(
                    `/quiz/delete/${encodeURIComponent(questionId)}`,
                    { method: "DELETE" }
                );

                if (/only admin/i.test(result.message || "")) {
                    throw new Error(result.message);
                }

                message.textContent =
                    result.message || "Question deleted successfully.";

                message.style.color = "green";
                deleteForm.reset();

            } catch (error) {
                message.textContent = error.message;
                message.style.color = "red";
                console.error("Delete question error:", error);

            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }
});
