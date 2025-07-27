/* Records a note for a book instance */

CREATE TABLE NOTE (
	BOOK_ID INT UNSIGNED, /* Book instance tied to this note */
    NOTE_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this note was recorded*/
    NOTE_CONTENT TEXT NOT NULL, /* Actual content of the note */
    PRIMARY KEY (BOOK_ID, COM_TIMESTAMP),
    FOREIGN KEY (BOOK_ID)
		REFERENCES BOOK (BOOK_ID)
        ON DELETE CASCADE
);