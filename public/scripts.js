// Load User Data from Backend
async function loadUserData() {
    const loading = document.getElementById("loading");
    const userGrid = document.getElementById("userGrid");
    const emptyState = document.getElementById("emptyState");

    loading.style.display = "block";
    userGrid.innerHTML = "";
    emptyState.style.display = "none";

    try {
        const response = await fetch('/api/candidates');

        if (!response.ok) {
            throw new Error("Failed to fetch data from Airtable");
        }

        const data = await response.json();
        allUsers = data.records || [];

        displayUsers(allUsers);
        updateStats();
    } catch (error) {
        console.error("Error loading data from Airtable:", error);
        emptyState.style.display = "block";
        document.querySelector("#emptyState h3").textContent = "Error Loading Data";
        document.querySelector("#emptyState p").textContent = "Failed to load candidate data from Airtable. Please check your connection and try again.";
    }

    loading.style.display = "none";
}

// Display Users in Grid
function displayUsers(users) {
    const userGrid = document.getElementById("userGrid");
    const emptyState = document.getElementById("emptyState");

    if (users.length === 0) {
        userGrid.innerHTML = "";
        emptyState.style.display = "block";
        document.querySelector("#emptyState h3").textContent = "No Candidates Found";
        document.querySelector("#emptyState p").textContent = "No candidate data available yet.";
        return;
    }

    emptyState.style.display = "none";
    userGrid.innerHTML = users.map((user) => createUserCard(user)).join("");

    // Attach event listeners
    userGrid.querySelectorAll(".user-card").forEach((card) => {
        const userId = card.getAttribute("data-userid");
        const user = allUsers.find((u) => u.id === userId);
        if (!user) return;

        const viewBtn = card.querySelector("[data-action='view-details']");
        if (viewBtn) {
            viewBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                viewDetails(user);
            });
        }

        const editBtn = card.querySelector("[data-action='edit']");
        if (editBtn) {
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                editUser(user);
            });
        }

        const deleteBtn = card.querySelector("[data-action='delete']");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteUser(user);
            });
        }

        const checkbox = card.querySelector(".select-user-checkbox");
        if (checkbox) {
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }

        card.addEventListener("click", () => {
            viewDetails(user);
        });
    });
}

// Create User Card HTML
function createUserCard(user) {
    const fields = user.fields || user;
    const name = fields.Name || "Unknown";
    const email = fields.email || "N/A";
    const phone = fields.number || "N/A";
    const profession = fields.profession || "N/A";
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return `
        <div class="user-card" data-userid="${user.id}">
            <input type="checkbox" class="select-user-checkbox" data-id="${user.id}">
            <div class="user-header">
                <div class="avatar">${initials}</div>
                <div class="user-info">
                    <h3>${name}</h3>
                    <div class="user-profession">${profession}</div>
                </div>
            </div>
            <div class="info-row">
                <span class="info-icon">📧</span>
                <span>${email}</span>
            </div>
            <div class="info-row">
                <span class="info-icon">📱</span>
                <span>${phone}</span>
            </div>
            <button class="view-details-btn" data-action="view-details">View Full Details</button>
            <div class="action-buttons">
                <button class="edit-btn" data-action="edit">Edit</button>
                <button class="delete-btn" data-action="delete">Delete</button>
            </div>
        </div>
    `;
}

// View User Details
function viewDetails(user) {
    currentUser = user;
    const fields = user.fields || user;
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = fields.Name || "Candidate Details";

    let html = `
        <div class="detail-section">
            <h3>📋 Basic Information</h3>
            <div class="detail-content">
                <p><strong>Email:</strong> ${fields.email || "N/A"}</p>
                <p><strong>Phone:</strong> ${fields.number || "N/A"}</p>
                <p><strong>Profession:</strong> ${fields.profession || "N/A"}</p>
            </div>
        </div>
        <div class="detail-section">
            <h3>🎓 Education</h3>
            <div class="detail-content">
                <p>${fields.education || "N/A"}</p>
            </div>
        </div>
        <div class="detail-section">
            <h3>💼 Experience</h3>
            <div class="detail-content">
                <p>${fields.Experience || "N/A"}</p>
            </div>
        </div>
        <div class="detail-section">
            <h3>🛠️ Skills</h3>
            <div class="detail-content">
                ${fields.skills ? fields.skills.split(",").map(skill => `<span class="tag">${skill.trim()}</span>`).join("") : "N/A"}
            </div>
        </div>
        <div class="detail-section">
            <h3>🚀 Projects</h3>
            <div class="detail-content">
                <p>${fields.Project || "N/A"}</p>
            </div>
        </div>
        <div class="detail-section">
            <h3>🎤 Interview URL</h3>
            <div class="detail-content">
                ${fields.Interview_url ? `<a href="${fields.Interview_url}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">${fields.Interview_url}</a>` : "<p>N/A</p>"}
            </div>
        </div>
    `;

    if (fields.PrimarySkillsQuestions) {
        html += createQuestionSection("Primary Skills Questions", fields.PrimarySkillsQuestions);
    }
    if (fields.SecondarySkillsQuestions) {
        html += createQuestionSection("Secondary Skills Questions", fields.SecondarySkillsQuestions);
    }
    if (fields.ProjectBasedQuestions) {
        html += createQuestionSection("Project-Based Questions", fields.ProjectBasedQuestions);
    }
    if (fields.ScenarioBasedQuestions) {
        html += createQuestionSection("Scenario-Based Questions", fields.ScenarioBasedQuestions);
    }
    if (fields.DebuggingQuestions) {
        html += createQuestionSection("Debugging Questions", fields.DebuggingQuestions);
    }

    // Add Regenerate Questions button at the bottom
    html += `
        <div class="detail-section" style="text-align: center; margin-top: 2rem;">
            <button id="regenerateFromModal" class="regenerate-btn" style="padding: 12px 32px; font-size: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                🔄 Regenerate Interview Questions
            </button>
        </div>
    `;

    modalBody.innerHTML = html;
    modal.classList.add("show");

    // Add event listener for the regenerate button in modal
    const regenerateBtn = document.getElementById("regenerateFromModal");
    if (regenerateBtn) {
        regenerateBtn.addEventListener("click", () => {
            closeModal();
            openRegenerateModal(user);
        });
        
        // Add hover effect
        regenerateBtn.addEventListener("mouseenter", function() {
            this.style.transform = "translateY(-2px)";
            this.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
        });
        
        regenerateBtn.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
            this.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
        });
    }
}

// Create Question Section
function createQuestionSection(title, questions) {
    const questionList = questions.split(/\d+\.\s/).filter((q) => q.trim());

    return `
        <div class="detail-section">
            <h3>❓ ${title}</h3>
            <div class="detail-content">
                <div class="question-list">
                    ${questionList.map((q, i) => `<div class="question-item"><strong>Q${i + 1}:</strong> ${q.trim()}</div>`).join("")}
                </div>
            </div>
        </div>
    `;
}

// Close Modal
function closeModal() {
    document.getElementById("modal").classList.remove("show");
}

// Update Statistics
function updateStats() {
    document.getElementById("totalUsers").textContent = allUsers.length;

    let totalQuestions = 0;
    allUsers.forEach((user) => {
        const fields = user.fields || user;
        ["PrimarySkillsQuestions", "SecondarySkillsQuestions", "ProjectBasedQuestions", "ScenarioBasedQuestions", "DebuggingQuestions"].forEach((key) => {
            if (fields[key]) {
                totalQuestions += fields[key].split(/\d+\.\s/).filter((q) => q.trim()).length;
            }
        });
    });
    document.getElementById("totalQuestions").textContent = totalQuestions;
}

// Search Functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allUsers.filter((user) => {
        const fields = user.fields || user;
        return (
            (fields.Name || "").toLowerCase().includes(searchTerm) ||
            (fields.email || "").toLowerCase().includes(searchTerm) ||
            (fields.skills || "").toLowerCase().includes(searchTerm) ||
            (fields.profession || "").toLowerCase().includes(searchTerm)
        );
    });
    displayUsers(filtered);
});

// Export Data to CSV
function exportData() {
    const csv = convertToCSV(allUsers);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
}

function convertToCSV(data) {
    const headers = ["Name", "Email", "Phone", "Profession", "Education", "Experience", "Skills"];
    let csv = headers.join(",") + "\n";

    data.forEach((user) => {
        const fields = user.fields || user;
        const row = [
            fields.Name || "",
            fields.email || "",
            fields.number || "",
            fields.profession || "",
            (fields.education || "").replace(/,/g, ";"),
            (fields.Experience || "").replace(/,/g, ";"),
            (fields.skills || "").replace(/,/g, ";"),
        ];
        csv += row.map((field) => `"${field}"`).join(",") + "\n";
    });

    return csv;
}

// Delete User
async function deleteUser(user) {
    const name = (user.fields && user.fields.Name) || "Unknown";
    if (confirm(`Are you sure you want to delete candidate "${name}"? This action cannot be undone.`)) {
        try {
            const response = await fetch(
                `/api/candidates/${user.id}`,
                {
                    method: "DELETE"
                }
            );
            if (!response.ok) {
                throw new Error("Failed to delete candidate: " + response.statusText);
            }
            alert(`Candidate "${name}" deleted successfully.`);
            await loadUserData();
        } catch (error) {
            alert("Error deleting candidate: " + error.message);
            console.error("Delete error:", error);
        }
    }
}

async function deleteUserById(id) {
    try {
        await fetch(
            `/api/candidates/${id}`,
            {
                method: "DELETE"
            }
        );
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

async function deleteSelected() {
    const checkedBoxes = document.querySelectorAll(".select-user-checkbox:checked");

    if (checkedBoxes.length === 0) {
        alert("⚠ No users selected.");
        return;
    }

    if (!confirm(`Are you sure you want to delete ${checkedBoxes.length} selected users?`)) return;

    for (const box of checkedBoxes) {
        await deleteUserById(box.dataset.id);
    }

    alert("✓ Selected users deleted.");
    loadUserData();
}

async function deleteAll() {
    if (!confirm("⚠️ This will delete ALL users. Proceed?")) return;

    const allBoxes = document.querySelectorAll(".select-user-checkbox");

    for (const box of allBoxes) {
        await deleteUserById(box.dataset.id);
    }

    alert("🗑️ All users deleted.");
    loadUserData();
}

// Edit User
function editUser(user) {
    currentUser = user;
    const fields = user.fields || {};

    document.getElementById("editName").value = fields.Name || "";
    document.getElementById("editEmail").value = fields.email || "";
    document.getElementById("editPhone").value = fields.number || "";
    document.getElementById("editProfession").value = fields.profession || "";
    document.getElementById("editEducation").value = fields.education || "";
    document.getElementById("editExperience").value = fields.Experience || "";
    document.getElementById("editSkills").value = fields.skills || "";
    document.getElementById("editProjects").value = fields.Project || "";
    document.getElementById("editInterviewURL").value = fields.Interview_url || "";

    document.getElementById("editError").textContent = "";
    document.getElementById("editError").classList.remove("show");

    document.getElementById("editModal").classList.add("show");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("show");
}

document.getElementById("editForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const errorElement = document.getElementById("editError");
    errorElement.textContent = "";
    errorElement.classList.remove("show");

    const formData = {
        fields: {
            Name: document.getElementById("editName").value.trim(),
            email: document.getElementById("editEmail").value.trim(),
            number: document.getElementById("editPhone").value.trim(),
            profession: document.getElementById("editProfession").value.trim(),
            education: document.getElementById("editEducation").value.trim(),
            Experience: document.getElementById("editExperience").value.trim(),
            skills: document.getElementById("editSkills").value.trim(),
            Project: document.getElementById("editProjects").value.trim(),
            Interview_url: document.getElementById("editInterviewURL").value.trim(),
        },
    };

    if (!formData.fields.Name) {
        errorElement.textContent = "Name is required.";
        errorElement.classList.add("show");
        return;
    }
    if (!formData.fields.email) {
        errorElement.textContent = "Email is required.";
        errorElement.classList.add("show");
        return;
    }

    try {
        const response = await fetch(
            `/api/candidates/${currentUser.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update candidate: ${errorText || response.statusText}`);
        }

        alert("Candidate updated successfully.");
        closeEditModal();
        await loadUserData();
    } catch (error) {
        errorElement.textContent = error.message || "Error updating candidate.";
        errorElement.classList.add("show");
        console.error("Update error:", error);
    }
});

// Upload Modal Functions
function openUploadModal() {
    document.getElementById("uploadModal").classList.add("show");
    resetUploadForm();
}

function closeUploadModal() {
    document.getElementById("uploadModal").classList.remove("show");
    resetUploadForm();
}

function resetUploadForm() {
    selectedFile = null;
    document.getElementById("fileInputModal").value = "";
    document.getElementById("fileInfoModal").classList.remove("show");
    document.getElementById("generateBtnModal").classList.remove("show");
    document.getElementById("loadingModal").classList.remove("show");
    document.getElementById("successMessage").classList.remove("show");
    document.getElementById("errorMessage").classList.remove("show");
}

const uploadAreaModal = document.getElementById("uploadAreaModal");
const fileInputModal = document.getElementById("fileInputModal");
const fileInfoModal = document.getElementById("fileInfoModal");
const fileNameModal = document.getElementById("fileNameModal");
const removeBtnModal = document.getElementById("removeBtnModal");
const generateBtnModal = document.getElementById("generateBtnModal");

uploadAreaModal.addEventListener("click", () => fileInputModal.click());

uploadAreaModal.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadAreaModal.classList.add("dragover");
});

uploadAreaModal.addEventListener("dragleave", () => {
    uploadAreaModal.classList.remove("dragover");
});

uploadAreaModal.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadAreaModal.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

fileInputModal.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

removeBtnModal.addEventListener("click", () => {
    selectedFile = null;
    fileInputModal.value = "";
    fileInfoModal.classList.remove("show");
    generateBtnModal.classList.remove("show");
    document.getElementById("errorMessage").classList.remove("show");
});

function handleFileUpload(file) {
    const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        showUploadError("Please upload a PDF, DOC, or DOCX file.");
        return;
    }

    if (file.size > maxSize) {
        showUploadError("File size must be less than 10MB.");
        return;
    }

    selectedFile = file;
    fileNameModal.textContent = file.name;
    fileInfoModal.classList.add("show");
    generateBtnModal.classList.add("show");
    document.getElementById("errorMessage").classList.remove("show");
}

generateBtnModal.addEventListener("click", async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const loadingModalElement = document.getElementById("loadingModal");
    const successMessageElement = document.getElementById("successMessage");
    const errorMessageElement = document.getElementById("errorMessage");

    loadingModalElement.classList.add("show");
    generateBtnModal.disabled = true;
    errorMessageElement.classList.remove("show");
    successMessageElement.classList.remove("show");

    try {
        // Add recordId to formData if not present
        if (!formData.has('recordId')) {
            formData.append('recordId', 'temp-record-id'); // Placeholder, should be dynamic
        }

        const webhookPromise = fetch(
            "/api/admin/upload-resume",
            {
                method: "POST",
                body: formData,
            }
        );

        const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 30000));

        const [response] = await Promise.all([webhookPromise, minWaitPromise]);

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`Server error (${response.status}): ${errorText || "Failed to process resume"}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { success: true };
        }

        console.log("Resume processed successfully:", data);

        loadingModalElement.classList.remove("show");
        successMessageElement.classList.add("show");

        setTimeout(async () => {
            successMessageElement.classList.remove("show");
            await loadUserData();
            setTimeout(() => {
                closeUploadModal();
            }, 500);
        }, 2000);
    } catch (err) {
        console.error("Error details:", err);
        loadingModalElement.classList.remove("show");
        showUploadError(err.message || "An error occurred while processing the resume. Please check your connection and try again.");
    } finally {
        generateBtnModal.disabled = false;
    }
});

function showUploadError(message) {
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = message;
    errorElement.classList.add("show");
}

// Fullscreen Textarea Functions
function expandTextarea(id) {
    currentTextarea = document.getElementById(id);
    const overlay = document.getElementById("fullscreenOverlay");
    const overlayTextarea = document.getElementById("fullscreenTextarea");

    overlayTextarea.value = currentTextarea.value;
    overlay.style.display = "block";

    overlayTextarea.focus();
    overlayTextarea.selectionStart = overlayTextarea.selectionEnd = overlayTextarea.value.length;

    document.body.style.overflow = "hidden";
}

function closeFullscreen() {
    const overlay = document.getElementById("fullscreenOverlay");
    const overlayTextarea = document.getElementById("fullscreenTextarea");

    if (currentTextarea) {
        currentTextarea.value = overlayTextarea.value;
    }

    overlay.style.display = "none";
    currentTextarea = null;

    document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFullscreen();
});

// Modal Click Outside to Close
window.onclick = (e) => {
    const modal = document.getElementById("modal");
    if (e.target === modal) {
        closeModal();
    }
    const uploadModal = document.getElementById("uploadModal");
    if (e.target === uploadModal) {
        closeUploadModal();
    }
};

// Regenerate Interview Questions Functions
function openRegenerateModal(user) {
    currentUser = user;
    const modal = document.getElementById("regenerateModal");
    const currentQuestionsDiv = document.getElementById("currentQuestions");

    // Display current questions
    let html = '<div class="questions-container">';
    const fields = user.fields || user;
    const questionTypes = [
        { key: "PrimarySkillsQuestions", title: "Primary Skills Questions" },
        { key: "SecondarySkillsQuestions", title: "Secondary Skills Questions" },
        { key: "ProjectBasedQuestions", title: "Project-Based Questions" },
        { key: "ScenarioBasedQuestions", title: "Scenario-Based Questions" },
        { key: "DebuggingQuestions", title: "Debugging Questions" }
    ];

    questionTypes.forEach(type => {
        if (fields[type.key]) {
            const questions = fields[type.key].split(/\d+\.\s/).filter(q => q.trim());
            html += `
                <div class="question-type-section">
                    <h4>${type.title}</h4>
                    <div class="question-list">
                        ${questions.map((q, i) => `<div class="question-item"><strong>Q${i + 1}:</strong> ${q.trim()}</div>`).join("")}
                    </div>
                </div>
            `;
        }
    });
    html += '</div>';
    currentQuestionsDiv.innerHTML = html;

    // Reset form
    document.getElementById("regeneratePrompt").value = "";
    document.getElementById("regenerateError").textContent = "";
    document.getElementById("regenerateError").classList.remove("show");
    document.getElementById("regenerateLoading").classList.remove("show");
    document.getElementById("regenerateSuccess").classList.remove("show");

    modal.classList.add("show");
}

function closeRegenerateModal() {
    document.getElementById("regenerateModal").classList.remove("show");
}

document.getElementById("regenerateBtn").addEventListener("click", async () => {
    const prompt = document.getElementById("regeneratePrompt").value.trim();
    if (!prompt) {
        showRegenerateError("Please enter a prompt for regenerating questions.");
        return;
    }

    const loadingElement = document.getElementById("regenerateLoading");
    const successElement = document.getElementById("regenerateSuccess");
    const errorElement = document.getElementById("regenerateError");

    loadingElement.classList.add("show");
    document.getElementById("regenerateBtn").disabled = true;
    errorElement.classList.remove("show");
    successElement.classList.remove("show");

    try {
        const response = await fetch("/api/admin/regenerate-questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                prompt: prompt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`Server error (${response.status}): ${errorText || "Failed to regenerate questions"}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { success: true };
        }

        console.log("Questions regenerated successfully:", data);

        loadingElement.classList.remove("show");
        successElement.classList.add("show");

        setTimeout(async () => {
            successElement.classList.remove("show");
            await loadUserData();
            setTimeout(() => {
                closeRegenerateModal();
            }, 500);
        }, 2000);
    } catch (err) {
        console.error("Error regenerating questions:", err);
        loadingElement.classList.remove("show");
        showRegenerateError(err.message || "An error occurred while regenerating questions. Please check your connection and try again.");
    } finally {
        document.getElementById("regenerateBtn").disabled = false;
    }
});

function showRegenerateError(message) {
    const errorElement = document.getElementById("regenerateError");
    errorElement.textContent = message;
    errorElement.classList.add("show");
}

// Load data on page load
loadUserData();

// ============================================
// SCRAPER MODAL FUNCTIONS
// ============================================

// Open/Close Scraper Modal
function openScraperModal() {
    document.getElementById("scraperModal").classList.add("show");
    // Load scraped candidates by default when opening
    switchScraperTab('single');
}

function closeScraperModal() {
    document.getElementById("scraperModal").classList.remove("show");
    // Reset all forms and results
    document.getElementById("linkedinUrlInput").value = "";
    document.getElementById("searchRole").value = "";
    document.getElementById("searchSkills").value = "";
    document.getElementById("searchLocation").value = "";
    document.getElementById("searchExperience").value = "";
    document.getElementById("scrapeResult").innerHTML = "";
    document.getElementById("searchResult").innerHTML = "";
    document.getElementById("allCandidatesResult").innerHTML = "";
    document.getElementById("scraperError").textContent = "";
    document.getElementById("scraperError").classList.remove("show");
}

// Switch Scraper Tabs
function switchScraperTab(tabName) {
    // Hide all tab contents
    document.getElementById("scraperTabContentSingle").style.display = "none";
    document.getElementById("scraperTabContentSearch").style.display = "none";
    document.getElementById("scraperTabContentAll").style.display = "none";

    // Remove active class from all tabs
    document.getElementById("scraperTabSingle").classList.remove("active");
    document.getElementById("scraperTabSearch").classList.remove("active");
    document.getElementById("scraperTabAll").classList.remove("active");

    // Show selected tab and mark as active
    if (tabName === 'single') {
        document.getElementById("scraperTabContentSingle").style.display = "block";
        document.getElementById("scraperTabSingle").classList.add("active");
    } else if (tabName === 'search') {
        document.getElementById("scraperTabContentSearch").style.display = "block";
        document.getElementById("scraperTabSearch").classList.add("active");
    } else if (tabName === 'all') {
        document.getElementById("scraperTabContentAll").style.display = "block";
        document.getElementById("scraperTabAll").classList.add("active");
        // Auto-load candidates when switching to this tab
        loadScrapedCandidates();
    }
}

// Scrape Single Profile
async function scrapeSingleProfile() {
    const url = document.getElementById("linkedinUrlInput").value.trim();
    if (!url) {
        showScraperError("Please enter a LinkedIn profile URL");
        return;
    }

    const loadingElement = document.getElementById("scrapeLoading");
    const resultElement = document.getElementById("scrapeResult");
    const errorElement = document.getElementById("scraperError");
    const btn = document.getElementById("scrapeSingleBtn");

    loadingElement.classList.add("show");
    btn.disabled = true;
    errorElement.classList.remove("show");
    resultElement.innerHTML = "";

    try {
        const response = await fetch("/api/scraper/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to scrape profile");
        }

        const data = await response.json();
        loadingElement.classList.remove("show");
        
        // Display result
        resultElement.innerHTML = createCandidateCard(data, true);
        
    } catch (error) {
        console.error("Error scraping profile:", error);
        loadingElement.classList.remove("show");
        showScraperError(error.message || "Failed to scrape profile. Please try again.");
    } finally {
        btn.disabled = false;
    }
}

// Search LinkedIn Candidates
async function searchLinkedInCandidates() {
    const role = document.getElementById("searchRole").value.trim();
    const skills = document.getElementById("searchSkills").value.trim();
    const location = document.getElementById("searchLocation").value.trim();
    const experience = document.getElementById("searchExperience").value.trim();

    if (!role && !skills) {
        showScraperError("Please enter at least a role or skills");
        return;
    }

    const loadingElement = document.getElementById("searchLoading");
    const resultElement = document.getElementById("searchResult");
    const errorElement = document.getElementById("scraperError");
    const btn = document.getElementById("searchCandidatesBtn");

    loadingElement.classList.add("show");
    btn.disabled = true;
    errorElement.classList.remove("show");
    resultElement.innerHTML = "";

    try {
        const response = await fetch("/api/scraper/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, skills, location, experience })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to search candidates");
        }

        const data = await response.json();
        loadingElement.classList.remove("show");
        
        if (data && data.length > 0) {
            resultElement.innerHTML = `
                <h3 style="margin: 20px 0 15px 0;">Found ${data.length} Candidates</h3>
                <div style="display: grid; gap: 15px;">
                    ${data.map(candidate => createCandidateCard(candidate, true)).join('')}
                </div>
            `;
        } else {
            resultElement.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No candidates found matching your criteria.</p>';
        }
        
    } catch (error) {
        console.error("Error searching candidates:", error);
        loadingElement.classList.remove("show");
        showScraperError(error.message || "Failed to search candidates. Please try again.");
    } finally {
        btn.disabled = false;
    }
}

// Load All Scraped Candidates
async function loadScrapedCandidates() {
    const loadingElement = document.getElementById("allCandidatesLoading");
    const resultElement = document.getElementById("allCandidatesResult");
    const errorElement = document.getElementById("scraperError");

    loadingElement.classList.add("show");
    errorElement.classList.remove("show");
    resultElement.innerHTML = "";

    try {
        const response = await fetch("/api/scraper/candidates");

        if (!response.ok) {
            throw new Error("Failed to load scraped candidates");
        }

        const data = await response.json();
        loadingElement.classList.remove("show");
        
        if (data && data.length > 0) {
            resultElement.innerHTML = `
                <h3 style="margin: 0 0 15px 0;">Total Scraped Candidates: ${data.length}</h3>
                <div style="display: grid; gap: 15px;">
                    ${data.map(candidate => createCandidateCard(candidate, false)).join('')}
                </div>
            `;
        } else {
            resultElement.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No scraped candidates found in database.</p>';
        }
        
    } catch (error) {
        console.error("Error loading scraped candidates:", error);
        loadingElement.classList.remove("show");
        showScraperError(error.message || "Failed to load candidates. Please try again.");
    }
}

// Create Candidate Card HTML
function createCandidateCard(candidate, showPdfButton) {
    const name = candidate["Full Name"] || candidate.full_name || "Unknown";
    const email = candidate["Email"] || candidate.email || "N/A";
    const phone = candidate["Phone"] || candidate.phone || "N/A";
    const skills = candidate["Skills"] || candidate.skills || [];
    const education = candidate["Education"] || candidate.education || "N/A";
    const experience = candidate["Experience"] || candidate.experience || "N/A";
    const linkedinUrl = candidate["linkedin_url"] || candidate.linkedin_url || "";
    const id = candidate.id || "";

    const skillsDisplay = Array.isArray(skills) 
        ? skills.slice(0, 5).map(skill => `<span class="tag">${skill}</span>`).join('')
        : (typeof skills === 'string' ? `<span class="tag">${skills}</span>` : 'N/A');

    const educationDisplay = Array.isArray(education) 
        ? education.map(edu => typeof edu === 'object' ? Object.values(edu).join(' - ') : edu).join('<br>')
        : education;

    const experienceDisplay = Array.isArray(experience)
        ? experience.slice(0, 2).map(exp => typeof exp === 'object' ? Object.values(exp).join(' - ') : exp).join('<br>')
        : (typeof experience === 'string' ? experience.substring(0, 200) + (experience.length > 200 ? '...' : '') : experience);

    return `
        <div class="user-card scraper-card">
            <div class="user-header">
                <div class="user-info">
                    <h3>${name}</h3>
                    ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="linkedin-link">🔗 LinkedIn Profile</a>` : ''}
                </div>
                ${id ? `<button onclick="deleteScrapedCandidate('${id}')" class="delete-btn-small">🗑️</button>` : ''}
            </div>
            
            <div class="info-row">
                <span class="info-icon">📧</span>
                <span>${email}</span>
            </div>
            <div class="info-row">
                <span class="info-icon">📱</span>
                <span>${phone}</span>
            </div>
            
            <div class="detail-section small">
                <h4>🎓 Education</h4>
                <div class="detail-content-small">${educationDisplay}</div>
            </div>
            
            <div class="detail-section small">
                <h4>💼 Experience</h4>
                <div class="detail-content-small">${experienceDisplay}</div>
            </div>
            
            <div class="detail-section small">
                <h4>🛠️ Skills</h4>
                <div class="skills-container">${skillsDisplay}</div>
            </div>

            ${showPdfButton ? `
                <button class="pdf-download-btn" data-candidate='${JSON.stringify(candidate).replace(/'/g, "&#39;")}' >
                    📥 Download PDF Resume
                </button>
            ` : ''}
        </div>
    `;
}

// Delete Scraped Candidate
async function deleteScrapedCandidate(id) {
    if (!confirm("Are you sure you want to delete this candidate from the database?")) {
        return;
    }

    try {
        const response = await fetch(`/api/scraper/candidates/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete candidate");
        }

        alert("Candidate deleted successfully");
        loadScrapedCandidates(); // Reload the list
        
    } catch (error) {
        console.error("Error deleting candidate:", error);
        showScraperError(error.message || "Failed to delete candidate");
    }
}

// Download Candidate PDF
async function downloadCandidatePDF(candidateData) {
    try {
        const response = await fetch("/api/scraper/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateData)
        });

        if (!response.ok) {
            throw new Error("Failed to generate PDF");
        }

        // Get the blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${candidateData["Full Name"] || 'candidate'}_resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        showScraperError(error.message || "Failed to generate PDF");
    }
}

// Event delegation for dynamically created PDF download buttons
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('pdf-download-btn')) {
        const candidateData = JSON.parse(e.target.getAttribute('data-candidate'));
        downloadCandidatePDF(candidateData);
    }
});

// Show Scraper Error
function showScraperError(message) {
    const errorElement = document.getElementById("scraperError");
    errorElement.textContent = message;
    errorElement.classList.add("show");
}

// Close scraper modal when clicking outside
window.addEventListener('click', (e) => {
    const scraperModal = document.getElementById("scraperModal");
    if (e.target === scraperModal) {
        closeScraperModal();
    }
});

