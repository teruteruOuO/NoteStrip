/* Records a note for a book instance */

CREATE TABLE NOTE (
	NOTE_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, /* Unique ID for a note instance */
	BOOK_ID INT UNSIGNED NOT NULL, /* Book instance tied to this note */
    NOTE_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this note was recorded and then updated */
    NOTE_CONTENT TEXT NOT NULL, /* Actual content of the note */
    NOTE_TITLE VARCHAR(250) NOT NULL, /* Title of the note */
    FOREIGN KEY (BOOK_ID)
		REFERENCES BOOK (BOOK_ID)
        ON DELETE CASCADE
);