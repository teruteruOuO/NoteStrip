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
  
SHOW EVENTS;

