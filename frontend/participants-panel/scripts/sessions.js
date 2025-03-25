
document.addEventListener("DOMContentLoaded", loadParticipantName);

document.addEventListener('DOMContentLoaded', function() {
    // Fetch the participant details from localStorage
    const participantName = localStorage.getItem('participantName');
  

    // Display participant name
    document.getElementById('participantName').textContent = participantName || 'Guest';
    
});


async function loadParticipantName() {
    try {
        const participantId = localStorage.getItem("participantId");
        if (!participantId) {
            console.error("Participant ID not found in localStorage");
            document.getElementById("participantName").textContent = "Guest";
            return;
        }

        const response = await fetch(`http://localhost:3000/api/user/${participantId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch participant details");
        }

        const participant = await response.json();
        document.getElementById("participantName").textContent =
            participant.name || "Guest";
    } catch (error) {
        console.error("Error loading participant name:", error);
        document.getElementById("participantName").textContent = "Guest";
    }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", loadParticipantName);

// Load available sessions
async function loadAvailableSessions() {
    try {
        const response = await fetch('http://localhost:3000/api/sessions');
        const sessions = await response.json();

        const tableBody = document.querySelector('#availableSessionsTable tbody');
        tableBody.innerHTML = '';

        sessions.forEach((session) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.title}</td>
                <td>${session.speaker}</td>
                <td>${new Date(session.time).toLocaleString()}</td>
                <td>${session.venue}</td>
                <td>${session.capacity}</td>
                <td>
                    <button onclick="registerForSession(${session.session_id})" id="register-${session.session_id}">
                        Register
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading available sessions:', error);
    }
}

// Load registered sessions
async function loadRegisteredSessions() {
    try {
        const participantId = localStorage.getItem('participantId');
        if (!participantId) {
            console.error('Participant ID not found in localStorage');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/registered-sessions/${participantId}`);
        const registeredSessions = await response.json();

        const tableBody = document.querySelector('#registeredSessionsTable tbody');
        tableBody.innerHTML = '';

        registeredSessions.forEach((session) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.title}</td>
                <td>${session.speaker}</td>
                <td>${new Date(session.time).toLocaleString()}</td>
                <td>${session.venue}</td>
                <td><a href="${session.meeting_link}" target="_blank">Join</a></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading registered sessions:', error);
    }
}

// Register for a session
async function registerForSession(sessionId) {
    try {
        const participantId = localStorage.getItem('participantId');
        if (!participantId) {
            alert('Please log in to register for a session.');
            return;
        }

        const response = await fetch('http://localhost:3000/api/session-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, participantId }),
        });

        if (response.ok) {
            alert('Successfully registered for the session!');
            document.getElementById(`register-${sessionId}`).disabled = true;
            loadRegisteredSessions();
        } else {
            const result = await response.json();
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error registering for session:', error);
    }
}

// Event listeners for toggling session displays
document.getElementById('availableSessionsButton').addEventListener('click', () => {
    document.getElementById('availableSessionsContainer').style.display = 'block';
    document.getElementById('registeredSessionsContainer').style.display = 'none';
});

document.getElementById('registeredSessionsButton').addEventListener('click', () => {
    document.getElementById('availableSessionsContainer').style.display = 'none';
    document.getElementById('registeredSessionsContainer').style.display = 'block';
});

// On page load
document.addEventListener('DOMContentLoaded', () => {
    loadParticipantName(); // Load the participant's name
    loadAvailableSessions(); // Load available sessions
    loadRegisteredSessions(); // Load registered sessions
});
