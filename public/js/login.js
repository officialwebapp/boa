document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form")
  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")
  const loginBtn = document.getElementById("login-btn")
  const errorMessage = document.getElementById("error-message")

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Validate inputs
      if (!emailInput.value || !passwordInput.value) {
        errorMessage.textContent = "Please enter both Online ID and Password"
        errorMessage.style.display = "block"
        return
      }

      // Show loading state
      loginBtn.textContent = "Signing In..."
      loginBtn.disabled = true

      // Send login request to server
      fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Store user data
            localStorage.setItem("isLoggedIn", "true")
            localStorage.setItem("user", JSON.stringify(data.user))

            // Redirect based on role
            if (data.user.role === "admin") {
              window.location.href = "admin.html"
            } else {
              window.location.href = "dashboard.html"
            }
          } else {
            errorMessage.textContent = data.message || "Invalid email or password"
            errorMessage.style.display = "block"
            loginBtn.textContent = "Sign In"
            loginBtn.disabled = false
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          errorMessage.textContent = "An error occurred. Please try again."
          errorMessage.style.display = "block"
          loginBtn.textContent = "Sign In"
          loginBtn.disabled = false
        })
    })
  }
})
