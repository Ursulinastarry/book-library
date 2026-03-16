"use strict";
function login() {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("loginError");
    if (!loginForm) {
        console.error("Login form not found. Check HTML IDs.");
        return;
    }
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const userRole = document.querySelector("input[name='userRole']:checked")?.value || "borrower";
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
        }
        catch (error) {
            errorMessage.textContent = error.message;
            alert("Invalid email or password");
        }
    });
}
login();
function signup() {
    const signupForm = document.getElementById("signupForm");
    const signupErrorMessage = document.getElementById("signupError");
    if (!signupForm) {
        console.error("Signup form not found. Check HTML IDs.");
        return;
    }
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const role = document.querySelector("input[name='userRole']:checked")?.value || "borrower";
        // Map role name to role ID
        const roleMap = {
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
        }
        catch (error) {
            signupErrorMessage.textContent = error.message;
        }
    });
}
signup();
