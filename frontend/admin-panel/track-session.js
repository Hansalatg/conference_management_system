// Add Session
document.getElementById('addSessionForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const trackId = document.getElementById('trackId').value.trim();
    const title = document.getElementById('sessionTitle').value.trim();
    const speaker = document.getElementById('speaker').value.trim();
    const time = document.getElementById('time').value.trim();
    const venue = document.getElementById('venue').value.trim();
    const capacity = document.getElementById('capacity').value.trim();

    try {
        const response = await fetch('http://localhost:3000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId, title, speaker, time, venue, capacity }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Session added successfully');
            displaySessions();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add session');
    }
});

document.getElementById('viewSessionsButton').addEventListener('click', function() {
    const sessionsList = document.getElementById('sessionsList');
    if (sessionsList.style.display === "none" || sessionsList.style.display === "") {
        // Show the sessions list
        sessionsList.style.display = "block";
        displaySessions(); // Call to fetch and display sessions
    } else {
        // Hide the sessions list
        sessionsList.style.display = "none";
    }
});

// Display Sessions in Table
async function displaySessions() {
    try {
        const response = await fetch('http://localhost:3000/api/sessions');
        const sessions = await response.json();
        const sessionsTableBody = document.getElementById('sessionsTableBody');
        sessionsTableBody.innerHTML = '';  // Clear the existing rows

        sessions.forEach((session) => {
            const row = document.createElement('tr');
            row.setAttribute('data-session-id', session.session_id);

            row.innerHTML = `
                <td>${session.title}</td>
                <td>${session.speaker}</td>
                <td>${session.time}</td>
                <td>${session.venue}</td>
                <td>${session.capacity}</td>
                <td>
                    <button class="editButton">Edit</button>
                    <button class="deleteButton">Delete</button>
                </td>
            `;

            sessionsTableBody.appendChild(row);
        });

        // Show the session table section after data is loaded
        document.getElementById('sessionsList').style.display = 'block';
    } catch (error) {
        console.error('Error fetching sessions:', error);
    }
}

// Edit Session
function editSession(sessionId) {
    const sessionRow = document.querySelector(`tr[data-session-id='${sessionId}']`);
    const title = sessionRow.querySelector('td:nth-child(1)').innerText;
    const speaker = sessionRow.querySelector('td:nth-child(2)').innerText;
    const time = sessionRow.querySelector('td:nth-child(3)').innerText;
    const venue = sessionRow.querySelector('td:nth-child(4)').innerText;
    const capacity = sessionRow.querySelector('td:nth-child(5)').innerText;

    // Replace session details with input fields
    sessionRow.innerHTML = `
        <td><input type="text" class="inputField" id="editTitle" value="${title}"></td>
        <td><input type="text" class="inputField" id="editSpeaker" value="${speaker}"></td>
        <td><input type="text" class="inputField" id="editTime" value="${time}"></td>
        <td><input type="text" class="inputField" id="editVenue" value="${venue}"></td>
        <td><input type="number" class="inputField" id="editCapacity" value="${capacity}"></td>
        <td>
            <button class="saveButton" data-session-id="${sessionId}">Save</button>
            <button class="cancelButton">Cancel</button>
        </td>
    `;
}

// Save Edited Session
async function saveSession(sessionId) {
    const sessionRow = document.querySelector(`tr[data-session-id='${sessionId}']`);
    const title = document.getElementById('editTitle').value;
    const speaker = document.getElementById('editSpeaker').value;
    const time = document.getElementById('editTime').value;
    const venue = document.getElementById('editVenue').value;
    const capacity = document.getElementById('editCapacity').value;

    try {
        const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, speaker, time, venue, capacity }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Session updated successfully');
            displaySessions();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update session');
    }
}

// Cancel Edit
function cancelEdit() {
    displaySessions();
}

// Delete Session
async function deleteSession(sessionId) {
    // Show confirmation dialog
    const userConfirmed = confirm('Are you sure you want to delete this session?');

    if (userConfirmed) {
        try {
            const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            if (response.ok) {
                alert('Session deleted successfully');
                displaySessions(); // Re-fetch and display updated session list
            } else {
                alert('Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('An error occurred while deleting the session');
        }
    } else {
        console.log('Session deletion canceled');
    }
}

// Handle Button Clicks (Edit, Save, Cancel, Delete)
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('editButton')) {
        const sessionId = event.target.closest('tr').getAttribute('data-session-id');
        editSession(sessionId);
    }

    if (event.target.classList.contains('saveButton')) {
        const sessionId = event.target.getAttribute('data-session-id');
        saveSession(sessionId);
    }

    if (event.target.classList.contains('cancelButton')) {
        cancelEdit();
    }

    if (event.target.classList.contains('deleteButton')) {
        const sessionId = event.target.closest('tr').getAttribute('data-session-id');
        deleteSession(sessionId);
    }
});

// Call displaySessions() on page load
displaySessions();
