document.getElementById('registerButton').addEventListener('click', async function () {
    console.log("Register button clicked!");

    const participantId = document.getElementById("participantId").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const organization = document.getElementById("organization").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!participantId || !name || !email || !organization || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ participantId, name, email, organization, password }),
        });

        const result = await response.json(); // Parse response JSON
        console.log("Server response:", result); // Debug response

        const messageElement = document.getElementById("responseMessage");

        if (response.ok) {
            // Store the participant ID and name in localStorage
            localStorage.setItem('participantId', result.participant_id);
            localStorage.setItem('participantName', name); // Store the name

            // Display success message
            messageElement.textContent = `Successfully registered! A QR code will be sent to your email address shortly.`;
            messageElement.style.color = "green";

            // Display QR Code ID
            const qrCodeIDElement = document.createElement("p");
            qrCodeIDElement.textContent = `QR Code ID: ${result.qrCodeID}`;
            qrCodeIDElement.style.fontWeight = "bold";

            // Display QR Code image
            const qrCodeImage = document.createElement("img");

            // Check if QR code is base64 or a URL
            if (result.qrCodeImage.startsWith("data:image/png;base64,")) {
                // If it's base64 encoded data
                qrCodeImage.src = result.qrCodeImage;
            } else {
                // If it's a relative file path, prepend the server URL
                qrCodeImage.src = "http://localhost:3000" + result.qrCodeImage; // Ensure URL includes localhost
            }
            
            qrCodeImage.alt = "QR Code";

            // Append elements to the body or a specific container
            const resultContainer = document.getElementById("resultContainer");
            resultContainer.innerHTML = ""; // Clear previous results
            resultContainer.appendChild(qrCodeIDElement);
            resultContainer.appendChild(qrCodeImage);
        } else {
            // Handle error
            messageElement.textContent = `Error: ${result.error || "An unknown error occurred"}`;
            messageElement.style.color = "red";
        }
    } catch (error) {
        console.error("Error during registration:", error);
        const messageElement = document.getElementById("responseMessage");
        messageElement.textContent = `Error: ${error.message}`;
        messageElement.style.color = "red";
    }
});
