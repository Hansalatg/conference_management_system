// Ensure the page is fully loaded before executing this script
window.onload = function() {
    const participantName = localStorage.getItem('participantName');
    if (participantName) {
        document.getElementById('participantName').textContent = participantName;
    } else {
        // If no participant name found, redirect to login page
        window.location.href = 'login.html';
    }
};



async function loadSessions() {
    try {
        const response = await fetch('http://localhost:3000/api/sessions');
        const sessions = await response.json();

        const availableSessionsContainer = document.getElementById('availableSessionsContainer');
        const availableSessionsTable = document.getElementById('availableSessionsTable').getElementsByTagName('tbody')[0];
        availableSessionsTable.innerHTML = ''; // Clear existing data

        sessions.forEach((session) => {
            const row = availableSessionsTable.insertRow();
            row.innerHTML = `
                <td>${session.title}</td>
                <td>${session.speaker}</td>
                <td>${new Date(session.time).toLocaleString()}</td>
                <td>${session.venue}</td>
                <td>${session.capacity}</td>
                <td><button class="register-btn" onclick="registerForSession(${session.session_id})" id="register-${session.session_id}">Register</button></td>
            `;
        });

        availableSessionsContainer.style.display = 'block';
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function loadRegisteredSessions() {
    try {
        const participantId = localStorage.getItem('participantId');
        
        // Fetching the registered sessions from the API
        const response = await fetch(`http://localhost:3000/api/registered-sessions/${participantId}`);
        const registeredSessions = await response.json();

        console.log("Registered Sessions:", registeredSessions);  // Log the response to check data

        // Get the container and table for displaying sessions
        const registeredSessionsContainer = document.getElementById('registeredSessionsContainer');
        const registeredSessionsTable = document.getElementById('registeredSessionsTable').getElementsByTagName('tbody')[0];
        
        // Clear existing table data
        registeredSessionsTable.innerHTML = '';

        // If no sessions are found, display a message
        if (registeredSessions.length === 0) {
            registeredSessionsContainer.innerHTML = '<p>No registered sessions yet.</p>';
            return;
        }

        // Loop through each session and create a row in the table
        registeredSessions.forEach((session) => {
            const sessionId = session.session_id || session.track_session_id;  // Use session_id or track_session_id if session_id is missing

            console.log('Session Data:', session); // Log each session object to check data

            // Create a new row for the table
            const row = registeredSessionsTable.insertRow();
            row.innerHTML = `
                <td>${session.title || 'N/A'}</td>  <!-- Fallback if title is missing -->
                <td>${session.speaker || 'N/A'}</td>  <!-- Fallback if speaker is missing -->
                <td>${session.time ? new Date(session.time).toLocaleString() : 'N/A'}</td>  <!-- Fallback if time is missing -->
                <td>${session.venue || 'N/A'}</td>  <!-- Fallback if venue is missing -->
                <td>
                    <a href="${session.link || '#'}" class="join-link" target="_blank">Join</a>  <!-- Fallback if link is missing -->
                </td>
               
            `;
        });

        // Make the container visible
        registeredSessionsContainer.style.display = 'block';

    } catch (error) {
        console.error('Error loading registered sessions:', error);
    }
}



function goToCheckinPage(sessionId) {
    const participantId = localStorage.getItem('participantId');
    if (!participantId) {
        alert('Please log in to check in.');
        return;
    }

    // Store sessionId in localStorage for later use
    localStorage.setItem('sessionId', sessionId);

    // Navigate to the check-in page with sessionId and participantId as query parameters
    const checkinUrl = `checkin.html?sessionId=${sessionId}&participantId=${participantId}`;
    window.location.href = checkinUrl;
}



async function registerForSession(sessionId) {
    const participantId = localStorage.getItem('participantId');
    if (!participantId) {
        alert('Please log in to register for sessions.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/session-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, participantId }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Registered successfully for the session!');
            // Store the session ID in localStorage for check-in
            localStorage.setItem('registeredSessionId', sessionId);
            document.getElementById(`register-${sessionId}`).disabled = true;
            loadRegisteredSessions(); // Refresh registered sessions
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error registering for session:', error);
        alert('Failed to register for session');
    }
}


// Retrieve the user's name from localStorage

// Button Event Listeners to toggle between sessions
document.getElementById('availableSessionsButton').addEventListener('click', function() {
    document.getElementById('registeredSessionsContainer').style.display = 'none';
    document.getElementById('availableSessionsContainer').style.display = 'block';
    loadSessions();
});

document.getElementById('registeredSessionsButton').addEventListener('click', function() {
    document.getElementById('availableSessionsContainer').style.display = 'none';
    document.getElementById('registeredSessionsContainer').style.display = 'block';
    loadRegisteredSessions();
});

// Load sessions and registered sessions on page load
loadSessions();
