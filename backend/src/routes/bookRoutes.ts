import express from "express";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  partialUpdateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getAvailableCopies,
  getAvailableCopiesForBook,
} from "../controllers/bookController";
// import { authMiddleware } from "../controllers/userController";
import {protect} from "../middlewares/protect";
// import { authenticateUser } from "../middlewares/protect";


const router = express.Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/",protect,createBook);
router.put("/:id",protect,updateBook);
router.patch("/:id", protect,partialUpdateBook);
router.delete("/:id",protect, deleteBook);
router.post("/borrow", protect, borrowBook);
router.post("/return", protect, returnBook);
router.get("/available", protect, getAvailableCopies);
router.get("/available/:id", protect, getAvailableCopiesForBook);

export default router;
