document.addEventListener("DOMContentLoaded", function () {
    fetch('http://localhost:3000/api/participants')
        .then(response => response.json())
        .then(data => {
            const participantList = document.getElementById('participantList');
            
            // Check if the response is an array and contains participants
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(participant => {
                    // Create a new table row for each participant
                    const row = document.createElement('tr');
                    
                    // Populate the row with participant data
                    row.innerHTML = `
                        <td>${participant.participant_id}</td>
                        <td>${participant.name}</td>
                        <td>${participant.email}</td>
                        <td>${participant.QR_code}</td>
                        <td>${participant.sessions_registered || 'None'}</td>
                    `;
                    
                    // Append the row to the table body
                    participantList.appendChild(row);
                });
            } else {
                // If no participants are found, display a message
                participantList.innerHTML = "<tr><td colspan='5'>No participants found.</td></tr>";
            }
        })
        .catch(error => {
            console.error('Error fetching participants:', error);
        });
});
