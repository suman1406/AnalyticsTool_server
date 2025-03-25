const TEMPLATE_OFFICIAL_CREATED = (email, profName, password) => {
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
        <p>Dear ${profName},</p>
        <br />
        <p>Greetings from Social Media Analytics Tool App. Welcome!</p>
        <p>You have been registered by the admin to the app. Here is your credentials. Head to the login page to continue to login.</p>
        <br />
        <p>EmailID: ${email}</p>
        <p>Password: ${password}</p>
        <br />
        <p>Regards,</p>
        <p>Social Media Analytics Tool</p>
    </body>

    </html>`;
}

module.exports = TEMPLATE_OFFICIAL_CREATED;