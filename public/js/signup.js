document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form")
  const firstNameInput = document.getElementById("firstName")
  const lastNameInput = document.getElementById("lastName")
  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")
  const confirmPasswordInput = document.getElementById("confirmPassword")
  const signupBtn = document.getElementById("signup-btn")
  const errorMessage = document.getElementById("error-message")

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Validate inputs
      if (
        !firstNameInput.value ||
        !lastNameInput.value ||
        !emailInput.value ||
        !passwordInput.value ||
        !confirmPasswordInput.value
      ) {
        errorMessage.textContent = "Please fill in all fields"
        errorMessage.style.display = "block"
        return
      }

      if (passwordInput.value !== confirmPasswordInput.value) {
        errorMessage.textContent = "Passwords do not match"
        errorMessage.style.display = "block"
        return
      }

      if (passwordInput.value.length < 8) {
        errorMessage.textContent = "Password must be at least 8 characters"
        errorMessage.style.display = "block"
        return
      }

      // Show loading state
      signupBtn.textContent = "Creating Account..."
      signupBtn.disabled = true

      // Send registration request to server
      fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstNameInput.value,
          lastName: lastNameInput.value,
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

            // Redirect to dashboard
            window.location.href = "dashboard.html"
          } else {
            errorMessage.textContent = data.message || "Failed to create account. Please try again."
            errorMessage.style.display = "block"
            signupBtn.textContent = "Create Account"
            signupBtn.disabled = false
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          errorMessage.textContent = "An error occurred. Please try again."
          errorMessage.style.display = "block"
          signupBtn.textContent = "Create Account"
          signupBtn.disabled = false
        })
    })
  }
})
