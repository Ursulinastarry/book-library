function login() {
    const loginForm = document.getElementById("loginForm") as HTMLFormElement;
    const errorMessage = document.getElementById("loginError") as HTMLElement;
  
    if (!loginForm) {
      console.error("Login form not found. Check HTML IDs.");
      return;
    }
  
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent default form submission
  
      const email = (document.getElementById("loginEmail") as HTMLInputElement).value.trim();
      const password = (document.getElementById("loginPassword") as HTMLInputElement).value.trim();
      const userRole = (document.querySelector("input[name='userRole']:checked") as HTMLInputElement)?.value || "borrower";
  
      if (!email || !password) {
        errorMessage.textContent = "Please enter both email and password.";
        return;
      }
  
      try {
        const response = await fetch("http://localhost:4000/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: userRole }),
          credentials: "include",
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Invalid credentials");
        }
  
        console.log("Login successful", data);
        alert("Login successful!");
  
        // Redirect after login
        window.location.href = "home.html";
      } catch (error: any) {
        errorMessage.textContent = error.message;
        alert("Invalid email or password");
      }
    });
  }
  
  login();

  function signup() {
    const signupForm = document.getElementById("signupForm") as HTMLFormElement;
    const signupErrorMessage = document.getElementById("signupError") as HTMLElement;
  
    if (!signupForm) {
      console.error("Signup form not found. Check HTML IDs.");
      return;
    }
  
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent default form submission
  
      const name = (document.getElementById("signupName") as HTMLInputElement).value.trim();
      const email = (document.getElementById("signupEmail") as HTMLInputElement).value.trim();
      const password = (document.getElementById("signupPassword") as HTMLInputElement).value.trim();
      const role = (document.querySelector("input[name='userRole']:checked") as HTMLInputElement)?.value || "borrower";

        // Map role name to role ID
    const roleMap: { [key: string]: number } = {
        borrower: 1,
        librarian: 2,
        admin: 3,
      };
      roleMap[role]; // Convert name to ID
  
      if (!name || !email || !password || !role) {
        signupErrorMessage.textContent = "Please fill in all fields.";
        return;
      }
  
      try {
        const response = await fetch("http://localhost:4000/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Signup failed. Please try again.");
        }
  
        console.log("Signup successful", data);
        alert("Welcome to Lina's library💕");
  
        // Redirect to login page
        window.location.href = "index.html";
      } catch (error: any) {
        signupErrorMessage.textContent = error.message;
      }
    });
  }
  
  signup();
  