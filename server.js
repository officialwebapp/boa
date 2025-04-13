// Server.js - Backend for Bank of Henzo

const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// Data paths
const DATA_DIR = path.join(__dirname, "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json")

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Generate a random account number
const generateAccountNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString()
}

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify([
      {
        id: "admin-1",
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123", // In a real app, this would be hashed
        role: "admin",
        accountNumber: "9876543210",
        balance: 500000000,
        currency: "USD",
        status: "active",
        createdAt: new Date().toISOString(),
      }
    ]),
  )
}

if (!fs.existsSync(TRANSACTIONS_FILE)) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([]))
}

// Helper functions
const readData = (file) => {
  try {
    const data = fs.readFileSync(file, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${file}:`, error)
    return []
  }
}

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(`Error writing to ${file}:`, error)
    return false
  }
}

// Routes

// Auth routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" })
  }

  const users = readData(USERS_FILE)
  const user = users.find((u) => u.email === email && u.password === password)

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" })
  }

  // In a real app, we would generate a JWT token here
  const { password: _, ...userWithoutPassword } = user

  res.json({ success: true, user: userWithoutPassword })
})

app.post("/api/auth/register", (req, res) => {
  const { firstName, lastName, email, password } = req.body

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  const users = readData(USERS_FILE)

  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ success: false, message: "Email already in use" })
  }

  // Generate a unique account number
  let accountNumber
  do {
    accountNumber = generateAccountNumber()
  } while (users.some((u) => u.accountNumber === accountNumber))

  const newUser = {
    id: `user-${uuidv4()}`,
    name: `${firstName} ${lastName}`,
    email,
    password, // In a real app, this would be hashed
    role: "user",
    accountNumber,
    balance: 0, // Start with 0 balance
    currency: "USD",
    status: "active",
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)

  if (writeData(USERS_FILE, users)) {
    const { password: _, ...userWithoutPassword } = newUser
    res.status(201).json({ success: true, user: userWithoutPassword })
  } else {
    res.status(500).json({ success: false, message: "Failed to create user" })
  }
})

// User routes
app.get("/api/users", (req, res) => {
  const users = readData(USERS_FILE)
  const usersWithoutPasswords = users.map(({ password, ...user }) => user)

  res.json({ success: true, users: usersWithoutPasswords })
})

app.get("/api/users/:id", (req, res) => {
  const { id } = req.params
  const users = readData(USERS_FILE)
  const user = users.find((u) => u.id === id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  const { password, ...userWithoutPassword } = user
  res.json({ success: true, user: userWithoutPassword })
})

// Delete user
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params
  const users = readData(USERS_FILE)
  const userIndex = users.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Don't allow deleting the admin
  if (users[userIndex].role === "admin") {
    return res.status(403).json({ success: false, message: "Cannot delete admin user" })
  }

  users.splice(userIndex, 1)

  if (writeData(USERS_FILE, users)) {
    res.json({ success: true, message: "User deleted successfully" })
  } else {
    res.status(500).json({ success: false, message: "Failed to delete user" })
  }
})

// Transaction routes
app.post("/api/transactions/send", (req, res) => {
  const { senderId, recipientAccountNumber, amount, note, transactionCode } = req.body

  if (!senderId || !recipientAccountNumber || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid transaction data" })
  }

  // Verify transaction code
  if (transactionCode !== "45242769012") {
    return res.status(400).json({ success: false, message: "Invalid transaction code" })
  }

  const users = readData(USERS_FILE)
  const sender = users.find((u) => u.id === senderId)
  const recipient = users.find((u) => u.accountNumber === recipientAccountNumber)

  if (!sender) {
    return res.status(404).json({ success: false, message: "Sender not found" })
  }

  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient account not found" })
  }

  if (sender.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient funds" })
  }

  // Update balances
  sender.balance -= amount
  recipient.balance += amount

  // Create transaction record
  const transactions = readData(TRANSACTIONS_FILE)
  const transaction = {
    id: `tx-${uuidv4()}`,
    type: "transfer",
    senderId,
    senderName: sender.name,
    senderEmail: sender.email,
    senderAccountNumber: sender.accountNumber,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientAccountNumber,
    amount,
    currency: sender.currency,
    note,
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(transaction)

  if (writeData(USERS_FILE, users) && writeData(TRANSACTIONS_FILE, transactions)) {
    res.json({ success: true, transaction })
  } else {
    res.status(500).json({ success: false, message: "Failed to process transaction" })
  }
})

app.get("/api/transactions", (req, res) => {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" })
  }

  const transactions = readData(TRANSACTIONS_FILE)
  const userTransactions = transactions.filter((t) => t.senderId === userId || t.recipientId === userId)

  res.json({ success: true, transactions: userTransactions })
})

// Get all transactions (for admin)
app.get("/api/admin/transactions", (req, res) => {
  const transactions = readData(TRANSACTIONS_FILE)
  res.json({ success: true, transactions })
})

// Admin routes
app.post("/api/admin/fund-user", (req, res) => {
  const { adminId, accountNumber, amount, note } = req.body

  if (!adminId || !accountNumber || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid data" })
  }

  const users = readData(USERS_FILE)
  const admin = users.find((u) => u.id === adminId && u.role === "admin")
  const user = users.find((u) => u.accountNumber === accountNumber)

  if (!admin) {
    return res.status(403).json({ success: false, message: "Unauthorized" })
  }

  if (!user) {
    return res.status(404).json({ success: false, message: "User account not found" })
  }

  // Update user balance
  user.balance += Number.parseFloat(amount)

  // Create transaction record
  const transactions = readData(TRANSACTIONS_FILE)
  const transaction = {
    id: `tx-${uuidv4()}`,
    type: "admin-fund",
    adminId,
    adminName: admin.name,
    recipientId: user.id,
    recipientName: user.name,
    recipientEmail: user.email,
    recipientAccountNumber: accountNumber,
    amount: Number.parseFloat(amount),
    currency: user.currency,
    note: note || "Admin funding",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(transaction)

  if (writeData(USERS_FILE, users) && writeData(TRANSACTIONS_FILE, transactions)) {
    res.json({ success: true, transaction })
  } else {
    res.status(500).json({ success: false, message: "Failed to fund user" })
  }
})

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing.html"))
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
})

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"))
})

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app