import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "704926c55669e4",
    pass: "676940bfb13579",
  },
});

interface InterfaceOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: InterfaceOptions): Promise<void> => {
  console.log(options.message);
  const info = await transporter.sendMail({
    from: '"Muhammad Uzair" <uzair@zAcademy.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
};
