/* Entity about the user's personal information */

CREATE TABLE ACCOUNT (
	ACCT_ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,  /* Account ID of a user */
    ACCT_EMAIL VARCHAR(150) NOT NULL UNIQUE, /* Current email of a user. Must be unique*/
    ACCT_PASSWORD VARCHAR(300) NOT NULL,  /* Password for a user; used for logging in */
    ACCT_NICKNAME VARCHAR(150), /* Nickname of a user. Takes precedence in profile over username */
    ACCT_VERIFIED VARCHAR(3) NOT NULL DEFAULT 'no', /* Yes or No regarding the verification of the user's email */
    ACCT_ACTIVE VARCHAR(3) NOT NULL DEFAULT 'no', /* Will always be yes after the user successfully creates their account */
    ACCT_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* The timestamp the account was created before email verification */
);

ALTER TABLE ACCOUNT
ADD CONSTRAINT CHK_ACCT_EMAIL CHECK (ACCT_EMAIL LIKE '%_@_%._%'), /* Email must always have the xxxxx@xxx.xxx format */
ADD CONSTRAINT CHK_ACCT_VERIFIED CHECK (ACCT_VERIFIED IN ('yes', 'no')), /* ACCT_VERIFIED must only either be yes or no */
ADD CONSTRAINT CHK_ACCT_ACTIVE CHECK (ACCT_ACTIVE IN ('yes', 'no')); /* ACCT_ACTIVE must only either be yes or no */