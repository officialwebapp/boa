document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  if (!isLoggedIn) {
    window.location.href = "login.html"
    return
  }

  // Get user data from localStorage
  const userString = localStorage.getItem("user")
  let user = null

  if (userString) {
    try {
      user = JSON.parse(userString)
    } catch (e) {
      console.error("Error parsing user data:", e)
    }
  }

  // Handle profile button click
  const profileBtn = document.getElementById("profile-btn")
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  // Handle bottom navigation
  const navAccounts = document.getElementById("nav-accounts")
  const navPay = document.getElementById("nav-pay")

  if (navAccounts) {
    navAccounts.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  if (navPay) {
    navPay.addEventListener("click", () => {
      window.location.href = "send-money.html"
    })
  }

  // Load transactions
  loadTransactions()

  // Handle filter change
  const transactionFilter = document.getElementById("transaction-filter")
  if (transactionFilter) {
    transactionFilter.addEventListener("change", () => {
      loadTransactions(transactionFilter.value)
    })
  }
})

// Function to load transactions
function loadTransactions(filter = "all") {
  const transactionsList = document.getElementById("transactions-list")
  const noTransactionsElement = document.getElementById("no-transactions")

  if (!transactionsList) return

  // Get user data
  const userString = localStorage.getItem("user")
  if (!userString) return

  const user = JSON.parse(userString)

  // Get transactions from API
  fetch("/api/transactions")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.transactions) {
        // Filter transactions for current user
        let userTransactions = data.transactions.filter(
          (t) => t.senderAccountNumber === user.accountNumber || t.recipientAccountNumber === user.accountNumber,
        )

        // Apply filter
        if (filter === "credit") {
          userTransactions = userTransactions.filter((t) => t.recipientAccountNumber === user.accountNumber)
        } else if (filter === "debit") {
          userTransactions = userTransactions.filter((t) => t.senderAccountNumber === user.accountNumber)
        }

        // Sort by date (newest first)
        userTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

        if (userTransactions.length > 0) {
          // Hide no transactions message
          if (noTransactionsElement) {
            noTransactionsElement.style.display = "none"
          }

          // Clear existing transactions
          transactionsList.innerHTML = ""

          // Add transactions to the list
          userTransactions.forEach((transaction) => {
            const isCredit = transaction.recipientAccountNumber === user.accountNumber
            const transactionItem = document.createElement("div")
            transactionItem.className = "transaction-item"

            const formattedDate = new Date(transaction.date).toLocaleDateString()
            const formattedAmount =
              "$" +
              transaction.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })

            transactionItem.innerHTML = `
              <div class="transaction-details">
                <div class="transaction-title">${isCredit ? "Received from" : "Sent to"} ${isCredit ? transaction.senderName || "Unknown" : transaction.recipientName || "Unknown"}</div>
                <div class="transaction-date">${formattedDate}</div>
              </div>
              <div class="transaction-amount ${isCredit ? "credit" : "debit"}">
                ${isCredit ? "+" : "-"}${formattedAmount}
              </div>
            `

            transactionsList.appendChild(transactionItem)
          })
        } else {
          // Show no transactions message
          if (noTransactionsElement) {
            noTransactionsElement.style.display = "block"
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching transactions:", error)
    })
}
