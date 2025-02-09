import ejs from "ejs";
import { convert } from "html-to-text";
import path from "node:path";
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

  // FUNCTION this creates a transporter
  private transporter() {
    return nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "704926c55669e4",
        pass: "676940bfb13579",
      },
    });
  }

  // FUNCTION this sends the email
  async send(subject: string, text: string, html: string) {
    await this.transporter().sendMail({
      from: this.emailFrom,
      to: this.emailTo,
      subject,
      text,
      html,
    });
  }

  // FUNCTION returns htm string from the path which is specified
  private async renderTemplate(
    templateName: string,
    data: object
  ): Promise<string> {
    const templatePath = path.join(
      __dirname,
      "../data/templates/email-template",
      `${templateName}.ejs`
    );
    return ejs.renderFile(templatePath, data);
  }

  // FUNCTION user interact with this
  async sendResetEmail(subject: string, templateName: string, data: object) {
    // 1 : this renders the associated template
    const html: string = await this.renderTemplate("email-template", data);

    // 2 : this extracts the string from html
    const text = convert(html);

    // 3 : we send the email
    await this.send(subject, text, html);
  }
}
