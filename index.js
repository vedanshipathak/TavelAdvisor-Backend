const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to enable CORS
app.use(cors());

// Create a Mongoose schema for the user data
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  confirm_password: String
});

// Create a Mongoose model using the schema
const User = mongoose.model('User', userSchema);

// Middleware to check if password and confirm_password match
const checkPasswordMatch = (req, res, next) => {
  const { password, confirm_password } = req.body;
  console.log(req.body);
  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Password and confirm password do not match.' });
  }
  next();
};

// Middleware to check if email already exists in the database
const checkExistingEmail = async (req, res, next) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking email existence.', error: error.message });
  }
};

// POST endpoint for sign-up with the checkPasswordMatch and checkExistingEmail middlewares
app.post('/signup', checkPasswordMatch, checkExistingEmail, async (req, res) => {
  // Extract email, password, and confirm_password from the request body
  const { email, password, confirm_password } = req.body;

  // Create a new User instance
  const newUser = new User({
    email,
    password,
    confirm_password
  });

  try {
    // Save the new user to the database
    await newUser.save();
    // Respond with a success message and the user data
    res.status(201).json({ message: 'User signed up successfully.', user: newUser });
  } catch (error) {
    // If there's an error, send a 500 response with the error message
    res.status(500).json({ message: 'Failed to sign up user.', error: error.message });
  }
});


// POST endpoint for sign-in
app.post('/signin', async (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;
  
    try {
      // Check if a user with the provided email exists in the database
      const existingUser = await User.findOne({ email });
  
      // If no user found, return an error
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found. Please sign up.' });
      }
  
      // Check if the password provided matches the password stored in the database
      if (existingUser.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
      }
  
      // If both email and password are correct, return success message and user data
      res.status(200).json({ message: 'User signed in successfully.', user: existingUser });
    } catch (error) {
      // If there's an error, send a 500 response with the error message
      res.status(500).json({ message: 'Failed to sign in user.', error: error.message });
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});