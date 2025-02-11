"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ejs_1 = __importDefault(require("ejs"));
const html_to_text_1 = require("html-to-text");
const node_path_1 = __importDefault(require("node:path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
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
class Email {
    constructor(emailFrom, emailTo) {
        this.emailFrom = emailFrom;
        this.emailTo = emailTo;
    }
    // FUNCTION this creates a transporter
    transporter() {
        return nodemailer_1.default.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "704926c55669e4",
                pass: "676940bfb13579",
            },
        });
    }
    // FUNCTION this sends the email
    send(subject, text, html) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transporter().sendMail({
                from: this.emailFrom,
                to: this.emailTo,
                subject,
                text,
                html,
            });
        });
    }
    // FUNCTION returns htm string from the path which is specified
    renderTemplate(templateName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = node_path_1.default.join(__dirname, "../data/templates/email-template", `${templateName}.ejs`);
            return ejs_1.default.renderFile(templatePath, data);
        });
    }
    // FUNCTION user interact with this
    sendResetEmail(subject, templateName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1 : this renders the associated template
            const html = yield this.renderTemplate("email-template", data);
            // 2 : this extracts the string from html
            const text = (0, html_to_text_1.convert)(html);
            // 3 : we send the email
            yield this.send(subject, text, html);
        });
    }
}
exports.default = Email;
