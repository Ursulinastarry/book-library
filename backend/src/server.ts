import { setupAliases } from "import-aliases";
setupAliases()

import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import bookRoutes from "@app/routes/bookRoutes"
import userRoutes from "./routes/userRoutes"
import cookieParser from "cookie-parser"
dotenv.config();

const app = express();
const port = process.env.PORT ;
app.use(cookieParser());

// app.use("/auth", userRoutes);
app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET, POST,PUT,PATCH,DELETE",
  credentials: true //allows cookies and auth headers
}))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/books",bookRoutes)
app.use("/users", userRoutes)
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});