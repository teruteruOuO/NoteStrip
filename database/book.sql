/* Entity about a user's book instance */

CREATE TABLE BOOK (
	BOOK_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, /* Unique ID for a book instance */
    ACCT_ID INT UNSIGNED NOT NULL, /* User tied to this book instance */
    BOOK_TITLE VARCHAR(300) UNIQUE NOT NULL, /* Title of the book; must be unique */
    BOOK_IMG VARCHAR(300) NOT NULL, /* Amazon S3 location for the book's image */
    BOOK_PLOT_DESC TEXT, /* Optional description of the book */
    BOOK_EXTRA_INFO TEXT, /* Optional information of the book */
    BOOK_DATE_RELEASE DATE, /* Optional release date of the book */
    BOOK_DATE_END DATE, /* Optional end date of the book */
    BOOK_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this book was recorded*/
    FOREIGN KEY (ACCT_ID)
		REFERENCES ACCOUNT (ACCT_ID)
        ON UPDATE CASCADE
);