const validateRegisterInputs = (fname, email, password, dob) => {
    const errors = {};

    const nameRegEx = /^([a-zA-Z\s]+)$/;

    if (fname) {
        if (fname.trim() === "")
            errors.fname = " You missed a spot! Don't forget to add your name.";
        else if (fname.trim().length > 30)
            errors.fname = "Name cannot be longer than 40 character";
    } else errors.fname = " You missed a spot! Don't forget to add your name.";

    if (email) {
        if (email.trim() === "")
            errors.email = "You missed a spot! Don't forget to add your email.";
        else if (email.trim().length > 64)
            errors.email = "Email address too long!!!";
        else {
            const regEx =
                /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
            if (!email.match(regEx))
                errors.email = "Hmm...that doesn't look like an email address";
        }
    } else errors.email = "You missed a spot! Don't forget to add your email.";
    // Password validation
    if (password) {
        if (password.trim() === "")
            errors.password = "Your password is too short. It should be 6+ characters";
        else if (password.trim().length > 30)
            errors.password = "Name cannot be longer than 40 character";
    } else errors.password = "Your password is too short. It should be 6+ characters";

    return {
        valid: Object.keys(errors).length > 0 ? false : true,
        errors,
    };
};

const validateLoginInputs = (email, password) => {
    const errors = {};

    if (email) {
        if (email.trim() === "")
            errors.email = "You missed a spot! Don't forget to add your email.";
        else if (email.trim().length > 64)
            errors.email = "Email address too long!!!";
        else {
            const regEx =
                /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
            if (!email.match(regEx)) errors.email = "Hmm... that does'nt look like email";
        }
    } else errors.email = "You missed a spot! Don't forget to add your email.";

    if (password) {
        if (password.trim() === "")
            errors.password = "The password is too short. It should be 6+ characters";
    } else errors.password = "The password is too short. It should be 6+ characters";

    return {
        valid: Object.keys(errors).length > 0 ? false : true,
        errors,
    };
};

module.exports = { validateRegisterInputs, validateLoginInputs };
