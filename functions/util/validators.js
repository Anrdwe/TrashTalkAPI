const isEmpty = (string) => {
    //we need to eliminate spaces or someone could put 1 space and that would be considered not empty
    if (string.trim() === '') {
        return true;
    }
    else { 
        return false;
    }
}

const isEmail = (email) => {
    //regular expression that matches the patterns of an email
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}

exports.validateSignupData = (data) => {
    //TODO: validate data
    //email must not be empty and must be valid
    let errors = {};
    //we need to make sure this is empty to procceed 

    if (isEmpty(data.email)) {   
        errors.email = 'Must not be empty'
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email address'
    }
    //for the front-end you do not need to say password must not be empty, because they already know its the password
    //this is prettier
    if (isEmpty(data.password)) errors.password = 'Must not be empty'
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if (isEmpty(data.username)) errors.username = 'Must not be empty'

    //valid property is true if there are no errors
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.validateLoginData = (data) => {
    let errors = {};
    //validation check, email and password cannot be empty
    if(isEmpty(data.email)) errors.email = "Must not be empty";
    if(isEmpty(data.password)) errors.password = "Must not be empty";
    
    //valid property is true if there are no errors
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};
    //The data is checked in case the user does not enter anything in these fields.
    //React will still send in an empty string, but we do not want to put an empty string in our database
    if(!isEmpty(data.organization.trim())) userDetails.organization = data.organization;
    if(!isEmpty(data.website.trim())) {
        //'https://example.com'
        //check to see if the user typed in 'http://'
        //for some reason the 4 in the substring function goes to p and not s
        if(data.website.trim().substring(0, 4) !== 'http') {
            //if the user did not type in 'http://', it is added
            userDetails.website = `http://${data.website.trim()}`
        } else userDetails.website = data.website;
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;
    //Only the properties that have something other than an Empty String will be returned.
    //So that if the user wanted to only update certain properties, they can leave the rest blank.
    return userDetails;
}