const moment = require("moment");


async function updateDataStoreWithIsErasmusData(userData, req) {
  console.log("----------updateDataStoreWithIsErasmusData----------------");
  console.log(userData);
  console.log("----------updateDataStoreWithIsErasmusData----------------");
  // if (
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "GR/GR/ERMIS-58333947".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "PT/GR/15862180".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "GR/GR/ERMIS-59659924".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "GR/GR/ERMIS-27655708".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "IT/GR/INFC0001TESTEU".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "ES/GR/53377873W".toLowerCase() ||
  //   userData.eidas.person_identifier.toLowerCase() ===
  //     "EE/GR/37601230152".toLowerCase() ||
  //   isUsability(userData.eidas.given_name) ||
  //   isEdugainDataSet(userData)
  //   //
  // ) {
    // if (isEdugainDataSet(userData)) {
    //   useData.eidas = {};
    // }
    userData.eidas.affiliation = "UAegean ERASMUS+ Student";
    userData.eidas.hostingInstitution = "University of the Aegean";
    userData.eidas.starts = moment("2021-06-01"); //always start the first day of the month
    userData.eidas.expires = moment("2021-09-25");
  // } else {
  //   userData = await getAttributesFromAAS(userData, req);
  // }
  if (!userData.eidas.expires) {
    req.session.error = "ERROR all accepted ERASMUS applications have ended";
  }

  //add data to session
  req.session.userData = userData;
  //add data to backend (seal sm) to retrieve them when requesting issuance
  dataStore.clearData[0].attributes.push({
    name: "affiliation",
    friendlyName: "affiliation",
    encoding: "UTF-8",
    language: "N/A",
    values: ["UAegean ERASMUS+ Student"],
  });
  dataStore.clearData[0].attributes.push({
    name: "hostingInstitution",
    friendlyName: "hostingInstitution",
    encoding: "UTF-8",
    language: "N/A",
    values: ["University of the Aegean"],
  });
  dataStore.clearData[0].attributes.push({
    name: "expires",
    friendlyName: "expires",
    encoding: "UTF-8",
    language: "N/A",
    values: [userData.eidas.expires.format()],
  });
  dataStore.clearData[0].attributes.push({
    name: "validFrom",
    friendlyName: "validFrom",
    encoding: "UTF-8",
    language: "N/A",
    values: [userData.eidas.starts.format()],
  });

  let sessionUpdated = await updateSessionData(
    sessionId,
    "dataStore",
    jsesc(dataStore, {
      json: true,
    })
  );
  console.log(` updated dataStore with`);
  console.log(dataStore);
}

async function getAASCallOptions() {
  //make API call to see if the user is an erasmus student
  let keycloakAuthTokenEndpoint = process.env.KEYCLOAK_OAUTH_TOKEN
    ? process.env.KEYCLOAK_OAUTH_TOKEN
    : "https://eidasiss.aegean.gr/service-sso/realms/eidas/protocol/openid-connect/token";
  let client_id = "seal_isErasmus_oauth";
  let client_secret = "b0812062-44ff-4fa6-90e1-2f8f708d4918";
  let token = await axios({
    method: "post",
    url: keycloakAuthTokenEndpoint,
    data: qs.stringify({
      client_id: client_id,
      client_secret: client_secret,
      grant_type: "client_credentials",
      scope: "openid",
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  // console.log(`the token i got from keycloak is `)
  // console.log(token.data.access_token)
  let isAegeanQueryEndpoint = process.env.IS_ERASMUS_URI
    ? process.env.IS_ERASMUS_URI
    : `http://aas.aegean.gr/api/users/applications`;

  const options = {
    method: "GET",
    url: isAegeanQueryEndpoint,
    qs: { eid: userData.eidas.person_identifier.toLowerCase() },
    headers: {
      Authorization: `Bearer ${token.data.access_token}`,
    },
  };
  return options;
}

async function getAttributesFromAAS(userData, req) {
  let options = getAASCallOptions();
  try {
    await request(options, async function (error, response, body) {
      try {
        let resp = JSON.parse(body);
        let matchingApplication = resp.filter((application) => {
          console.log(
            `checking application.submitionStatu, found ${
              application.submitionStatus
            } result ${application.submitionStatus === "APPROVED"}`
          );
          return application.submitionStatus === "APPROVED";
        });
        if (matchingApplication) {
          matchingApplication.forEach((acceptedApplication) => {
            let startMonthOfStudy = acceptedApplication.startMonthOfStudy;
            let endingMonth = acceptedApplication.endMonthOfStudy;
            let durationOfStay = acceptedApplication.durationOfStay;
            let academicYear = acceptedApplication.academicYear;
            console.log(
              ` starting month--${startMonthOfStudy}--ending month--${endingMonth}--duration--${durationOfStay}--academicyear==${academicYear}--`
            );
            let startingYear = academicYear.split("-")[0];
            let endingYear = academicYear.split("-")[1];
            let activeYear = null;
            let activeMonth = null;
            if ((startMonthOfStudy === "SEP") | "OCT" | "NOV" | "DEC") {
              activeYear = startingYear;
              switch (startMonthOfStudy) {
                case "SEP":
                  activeMonth = "09";
                  break;
                case "OCT":
                  activeMonth = "10";
                  break;
                case "NOV":
                  activeMonth = "11";
                  break;
                case "DEC":
                  activeMonth = "12";
                  break;
              }
            } else {
              activeYear = endingYear;
              switch (startMonthOfStudy) {
                case "JAN":
                  activeMonth = "01";
                  break;
                case "FEB":
                  activeMonth = "02";
                  break;
                case "MAR":
                  activeMonth = "03";
                  break;
                case "APR":
                  activeMonth = "04";
                  break;
                case "MAY":
                  activeMonth = "05";
                  break;
                case "JUN":
                  activeMonth = "06";
                  break;
                case "JUL":
                  activeMonth = "07";
                  break;
                case "AUG":
                  activeMonth = "08";
                  break;
              }
            }

            if (
              moment(activeYear + "-" + activeMonth + "-" + "01")
                .add(durationOfStay, "M")
                .isAfter()
            ) {
              //if the accepted erasmus application will end in the future
              console.log(
                `active year: ${activeYear} and activemonth ${activeMonth}`
              );
              userData.eidas.affiliation = "UAegean ERASMUS+ Student";
              userData.eidas.hostingInstitution = "University of the Aegean";
              userData.eidas.starts = moment(
                activeYear + "-" + activeMonth + "-" + "01"
              ); //always start the first day of the month
              userData.eidas.expires = moment(
                activeYear + "-" + activeMonth + "-" + "01"
              ).add(durationOfStay, "M");
            }
          });
        } else {
          console.log("no matching application found");
        }
      } catch (err) {
        if (err) {
          // ERROR parsing result from AAS and proceeding with flow
          // display in UI and not allow credentials issuance
          console.log(err);
          req.session.error = "ERROR parsing results from AAS";
        }
      }
    });
  } catch (err) {
    // error fetch user from aas by eID
    // display in UI and not allow credentials issuance
    console.log("ERROR1::");
    console.log(err);
    if (userData.eidas.person_identifier !== "GR/GR/ERMIS-58333947")
      req.session.error = "ERROR fetching results";
  }

  return userData;
}

function isUsability(name) {
  console.log("checking for usability " + name);
  let result = false;
  let testUsers = [
    "Salas",
    "Muñoz",
    "Agua",
    "Carrasco",
    "Reyes",
    "Nalda",
    "Ferrada",
    "Blasco",
    "Suliano",
    "Teixeira",
    "Freitas",
    "Ângelo",
    "Mesquita",
    "Mazarakis",
    "Papadimitriou",
    "Lavidopoulou",
    "Apergi",
    "Katsatos",
    "Kironomos",
    "Giannakopoulos",
    "Little",
    "Orlandi",
    "SOFIANOPOULOS",
    "ΠΕΤΡΟΥ PETROU",
    "ΑΝΔΡΕΑΣ ANDREAS",
    "Aikaterini"
  ];
  testUsers.forEach((user) => {
    if (name.indexOf(user) >= 0) {
      result = true;
    }
  });
  return result;
}

function isEdugainDataSet(useData) {
  return userData.edugain;
}

export { updateDataStoreWithIsErasmusData };
