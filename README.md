# Project Documentation
# ALL DOCUMENTATION IS PRESENT IN BELOW PDF |

all the Documentation is available in this  below pdf please do  read it.

[View PDF Document](README/Books%20Management%20System.pdf)

## Video Tutorial

You can watch the video tutorial here:

[Watch Video](Screen%20Recording%202025-01-08%20002042.mp4)



# Books Management System

## Installation and Setup

### Clone the Repository
```bash
git clone https://github.com/khartalakshya/Library_management
```

### Install Dependencies
```bash
npm install
```

### Configure Database

1. Ensure PostgreSQL is running.
2. Update the database connection details in the backend code:
    ```javascript
    const db = new Pool({
        user: "your_username",
        host: "localhost",
        database: "your_database",
        password: "your_password",
        port: 5432,
    });
    ```

### Start the Server
```bash
node app.js
```

### Access the Application

Open your browser and navigate to:  
[http://localhost:3000/books](http://localhost:3000/books)

---

## File Structure

```
story/
├── public/            # Static files (CSS, images, etc.)
├── views/             # EJS templates
│   ├── books.ejs      # Main books page
├── app.js             # Backend server
├── package.json       # Project metadata and dependencies
```

---

## Routes

1. **`/books` (GET)**  
   - Displays all books.

2. **`/books/add` (POST)**  
   - Adds a new book to the database.

3. **`/books/delete/:id` (POST)**  
   - Deletes a book by its ID.


## Conclusion

The **Books Management System** offers a simple and efficient way to manage a library’s inventory. Its integration of modern web technologies with a robust database ensures reliability and scalability, making it suitable for small-scale libraries or personal use.




