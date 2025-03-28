const TEMPLATE_PWRESET_OTP = (otp, userName) => {
    return `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Social Media Analytics Tool OTP</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
        </style>
    </head>

    <body>
        <p>Dear ${userName},</p>
        <br />
        <p>Your OTP to reset your account password is:</p>
        <br />
        <h1>${otp}</h1>
        <br />
        <p>Please use within 5 mins. Don't share your otp with anyone.</p>
        <br />
        <p>Regards,</p>
        <p>Social Media Analytics Tool</p>
    </body>

    </html>`;
}

module.exports = TEMPLATE_PWRESET_OTP;