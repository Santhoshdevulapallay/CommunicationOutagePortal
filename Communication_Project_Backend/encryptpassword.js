const bcrypt = require("bcrypt");



async function encryptpassword(pass) {
    // console.log("in");
    // await User.deleteMany({});
    // console.log(user_data);
    // await Link.deleteMany({});
    // await Equipment.deleteMany({});
  
   
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(pass, salt);
      console.log(password);

}

encryptpassword('123456');