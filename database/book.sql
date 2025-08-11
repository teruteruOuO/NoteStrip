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
    BOOK_READ VARCHAR(3) DEFAULT('yes') NOT NULL, /* Determines if the book has been re-read again; yes at first insertion */
    BOOK_LATEST_READ TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* The latest time this book was re-read*/
    FOREIGN KEY (ACCT_ID)
		REFERENCES ACCOUNT (ACCT_ID)
        ON UPDATE CASCADE
);

ALTER TABLE BOOK
ADD CONSTRAINT CHK_BOOK_READ CHECK (BOOK_READ IN ('yes', 'no')); /* Limits BOOK_READ to only yes or no values */

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

/* Every 30 minutes, check every book with BOOK_READ as 'yes' to switch back to 'no' 10 hours after their BOOK_LATEST_READ */
CREATE EVENT ev_switch_book_read
ON SCHEDULE EVERY 30 MINUTE
STARTS CURRENT_TIMESTAMP
DO
    UPDATE BOOK
    SET BOOK_READ = 'no'
    WHERE BOOK_READ = 'yes'
      AND BOOK_LATEST_READ <= (NOW() - INTERVAL 10 HOUR);