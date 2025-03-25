const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');

const secret_key = "E$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3424343244243o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)356536432424341#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFSSFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFSFHAFAHFBHABFHADE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHA";

async function otpTokenValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (!tokenHeader || !token) {
        return res.status(401).send({ "ERROR": "No Token. Warning." });
    }

    const public_key = fs.readFileSync('./RSA/public_key.pem');

    try {
        const payload = await verify(token, public_key);

        if (payload["secret_key"] === secret_key) {
            // Attach payload properties to the request
            req.username = payload["username"];
            req.email = payload["email"];
            req.password = payload["password"];
            req.role = payload["role"]; // role should be either "user" or "admin"
            next();
        } else {
            return res.status(401).send({ "ERROR": "Unauthorized access. Warning." });
        }
    } catch (err) {
        return res.status(401).send({ "ERROR": "Unauthorized access. Warning." });
    }
}

async function resetPasswordValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (!tokenHeader || !token) {
        return res.status(401).send({ "ERROR": "No Token. Warning." });
    }

    const public_key = fs.readFileSync('./RSA/public_key.pem');

    try {
        const payload = await verify(token, public_key);

        if (payload["secret_key"] === secret_key) {
            // Attach payload properties to the request
            req.username = payload["username"];
            req.email = payload["email"];
            req.password = payload["password"];
            req.role = payload["role"];
            next();
        } else {
            return res.status(401).send({ "ERROR": "Unauthorized access. Warning." });
        }
    } catch (err) {
        return res.status(401).send({ "ERROR": "Unauthorized access. Warning." });
    }
}

module.exports = [otpTokenValidator, resetPasswordValidator];