const { admin, db } = require('../util/admin')

const config = require('../util/config')

const firebase = require('firebase');
firebase.initializeApp(config)

const {validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators')

//Sign user up
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username
    }

    const { valid, errors } = validateSignupData(newUser)

    if(!valid) return res.status(400).json(errors)

    let token, userId;
    db.doc(`/users/${newUser.username}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ username: "this username is already taken"})
            }
            else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then(data => {  
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idtoken => {
            token = idtoken;
            const userCredentials = {
                email: newUser.email,
                username: newUser.username,
                password: newUser.password,
                createdAt: new Date().toISOString(),
                userId: userId
            }
            //put the newUser inside the collection, since usernames are unique, it is the id
            return db.doc(`/users/${newUser.username}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use' })
            }
            return res.status(500).json({ general: 'Something went wrong, please try again' });
        })
}

//Log user in
exports.login = (req, res) => {
    //request email and password
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    //console.log(user.email);

    const { valid, errors } = validateLoginData(user)
    
    if(!valid) return res.status(400).json(errors)

    //if we dont have any errors, we can login the user
    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        //successful logins will return a token
        .then(token => {
            return res.json({token});
        })
        .catch((err) => {
            console.error(err);
            //wrong password or email error's custom message
            if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email'){
                return res.status(403).json({ general: 'Wrong credentials, please try again'});
            } else return res.status(500).json({ error: err.code });
        })
}

// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    //Since addUserDetails is in a protected route, it has access to req.user.username
    //through the FBAuth middleware.
    db.doc(`/users/${req.user.username}`).update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.statis(500).json({error: err.code})
        })
}
// Get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.username}`).get()
        .then(doc => {
            if(doc.exists) {
                userData.credentials = doc.data();
                return db.collection('posts').where('username', '==', req.user.username).get();
            }
        })
        .then(data => {
            userData.posts = [];
            data.forEach( doc => {
                userData.posts.push(doc.data());
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code})
        })
}