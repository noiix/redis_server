import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    const token = req.cookies.token;
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next()
  })
};