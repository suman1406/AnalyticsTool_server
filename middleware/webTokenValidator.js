const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "E$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3424343244243o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)356536432424341#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFSSFBAE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHABFHADBFE$#^!$%!^$*!$(UHIANJKfnkjasnfkansdklandkOIJJ()#Q$)3o4uq0409uqujIODKQJNHDOLQJNDIUHO#984u32048024uhiusjJAbdsafdjsafhbBbhBFBVHFFIWJRQO9U432432843243284OIQJFKJNJBAHFB*($!)($*!(*!$#($*#!($&!HAFKAFJBAHFBAFDABHFBASSFBASFHAFAHFBHA";

async function tokenValidator(req, res, next) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (!tokenHeader || !token) {
        return res.status(401).send({ "ERROR": "No Token. Warning." });
    }

    const public_key = fs.readFileSync('./RSA/public_key.pem');

    try {
        const payload = await verify(token, public_key);
        // console.log("Verified Payload:", payload);

        // Attach token payload properties to request object
        req.username = payload.username;
        req.email = payload.email;
        req.role = payload.role; // Expected to be "user" or "admin"
        req.exp = payload.exp;

        next();
    } catch (err) {
        console.error("Token Verification Error:", err);
        return res.status(401).send({ "ERROR": "Unauthorized access. Warning." });
    }
}

module.exports = tokenValidator;
