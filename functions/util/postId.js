const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
    let id;
    if (req.headers.postid) {
        id = req.headers.postid;
        req.postId = id;   
    }
    else {
        console.log('no post id')
        return res.status(400).json();

    }
    return next();
}
