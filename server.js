const express = require("express")
const path = require("path")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.static("public"))
app.use(express.json())

// Ensure data directory exists
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
}

// Helper functions for file operations
function readJsonFile(filename) {
  const filePath = path.join(dataDir, filename)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const data = fs.readFileSync(filePath, "utf8")
  return JSON.parse(data)
}

function writeJsonFile(filename, data) {
  const filePath = path.join(dataDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
}

// Initialize data files if they don't exist
function initializeDataFiles() {
  // Create users.json if it doesn't exist
  const usersPath = path.join(dataDir, "users.json")
  if (!fs.existsSync(usersPath)) {
    const initialUsers = [
      {
        id: "admin-1",
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        accountNumber: "9876543210",
        balance: 500000000,
        currency: "USD",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]
    writeJsonFile("users.json", initialUsers)
    console.log("Created initial users.json file")
  }

  // Create transactions.json if it doesn't exist
  const transactionsPath = path.join(dataDir, "transactions.json")
  if (!fs.existsSync(transactionsPath)) {
    writeJsonFile("transactions.json", [])
    console.log("Created initial transactions.json file")
  }
}

// Initialize data files
initializeDataFiles()

// Helper function to generate account number
function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString()
}

// API Routes
// Register new user
app.post("/api/auth/register", (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const users = readJsonFile("users.json")

    // Check if email already exists
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      })
    }

    // Create new user
    const newUser = {
      id: `user-${uuidv4()}`,
      name: `${firstName} ${lastName}`,
      email,
      password, // In a real app, you would hash this
      role: "user",
      accountNumber: generateAccountNumber(),
      balance: 0,
      currency: "USD",
      status: "active",
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    writeJsonFile("users.json", users)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    const users = readJsonFile("users.json")

    // Find user by email
    const user = users.find((user) => user.email === email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Get all users (admin only)
app.get("/api/users", (req, res) => {
  try {
    const users = readJsonFile("users.json")

    // Remove passwords for security
    const safeUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return res.status(200).json({
      success: true,
      users: safeUsers,
    })
  } catch (error) {
    console.error("Get users error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Get all transactions
app.get("/api/transactions", (req, res) => {
  try {
    const transactions = readJsonFile("transactions.json")
    return res.status(200).json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Send money
app.post("/api/transactions/send", (req, res) => {
  try {
    const { senderAccountNumber, recipientAccountNumber, amount, note } = req.body

    if (!senderAccountNumber || !recipientAccountNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: "Sender, recipient, and amount are required",
      })
    }

    const users = readJsonFile("users.json")

    // Find sender and recipient
    const sender = users.find((user) => user.accountNumber === senderAccountNumber)
    const recipient = users.find((user) => user.accountNumber === recipientAccountNumber)

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found",
      })
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient account not found",
      })
    }

    // Check if sender has enough balance
    const amountNum = Number.parseFloat(amount)
    if (sender.balance < amountNum) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds",
      })
    }

    // Update balances
    sender.balance = Number.parseFloat((sender.balance - amountNum).toFixed(2))
    recipient.balance = Number.parseFloat((recipient.balance + amountNum).toFixed(2))

    // Save updated users
    writeJsonFile("users.json", users)

    // Create transaction record
    const transaction = {
      id: uuidv4(),
      senderAccountNumber,
      senderName: sender.name,
      recipientAccountNumber,
      recipientName: recipient.name,
      amount: amountNum,
      note: note || "",
      date: new Date().toISOString(),
      status: "completed",
      type: "transfer",
    }

    // Save transaction
    const transactions = readJsonFile("transactions.json")
    transactions.push(transaction)
    writeJsonFile("transactions.json", transactions)

    return res.status(200).json({
      success: true,
      message: "Transfer successful",
      transaction,
    })
  } catch (error) {
    console.error("Transaction error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Admin fund user
app.post("/api/admin/fund", (req, res) => {
  try {
    const { adminId, recipientAccountNumber, amount, note } = req.body

    if (!adminId || !recipientAccountNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: "Admin ID, recipient, and amount are required",
      })
    }

    const users = readJsonFile("users.json")

    // Find admin and recipient
    const admin = users.find((user) => user.id === adminId)
    const recipient = users.find((user) => user.accountNumber === recipientAccountNumber)

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      })
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient account not found",
      })
    }

    // Update recipient balance
    const amountNum = Number.parseFloat(amount)
    recipient.balance = Number.parseFloat((recipient.balance + amountNum).toFixed(2))

    // Save updated users
    writeJsonFile("users.json", users)

    // Create transaction record
    const transaction = {
      id: uuidv4(),
      senderAccountNumber: "ADMIN",
      senderName: "Admin",
      recipientAccountNumber,
      recipientName: recipient.name,
      amount: amountNum,
      note: note || "Admin funding",
      date: new Date().toISOString(),
      status: "completed",
      type: "admin-fund",
    }

    // Save transaction
    const transactions = readJsonFile("transactions.json")
    transactions.push(transaction)
    writeJsonFile("transactions.json", transactions)

    return res.status(200).json({
      success: true,
      message: "Funding successful",
      transaction,
    })
  } catch (error) {
    console.error("Admin funding error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
