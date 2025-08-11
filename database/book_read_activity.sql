/* Records how many times a book has been re-read by a user*/

CREATE TABLE BOOK_READ_ACTIVITY (
	BR_ACTIVITY_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, /* Unique ID for a book read activity instance */
	BOOK_ID INT UNSIGNED NOT NULL, /* Book instance tied to this book read activity */
    BR_ACTIVITY_LATEST_READ TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* The latest time this book was re-read */
    FOREIGN KEY (BOOK_ID)
		REFERENCES BOOK (BOOK_ID)
        ON DELETE CASCADE
);