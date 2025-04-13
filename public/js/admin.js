document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in and is admin
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  const userString = localStorage.getItem("user")
  let user = null

  if (userString) {
    try {
      user = JSON.parse(userString)
      if (!user || user.role !== "admin") {
        window.location.href = "login.html"
        return
      }
    } catch (e) {
      console.error("Error parsing user data:", e)
      window.location.href = "login.html"
      return
    }
  } else {
    window.location.href = "login.html"
    return
  }

  // Handle tab switching
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button and corresponding content
      button.classList.add("active")
      const tabId = button.getAttribute("data-tab") + "-tab"
      document.getElementById(tabId).classList.add("active")
    })
  })

  // Handle logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("user")
      window.location.href = "login.html"
    })
  }

  // Load users
  loadUsers()

  // Load transactions
  loadTransactions()

  // Handle fund user form
  const fundUserForm = document.getElementById("fund-user-form")
  const fundSuccessMessage = document.getElementById("fund-success-message")
  const fundErrorMessage = document.getElementById("fund-error-message")

  if (fundUserForm) {
    fundUserForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const accountNumber = document.getElementById("account-number").value
      const amount = Number.parseFloat(document.getElementById("fund-amount").value)
      const note = document.getElementById("fund-note").value

      // Validate inputs
      if (!accountNumber) {
        fundErrorMessage.textContent = "Please enter an account number"
        fundErrorMessage.style.display = "block"
        fundSuccessMessage.style.display = "none"
        return
      }

      if (isNaN(amount) || amount <= 0) {
        fundErrorMessage.textContent = "Please enter a valid amount"
        fundErrorMessage.style.display = "block"
        fundSuccessMessage.style.display = "none"
        return
      }

      // Send fund request to server
      fetch("/api/admin/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: user.id,
          recipientAccountNumber: accountNumber,
          amount: amount,
          note: note,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show success message
            fundSuccessMessage.textContent = `Successfully funded account with $${amount.toFixed(2)}`
            fundSuccessMessage.style.display = "block"
            fundErrorMessage.style.display = "none"

            // Reset form
            fundUserForm.reset()

            // Reload users and transactions
            loadUsers()
            loadTransactions()
          } else {
            fundErrorMessage.textContent = data.message || "Failed to fund account. Please try again."
            fundErrorMessage.style.display = "block"
            fundSuccessMessage.style.display = "none"
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          fundErrorMessage.textContent = "An error occurred. Please try again."
          fundErrorMessage.style.display = "block"
          fundSuccessMessage.style.display = "none"
        })
    })
  }
})

// Function to load users
function loadUsers() {
  const usersTableBody = document.getElementById("users-table-body")
  if (!usersTableBody) return

  // Get users from API
  fetch("/api/users")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.users) {
        // Clear table
        usersTableBody.innerHTML = ""

        // Add users to table
        data.users.forEach((user) => {
          if (user.role !== "admin") {
            // Don't show admin users
            const row = document.createElement("tr")

            const formattedBalance = (user.balance || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })

            row.innerHTML = `
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.accountNumber}</td>
              <td>$${formattedBalance}</td>
              <td><span class="status-badge status-active">${user.status || "active"}</span></td>
              <td>
                <button class="action-btn fund-btn" data-account="${user.accountNumber}"><i class="fas fa-money-bill"></i></button>
                <button class="action-btn delete delete-btn" data-account="${user.accountNumber}"><i class="fas fa-trash"></i></button>
              </td>
            `

            usersTableBody.appendChild(row)
          }
        })

        // Add event listeners to fund buttons
        const fundBtns = document.querySelectorAll(".fund-btn")
        fundBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const accountNumber = btn.getAttribute("data-account")

            // Switch to fund tab
            document.querySelector('.tab-btn[data-tab="fund"]').click()

            // Fill account number field
            document.getElementById("account-number").value = accountNumber
          })
        })
      }
    })
    .catch((error) => {
      console.error("Error fetching users:", error)
    })
}

// Function to load transactions
function loadTransactions() {
  const transactionsTableBody = document.getElementById("transactions-table-body")
  if (!transactionsTableBody) return

  // Get transactions from API
  fetch("/api/transactions")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.transactions) {
        // Sort by date (newest first)
        data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Clear table
        transactionsTableBody.innerHTML = ""

        // Add transactions to table
        data.transactions.forEach((transaction) => {
          const row = document.createElement("tr")

          const formattedDate = new Date(transaction.date).toLocaleString()
          const formattedAmount = transaction.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })

          const transactionType = transaction.type === "admin-fund" ? "Admin Funding" : "Transfer"

          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.senderName} (${transaction.senderAccountNumber})</td>
            <td>${transaction.recipientName} (${transaction.recipientAccountNumber})</td>
            <td>$${formattedAmount}</td>
            <td>${transactionType}</td>
            <td><span class="status-badge status-active">${transaction.status || "completed"}</span></td>
          `

          transactionsTableBody.appendChild(row)
        })
      }
    })
    .catch((error) => {
      console.error("Error fetching transactions:", error)
    })
}
