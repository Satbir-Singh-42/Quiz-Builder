# Quiz Builder Application - User Guide

This comprehensive guide explains how to use the Quiz Builder application for both administrators and participants.

## Table of Contents

1. [For Administrators](#for-administrators)
   - [Authentication](#administrator-authentication)
   - [Dashboard Overview](#dashboard-overview)
   - [Creating Quizzes](#creating-quizzes)
   - [Managing Quizzes](#managing-quizzes)
   - [Viewing Results](#viewing-results)
   - [Best Practices](#administrator-best-practices)

2. [For Participants](#for-participants)
   - [Registration](#participant-registration)
   - [Taking Quizzes](#taking-quizzes)
   - [Understanding Results](#understanding-results)
   - [Tips for Success](#participant-tips)

---

## For Administrators

### Administrator Authentication

1. **Accessing the Admin Page**:
   - Navigate to the `/auth` route in your browser
   - You'll see a login/register form

2. **Logging In**:
   - Use the default credentials:
     - Username: `admin`
     - Password: `admin123`
   - Or use your previously created admin account

3. **Creating a New Admin Account**:
   - Click the "Register" tab
   - Enter a username (at least 3 characters)
   - Create a password (at least 6 characters)
   - Confirm your password
   - Click "Register"

4. **Security Recommendations**:
   - Change the default admin password after first login
   - Use a strong, unique password
   - Don't share admin credentials with unauthorized users

### Dashboard Overview

The admin dashboard provides a comprehensive overview of all quiz activity:

1. **Key Statistics**:
   - Total Quizzes: The number of quizzes created
   - Quiz Submissions: Total number of completed quizzes
   - Average Score: Overall average score across all submissions

2. **Recent Quizzes Section**:
   - Shows the most recently created quizzes
   - Displays quick information (questions, time limits)
   - Provides quick edit access

3. **Recent Results Section**:
   - Shows the most recent quiz submissions
   - Displays participant information and scores
   - Offers links to detailed result views

### Creating Quizzes

1. **Starting Quiz Creation**:
   - Click "Create Quiz" in the sidebar or dashboard
   - You'll be taken to the quiz creation form

2. **Setting Quiz Parameters**:
   - **Title**: Enter a descriptive name for your quiz
   - **Time Limit**: Set the duration in minutes (e.g., 30)
   - **Passing Score**: Define the minimum percentage to pass (e.g., 60%)

3. **Adding Questions**:
   - Enter the question text
   - Add at least two answer options
   - Select the correct answer by clicking the radio button
   - Use the "Add Another Option" button to add more choices
   - Click "Add Another Question" to include additional questions

4. **Finalizing the Quiz**:
   - Review all questions and answers
   - Ensure the correct answers are selected
   - Click "Create Quiz" to save

### Managing Quizzes

1. **Viewing All Quizzes**:
   - Navigate to "Manage Quizzes" in the sidebar
   - See a complete list of all created quizzes

2. **Searching and Filtering**:
   - Use the search box to find quizzes by title
   - Sort quizzes by various attributes

3. **Quiz Actions**:
   - **Edit**: Modify quiz details and questions
   - **Preview**: Test the quiz from a participant's perspective
   - **Delete**: Remove quizzes that are no longer needed

4. **Editing a Quiz**:
   - Change the title, time limit, or passing score
   - Add, modify, or remove questions
   - Update answer options and correct answers

### Viewing Results

1. **Accessing Result Data**:
   - Click "User Results" in the sidebar
   - View all quiz submissions in a sortable table

2. **Filtering and Sorting**:
   - Filter by specific quiz
   - Sort by submission date, score, or time taken
   - Search for specific participants

3. **Analyzing Performance**:
   - View overall statistics at the bottom of the page
   - See average scores, time taken, and pass rates

4. **Exporting Data**:
   - Click "Export Results" to download a CSV file
   - Use this data for grading or further analysis

### Administrator Best Practices

1. **Quiz Design**:
   - Keep questions clear and concise
   - Provide enough answer options (typically 3-5)
   - Ensure there's only one correct answer per question
   - Set appropriate time limits based on question complexity

2. **Content Management**:
   - Regularly review and update quizzes
   - Remove outdated quizzes to maintain clarity
   - Create quizzes with progressive difficulty

3. **Results Analysis**:
   - Regularly review participant performance
   - Identify commonly missed questions
   - Adjust quiz content based on results

---

## For Participants

### Participant Registration

1. **Accessing the Application**:
   - Open the application in your browser
   - You'll be directed to the registration page

2. **Entering Your Information**:
   - **Full Name**: Enter your complete name
   - **Roll Number**: Provide your official identification number
   - **Class**: Enter your class or group designation
   - **Department**: Specify your department or subject area

3. **Submitting Your Information**:
   - Click "Submit" to register
   - Your information will be saved for all quiz attempts

### Taking Quizzes

1. **Selecting a Quiz**:
   - After registration, you'll see available quizzes
   - Click "Take Quiz" on the quiz you want to attempt

2. **Understanding the Interface**:
   - Note the timer at the top of the screen
   - Choose your preferred question view:
     - **One by One**: Navigate through questions sequentially
     - **All Questions**: View all questions on a single page

3. **Answering Questions**:
   - Read each question carefully
   - Select your answer by clicking the radio button
   - In "One by One" mode, use Next/Previous to navigate
   - In "All Questions" mode, scroll to see all questions

4. **Submitting Your Quiz**:
   - Click "Submit Quiz" when you've completed all questions
   - Confirm submission in the dialog box
   - If time expires, your quiz will be submitted automatically

### Understanding Results

1. **Score Summary**:
   - View your overall score and percentage
   - See how many questions you answered correctly
   - Check your total time taken

2. **Question Analysis**:
   - Review each question with your selected answer
   - Green checkmarks indicate correct answers
   - Red X marks indicate incorrect answers
   - For incorrect answers, see the correct solution

3. **Performance Metrics**:
   - Your score compared to the passing threshold
   - Time efficiency (how quickly you completed the quiz)

### Participant Tips

1. **Before the Quiz**:
   - Ensure you have a stable internet connection
   - Note the time limit for the quiz
   - Have any necessary reference materials ready (if allowed)

2. **During the Quiz**:
   - Keep an eye on the timer
   - Don't spend too much time on any single question
   - If unsure about an answer, mark your best guess and move on
   - Use the "All Questions" view to quickly check your progress

3. **Quiz Strategy**:
   - Answer easy questions first to build confidence
   - Come back to challenging questions later
   - Review all answers before submitting if time permits
   - Don't leave questions unanswered

---

## Troubleshooting

### Common Issues for Administrators

1. **Can't Create Quiz**:
   - Ensure all required fields are filled
   - Each question must have at least two options
   - One option must be selected as the correct answer

2. **Can't Delete Quiz**:
   - Ensure you have proper permissions
   - Quizzes with active submissions may require special handling

### Common Issues for Participants

1. **Can't Start Quiz**:
   - Verify your information was submitted correctly
   - Ensure the quiz is still available
   - Check your internet connection

2. **Quiz Submits Unexpectedly**:
   - The timer may have expired
   - Your connection may have been interrupted
   - Browser issues may have triggered an auto-submit

### Technical Support

If you encounter any issues not covered in this guide, please contact your system administrator or technical support team.