/* Entity about a user's book instance */

CREATE TABLE BOOK (
	BOOK_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, /* Unique ID for a book instance */
    ACCT_ID INT UNSIGNED NOT NULL, /* User tied to this book instance */
    BOOK_TITLE VARCHAR(300) UNIQUE NOT NULL, /* Title of the book; must be unique */
    BOOK_IMG TEXT NOT NULL, /* Amazon S3 location for the book's image */
    BOOK_PLOT_DESC TEXT, /* Optional description of the book */
    BOOK_EXTRA_INFO TEXT, /* Optional information of the book */
    BOOK_DATE_RELEASE DATE, /* Optional release date of the book */
    BOOK_DATE_END DATE, /* Optional end date of the book */
    BOOK_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this book was initially recorded */
    FOREIGN KEY (ACCT_ID)
		REFERENCES ACCOUNT (ACCT_ID)
        ON UPDATE CASCADE
);

-- Create book activity row after a new book is inserted
DROP TRIGGER IF EXISTS trg_book_after_insert_add_activity;
DELIMITER $$

CREATE TRIGGER trg_book_after_insert_add_activity
AFTER INSERT ON BOOK
FOR EACH ROW
BEGIN
  INSERT INTO BOOK_READ_ACTIVITY (BOOK_ID, BR_ACTIVITY_LATEST_READ)
  VALUES (
    NEW.BOOK_ID,
    COALESCE(NEW.BOOK_LATEST_READ, CURRENT_TIMESTAMP) /* COALESCE is just a safety net; if for any reason BOOK_LATEST_READ is NULL, it falls back to the current timestamp. */
  );
END$$
DELIMITER ;