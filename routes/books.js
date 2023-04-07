const express = require("express");
const Book = require("../models/book");
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const bookSchema = require("../schemas/bookSchema.json");
const bookUpdateSchema = require("../schemas/bookUpdateSchema.json");

const router = new express.Router();

/** TODO:
 * Use JSON Schema to validate the creation and updating of books
 * Display error message containing ALL of the validation errors
 * if book creation or updating fails.
 * NOTE: I'm thinking we want to validate BEFORE we call Book.method
 * since we want the ROUTE to check for valid data BEFORE we even 
 * touch the db
 */


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, bookSchema);

    if (!result.valid) {
      const listOfErrors = result.errors.map(error => error.stack);
      const error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {

    if (req.body.isbn) throw new ExpressError("ISBN not allowed in request body for book updates", 400);

    const result = jsonschema.validate(req.body, bookUpdateSchema);

    if(!result.valid) {
      const listOfErrors = result.errors.map(error => error.stack);
      const error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
