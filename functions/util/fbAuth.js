const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
    let idToken;
    //in the header there is an object {'autherization' : 'Bearer Token'}
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        //we need to extract the token, by using split here, we will get 2 strings 'Bearer ' and the token
        //we want the second element the token
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        //403 is an authorized error
        //No token found error if there is nothing after Bearer
        console.error('No token found')
        return res.status(403).json({ error: 'Unautheorized' });
    }
    //we need verify this token was issued by our application 
    admin
        .auth()
        .verifyIdToken(idToken)
        //this returns a promise that is a decodedToken, which holds the data that is inside our token
        .then(decodedToken => {
            //we want to add this data to the request object, so that when we proceed to the next route,
            //our request will have extra data(user data) from the middleware
            req.user = decodedToken;
            console.log(decodedToken);
            //since the username is not stored in the firebase authentication system,
            //we need to get the username in our collection of users.
            //we already have the user in the request, so we can use the uid to find it.
            return db
                .collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        //the promised data will have only 1 element in its docs, which is the user with the userid
        .then(data => {
            req.user.username = data.docs[0].data().username;
            req.user.email = data.docs[0].data().email;
            req.user.organization = data.docs[0].data().organization;
            //returning next() will allow it to proceed to the next step
            return next()
        })
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}