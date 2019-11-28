const functions = require('firebase-functions');

const express = require('express'); 
const app = express();

const { db } = require('./util/admin');

const { getAllPosts, postOnePost, uploadImage, getPost, commentOnPost, deletePost } = require('./handlers/posts');
const { signup, login, addUserDetails, getAuthenticatedUser } = require('./handlers/users');

const PostId = require('./util/postId.js');

const FBAuth = require('./util/fbAuth');

//post routes
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, postOnePost);
app.post('/post/:postId/image', FBAuth, uploadImage);
app.get('/post/:postId', getPost);
//TODO: delete post
app.delete('/post/:postId', FBAuth, deletePost);
//TODO: edit a post
//TODO: mark post as completed
app.post('/post/:postId/comment', FBAuth, commentOnPost)

//signup and login routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

//we want this https://baseurl.com/api/
exports.api = functions.region('us-east1').https.onRequest(app);

//database triggers: watches changes
//delete all comments of deleted posts
exports.onPostDelete = functions
    .region('us-east1')
    .firestore.document('/posts/{postId}')
    .onDelete((snapshot, context) => {
        const postId = context.params.postId;
        const batch = db.batch();
        return db.collection('comments').where('postId', '==', postId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`))
                })
                return batch.commit();
            })
        .catch(err => console.error(err));
    })
        
    