CREATE DATABASE NOTESTRIP;
USE NOTESTRIP;

/* Entity about the user's personal information */
CREATE TABLE ACCOUNT (
	ACCT_ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,  /* Account ID of a user */
    ACCT_EMAIL VARCHAR(150) NOT NULL UNIQUE, /* Current email of a user. Must be unique*/
    ACCT_PASSWORD VARCHAR(300) NOT NULL,  /* Password for a user; used for logging in */
    ACCT_NICKNAME VARCHAR(150), /* Nickname of a user. */
    ACCT_VERIFIED VARCHAR(3) NOT NULL DEFAULT 'no', /* Yes or No regarding the verification of the user's email */
    ACCT_ACTIVE VARCHAR(3) NOT NULL DEFAULT 'no', /* Will always be yes after the user successfully creates their account */
    ACCT_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP /* The timestamp the account was created before email verification */
);
ALTER TABLE ACCOUNT
ADD CONSTRAINT CHK_ACCT_EMAIL CHECK (ACCT_EMAIL LIKE '%_@_%._%'), /* Email must always have the xxxxx@xxx.xxx format */
ADD CONSTRAINT CHK_ACCT_VERIFIED CHECK (ACCT_VERIFIED IN ('yes', 'no')), /* ACCT_VERIFIED must only either be yes or no */
ADD CONSTRAINT CHK_ACCT_ACTIVE CHECK (ACCT_ACTIVE IN ('yes', 'no')); /* ACCT_ACTIVE must only either be yes or no */

/* Logs a user's activity throughout their logged in window */
CREATE TABLE ACTIVITY_LOG (
	LOG_ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, /* Unique ID for activity log*/
    ACCT_ID INT UNSIGNED NOT NULL, /* User that invoked this activity log instance */
    LOG_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time the activity log was recorded */
    LOG_TYPE VARCHAR(6) NOT NULL, /* Must either be user or system */
    LOG_DESCRIPTION TEXT NOT NULL, /* Description of the activity */
    FOREIGN KEY (ACCT_ID)
		REFERENCES ACCOUNT (ACCT_ID)
        ON DELETE CASCADE
);
ALTER TABLE ACTIVITY_LOG
ADD CONSTRAINT CHK_LOG_TYPE CHECK (LOG_TYPE IN ('user', 'system')); /* Limits LOG_TYPE to only user or system values */

/* Records temporary verification codes for signing up, changing email, etc. until they are expired */
CREATE TABLE VERIFICATION_CODE (
	CODE_ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, /* Unique ID for a verification code */
    ACCT_ID INT UNSIGNED NOT NULL, /* User tied to this verification code instance */
    CODE_CONTENT VARCHAR(15) NOT NULL, /* Actual content of the code that will be used to verify */
    CODE_CREATED TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this code was created */
    CODE_EXPIRATION TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 10 MINUTE), /* Adds a 10 minute duration to the code */
    FOREIGN KEY (ACCT_ID)
		REFERENCES ACCOUNT (ACCT_ID)
        ON DELETE CASCADE
);
CREATE EVENT IF NOT EXISTS delete_expired_verification_codes
ON SCHEDULE EVERY 1 MINUTE
DO
  DELETE FROM VERIFICATION_CODE
  WHERE CODE_EXPIRATION < CURRENT_TIMESTAMP;

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

/* Records a note for a book instance */
CREATE TABLE NOTE (
	BOOK_ID INT UNSIGNED, /* Book instance tied to this note */
    NOTE_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Time this note was recorded*/
    NOTE_CONTENT TEXT NOT NULL, /* Actual content of the note */
    PRIMARY KEY (BOOK_ID, NOTE_TIMESTAMP),
    FOREIGN KEY (BOOK_ID)
		REFERENCES BOOK (BOOK_ID)
        ON DELETE CASCADE
);

