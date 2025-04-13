import express from "express";
import { createUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser,logoutUser} from "../controllers/userController";
import { protect } from "@app/middlewares/protect";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout",logoutUser)
router.get("/",  getAllUsers);
router.get("/:user_id", getUserById);
router.put("/:user_id", updateUser);
router.delete("/:user_id", deleteUser);
router.get("/auth/me", protect);

export default router;
