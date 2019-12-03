# Trashtalk API
## Uses firebase authentication, store, database, and functions

## Folder structure
### /functions/handlers
>- contains the JS files that handle requests
- #### /functions/handlers/posts.js
>- <strong>getAllPosts:</strong> get request, gets all the posts from the 'posts' collection in the firebase database as a json object that contains an array of objects. An object includes information about the post and the poster: 1. postId, 2. email, 3. username, 4. organization, 5. message, 6. date, 7. imageUrl. The post objects are in descending order by the data in the array.
>- <strong>postOnePost:</strong> post request, requires authentication token in the header. Takes an object with a single key, message, as input. Creates a new a document in the 'posts' collection with the email, username and organization of the authenticated user, the inputed messaged, the current date, and a default imageUrl. Response returns the postId
>- <strong>uploadImage:</strong> post request, stores the image in the firebase storage and adds an imageUrl to a post. The Id of the post needs to be in the Url. Uses busboy to parse form data as input. Only png and jpeg images are accepted. 
>- <strong>getPost:</strong> get request, gets a specific post. The id of the post needs to be in the Url. Responds returns the post object.
>- <strong>commentOnPost:</strong> post request, adds a doc in the 'comments' collection. The Id of the post needs to be in the Url. Takes a message as input. The doc contains: 1. inputed message, 2. current date, 2. postId in the Url, 3. username of poster.
>- <strong>removeComment:</strong> NOT DONE
>- <strong>deletePost:</strong> delete request, deletes the a post document in the 'posts' collection and all the documents in the 'comments' collection that contains the Id of the deleted post document.
- #### /functions/handlers/users.js
>- <strong>signup</strong>
>- <strong>login</strong>
>- <strong>addUserDetails</strong>
>- <strong>getAuthenticatedUser</strong>
### /functions/util
#### /functions/util/admin.js
>- 
#### /functions/util/fbAuth.js
>- 
#### /functions/util/validators.js
>- <strong>isEmpty</strong>
>- <strong>isEmail</strong>
>- <strong>validateSignupData</strong>
>- <strong>validateLoginData</strong>
>- <strong>reduceUserDetails</strong>
