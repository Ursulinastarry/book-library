"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function login() {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("loginError");
    if (!loginForm) {
        console.error("Login form not found. Check HTML IDs.");
        return;
    }
    loginForm.addEventListener("submit", (event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        event.preventDefault(); // Prevent default form submission
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const userRole = ((_a = document.querySelector("input[name='userRole']:checked")) === null || _a === void 0 ? void 0 : _a.value) || "borrower";
        if (!email || !password) {
            errorMessage.textContent = "Please enter both email and password.";
            return;
        }
        try {
            const response = yield fetch("http://localhost:4000/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: userRole }),
                credentials: "include",
            });
            const data = yield response.json();
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
    }));
}
login();
function signup() {
    const signupForm = document.getElementById("signupForm");
    const signupErrorMessage = document.getElementById("signupError");
    if (!signupForm) {
        console.error("Signup form not found. Check HTML IDs.");
        return;
    }
    signupForm.addEventListener("submit", (event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        event.preventDefault(); // Prevent default form submission
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const role = ((_a = document.querySelector("input[name='userRole']:checked")) === null || _a === void 0 ? void 0 : _a.value) || "borrower";
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
            const response = yield fetch("http://localhost:4000/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = yield response.json();
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
    }));
}
signup();
