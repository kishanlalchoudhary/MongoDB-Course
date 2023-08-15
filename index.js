const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");

// init app and middleware
const app = express();
app.use(express.json());

// db connection
let db;

connectToDb((err) => {
  if (!err) {
    console.log("Connection with database is established");
    app.listen(3000, () => {
      console.log("App listening on port 3000");
    });
    db = getDb();
  }
});

// routes

app.get("/books", async (req, res) => {
  // Pagination
  const page = req.query.p || 0;
  const booksPerPage = 3;

  let books = [];
  // When we use a find method it returns the cursor which is an object which essentially points to a set of documents
  // Two methods are toArray and forEach
  // toArray fetches all the documents that cursor points to and then put them in an array for us
  // whereas forEach iterates the document at time and then allows us to process each individually
  // when we fetch the documents from mongodb using either of those two methods it actaully gets documents from the database in batches
  // Thats because our collection might contain huge amounts of documents like 50,000 or even more.
  // If we fetach all those documents in one go it would increase the network bandwidth
  // Therefore mongodb fetches the documents in smaller batches (101 doc)
  db.collection("books")
    .find()
    .skip(page * booksPerPage)
    .limit(booksPerPage)
    .forEach((book) => books.push(book))
    .then(() => {
      res.status(200).json(books);
    })
    .catch((err) => {
      res.status(500).json({ error: "Could not fetch the documents" });
    });
});

app.get("/books/:id", (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db.collection("books")
      .findOne({ _id: new ObjectId(req.params.id) })
      .then((book) => {
        res.status(200).json(book);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ error: "Could not fetch the required document" });
      });
  } else {
    res.status(500).json({ error: "Not a valid document Id" });
  }
});

app.post("/books", (req, res) => {
  const book = req.body;
  db.collection("books")
    .insertOne(book)
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((err) => {
      res.status(500).json({ error: "Could not create a document" });
    });
});

app.delete("/books/:id", (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db.collection("books")
      .deleteOne({ _id: new ObjectId(req.params.id) })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ error: "Could not delete the required document" });
      });
  } else {
    res.status(500).json({ error: "Not a valid document Id" });
  }
});

app.patch("/books/:id", (req, res) => {
  const updates = req.body;
  if (ObjectId.isValid(req.params.id)) {
    db.collection("books")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ error: "Could not update the required document" });
      });
  } else {
    res.status(500).json({ error: "Not a valid document Id" });
  }
});
