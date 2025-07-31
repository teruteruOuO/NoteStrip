import dotenv from 'dotenv';
import { IEmail, IMailOptions } from '../../types/types';
dotenv.config();

export class EmailConfiguration {
    // Readonly shared configuration for all instances
    public static readonly systemEmail: IEmail = {
        service: "gmail",
        auth: {
            user: process.env.NODEMAILER_EMAIL || "noemail@gmail.com",
            pass: process.env.NODEMAILER_PASSWORD || "nopassword"
        },
        pool: true,
        maxConnections: 1,
        maxMessages: 5,
        rateLimit: 5,
        tls: { rejectUnauthorized: false }
    }

    // Instance-specific properties
    private mailOptions: IMailOptions;

    /**
     * @param to Recipient's email
     * @param subject Email subject
     * @param contentType Specify 'text' or 'html'
     * @param content The actual message content
     */
    constructor(to: string, subject: string, contentType: 'text' | 'html', content: string) {
        this.mailOptions = {
            from: `"NoteStrip" <${process.env.NODEMAILER_EMAIL}>`,
            to,
            subject,
            ...(contentType === 'text' ? { text: content } : { html: content })
        };
    }

    // Returns this instance's mail options
    public getMailOptions(): IMailOptions {
        return { ...this.mailOptions };
    }
}

// How to use
/* 
const user1Email = new EmailConfiguration('user1@example.com', 'Welcome User 1');
const user2Email = new EmailConfiguration('user2@example.com', 'Welcome User 2');

console.log(user1Email.getMailOptions());
console.log(user2Email.getMailOptions());

console.log(EmailConfiguration.systemEmail);
*/