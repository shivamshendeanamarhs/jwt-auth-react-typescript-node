const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'shivamshende300@gmail.com', // Replace with your email
    pass: 'hdmb nhom nfij egvv'   // Replace with your email password or app-specific password
  }
});

// Set up email data with unicode symbols
let mailOptions = {
  from: '"Shivam Shende" <shivamshende300@gmail.com>', // Sender address
  to: 'shivamshende400@gmail.com', // List of receivers
  subject: 'Hello ✔', // Subject line
  text: 'Hello world?', // Plain text body
  html: '<b>Hello world?</b>' // HTML body
};

// Send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);
});
