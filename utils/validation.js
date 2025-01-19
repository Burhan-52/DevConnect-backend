import validator from "validator";

export const validateSignUpData = (req) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName && !lastName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email is not valid!");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password");
  }
};

export const validateProfileEditData = (req) => {
  const allowedEditFiled = [
    "firstName",
    "lastName",
    "email",
    "photoUrl",
    "gender",
    "about",
    "skills",
    "age",
  ];

  const isEditAllowed = Object.keys(req.body).some((field) =>
    allowedEditFiled.includes(field)
  );

  return isEditAllowed;
};
