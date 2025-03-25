const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require("mysql2");
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


const app = express();
const port = 3000;
let sessions = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, "../frontend")));
app.use('/qr-codes', express.static(path.join(__dirname, 'qr-codes')));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'conference_management', 
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
    } else {
        console.log('Connected to MySQL database.');
    }
});

// API Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/welcome.html"));
});
// 1. Register participant
app.post('/api/register', async (req, res) => {
    const { participantId, name, email, organization, password } = req.body;

    if (!participantId || !name || !email || !organization || !password) {
        return res.status(400).json({ error: 'participant id, Name, email, and password are required.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
       
        // Generate QR code data
        const qrData = JSON.stringify({
            participant_id: participantId,
            name: name,
            email: email,
            organization: organization
            
            
        });


        // Define the path where the QR code image will be saved
        
        const qrCodeImagePath = path.join(__dirname, 'qr-codes', `${participantId}.png`);

        // Generate the QR code and save it as a file
        await QRCode.toFile(qrCodeImagePath, qrData);

        // Insert participant details into the database
        const query = `
            INSERT INTO participants (participant_id, name, email, password, QR_code)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(query, [participantId, name, email, hashedPassword, qrCodeImagePath], async (err, result) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).json({ error: 'Failed to save participant.' });
            }

            try {
                // Send the QR code via email
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'ewtsystem@gmail.com',
                        pass: 'aldjutnurpdytjai',
                    },
                });

                const mailOptions = {
                    from: '"Conference Team" <ewtsystem@gmail.com>',
                    to: email,
                    subject: 'Your QR Code for the Conference',
                    text: `Hi ${name},\n\nThank you for registering! Your QR Code is attached below.`,
                    html: `
                        <p>Hi <b>${name}</b>,</p>
                        <p>Thank you for registering for the conference! Please find your QR code attached below:</p>
                        <p>Best regards,</p>
                        <p>Conference Team</p>
                    `,
                    attachments: [
                        {
                            filename: `${participantId}.png`,
                            path: qrCodeImagePath,  // Path to the saved QR code image
                            cid: 'qrCodeImage'      // Optional, for embedding as inline image
                        }
                    ]
                };

                await transporter.sendMail(mailOptions);

                // Respond with participant details and QR code data URL
                res.status(200).json({
                    participant_id: participantId,
                    qrCodeID: participantId,
                    qrCodeImage: `/qr-codes/${participantId}.png`
                });

            } catch (emailError) {
                console.error('Email sending error:', emailError);
                return res.status(500).json({ error: 'Failed to send email.' });
            }
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Failed to process the registration. Please try again.' });
    }
});



// app.post('/api/register', async (req, res) => {
//     const { name, email, password } = req.body;

//     // Generate a unique QR Code ID
//     const qrCodeID = `${name}-${Date.now()}`;
//     const qrData = `Name: ${name}, Email: ${email}, ID: ${qrCodeID}`; // QR code content

//     try {
//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Generate QR Code image as a Data URL
//         const qrCodeImage = await QRCode.toDataURL(qrData);

//         // Save data to the database
//         const sql = 'INSERT INTO participants (name, email, password, QR_code) VALUES (?, ?, ?, ?)';
//         db.query(sql, [name, email, hashedPassword, qrCodeID], (err, result) => {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }

//             // Respond with QR Code ID and image
//             res.json({
//                 message: 'Participant registered successfully',
//                 participant_id: result.insertId,
//                 qrCodeID, // Send the QR Code ID
//                 qrCodeImage, // Send the QR Code image
//             });
//         });
//     } catch (err) {
//         console.error("Error during registration:", err);
//         res.status(500).json({ error: "Failed to register participant" });
//     }
// });


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM participants WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Send back the user details, including participant_id and name
        res.json({ message: 'Login successful', user: { name: user.name, participantId: user.participant_id } });
    });
});



// 2. Fetch all participants
app.get("/api/participants", (req, res) => {
    const query = "SELECT * FROM participants";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching participants:", err);
            res.status(500).json({ error: "Error fetching participants" });
        } else {
            res.json(results);
        }
    });
});





app.post('/api/sessions', (req, res) => {
    const { trackId, title, speaker, time, venue, capacity } = req.body;
    const sql = 'INSERT INTO tracks_sessions (track_id, title, speaker, time, venue, capacity) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [trackId, title, speaker, time, venue, capacity], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Session added successfully', session_id: result.insertId });
    });
});

app.get('/api/sessions', (req, res) => {
    const sql = 'SELECT * FROM tracks_sessions';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


app.post('/api/session-registration', (req, res) => {
    const { sessionId, participantId } = req.body;

    // Fetch current sessions_registered value
    const selectSql = 'SELECT sessions_registered FROM participants WHERE participant_id = ?';
    db.query(selectSql, [participantId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        let registeredSessions = results[0].sessions_registered || '';
        const sessionIds = registeredSessions ? registeredSessions.split(',') : [];

        // Check if the session is already registered
        if (sessionIds.includes(String(sessionId))) {
            return res.status(400).json({ error: 'Already registered for this session' });
        }

        // Add the new session to the list
        sessionIds.push(sessionId);
        registeredSessions = sessionIds.join(',');

        // Update sessions_registered column
        const updateSql = 'UPDATE participants SET sessions_registered = ? WHERE participant_id = ?';
        db.query(updateSql, [registeredSessions, participantId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: 'Session registered successfully' });
        });
    });
});


app.get('/api/registered-sessions/:participantId', (req, res) => {
    const participantId = req.params.participantId;

    const sql = `
        SELECT ts.title, ts.speaker, ts.time, ts.venue
        FROM tracks_sessions ts
        JOIN participants p ON FIND_IN_SET(ts.session_id, p.sessions_registered)
        WHERE p.participant_id = ?
    `;
    db.query(sql, [participantId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});




app.delete('/api/sessions/:id', (req, res) => {
    const sessionId = req.params.id;
    const sql = 'DELETE FROM tracks_sessions WHERE session_id = ?';

    db.query(sql, [sessionId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ message: 'Session deleted successfully' });
    });
});


app.put('/api/sessions/:id', (req, res) => {
    const sessionId = req.params.id;
    const { trackId, title, speaker, time, venue, capacity } = req.body;

    const sql = `
        UPDATE tracks_sessions 
        SET track_id = ?, title = ?, speaker = ?, time = ?, venue = ?, capacity = ?
        WHERE session_id = ?
    `;

    db.query(sql, [trackId, title, speaker, time, venue, capacity, sessionId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ message: 'Session updated successfully' });
    });
});



// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'public/uploads');
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, uniqueSuffix + '_' + file.originalname);
//     }
//   });
  
//   const upload = multer({ storage: storage });

// // Routes

// // Upload Proceedings
// app.post("/upload", upload.single("file"), (req, res) => {
//     const { title, description } = req.body;
//     const file_path = `/uploads/${req.file.filename}`;

//     const sql = "INSERT INTO proceedings (title, description, file_path) VALUES (?, ?, ?)";
//     db.query(sql, [title, description, file_path], (err) => {
//         if (err) throw err;
//         res.status(200).send("Proceeding uploaded successfully!");
//     });
// });

// // Fetch Proceedings
// app.get("/proceedings", (req, res) => {
//     const sql = "SELECT * FROM proceedings ORDER BY uploaded_at DESC";
//     db.query(sql, (err, results) => {
//         if (err) throw err;
//         res.json(results);
//     });
// });


const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


app.post('/upload', upload.single('file'), (req, res) => {
    const { title, description, session_id } = req.body;
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Session:', session_id);  // Check if session is null here
  
    const filePath = `/uploads/${req.file.filename}`;
    
    const query = 'INSERT INTO proceedings (title, description, session_id, file_path) VALUES (?, ?, ?, ?)';
    db.query(query, [title, description, session_id, filePath], (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error uploading proceedings' });
        return;
      }
      res.status(200).json({ message: 'Proceeding uploaded successfully!' });
    });
  });
  



// Fetch proceedings route
app.get('/proceedings', (req, res) => {
    const session = req.query.session;  // Get session from query parameter
    let query = 'SELECT * FROM proceedings';

    if (session) {
        query += ' WHERE session_id = ?';  // Filter by session_id
    }

    db.query(query, [session], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching proceedings' });
            return;
        }
        res.json(result);  // Send the filtered proceedings
    });
});

// Update proceeding route
app.put('/proceedings/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, session_id } = req.body;
    const query = 'UPDATE proceedings SET title = ?, description = ?, session_id = ? WHERE id = ?';

    db.query(query, [title, description, session_id, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Error updating proceeding' });
            return;
        }
        res.status(200).json({ message: 'Proceeding updated successfully!' });
    });
});

// Delete proceeding route
app.delete('/proceedings/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM proceedings WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting proceeding:', err);
            res.status(500).send('Failed to delete proceeding');
        } else {
            res.send('Proceeding deleted successfully');
        }
    });
});

app.post('/admin/register', async (req, res) => {
    try {
      const { name, email, phone_number, password } = req.body;
  
      // Check if all required fields are provided
      if (!name || !email || !phone_number || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Check if email already exists
      const queryCheckEmail = `SELECT * FROM admin WHERE email = ?`;
      db.query(queryCheckEmail, [email], (err, result) => {
        if (err) {
          console.error('Database error:', err); // Log database errors
          return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        if (result.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }
  
        // Insert new admin into database
        const query = `INSERT INTO admin (name, email, phone_number, password) VALUES (?, ?, ?, ?)`;
        db.query(query, [name, email, phone_number, password], (err, result) => {
          if (err) {
            console.error('Database error:', err); // Log database errors
            return res.status(500).json({ message: 'Database error: ' + err.message });
          }
          res.status(200).json({ message: 'Registration successful' });
        });
      });
    } catch (err) {
      console.error('Server error:', err); // Log server-side errors
      res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });


  app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
  
    // Get admin data from the database
    db.query('SELECT * FROM admin WHERE email = ?', [email], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const admin = results[0];
  
      // Compare plain text password (no bcrypt needed)
      if (password === admin.password) {
        // Passwords match, generate JWT token
        const token = jwt.sign({ id: admin.id, email: admin.email }, 'your_jwt_secret', { expiresIn: '1h' });
        return res.status(200).json({ message: 'Login successful', token });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    });
  });
  

// Serve static files (frontend)

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query to find user by email
        const result = await pool.query('SELECT * FROM participants WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // Check if password matches (assuming you stored a hashed password)
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Return the user's data including name, participant_id, QR_code, and sessions_registered
        return res.json({
            participant_id: user.participant_id,
            name: user.name,
            QR_code: user.QR_code,
            sessions_registered: user.sessions_registered
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/user/:participantId', async (req, res) => {
    const { participantId } = req.params;

    try {
        const result = await pool.query('SELECT name FROM participants WHERE participant_id = $1', [participantId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Participant not found' });
        }
        
        const participant = result.rows[0];
        res.json(participant);
    } catch (error) {
        console.error('Error fetching participant details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Pseudo code for the server (Node.js example)
app.get('/proceedings/participants', async (req, res) => {
    const participantId = req.query.participantId;

    if (!participantId) {
        return res.status(400).send({ message: 'Participant ID is required.' });
    }

    try {
        // Query to get the participant's sessions_registered
        const getParticipantSessionsQuery = `
            SELECT sessions_registered FROM participants WHERE participant_id = ?
        `;

        db.execute(getParticipantSessionsQuery, [participantId], (err, participantResults) => {
            if (err) {
                console.error('Error fetching participant sessions:', err);
                return res.status(500).send({ message: 'Error fetching participant sessions.' });
            }

            if (participantResults.length === 0) {
                return res.status(404).send({ message: 'Participant not found.' });
            }

            const sessionsRegistered = participantResults[0].sessions_registered;

            if (!sessionsRegistered) {
                return res.status(404).send({ message: 'No sessions registered for this participant.' });
            }

            // Query to fetch proceedings for all registered sessions
            const fetchProceedingsQuery = `
                SELECT * FROM proceedings
                WHERE FIND_IN_SET(session_id, ?) > 0
            `;

            db.execute(fetchProceedingsQuery, [sessionsRegistered], (err, proceedingsResults) => {
                if (err) {
                    console.error('Error fetching proceedings:', err);
                    return res.status(500).send({ message: 'Error fetching proceedings.' });
                }

                if (proceedingsResults.length === 0) {
                    return res.status(404).send({ message: 'No proceedings found for registered sessions.' });
                }

                // Send the proceedings as a JSON response
                res.json(proceedingsResults);
            });
        });
    } catch (error) {
        console.error('Error in /proceedings/participants route:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});


// app.post('/check-in', (req, res) => {
//     const { data, sessionId } = req.body;

//     if (!data || !sessionId) {
//         return res.status(400).json({ error: 'QR code data and session ID are required.' });
//     }

//     try {
//         // Parse the QR code data
//         const { participant_id, name, email, organization } = JSON.parse(data);

//         // Check if the participant exists
//         db.query(
//             'SELECT * FROM participants WHERE participant_id = ?',
//             [participant_id],
//             (err, participantResults) => {
//                 if (err || participantResults.length === 0) {
//                     return res.status(400).json({ error: 'Invalid participant.' });
//                 }

//                 // Check if the session exists
//                 db.query(
//                     'SELECT * FROM sessions WHERE session_id = ?',
//                     [sessionId],
//                     (err, sessionResults) => {
//                         if (err || sessionResults.length === 0) {
//                             return res.status(400).json({ error: 'Invalid session.' });
//                         }

//                         // Record attendance
//                         db.query(
//                             'INSERT INTO attendance (participant_id, session_id, check_in_time) VALUES (?, ?, NOW())',
//                             [participant_id, sessionId],
//                             (err, attendanceResults) => {
//                                 if (err) {
//                                     return res.status(500).json({ error: 'Failed to record attendance.' });
//                                 }

//                                 res.status(200).json({ message: 'Check-in successful!' });
//                             }
//                         );
//                     }
//                 );
//             }
//         );
//     } catch (err) {
//         console.error(err);
//         res.status(400).json({ error: 'Invalid QR code data.' });
//     }
// });


app.post('/check-in', (req, res) => {
    const { data, sessionId } = req.body;

    if (!data || !sessionId) {
        return res.status(400).json({ error: 'QR code data and session ID are required.' });
    }

    try {
        // Parse the QR code data
        const { participant_id, name, email, organization } = JSON.parse(data);
        console.log("Parsed QR Code Data: ", { participant_id, name, email, organization });

        // Check if the participant exists
        db.query(
            'SELECT * FROM participants WHERE participant_id = ?',
            [participant_id],
            (err, participantResults) => {
                if (err) {
                    console.error("Error fetching participant:", err);
                    return res.status(500).json({ error: 'Error checking participant.' });
                }
                if (participantResults.length === 0) {
                    console.error("Participant not found:", participant_id);
                    return res.status(400).json({ error: 'Invalid participant.' });
                }

                // Check if the session exists in the track_sessions table
                db.query(
                    'SELECT * FROM tracks_sessions WHERE session_id = ?',
                    [sessionId],
                    (err, sessionResults) => {
                        if (err) {
                            console.error("Error fetching session:", err);
                            return res.status(500).json({ error: 'Error checking session.' });
                        }
                        if (sessionResults.length === 0) {
                            console.error("Session not found:", sessionId);
                            return res.status(400).json({ error: 'Invalid session.' });
                        }

                        // Record attendance in the track_sessions table
                        db.query(
                            'INSERT INTO attendance (participant_id, session_id, check_in_time) VALUES (?, ?, NOW())',
                            [participant_id, sessionId],
                            (err, attendanceResults) => {
                                if (err) {
                                    console.error("Error recording attendance:", err);
                                    return res.status(500).json({ error: 'Failed to record attendance.' });
                                }

                                console.log("Attendance successfully recorded for participant:", participant_id);
                                res.status(200).json({ message: 'Check-in successful!' });
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        console.error("Error processing QR code:", err);
        res.status(400).json({ error: 'Invalid QR code data or processing error.' });
    }
});


app.post('/add-session', (req, res) => {
    const { sessionId ,sessionName} = req.body;
    if (!sessionId || !sessionName) {
        return res.status(400).json({ message: "Session ID is required." });
    }

    // Add session to the list
    sessions.push({ sessionId , sessionName});
    res.status(200).json({ message: "Session added successfully!" });
});

// Get all sessions for users to check in
app.get('/sessions', (req, res) => {
    res.status(200).json({ sessions });
});



// Assuming you are using Express
app.delete('/delete-session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    // Assuming sessions are stored in an array or database
    const sessionIndex = sessions.findIndex(session => session.sessionId === sessionId);
    if (sessionIndex !== -1) {
        sessions.splice(sessionIndex, 1);  // Remove session
        res.json({ message: 'Session deleted successfully' });
    } else {
        res.status(404).json({ message: 'Session not found' });
    }
});





app.post('/submit-feedback', (req, res) => {
    const { name, email, rating, feedback } = req.body;

    if (!name || !email || !rating || !feedback) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Insert feedback into the database
    const query = 'INSERT INTO feedbacks (name, email, rating, feedback) VALUES (?, ?, ?, ?)';
    const values = [name, email, rating, feedback];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting feedback:', err);
            return res.status(500).json({ message: 'Error submitting feedback' });
        }

        // Respond with success message
        res.status(200).json({ message: 'Feedback submitted successfully!' });
    });
});

app.get('/get-feedbacks', (req, res) => {
    const sql = 'SELECT * FROM feedbacks';
    
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


// Delete feedback
app.delete('/delete-feedback/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM feedbacks WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Feedback deleted successfully!' });
    });
});

app.get('/get-attendance', (req, res) => {
    const sessionId = req.query.sessionId; // Get sessionId from query parameters

    if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required.' });
    }

    // SQL query to fetch attendance data by session_id
    const query = `
        SELECT a.attendance_id, a.participant_id, a.session_id, a.check_in_time, 
               p.name AS participant_name, p.email AS participant_email
        FROM attendance a
        JOIN participants p ON a.participant_id = p.participant_id
        WHERE a.session_id = ?
    `;

    db.query(query, [sessionId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching attendance data.', error: err });
        }
        res.json(results); // Return attendance data
    });
});



// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});