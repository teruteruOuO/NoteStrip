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