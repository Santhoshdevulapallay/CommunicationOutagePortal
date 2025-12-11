var MailConfig = require("../startup/mail");
var gmailTransport = MailConfig.GmailTransport;


const mailData = {
      from: senderMailID, // sender address
      to: mailList, // list of receivers
      subject: mailSubject,
      // text: 'That was easy!',
      html: `Dear All<br/><br/>
                  ${mailBody}<br/>
                  Thanks<br/><br/>
                  SRPC`,
    };

    gmailTransport.sendMail(mailData, function (err, info) {
      if (err) {
        return res
          .status(404)
          .send(
            "Outage Applied Successfully but Mail not sent. Please intimate the same outage application through Mail"
          );
      }
    });