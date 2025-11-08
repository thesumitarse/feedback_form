
// State Management

let currentPage = 0;
let completedPages = new Set();
let formData = {};

// Admin credentials (in production, use secure backend authentication)
const ADMIN_CREDENTIALS = [
    { username: 'admin', password: 'iips2025' },
    { username: 'staff', password: 'iipsS2025' },
    { username: 'faculty', password: 'iipsF2025' }
];

// Storage Helper Functions

async function getResponses() {
    try {
        // Check if storage API is available
        if (typeof window.storage !== 'undefined') {
            const result = await window.storage.get('feedback_responses', true);
            return result ? JSON.parse(result.value) : [];
        } else {
            // Fallback: use in-memory storage (for testing without storage API)
            console.warn('Storage API not available, using in-memory storage');
            return window._memoryResponses || [];
        }
    } catch (error) {
        console.error('Error getting responses:', error);
        return window._memoryResponses || [];
    }
}

async function saveResponses(responses) {
    try {
        if (typeof window.storage !== 'undefined') {
            await window.storage.set('feedback_responses', JSON.stringify(responses), true);
            return true;
        } else {
            // Fallback: use in-memory storage
            window._memoryResponses = responses;
            return true;
        }
    } catch (error) {
        console.error('Error saving responses:', error);
        return false;
    }
}

// ===========================
// Page Navigation
// ===========================
function goToPage(pageNum) {
    // Validate current page before moving forward
    if (pageNum > currentPage && currentPage > 0 && !validateCurrentPage()) {
        return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`page${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageNum;

        // Update sidebar progress
        updateProgress();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateProgress() {
    const progressCount = document.getElementById('progressCount');
    const progressItems = document.querySelectorAll('.progress-item');

    progressCount.textContent = `${completedPages.size}/6`;

    progressItems.forEach((item, index) => {
        const pageNum = index + 1;
        item.classList.remove('completed', 'active');

        if (completedPages.has(pageNum)) {
            item.classList.add('completed');
        }
        if (currentPage === pageNum) {
            item.classList.add('active');
        }

        // Make clickable if completed
        if (completedPages.has(pageNum) || pageNum === currentPage) {
            item.style.cursor = 'pointer';
            item.onclick = () => goToPage(pageNum);
        }
    });
}

// ===========================
// Validation Functions
// ===========================
function validateCurrentPage() {
    switch (currentPage) {
        case 1:
            return validatePage1();
        case 2:
            return validatePage2();
        case 3:
            return validatePage3();
        case 4:
            return validatePage4();
        case 5:
            return validatePage5();
        case 6:
            return validatePage6();
        default:
            return true;
    }
}

function validatePage1() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const program = document.getElementById('program').value.trim();
    const year = document.getElementById('year').value;

    if (!name || !id || !program || !year) {
        alert('Please fill in all required fields.');
        return false;
    }

    formData.studentName = name;
    formData.studentId = id;
    formData.program = program;
    formData.year = year;
    completedPages.add(1);
    return true;
}

function validatePage2() {
    const courseRelevance = document.querySelector('.number-rating[data-question="courseRelevance"] .number-btn.selected');
    const creditAllocation = document.querySelector('input[name="creditAllocation"]:checked');
    const contentDepth = document.getElementById('contentDepthSlider').value;

    if (!courseRelevance || !creditAllocation) {
        alert('Please answer all required questions on this page.');
        return false;
    }

    formData.courseRelevance = courseRelevance.dataset.value;
    formData.creditAllocation = creditAllocation.value;
    formData.contentDepth = contentDepth;
    completedPages.add(2);
    return true;
}

function validatePage3() {
    const instructorKnowledge = document.querySelector('#instructorKnowledge .emoji-btn.selected');
    const claritySlider = document.getElementById('claritySlider').value;

    if (!instructorKnowledge) {
        alert('Please rate your instructors\' knowledge.');
        return false;
    }

    formData.instructorKnowledge = instructorKnowledge.dataset.value;
    formData.clarityOfInstruction = claritySlider;
    completedPages.add(3);
    return true;
}

function validatePage4() {
    const libraryRating = document.getElementById('libraryHygieneSlider').value;
    const facilitiesRating = document.querySelector('#facilitiesRating .emoji-btn.selected');
    const labsWashRating = document.getElementById('labsWashHygieneSlider').value;

    if (!facilitiesRating) {
        alert('Please rate your satisfaction with campus facilities.');
        return false;
    }

    formData.libraryRating = libraryRating;
    formData.facilitiesRating = facilitiesRating.dataset.value;
    formData.labsWashRating = labsWashRating;
    completedPages.add(4);
    return true;
}

function validatePage5() {
    const overallSatisfaction = document.querySelector('#overallSatisfaction .number-btn.selected');
    const recommend = document.querySelector('input[name="recommend"]:checked');

    if (!overallSatisfaction || !recommend) {
        alert('Please answer all required questions on this page.');
        return false;
    }

    formData.overallSatisfaction = overallSatisfaction.dataset.value;
    formData.recommend = recommend.value;
    completedPages.add(5);
    return true;
}

function validatePage6() {
    const comments = document.getElementById('additionalComments').value.trim();
    formData.additionalComments = comments || 'No additional comments';
    completedPages.add(6);
    return true;
}

// ===========================
// Form Submission
// ===========================
async function submitForm() {
    console.log('Submit form called');

    if (!validateCurrentPage()) {
        console.log('Validation failed');
        return;
    }

    // Add submission timestamp
    formData.submittedAt = new Date().toISOString();

    console.log('Form data:', formData);

    try {
        // Save to storage
        const responses = await getResponses();
        responses.push(formData);
        const saved = await saveResponses(responses);

        if (saved) {
            console.log('Form submitted successfully');
            document.getElementById('modalOverlay').classList.add('active');
            // Show thank you page
            goToPage(7);
        } else {
            throw new Error('Failed to save response');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting your feedback. Your response has been logged locally. Please try again or contact support.');
        // Still go to thank you page even if storage fails
        goToPage(7);
    }
}

function exitForm() {
    if (confirm('Are you sure you want to exit? This will reset the form.')) {
        window.location.reload();
    }
}

// ===========================
// Interactive Elements Setup
// ===========================
function setupInteractiveElements() {
    // Emoji rating buttons
    document.querySelectorAll('.emoji-rating').forEach(container => {
        container.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                container.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                checkPageCompletion();
            });
        });
    });

    // Number rating buttons
    document.querySelectorAll('.number-rating').forEach(container => {
        container.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                container.querySelectorAll('.number-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                checkPageCompletion();
            });
        });
    });

    // Sliders with live value update
    document.querySelectorAll('.slider').forEach(slider => {
        const valueId = slider.id.replace('Slider', 'Value');
        const valueSpan = document.getElementById(valueId);

        slider.addEventListener('input', function () {
            if (valueSpan) {
                valueSpan.textContent = this.value;
            }
            checkPageCompletion();
        });
    });

    // Radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', checkPageCompletion);
    });

    // Text inputs
    document.querySelectorAll('input[type="text"], select, textarea').forEach(input => {
        input.addEventListener('input', checkPageCompletion);
        input.addEventListener('change', checkPageCompletion);
    });
}

function checkPageCompletion() {
    // Enable/disable next buttons based on current page validation
    switch (currentPage) {
        case 1:
            updateButtonState('nextBtn1', () => {
                const name = document.getElementById('studentName').value.trim();
                const id = document.getElementById('studentId').value.trim();
                const program = document.getElementById('program').value.trim();
                const year = document.getElementById('year').value;
                return name && id && program && year;
            });
            break;
        case 2:
            updateButtonState('nextBtn3', () => {
                const courseRelevance = document.querySelector('.number-rating[data-question="courseRelevance"] .number-btn.selected');
                const creditAllocation = document.querySelector('input[name="creditAllocation"]:checked');
                return courseRelevance && creditAllocation;
            });
            break;
        case 3:
            updateButtonState('nextBtn2', () => {
                const instructorKnowledge = document.querySelector('#instructorKnowledge .emoji-btn.selected');
                return instructorKnowledge !== null;
            });
            break;
        case 4:
            updateButtonState('nextBtn4', () => {
                const facilitiesRating = document.querySelector('#facilitiesRating .emoji-btn.selected');
                return facilitiesRating !== null;
            });
            break;
        case 5:
            updateButtonState('nextBtn5', () => {
                const overallSatisfaction = document.querySelector('#overallSatisfaction .number-btn.selected');
                const recommend = document.querySelector('input[name="recommend"]:checked');
                return overallSatisfaction && recommend;
            });
            break;
        case 6:
            // Submit button is always enabled on page 6 (comments are optional)
            updateButtonState('submitBtn', () => true);
            break;
    }
}

function updateButtonState(buttonId, checkFunction) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = !checkFunction();
    }
}

// ===========================
// Admin Portal Functions
// ===========================
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function attemptLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const isValidAdmin = ADMIN_CREDENTIALS.some(
        admin =>
            admin.username === username &&
            admin.password === password
    );

    if (isValidAdmin) {
        closeAdminLogin();
        openAdminPortal();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

async function openAdminPortal() {
    document.getElementById('adminPortal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    await loadAdminData();
}

function closeAdminPortal() {
    document.getElementById('adminPortal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function loadAdminData() {
    const responses = await getResponses();

    // Update statistics
    document.getElementById('totalResponses').textContent = responses.length;

    if (responses.length > 0) {
        const avgSat = responses.reduce((sum, r) => sum + parseInt(r.overallSatisfaction), 0) / responses.length;
        document.getElementById('avgSatisfaction').textContent = avgSat.toFixed(1);

        const latest = new Date(responses[responses.length - 1].submittedAt);
        const now = new Date();
        const diff = Math.floor((now - latest) / 60000);
        document.getElementById('latestResponse').textContent = diff < 60 ? `${diff}m ago` : `${Math.floor(diff / 60)}h ago`;
    } else {
        document.getElementById('avgSatisfaction').textContent = '-';
        document.getElementById('latestResponse').textContent = '-';
    }

    document.getElementById('responseRate').textContent = `${Math.min(100, responses.length * 2)}%`;

    // Load response table
    displayResponses(responses);
}

function displayResponses(responses) {
    const tbody = document.getElementById('responseTableBody');
    tbody.innerHTML = '';

    if (responses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No responses yet</td></tr>';
        return;
    }

    responses.forEach((response, index) => {
        const row = document.createElement('tr');
        const date = new Date(response.submittedAt);

        row.innerHTML = `
            <td>${response.studentName}</td>
            <td>${response.studentId}</td>
            <td>${response.program}</td>
            <td>${response.year}</td>
            <td><span class="satisfaction-badge">${response.overallSatisfaction}/10</span></td>
            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
            <td><button class="view-btn" onclick="viewResponse(${index})">View</button></td>
        `;

        tbody.appendChild(row);
    });
}

async function viewResponse(index) {
    const responses = await getResponses();
    const response = responses[index];

    const details = `
        <div class="response-detail">
            <h3>Student Information</h3>
            <p><strong>Name:</strong> ${response.studentName}</p>
            <p><strong>ID:</strong> ${response.studentId}</p>
            <p><strong>Program:</strong> ${response.program}</p>
            <p><strong>Year:</strong> ${response.year}</p>
            
            <h3>Course Content</h3>
            <p><strong>Course Relevance:</strong> ${response.courseRelevance}/10</p>
            <p><strong>Credit Allocation:</strong> ${response.creditAllocation}</p>
            <p><strong>Content Depth:</strong> ${response.contentDepth}/10</p>
            
            <h3>Teaching Quality</h3>
            <p><strong>Instructor Knowledge:</strong> ${response.instructorKnowledge}/5</p>
            <p><strong>Clarity of Instruction:</strong> ${response.clarityOfInstruction}/10</p>
            
            <h3>Campus Facilities</h3>
            <p><strong>Library Rating:</strong> ${response.libraryRating}/10</p>
            <p><strong>Facilities Rating:</strong> ${response.facilitiesRating}/5</p>
            <p><strong>Labs & Washrooms:</strong> ${response.labsWashRating}/10</p>
            
            <h3>Overall Experience</h3>
            <p><strong>Overall Satisfaction:</strong> ${response.overallSatisfaction}/10</p>
            <p><strong>Would Recommend:</strong> ${response.recommend}</p>
            
            <h3>Additional Comments</h3>
            <p>${response.additionalComments}</p>
            
            <p style="margin-top: 20px; color: #666;"><strong>Submitted:</strong> ${new Date(response.submittedAt).toLocaleString()}</p>
        </div>
    `;

    document.getElementById('responseDetails').innerHTML = details;
    document.getElementById('responseModal').style.display = 'flex';
}

function closeResponseModal() {
    document.getElementById('responseModal').style.display = 'none';
}

async function filterResponses() {
    const responses = await getResponses();
    const year = document.getElementById('filterYear').value;
    const search = document.getElementById('searchStudent').value.toLowerCase();

    let filtered = responses;

    if (year) {
        filtered = filtered.filter(r => r.year === year);
    }

    if (search) {
        filtered = filtered.filter(r =>
            r.studentName.toLowerCase().includes(search) ||
            r.studentId.toLowerCase().includes(search)
        );
    }

    displayResponses(filtered);
}

async function sortResponses() {
    const responses = await getResponses();
    const sortBy = document.getElementById('sortBy').value;

    let sorted = [...responses];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.studentName.localeCompare(b.studentName));
            break;
        case 'satisfaction':
            sorted.sort((a, b) => b.overallSatisfaction - a.overallSatisfaction);
            break;
        case 'date':
        default:
            sorted.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    }

    displayResponses(sorted);
}

async function exportToCSV() {
    const responses = await getResponses();

    if (responses.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = ['Name', 'ID', 'Program', 'Year', 'Course Relevance', 'Credit Allocation',
        'Content Depth', 'Instructor Knowledge', 'Clarity', 'Library', 'Facilities',
        'Labs/Wash', 'Overall Satisfaction', 'Recommend', 'Comments', 'Submitted'];

    const csvContent = [
        headers.join(','),
        ...responses.map(r => [
            `"${r.studentName}"`,
            r.studentId,
            `"${r.program}"`,
            r.year,
            r.courseRelevance,
            `"${r.creditAllocation}"`,
            r.contentDepth,
            r.instructorKnowledge,
            r.clarityOfInstruction,
            r.libraryRating,
            r.facilitiesRating,
            r.labsWashRating,
            r.overallSatisfaction,
            `"${r.recommend}"`,
            `"${r.additionalComments.replace(/"/g, '""')}"`,
            new Date(r.submittedAt).toLocaleString()
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_responses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ===========================
// Modal Functions
// ===========================
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    setTimeout(() => {
        goToPage(7);
    }, 400);
}

// ===========================
// Initialization
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Page loaded, initializing...');

    setupInteractiveElements();
    updateProgress();

    // Initialize submit button state
    checkPageCompletion();

    // Handle Enter key on login
    const passwordField = document.getElementById('adminPassword');
    if (passwordField) {
        passwordField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                attemptLogin();
            }
        });
    }

    // Close modals on outside click
    const adminLoginModal = document.getElementById('adminLoginModal');
    if (adminLoginModal) {
        adminLoginModal.addEventListener('click', function (e) {
            if (e.target === this) closeAdminLogin();
        });
    }

    const responseModal = document.getElementById('responseModal');
    if (responseModal) {
        responseModal.addEventListener('click', function (e) {
            if (e.target === this) closeResponseModal();
        });
    }

    console.log('Initialization complete');
});
