
# Firebase Studio - Telebounties App

This is a Next.js starter in Firebase Studio for the Telebounties application. It includes features for task management, user submissions, reward redemption, and an admin review panel.

## Getting Started: Running the Project Locally

Follow these steps to set up and run the project on your local machine for development and testing.

### 1. Prerequistes

*   **Node.js:** Ensure you have Node.js (version 18 or later) installed. You can download it from [nodejs.org](https://nodejs.org/).
*   **A Firebase Project:** You must have an active Firebase project. If you don't, create one at the [Firebase Console](https://console.firebase.google.com/).

### 2. Get the Code

Clone the repository to your local machine or download the source code files.

### 3. Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the necessary packages defined in `package.json`:

```bash
npm install
```

### 4. Set Up Environment Variables

This is a critical step to connect the application to your specific Firebase project.

*   In the root directory, you will find a file named `placeholder.env.local`.
*   Create a copy of this file and rename the copy to **`.env.local`**.
*   Open the newly created `.env.local` file. You will need to replace the placeholder values with your actual Firebase project credentials.

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

*   **Where to find your Firebase credentials:**
    1.  Go to the [Firebase Console](https://console.firebase.google.com/) and select your project.
    2.  Click the gear icon next to "Project Overview" and go to **Project settings**.
    3.  Under the **General** tab, scroll down to the "Your apps" section.
    4.  Select your web app (or create one if you haven't).
    5.  Choose the **"Config"** option for SDK setup and configuration. You will see all the required values there.
*   **Important**: The `.env.local` file is listed in `.gitignore`, so your secret keys will not be committed to your repository.

### 5. Run the Development Server

Once your dependencies are installed and your environment variables are set, run the following command in your terminal:

```bash
npm run dev
```

The application will start, and you can view it in your browser at **[http://localhost:9004](http://localhost:9004)**. The terminal will show logs, and any changes you make to the code will automatically reload the page.

## Core Features:

*   **Task List:** Display available tasks that users can complete.
*   **Task Submission:** A detailed page for each task with a form for users to submit their work (e.g., a link to a meme or tweet).
*   **User Profile:** Displays user information, HTR balance, and a history of their submissions.
*   **Redemption System:** Allows users to redeem their HTR for real money via PayPal or UPI, creating a request for admin approval.
*   **Settings:** Theme toggle, password update, logout, and account deletion.
*   **Admin Review Panel:** An admin-only page to review, approve, or reject task submissions and redemption requests, and award HTR.
