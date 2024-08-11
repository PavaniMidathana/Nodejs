const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject2 = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//AuthenticateToken Middleware Function
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        //console.log(request.username);
        next();
      }
    });
  }
};

//1.login user API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken: jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//2.GET states API
app.get("/states/", authenticateToken, async (request, response) => {
  const getStatesQuery = `SELECT state_id as stateId,
                                 state_name as stateName,
                                 population
    FROM state
    ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

//3.GET state API
app.get("/states/:stateId/", authenticateToken, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT state_id as stateId,
                                 state_name as stateName,
                                 population
     FROM state 
     WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

//4.Add Districts API
app.post("/districts/", authenticateToken, async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO 
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES 
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  const dbResponse = await db.run(addDistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//5.Get district API
app.get(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const getDistrictQuery = `SELECT * 
     FROM district 
     WHERE district_id = ${districtId};`;
    const district = await db.get(getDistrictQuery);
    response.send(convertDbObjectToResponseObject2(district));
  }
);

//6.Delete district API
app.delete(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const districtDeleteQuery = `DELETE FROM 
            district
    WHERE 
            district_id = ${districtId};`;
    await db.run(districtDeleteQuery);
    response.send("District Removed");
  }
);

//7.Update district API
app.put(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const districtUpdateQuery = `UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;
    await db.run(districtUpdateQuery);
    response.send("District Details Updated");
  }
);

//8.Get the statistics of a particular state
app.get(
  "/states/:stateId/stats/",
  authenticateToken,
  async (request, response) => {
    const { stateId } = request.params;
    const getStateQuery = `SELECT sum(cases) as totalCases,
                                sum(cured) as totalCured,
                                sum(active) as totalActive,
                                sum(deaths) as totalDeaths
     FROM district  
     WHERE state_id = ${stateId};`;
    const state = await db.get(getStateQuery);
    response.send(state);
  }
);

module.exports = app;
