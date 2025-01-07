import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
env.config();
const db= new pg.Client({
    user:process.env.PG_USER,
    host:process.env.PG_HOST,
    database:process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port:process.env.PG_PORT,
});
db.connect();
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("home.ejs");
});
app.get("/pageOne",(req,res)=>
{
    res.render("login.ejs");
})
app.get("/book_detail",async(req,res)=>
{
    res.render("booksDetail.ejs");
})
app.post("/login",async(req,res)=>
{
    const email= req.body.email;
    const password= req.body.password;
    console.log(email);
    console.log(password);
    
    try{
        const userResponse= await db.query("select * from users where email = $1",[email]);
        const userData= userResponse.rows;
        if(userData.length > 0) // has some data
        {
            // this are the books that user has done transaction
            const userId = userData[0].id;
            const booksResponse = await db.query(`
                   SELECT Books.id,Books.title, Books.author, Transactions.borrow_date, Transactions.return_date
                   FROM Books
                   JOIN Transactions ON Books.id = Transactions.book_id
                   WHERE Transactions.user_id = $1
            `, [userId]);
   
            const booksData = booksResponse.rows;
            ///------------------------------///
            // here i want to get hold of available   books
              const avlBooksResponse =await db.query(`SELECT * from books where availability = $1`,[true]);
              const avalableBookData = avlBooksResponse.rows;
            ///------------------------------///
            // Render the book details page with user info and their books ---> booksDetail.ejs
            res.render('use_book_info.ejs', {
                   user: userData[0],
                   books: booksData,
                   availableBooks:avalableBookData
            });
            console.log(userData); // User info
            console.log(booksData); // User's books
        }
        else
        {
            console.log("data not found");
            res.redirect("/");
        }
    }
    catch(err)
    {
        console.log(err); 
    }
})
app.post("/admin_login",(req,res)=>
{
    // since admin  has freedome to  insert delete  the books;
    res.redirect("/books");
})


// Route to display books
app.get("/books", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM books ORDER BY id ASC");
      res.render("books.ejs", { books: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving books.");
    }
  });
// adding book to database
app.post("/books/add", async (req, res) => {
    const { title, author, publication_year, availability } = req.body;
    try {
      await db.query(
        "INSERT INTO books (title, author, publication_year, availability) VALUES ($1, $2, $3, $4)",
        [title, author, publication_year, availability]
      );
      res.redirect("/books");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding book.");
    }
  });

//deleting the book from database
  app.post("/books/delete/:id", async (req, res) => {
    const bookId = req.params.id;
    try {
      await db.query("DELETE FROM books WHERE id = $1", [bookId]);
      res.redirect("/books");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting book.");
    }
  });

// returning the  book
app.post('/return', async (req, res) => {
  const { book_id, user_id } = req.body; // Accept user_id directly from the request
  console.log(req.body);

  
  try {
      // Check if there's an active transaction for this user and book
      const activeTransaction = await db.query(
          `SELECT * FROM Transactions 
           WHERE book_id = $1 AND user_id = $2 AND return_date IS NULL`,
          [book_id, user_id]
      );

      if (activeTransaction.rows.length === 0) {
          return res.status(400).send('No active borrow transaction found for this book.');
      }

      // Mark the book as returned by updating the return_date
      await db.query(
        `UPDATE Transactions 
         SET return_date = CURRENT_DATE 
         WHERE book_id = $1 AND user_id = $2 AND return_date IS NULL`,
        [book_id, user_id]
    );
    
      // Mark the book as available
      await db.query(
          `UPDATE Books SET availability = true WHERE id = $1`,
          [book_id]
      );

      // now showing the info to user
      const userResponse= await db.query("select * from users where id = $1",[user_id]);
      const userData= userResponse.rows;

      const booksResponse = await db.query(`
        SELECT Books.id,Books.title, Books.author, Transactions.borrow_date, Transactions.return_date
        FROM Books
        JOIN Transactions ON Books.id = Transactions.book_id
        WHERE Transactions.user_id = $1
        `, [user_id]);

      const booksData = booksResponse.rows;
      //available books//
      const avlBooksResponse =await db.query(`SELECT * from books where availability = $1`,[true]);
      const avalableBookData = avlBooksResponse.rows;
      
      // Rrendering to user books page
      res.render('use_book_info.ejs',{
        user:userData[0],
        books:booksData,
        availableBooks:avalableBookData
      }); 
  } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while returning the book.');
  }
});




// borrow books
app.post('/borrow', async (req, res) => {
  const { book_id, user_id } = req.body; // Accept user_id directly from the request
  console.log(req.body);

  try {
      // Check if the book is available
      const bookResponse = await db.query(
          `SELECT * FROM Books WHERE id = $1 AND availability = true`,
          [book_id]
      );

      if (bookResponse.rows.length === 0) {
          return res.status(400).send('Book is unavailable or does not exist.');
      }

      // Borrow the book by creating a transaction
      await db.query(
          `INSERT INTO Transactions (user_id, book_id, borrow_date) 
           VALUES ($1, $2, CURRENT_DATE)`,
          [user_id, book_id]
      );

      // Mark the book as unavailable
      await db.query(
          `UPDATE Books SET availability = false WHERE id = $1`,
          [book_id]
      );

      // Now showing the info to the user
      const userResponse = await db.query("SELECT * FROM users WHERE id = $1", [user_id]);
      const userData = userResponse.rows[0]; // Assuming only one user will be returned

      const booksResponse = await db.query(`
        SELECT Books.id, Books.title, Books.author, Transactions.borrow_date, Transactions.return_date
        FROM Books
        JOIN Transactions ON Books.id = Transactions.book_id
        WHERE Transactions.user_id = $1
      `, [user_id]);

      const booksData = booksResponse.rows;

      // Available books (for the user to see)
      const avlBooksResponse = await db.query(`SELECT * FROM Books WHERE availability = true`);
      const availableBookData = avlBooksResponse.rows;

      res.render('use_book_info.ejs', {
          user: userData, // Directly passing user data (first row, as there should be only one user)
          books: booksData,
          availableBooks: availableBookData
      }); // Rendering to user books page
  } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while borrowing the book.');
  }
});











app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

