# MERN Expense Tracker App

A modern, full-stack web application for tracking income and expenses with real-time analytics and data visualization.

## Features

✨ **Key Features:**
- 🔐 User Authentication (Register/Login)
- 💰 Add, Edit, and Delete Transactions
- 📊 Dynamic Dashboard with Charts
  - Pie chart for expense categories
  - Line chart for monthly trends
  - Income/Expense comparison with month-to-month percentage change
- 🔍 Advanced Filtering (by type, category, search)
- 💾 Persistent Data Storage (MongoDB)
- 📱 Responsive Design
- 🌐 Localized Currency (Indonesian Rupiah - IDR)
- 🎨 Modern UI with Lucide Icons
- 🔔 Toast Notifications

## Tech Stack

### Frontend
- **React** - UI framework with Hooks (useState, useEffect)
- **Recharts** - Data visualization (PieChart, LineChart)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **CSS3** - Styling with responsive design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables

## Project Structure

```
mern-expense-tracker-app/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.jsx      # Main dashboard with charts
│   │   │   │   ├── Transactions.jsx   # Transaction list & management
│   │   │   │   ├── TransactionModal.jsx # Add/Edit modal
│   │   │   │   ├── Login.jsx          # Login page
│   │   │   │   ├── Register.jsx       # Registration page
│   │   │   │   ├── Profile.jsx        # User profile
│   │   │   │   └── Layout.jsx         # Main layout
│   │   │   └── styles/                # Component stylesheets
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                          # Node.js Backend
│   ├── server.js                    # Express server & API routes
│   ├── .env                         # Environment variables
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file with:**
   ```env
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   PORT=5000
   ```
   > For MongoDB Atlas, use: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/expense-tracker`

4. **Start the server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   App runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user/:id` - Get user profile
- `PUT /api/auth/user/:id` - Update user profile

### Transactions
- `GET /api/expenses` - Get all transactions
- `POST /api/expenses` - Create new transaction
- `PUT /api/expenses/:id` - Update transaction
- `DELETE /api/expenses/:id` - Delete transaction

## Usage

1. **Register Account** - Create a new user account
2. **Login** - Access your dashboard
3. **Add Transactions** - Click "Add Transaction" to record income/expense
4. **View Dashboard** - See charts, stats, and expense breakdown
5. **Manage Transactions** - Edit or delete transactions from the table
6. **View Profile** - Manage your account information

## Key Components

### Dashboard
Displays:
- Total Income & Expense cards with month-to-month comparison
- Expense breakdown by category (Pie chart)
- 6-month trend analysis (Line chart)
- Real-time data from API

### Transactions
Features:
- Searchable transaction list
- Filter by type (Income/Expense) and category
- Edit transactions inline
- Delete with confirmation UI
- Currency formatting (IDR)

### TransactionModal
- Add new transactions
- Edit existing transactions
- Form validation
- Category selection based on type

## Currency Format

All monetary values are displayed in **Indonesian Rupiah (IDR)** using the format:
- Example: `Rp 1.000.000,00` instead of `$1,000.00`

## Authentication Flow

1. User registers with username, email, password
2. Credentials stored in MongoDB
3. On login, user data saved to localStorage
4. API calls use `userId` from localStorage
5. Logout clears localStorage

## Development Notes

- All API calls use Fetch API (not axios)
- State management: React Hooks (useState, useEffect)
- No external state management library (Redux, Zustand)
- Error handling with toast notifications
- Responsive CSS Grid/Flexbox layout

## Common Issues & Solutions

### Server Connection Error
```
Error: Failed to fetch from http://localhost:5000/api
```
**Solution:** Ensure server is running on port 5000

### MongoDB Connection Error
```
MongooseError: connect ECONNREFUSED
```
**Solution:** Check MongoDB is running and MONGO_URI is correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process or change PORT in .env

## Future Enhancements

- 📈 Advanced analytics & reports
- 💳 Multiple account support
- 📱 Mobile app version
- 🔄 Data export (CSV, PDF)
- 📧 Email notifications
- 💬 Budget alerts

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please create an issue in the repository.

---

**Happy Tracking! 💰**
