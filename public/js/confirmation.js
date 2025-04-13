document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  if (!isLoggedIn) {
    window.location.href = "login.html"
    return
  }

  // Get transaction data
  const transactionDataString = localStorage.getItem("lastTransaction")
  let transactionData = null

  if (transactionDataString) {
    try {
      transactionData = JSON.parse(transactionDataString)

      // Update transaction details
      const transactionId = document.getElementById("transaction-id")
      const transactionDate = document.getElementById("transaction-date")
      const recipientValue = document.getElementById("recipient-value")
      const transactionAmount = document.getElementById("transaction-amount")
      const transactionNote = document.getElementById("transaction-note")
      const noteRow = document.getElementById("note-row")

      // Generate a random transaction ID
      if (transactionId) {
        transactionId.textContent = transactionData.id || "TX-" + Math.floor(Math.random() * 1000000)
      }

      // Format date
      if (transactionDate && transactionData.date) {
        const date = new Date(transactionData.date)
        transactionDate.textContent = date.toLocaleString()
      }

      // Set recipient
      if (recipientValue && transactionData.recipientAccountNumber) {
        recipientValue.textContent = "Account #: " + transactionData.recipientAccountNumber
      }

      // Format amount
      if (transactionAmount && transactionData.amount) {
        transactionAmount.textContent =
          "$" +
          transactionData.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      }

      // Set note or hide note row if empty
      if (transactionData.note) {
        if (transactionNote) {
          transactionNote.textContent = transactionData.note
        }
      } else if (noteRow) {
        noteRow.style.display = "none"
      }
    } catch (e) {
      console.error("Error parsing transaction data:", e)
    }
  }

  // Handle button clicks
  const homeBtn = document.getElementById("home-btn")
  const newTransactionBtn = document.getElementById("new-transaction-btn")

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  if (newTransactionBtn) {
    newTransactionBtn.addEventListener("click", () => {
      window.location.href = "send-money.html"
    })
  }

  // Countdown and redirect
  const countdownElement = document.getElementById("countdown")
  let countdown = 5

  if (countdownElement) {
    const interval = setInterval(() => {
      countdown--
      countdownElement.textContent = countdown.toString()

      if (countdown <= 0) {
        clearInterval(interval)
        window.location.href = "dashboard.html"
      }
    }, 1000)
  }

  // Handle bottom navigation
  const navItems = document.querySelectorAll(".nav-item")
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const navText = this.querySelector(".nav-text").textContent

      switch (navText) {
        case "Accounts":
          window.location.href = "dashboard.html"
          break
        case "Pay & Transfer":
          window.location.href = "send-money.html"
          break
        case "Plan & Track":
          window.location.href = "dashboard.html?tab=plan"
          break
        case "Investment":
          window.location.href = "dashboard.html?tab=investment"
          break
      }
    })
  })
})
