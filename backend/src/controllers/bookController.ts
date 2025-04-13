import { Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import pkg from 'pg';
import dotenv from "dotenv";
import { UserRequest } from "../utils/types/userTypes";
import { BookRequest } from "../utils/types/bookTypes";
import { BorrowBookRequest } from "../utils/types/borrowTypes";
import { title } from "process";

const { Pool } = pkg;
dotenv.config()
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})
export async function connectClient(): Promise<void> {
  try {
    await pool.connect();
    console.log("Connected to the database.");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

connectClient();


interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  year: number;
  pages: number;
  publisher: string;
  description: string;
  image: string;
  price: number;
}

export const getAllBooks = asyncHandler( async (req: Request, res: Response) => {
  try {
    const result = await pool.query<Book>("SELECT * FROM public.books ORDER BY id ASC");
    const books=result.rows;

    const { 
      search, 
      genre, 
      year, 
      sortBy 
    } = req.query;

    let filteredBooks = [...books];

    if (search) {
      const searchTerm = (search as string).toLowerCase().trim();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.description.toLowerCase().includes(searchTerm)
      );
    }

    if (genre) {
      filteredBooks = filteredBooks.filter(book => 
        book.genre.toLowerCase() === (genre as string).toLowerCase()
      );
    }

    
    if (sortBy === "year") {
      filteredBooks.sort((a, b) => a.year - b.year);
  } else if (sortBy === "title") {
      filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "author") {
      filteredBooks.sort((a, b) => a.author.localeCompare(b.author));
  }
    
    const stats = {
      totalBooks: filteredBooks.length,
      avgPages: filteredBooks.length 
        ? Math.round(filteredBooks.reduce((sum, book) => sum + book.pages, 0) / filteredBooks.length)
        : 0,
      oldestBook: filteredBooks.length 
        ? Math.min(...filteredBooks.map(book => book.year))
        : null,
      uniqueGenres: new Set(filteredBooks.map(book => book.genre)).size
    };

    res.json(filteredBooks);

  } catch (err) {
    console.error("Error getting books:", err);
    res.status(500).json({ error: "Internal server error" });
    console.error("Error filtering books:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query<Book>(
      "SELECT * FROM public.books WHERE id = $1",
      [id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (err) {
    console.error("Error getting book:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const createBook = asyncHandler(async (req: UserRequest, res: Response) => {
  const { title, author, genre, year, pages, publisher, description, image, price } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (req.user.role_id !== 1) {
      res.status(403).json({ message: "Access denied: Only Admins can create books" });
      return;
    }

    const result = await pool.query<Book>(
      `
      INSERT INTO public.books (title, author, genre, year, pages, publisher, description, image, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [title, author, genre, year, pages, publisher, description, image, price]
    );

    res.status(201).json({ message: "Book created successfully", id: result.rows[0].id });
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export const updateBook = asyncHandler(async (req: BookRequest, res: Response) => {
  const { id } = req.params;
  const {
    title,
    author,
    genre,
    year,
    pages,
    publisher,
    description,
    image,
    price,
  } = req.body;
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
  }
   // Check if the book exists
   const bookQuery = await pool.query("SELECT id FROM books WHERE id=$1", [id]);

   if (bookQuery.rows.length === 0) {
       res.status(404).json({ message: "Book not found" });
       return;
   }

   if (req.user.role_id !== 1 && req.user.role_id !== 2) {
    res.status(403).json({ message: "Access denied: Only Admins and Librarians can update  books" });
    return;
}

    await pool.query(
      `
      UPDATE public.books
      SET title = $1, author = $2, genre = $3, year = $4, pages = $5, publisher = $6, description = $7, image = $8, price = $9
      WHERE id = $10
      `,
      [
        title,
        author,
        genre,
        year,
        pages,
        publisher,
        description,
        image,
        price,
        id,
      ]
    );
    res.json({ message: "Book updated successfully" });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const partialUpdateBook = asyncHandler(
  async (req: UserRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not Authorized" });
        return;
      }
      const { id } = (req as unknown as Request).params;
      const updates = req.body as Partial<Book>;
      if (req.user.role_id !== 1 && req.user.role_id !== 2) {
        res.status(403).json({
          message: "Access denied: Only Librarians or Admins can update books",
        });
        return;
      }
      let query = "UPDATE public.books SET ";
      const values: any[] = [];
      let index = 1;

      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          query += `${key} = $${index}, `;
          values.push(updates[key as keyof Book]);
          index++;
        }
      }

      query = query.slice(0, -2);
      query += ` WHERE id = $${index}`;
      values.push(id);

      await pool.query(query, values);
      res.json({ message: "Book partially updated successfully" });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const deleteBook = asyncHandler( async (req: BookRequest, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
  }
  // Check if the book exists
  const bookQuery = await pool.query("SELECT id FROM books WHERE id=$1", [id]);

  if (bookQuery.rows.length === 0) {
      res.status(404).json({ message: "Book not found" });
      return;
  }
 
  // Check if the user is  an Admin
  if (req.user.role_id !== 1) {
    res.status(403).json({ message: "Only admins can delete this book" });
    return;
}

    await pool.query("DELETE FROM public.books WHERE id = $1", [id]);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const getAvailableCopies = async (
  req: Request<{}, {}, BorrowBookRequest> & UserRequest, 
  res: Response
): Promise<void> => {
  try {
    // Option 1: Get all available copies from all books
    const availableCopies = await pool.query(
      `SELECT bc.copy_id, bc.id, bc.status, bc.condition, bc.location, 
              b.title, b.author
       FROM bookcopies bc
       JOIN books b ON bc.id = b.id
       WHERE bc.status = 'Available' OR bc.status = 'Returned'
       ORDER BY bc.copy_id`
    );

    res.status(200).json({
      success: true,
      count: availableCopies.rowCount,
      data: availableCopies.rows
    });
  } catch (error) {
    console.error('Error fetching available copies:', error);
     res.status(500).json({
      success: false,
      message: 'Server error fetching available copies'
    });
  }
};

// If you want to get available copies for a specific book
export const getAvailableCopiesForBook = async (
  req: Request<{}, {}, BorrowBookRequest> & UserRequest, 
  res: Response
): Promise<void> => {
  console.log("Request Params:", req.params);

  const bookId = parseInt(req.params.id);
  
  if (isNaN(bookId)) {
   res.status(400).json({ 
      success: false, 
      message: 'Invalid book ID' 
    });
  }
  console.log(`Fetching copies for book ID: ${bookId}`);
  try {
    const availableCopies = await pool.query(
      `SELECT bc.copy_id, bc.id, bc.status, bc.condition, bc.location,
              b.title, b.author
       FROM bookcopies bc
       JOIN books b ON bc.id = b.id
       WHERE bc.id = $1 AND (bc.status = 'Available' OR bc.status = 'Returned')
       ORDER BY bc.copy_id`,
      [bookId]
    );

    // Get the book details even if no copies are available
    if (availableCopies.rowCount === 0) {
      const bookDetails = await pool.query(
        `SELECT id, title, author FROM books WHERE id = $1`,
        [bookId]
      );
      
      if (bookDetails.rowCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }
      
       res.status(200).json({
        success: true,
        book: bookDetails.rows[0],
        count: 0,
        copies: []
      });
    }

    // Format the response to include book details and copies
    const book = {
      id: availableCopies.rows[0].id,
      title: availableCopies.rows[0].title,
      author: availableCopies.rows[0].author,
      
    };

    const copies = availableCopies.rows.map(copy => ({
      copy_id: copy.copy_id,
      status: copy.status,
      condition: copy.condition,
      location: copy.location,
      title:copy.title,
      author:copy.author
    }));

    res.status(200).json({
      success: true,
      book,
      count: copies.length,
      copies
    });
  } catch (error) {
    console.error(`Error fetching available copies for book ${bookId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available copies'
    });
  }
};
export const borrowBook = async (
  req: Request<{}, {}, BorrowBookRequest> & UserRequest, 
  res: Response
): Promise<void> => {  
  const { copy_id, librarian_id = 9 } = req.body;  // Default librarian_id to 9
  
  try {
      if (!req.user) {
          res.status(401).json({ message: "Unauthorized request." });
          return;
      }
      
      // Check if book is available
      const bookCopy = await pool.query(
          "SELECT * FROM bookcopies WHERE copy_id = $1 AND (status = 'Available' OR status = 'Returned')", 
          [copy_id]
      );
      
      if (bookCopy.rowCount === 0) {
          res.status(400).json({ message: "Book copy is not available." });
          return;
      }
      
      const borrowDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 14); // 2 weeks return period
      
      // Insert borrow record
      await pool.query(
          "INSERT INTO borrowers (user_id, copy_id, librarian_id, borrow_date, expected_return_date, status) VALUES ($1, $2, $3, $4, $5, 'Borrowed')",
          [req.user.user_id, copy_id, librarian_id, borrowDate, returnDate]
      );
      
      // Update book status
      await pool.query(
          "UPDATE bookcopies SET status = 'Borrowed' WHERE copy_id = $1", 
          [copy_id]
      );
      
      res.status(201).json({ 
          message: "Book borrowed successfully.", 
          return_date: returnDate 
      });
  } catch (error) {
      console.error("Error borrowing book:", error);
      res.status(500).json({ message: "Server error while borrowing book." });
  }
};


export const returnBook = async (
  req: Request<{}, {}, BorrowBookRequest> & UserRequest,
  res: Response
): Promise<void> => {
  const { borrower_id, librarian_id = 9 } = req.body;  // Default librarian_id to 9
  
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized request." });
      return;
    }
    
    // Check if the borrow record exists and belongs to the user
    const borrowRecord = await pool.query(
      "SELECT * FROM borrowers WHERE borrower_id = $1 AND user_id = $2 AND status = 'Borrowed'",
      [borrower_id, req.user.user_id]
    );
    
    if (borrowRecord.rowCount === 0) {
      res.status(404).json({ message: "Borrow record not found or book already returned." });
      return;
    }
    
    const actual_return_date = new Date();
    
    // Update borrow record
    await pool.query(
      "UPDATE borrowers SET status = 'Returned', actual_return_date = $1, librarian_id = $2 WHERE borrower_id = $3",
      [actual_return_date, librarian_id, borrower_id]
    );
    
    // Get the copy_id from the borrow record
    const copy_id = borrowRecord.rows[0].copy_id;
    
    // Update book copy status
    await pool.query(
      "UPDATE bookcopies SET status = 'Returned' WHERE copy_id = $1",
      [copy_id]
    );
    
    // Calculate any late fees if applicable
    const expected_return_date = new Date(borrowRecord.rows[0].expected_return_date);
    let late_fee = 0;
    let message = "Book returned successfully.";
    
    if (actual_return_date > expected_return_date) {
      // Calculate days late
      const daysLate = Math.ceil(
        (actual_return_date.getTime() - expected_return_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      late_fee = daysLate * 0.50; // $0.50 per day late fee
      
      // Update borrow record with late fee
      await pool.query(
        "UPDATE borrowers SET late_fee = $1 WHERE borrower_id = $2",
        [late_fee, borrower_id]
      );
      
      message = `Book returned successfully. Late fee: $${late_fee.toFixed(2)}`;
    }
    
    res.status(200).json({ 
      message,
      return_date: actual_return_date,
      late_fee: late_fee > 0 ? late_fee : null
    });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ message: "Server error while returning book." });
  }
};
