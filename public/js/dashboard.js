document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  if (!isLoggedIn) {
    window.location.href = "login.html"
    return
  }

  // Get user data from localStorage if available
  const userString = localStorage.getItem("user")
  let user = null

  if (userString) {
    try {
      user = JSON.parse(userString)

      // Update user name in UI
      const userNameElements = document.querySelectorAll("#user-name, #menu-user-name")
      userNameElements.forEach((el) => {
        if (el) el.textContent = user.name.split(" ")[0]
      })

      // Update account number
      const accountNumberElement = document.getElementById("account-number")
      if (accountNumberElement && user.accountNumber) {
        accountNumberElement.textContent = "Account #: " + user.accountNumber
      }

      // Update balance display with the exact format
      const checkingBalanceElement = document.getElementById("checking-balance")
      if (checkingBalanceElement) {
        // Format to match the exact style in the screenshot
        checkingBalanceElement.textContent =
          "$" +
          (user.balance || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      }
    } catch (e) {
      console.error("Error parsing user data:", e)
    }
  }

  // Set current date
  const currentDateElement = document.getElementById("current-date")
  if (currentDateElement) {
    const now = new Date()
    const options = { year: "numeric", month: "long", day: "numeric" }
    currentDateElement.textContent = now.toLocaleDateString("en-US", options)
  }

  // Handle profile button click to open side menu
  const profileBtn = document.getElementById("profile-btn")
  const sideMenu = document.getElementById("side-menu")
  const overlay = document.getElementById("overlay")

  if (profileBtn && sideMenu && overlay) {
    profileBtn.addEventListener("click", () => {
      sideMenu.classList.add("active")
      overlay.classList.add("active")
    })
  }

  if (overlay && sideMenu) {
    overlay.addEventListener("click", () => {
      sideMenu.classList.remove("active")
      overlay.classList.remove("active")
    })
  }

  // Handle logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("user")
      window.location.href = "login.html"
    })
  }

  // Handle send money button
  const sendMoneyBtn = document.getElementById("send-money-btn")
  const sendMoneyFeature = document.getElementById("send-money-feature")
  const navTransfer = document.getElementById("nav-transfer")

  if (sendMoneyBtn) {
    sendMoneyBtn.addEventListener("click", () => {
      window.location.href = "send-money.html"
    })
  }

  if (sendMoneyFeature) {
    sendMoneyFeature.addEventListener("click", () => {
      window.location.href = "send-money.html"
    })
  }

  if (navTransfer) {
    navTransfer.addEventListener("click", () => {
      window.location.href = "send-money.html"
    })
  }

  // Handle transactions feature
  const transactionsFeature = document.getElementById("transactions-feature")
  if (transactionsFeature) {
    transactionsFeature.addEventListener("click", () => {
      window.location.href = "transactions.html"
    })
  }

  // Load recent transactions
  loadRecentTransactions()
})

// Function to load recent transactions
function loadRecentTransactions() {
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
      if (data.success && data.transactions && data.transactions.length > 0) {
        // Filter transactions for current user
        const userTransactions = data.transactions.filter(
          (t) => t.senderAccountNumber === user.accountNumber || t.recipientAccountNumber === user.accountNumber,
        )

        // Sort by date (newest first)
        userTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Take only the 5 most recent
        const recentTransactions = userTransactions.slice(0, 5)

        if (recentTransactions.length > 0) {
          // Hide no transactions message
          if (noTransactionsElement) {
            noTransactionsElement.style.display = "none"
          }

          // Clear existing transactions
          transactionsList.innerHTML = ""

          // Add transactions to the list
          recentTransactions.forEach((transaction) => {
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
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching transactions:", error)
    })
}
