import nodemailer from "nodemailer";

// THIS WAS PREVIOUS APPROACH
// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "704926c55669e4",
//     pass: "676940bfb13579",
//   },
// });

// interface InterfaceOptions {
//   email: string;
//   subject: string;
//   message: string;
// }

// export const sendEmail = async (options: InterfaceOptions): Promise<void> => {
//   const info = await transporter.sendMail({
//     from: '"Muhammad Uzair" <admin@zAcademy.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   });
// };

export default class Email {
  private emailFrom: string;
  private emailTo: string;

  constructor(emailFrom: string, emailTo: string) {
    this.emailFrom = emailFrom;
    this.emailTo = emailTo;
  }

  transporter() {
    if (process.env.NODE_ENV === "production") {
      console.log("transporter in production mode");
    }

    return nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "704926c55669e4",
        pass: "676940bfb13579",
      },
    });
  }

  async send(subject: string, text: string) {
    await this.transporter().sendMail({
      from: this.emailFrom,
      to: this.emailTo,
      subject,
      text,
    });
  }

  async sendResetEmail(subject: string, text: string) {
    await this.send(subject, text);
  }
}
