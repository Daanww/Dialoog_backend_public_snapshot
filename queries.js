const Pool = require('pg').Pool
const auth = require('./auth')
const pool = new Pool({
  user: process.env.DATABASE_URL.split("/")[2].split(":")[0],
  host: process.env.DATABASE_URL.split("@")[1].split(":")[0],
  database: process.env.DATABASE_URL.split("/")[3],
  password: process.env.DATABASE_URL.split("@")[0].split(":")[2],
  port: process.env.DATABASE_URL.split(":")[3].split("/")[0],
  ssl: {
    rejectUnauthorized: false
  }
})



const login = (request, response) => {
  const { email, password} = request.body;

  const hashedPass = auth.getHashedPassword(password);



  pool.query('SELECT * FROM users WHERE email = $1 AND password = $2;', [email, hashedPass], (error, results) => {
    if (error) {
      console.log("ERROR during email/password verification!");
      throw error;
    }

    //console.log(`first query results.rows: ` + results.rows.toString());


    if(results.rows.length == 0) {
      //console.log("INVALID EMAIL/PASSWORD!\n");
      response.status(401).send("Invalid email and or password.\n");
    }
    else {
      //generate authentication token for this user
      const authtoken = auth.generateAuthToken();

      
      pool.query('UPDATE users SET authtoken = $1 WHERE userid = $2', [authtoken, results.rows[0].userid], (error2, results2) => {
        if(error2){
          throw error2;
        }
      });
      results.rows[0].authtoken = authtoken;

      response.status(200).json(results.rows);
      
      
    }
  });
}






const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY userid ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
}


const getUserById = (request, response) => {
  const id = parseInt(request.params.id);
  const {authtoken} = request.body;

  console.log("id: " + id);
  console.log("authtoken: " + authtoken);

  pool.query('SELECT * FROM users WHERE userid = $1 AND authtoken = $2', [id, authtoken], (error, results) => {
    if (error) {
      throw error;
    }
    if(results.rows.length == 0) {
      response.status(401).send("Invalid authentication and or userid.\n");
    } else {
      response.status(200).json(results.rows);
    }
  })
}



const createUser = (request, response) => {
  const { name, password, email } = request.body;
  const hashedPass = auth.getHashedPassword(password);
  pool.query('INSERT INTO users (name, password, email) VALUES ($1, $2, $3) RETURNING userid', [name, hashedPass, email], (error, results) => {
    if (error) {
      throw error
    }
    //response.status(201).send(`User added with ID: ${results.rows}\n`)
    response.status(201).json(results.rows);
  })
}




const updateUser = (request, response) => {
  const id = parseInt(request.params.id);
  const { name, password, email, authtoken } = request.body;
  const hashedPass = auth.getHashedPassword(password);
  pool.query(
    'UPDATE users SET name = $1, password = $2, email = $3 WHERE userid = $4 AND authtoken = $5 RETURNING userid',
    [name, hashedPass, email, id, authtoken],
    (error, results) => {
      if (error) {
        throw error
      }
      if (results.rows.length == 0) {
        response.status(401).send("Invalid authentication and or userid.\n");
      }
      else{
        response.status(200).send(`User modified with ID: ${id}\n`);
      }
    }
  );
}



const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)
  const {authtoken} = request.body;

  pool.query('DELETE FROM users WHERE userid = $1 AND authtoken = $2', [id, authtoken], (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows.length == 0) {
      response.status(401).send("Invalid authentication and or userid.\n");
    }
    else {
      response.status(200).send(`User deleted with ID: ${id}\n`)
    }
  })
}





const updateAnswer = (request, response) => {
  const { userid, answernumber, answervalue, authtoken} = request.body;
  var query = 'UPDATE users SET answer';
  query += answernumber;
  query += ' = $1 WHERE userid = $2 AND authtoken = $3 RETURNING answer';
  query += answernumber;

  pool.query(
    query, [answervalue, userid, authtoken], (error, results) => {
      if (error) {
        throw error
      }
      if(results.rows.length == 0) {
        response.status(401).send("Invalid authentication and or userid.\n");
      }
      else {
        response.status(200).send(`Answer${answernumber} has been modified.\n`)
      }
    }
  )
}




const deleteAnswer = (request, response) => {
  const userid = parseInt(request.params.id)
  const {authtoken} = request.body;

  pool.query('UPDATE users SET answer1 = 3, answer2 = 3, answer3 = 3 WHERE userid = $1 AND authtoken = $2 RETURNING userid', [userid, authtoken], (error, results) => {
    if (error) {
      throw error
    }
    if(results.rows.length == 0) {
      response.status(401).send("Invalid authentication and or userid.\n");
    }
    else {
      response.status(200).send(`Answers for userid ${userid} have been deleted\n`)
    }
  }
  );
}


module.exports = {
  login,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAnswer,
  deleteAnswer
}
