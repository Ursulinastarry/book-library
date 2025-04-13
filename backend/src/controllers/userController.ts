import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv"
import {pool} from "../controllers/bookController";
import { connectClient } from "../controllers/bookController";
import asyncHandler from "../middlewares/asyncHandler";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import { UserRequest } from "@app/utils/types/userTypes";

connectClient();
dotenv.config()
//Debugging  - check if env var are loaded correctly  

const jwtSecret:any = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret:any= process.env.REFRESH_TOKEN_SECRET;

const generateToken = (res: Response, userId: string, roleId: number) => {
  if (!jwtSecret || !refreshSecret) {
      throw new Error("ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables");
  }

  try {
      const accessToken = jwt.sign({ userId, roleId }, jwtSecret, { expiresIn: "15m" });
      const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: "30d" });

      res.cookie("access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return { accessToken, refreshToken, expiresIn: 900 }; // 900s = 15min
  } catch (error) {
      console.error("Error generating JWT:", error);
      throw new Error("Error generating authentication tokens");
  }
};


/** Create a new user */
export const createUser = asyncHandler(async (req: Request, res: Response)=> {
  try {
    const { name, email, password, role_id } = req.body;
    const salt = await bcrypt.genSalt( 10); 
    const hashedPassword = await bcrypt.hash(password,salt); // Hash password before saving
    const query = `INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [name, email, hashedPassword, role_id];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
})
/** Login user and return JWT */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Query user from database
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

  // Check if user exists
  if (!rows.length) return res.status(401).json({ message: "Invalid email or password" });

  const user = rows[0];

  // Compare hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

  // Generate JWT token
  const tokens = await generateToken(res, user.user_id, user.role_id);

  // ✅ Send a response after successful login
  return res.status(200).json({
      message: "Login successful",
      accessToken: tokens.accessToken,  // Optional, in case the frontend needs it
      user: { id: user.user_id, email: user.email, role_id: user.role_id }
  });
});


export const logoutUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  //We need to immedietly invalidate the access token and the refreh token 
  res.cookie("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      expires: new Date(0) // Expire immediately
  });

  res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      expires: new Date(0) // Expire immediately
  });

  res.status(200).json({ message: "User logged out successfully" });
});


/** Middleware to protect routes */
// export const authMiddleware = asyncHandler(async (req: Request, res: Response, next: Function) =>{
//   const token = req.header("Authorization")?.split(" ")[1]; // Extract token from "Bearer <token>"
  
//   if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

//   try {
//     const decoded = jwt.verify(token, jwtSecret);
//     (req as any).user = decoded; // Attach user to request
//     next();
//   } catch (error) {
//     res.status(403).json({ message: "Invalid token" });
//   }
// })
/** Get all users */
export const getAllUsers = asyncHandler(async (req: Request, res: Response)=> {
  try {
    const { rows } = await pool.query(`SELECT * FROM users`);
    res.json(rows);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
})

/** Get user by ID */
export const getUserById = asyncHandler(async (req: Request, res: Response)=> {
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [req.params.user_id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
})

/** Update user */
export const updateUser = asyncHandler(async (req: Request, res: Response)=> {
  try {
    const { name, email, role_id } = req.body;
    const query = `UPDATE users SET name = $1, email = $2, role_id = $3 WHERE user_id = $4 RETURNING *`;
    const values = [name, email, role_id, req.params.user_id];
    const { rows } = await pool.query(query, values);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
})

/** Delete user */
export const deleteUser= asyncHandler(async (req: Request, res: Response)=> {
  try {
    const { rowCount } = await pool.query(`DELETE FROM users WHERE user_id = $1`, [req.params.user_id]);
    if (!rowCount) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
})
