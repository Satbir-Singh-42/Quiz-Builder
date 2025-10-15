# Quiz Builder Application

A full-stack web application for creating, managing, and taking timed quizzes. Perfect for educational institutions, training organizations, or any scenario requiring structured assessments.

## Features

### For Administrators
- **User Authentication**: Secure admin login and registration system
- **Quiz Creation**: Build quizzes with customizable time limits and passing scores
- **Question Management**: Add multiple-choice questions with correct answers
- **Quiz Preview**: Test quizzes before making them available to participants
- **Results Dashboard**: View detailed analytics on quiz performance
- **Export Results**: Download participant results as CSV files

### For Participants
- **User Registration**: Simple registration with name, roll number, class, and department
- **Quiz Taking**: Intuitive interface for answering questions
- **Timed Sessions**: Real-time countdown timer for quiz completion
- **Instant Feedback**: Immediate score display upon submission
- **Detailed Results**: Review answers with correct solutions highlighted

## Getting Started

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

### Using the Application

#### As an Administrator

1. **Login**:
   - Navigate to `/auth` to access the admin login page
   - Use the default credentials (admin/admin123) or create a new admin account

2. **Dashboard**:
   - View overall statistics including:
     - Total quizzes
     - Quiz submissions
     - Average scores

3. **Create Quiz**:
   - Click "Create Quiz" button in the dashboard or sidebar
   - Set quiz title, time limit, and passing score
   - Add questions with multiple-choice options
   - Mark the correct answer for each question
   - Submit to create the quiz

4. **Manage Quizzes**:
   - View all created quizzes
   - Edit quiz details and questions
   - Preview quizzes from a participant's perspective
   - Delete quizzes when no longer needed

5. **View Results**:
   - Access the "User Results" section to see all submissions
   - Filter results by quiz
   - Sort by submission date, score, or time taken
   - Export results to CSV for further analysis

#### As a Participant

1. **Register**:
   - Enter your full name, roll number, class, and department
   - Submit to access available quizzes

2. **Taking a Quiz**:
   - Select a quiz from the list of available quizzes
   - Read the instructions and note the time limit
   - Answer questions in one of two modes:
     - "One by One": Navigate through questions sequentially
     - "All Questions": View and answer all questions on a single page
   - Submit your answers before the timer expires

3. **Viewing Results**:
   - Review your score immediately after submission
   - See which questions were answered correctly/incorrectly
   - View the correct answers for any missed questions

## Technical Setup

### Prerequisites
- Node.js and npm
- PostgreSQL database

### Environment Variables
The application relies on the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management

### Development
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up the database with `npm run db:push`
4. Seed initial data with `npm run db:seed`
5. Start the development server with `npm run dev`

## Technologies Used

- **Frontend**: React, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy

## License

This project is licensed under the MIT License - see the LICENSE file for details.