process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

const goodBook = {
    "isbn": "0691161518",
    "amazon_url": "http://a.co/eobPtX2",
    "author": "Matthew Lane",
    "language": "english",
    "pages": 264,
    "publisher": "Princeton University Press",
    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
    "year": 2017
};

const badBook = {
    // no isbn
    "amazon_url": 123, // amazon_url is a number
    "author": "Matthew Lane",
    "language": "english",
    "pages": "264", // pages is a string
    "publisher": "Princeton University Press",
    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
    "year": true // year is a boolean
};

const updateBook = {
    "amazon_url": "http://google.com",
    "author": "Gabriel Ramirez",
    "language": "spanish",
    "pages": 342,
    "publisher": "Ramirez Publishing Co.",
    "title": "Level-Up: The Hidden Mathematics in Video Games",
    "year": 2023
};

beforeAll(async function() {
    await db.query(`DELETE FROM books`);
});

// prioritize testing the POST and PUT routes for data validation!

afterEach(async function() {
    await db.query(`DELETE FROM books`);
});

afterAll(async function() {
    await db.end();
});

describe("POST /books", function() {
    test("Creates a new book given valid data", async function() {
        const response = await request(app)
            .post(`/books`)
            .send(goodBook);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({ book: goodBook });
    });

    test("Responds with 400 if given invalid data", async function() {
        const response = await request(app)
            .post(`/books`)
            .send(badBook);
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: [
                    expect.any(String), // error message for isbn
                    expect.any(String), // error message for amazon_url
                    expect.any(String), // error message for pages
                    expect.any(String) // error message for year
                ],
                status: 400
            }
        });
    });
});

describe("PUT /books/:isbn", function() {

    beforeAll(async function() {
        await request(app).post(`/books`).send(goodBook);
    });

    test("Updates an existing book", async function() {
        const response = await request(app)
            .put(`/books/${goodBook.isbn}`)
            .send(updateBook);
        expect(response.statusCode).toEqual(200);

        updateBook.isbn = "0691161518";
        expect(response.body).toEqual({
            book: updateBook
        });
        delete updateBook.isbn;
    });

    test("Responds with 400 if isbn in request body", async function() {
        const response = await request(app)
            .put(`/books/${goodBook.isbn}`)
            .send(goodBook);
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: "ISBN not allowed in request body for book updates",
                status: 400
            }
        });
    });

    test("Responds with 400 if given invalid data", async function() {
        const response = await request(app)
            .put(`/books/${goodBook.isbn}`)
            .send(badBook);
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: [ // note that isbn does not change once book is made
                    expect.any(String), // error message for amazon_url
                    expect.any(String), // error message for pages
                    expect.any(String) // error message for year
                ],
                status: 400
            }
        });
    });

    test("Responds with 404 if invalid isbn", async function() {
        const response = await request(app)
            .put(`/books/1234567890`)
            .send(updateBook);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: `There is no book with an isbn '1234567890`,
                status: 404
            }
        });
    });
});