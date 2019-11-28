const { admin, db } = require('../util/admin');
const config = require('../util/config');

//Return a json object of the posts in the Posts collect in descending order by date
exports.getAllPosts = (req, res) => {
    db
        .collection('posts')
        .orderBy('date', 'desc')
        .get()
        .then(data => {
            let posts = [];
            data.forEach((doc) => {
                posts.push({
                    postId: doc.id,
                    email: doc.data().email,
                    username: doc.data().username,
                    organization: doc.data().organization,
                    message: doc.data().message,
                    date: doc.data().date,
                    imageUrl: doc.data().imageUrl
                });
            });
            return res.json(posts);
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code});
    });
};

//Create a post in the Posts collection
//Input for a post is only a message
exports.postOnePost = (req, res) => {
    if (req.body.message.trim() === '') {
        return res.status(400).json({ message: 'Message must not be empty'});
    }
    //if there is no image, use this one
    const noImg = 'No-Image-Available.png';
    const newPost = {
        email: req.user.email,
        username: req.user.username,   //we added the user to the req already in FBAuth
        organization: req.user.organization,
        message: req.body.message,
        date: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`
    };
    db
        .collection('posts')
        .add(newPost)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully`});
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong'});
            console.error(err);
        });
};



//Upload an image to a specifc postId
exports.uploadImage = (req, res) => {
    db.doc(`/posts/${req.params.postId}`).get()
    .then(doc => {
        if(!doc.exists) {
            return res.status(404).json({ error: 'Post not found' });
        }})
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    
    let imageFileName;
    let imageToBeUploaded = {};

    //busboy parses incoming form data
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
        //mimetype is in the format: 'image/extension'
        //we only want mimetype 'image/jpeg' and 'image/png'
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted'})
        }
        //we need to extract the file extension ex: the png in image.png
        //after the filename is split, we want the last part of the filename, where the extension is
        const imageExtension = filename.split('.')[filename.split('.').length-1];
        //Generate a random filename, so that there is no same names
        imageFileName = `${Math.round(Math.random()*1000000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        //the upload function returns a promise
        .then(() => {
            //if we don't add alt=media, it will download the file to our computer.
            //we only want to show it on the browser
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            //we need to add the imageUrl to our post document
            //in the middleware postId.js, the postId from the header is saved in the req
            return db.doc(`/posts/${req.params.postId}`).update({ imageUrl: imageUrl });
        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code});
        });
    });
    busboy.end(req.rawBody);
}

exports.getPost = (req, res) => {
    let postData = {};
    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists) {
                return res.status(404).json({ error: "Post not found" })
            }
            postData = doc.data();
            postData.postId = doc.id;
            return db
                .collection('comments')
                .orderBy('date', 'desc')
                .where('postId', '==', req.params.postId).get()
        })
        .then(data => {
            postData.comments = [];
            data.forEach(doc => {
                postData.comments.push(doc.data())
            });
            return res.json(postData);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code })
        });
}

// Comment on a post
exports.commentOnPost = (req, res) => {
    //Check to see if an empty comment was submitted 
    if(req.body.message.trim() === '') return res.status(400).json({ comment: 'Must not be empty' });
    
    const newComment = {
        message: req.body.message,
        date: new Date().toISOString(),
        postId: req.params.postId,
        username: req.user.username
    }
    //Check to see if the post to be commented on exists
    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists) {
                return res.status(404).json({ error: 'Post not found' });
            }
            //Update comment count of doc, which is the post
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
        })
        .then(() => {
            //comment added to comments collection if the post exists
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            //the comment is returned to be added to the user interface
            res.json(newComment);
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: 'Something went wrong' })
        })
}

//Delete comment NOT DONE
exports.removeComment = (req, res) => {
    //Check to see if the post  exists
    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists) {
                return res.status(404).json({ error: 'Post not found' });
            }
            //delete the specific document in this comments path
            //the id is store in the document itself not in the data
            return db.doc(`/comments/${data.docs[0].id}`).delete()
                .then(() => {
                    res.json("comment deleted")
                })
            })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: 'Something went wrong' })
        })
}

// Delete post

exports.deletePost = (req, res) => {
    const document = db.doc(`/posts/${req.params.postId}`);
    document.get()
        .then(doc => {
            //check if the post exists
            if (!doc.exists) {
                return res.status(404).json({ error: 'Post not found' })
            }
            //check the userId of the Post is the same as the user from the token, make sure this user is the owner
            if (doc.data().username !== req.user.username) {
                return res.status(403).json({ error: 'Unauthorized' })
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Post deleted successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}