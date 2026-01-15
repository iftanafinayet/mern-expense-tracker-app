const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// MODEL DEFINITIONS
const UserSchema = new mongoose.Schema({
    username : { type: String, required: true, unique: true },
    email : { type : String, required: true, unique:true },
    password : {type : String, required: true },
    profileImage : { type: String },
    role : { type : String },
    createdAt : { type : Date, default : Date.now }
});

const TransactionSchema = new mongoose.Schema({
    userId : { type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true },
    title : { type : String, required : true },
    description : { type : String },
    amount : { type : Number, required : true },
    type : { type : String, enum : ['income', 'expense'], required : true },
    category : { type : String, required : true },
    date : { type : Date, default : Date.now },
    createdAt : { type : Date, default : Date.now }
});

const AccountSchema = new mongoose.Schema({
    userId : { type : mongoose.Schema.Types.ObjectId, ref : 'User', requires : true },
    balance : { type : Number, required : true, default : 0 },
    totalIncome : { type : Number, required : true, default : 0 },
    totalExpense : { type : Number, required : true, default : 0 },
    budget : { type : Number, required : true, default : 0 },
    categories : { type : [String], default : ['food', 'Transportation', 'Entertainment'] }
});

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.model('Account', AccountSchema);

// Routes
// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Cek apakah username atau email sudah ada
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.username === username 
                    ? 'Username already exists' 
                    : 'Email already exists' 
            });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.get('/api/auth/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' }); 
    }
});

app.put('/api/auth/user/:id', async (req, res) => {
    const { username, email, profileImage } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username, email, profileImage },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.post('/api/auth/upload-profile-image/:id', async (req, res) => {
    const { profileImage } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { profileImage },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Profile image updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.post ('/api/auth/logout', (req, res) => {
    // For stateless JWT, logout can be handled on client side by deleting the token
    res.status(200).json({ message: 'Logout successful' });
});

// Transaction Routes
app.get('/api/expenses', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.status(200).json(transactions);
    } catch (error){
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.get('/api/expenses/:month/:year', async (req, res) => {
    const { month, year } = req.params;
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const transactions = await Transaction.find({
            date: { $gte: startDate, $lte: endDate }
        });
        res.status(200).json(transactions);
    } catch (error){
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.post('/api/expenses', async (req, res) => {
    const { userId, title, description, amount, type, category, date } = req.body;
    try {
        if (!title || !amount || !type || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTransaction = new Transaction({
            userId,
            title,
            description,
            amount,
            type,
            category,
            date: date || new Date()
        });
        await newTransaction.save();
        res.status(201).json({ message: 'Transaction added successfully', transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.put('/api/expenses/:id', async (req, res) => {
    const { title, description, amount, type, category, date } = req.body;
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { title, description, amount, type, category, date },
            { new: true }
        );
        if (!updatedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });     
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!deletedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.get ('/api/expenses/download', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        // Convert transactions to CSV or desired format here
        // For simplicity, sending JSON response
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}); 

// Income Routes
app.get('/api/income', async (req, res) => {
    try {
        const incomeTransactions = await Transaction.find({ type: 'income' });
        res.status(200).json(incomeTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.post('/api/income', async (req, res) => {
    const { userId, title, description, amount, category, date } = req.body;
    try {
        const newIncome = new Transaction({
            userId,
            title,
            description,
            amount,
            type: 'income',
            category,
            date: date || new Date()
        });
        await newIncome.save();
        res.status(201).json({ message: 'Income added successfully', transaction: newIncome });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// Dashboard Routes
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const totalIncome = await Transaction.aggregate([
            { $match: { type: 'income' } },
            { $group: {
                _id: null,
                total: { $sum: '$amount' }
            }}
        ]);
        const totalExpense = await Transaction.aggregate([
            { $match: { type: 'expense' } },
            { $group: {
                _id: null,
                total: { $sum: '$amount' }
            }}
        ]);
        res.status(200).json({
            totalIncome: totalIncome[0] ? totalIncome[0].total : 0,
            totalExpense: totalExpense[0] ? Math.abs(totalExpense[0].total) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }  
});

app.get('/api/dashboard/recent-transaction', async (req, res) => {
    try {
        const recentTransactions = await Transaction.find()
        .sort({ date: -1 })
        .limit(5);
        res.status(200).json(recentTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            { $group: {
                _id: { $month: '$date' },
                totalIncome: { $sum: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                }},
                totalExpense: { $sum: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]  
                }}
            }}
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});