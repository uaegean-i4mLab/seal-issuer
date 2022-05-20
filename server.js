const express = require("express");
const https = require("https");
const fs = require("fs");
const next = require("next");
const ngrok = require("ngrok");
const jsesc = require("jsesc");
const qs = require("qs");
const request = require("request-promise");
import { claimsMetadata } from 'jolocom-lib'
import { SoftwareKeyProvider } from "@jolocom/vaulted-key-provider";
import { walletUtils } from "@jolocom/native-core";


const port = parseInt(process.env.PORT, 10) || 5000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const bodyParser = require("body-parser");
const session = require("express-session");
const MemcachedStore = require("connect-memcached")(session);
const axios = require("axios");
const moment = require("moment");

import { subscribe } from "./back-services/server-sent-events";
const makeConnectionRequest =
  require("./back-controllers/controllers").makeConnectionRequest;
const cacheUserConnectionRequest =
  require("./back-controllers/controllers").cacheUserConnectionRequest;
const credentialsIssuanceConnectionResponse =
  require("./back-controllers/controllers").credentialsIssuanceConnectionResponse;
const issueVc = require("./back-controllers/controllers").issueVC;
const sealIssueVCJolo = require("./back-controllers/controllers").issueVCJolo;
const offerResponseJolo =
  require("./back-controllers/controllers").offerResponseJolo;

const onlyConnectionRequest =
  require("./back-controllers/controllers").onlyConnectionRequest;
const onlyConnectionResponse =
  require("./back-controllers/controllers").onlyConnectionResponse;
const onlyIssueVC = require("./back-controllers/controllers").onlyIssueVC;

const getIssueEidasEdugain =
  require("./back-controllers/VCIssuingControllers").getIssueEidasEdugain;
const eidasEdugainResponse =
  require("./back-controllers/VCIssuingControllers").eidasEdugainResponse;

import { getCache } from "./helpers/CacheHelper";
const claimsCache = getCache();

import {
  makeSession,
  update,
  makeToken,
  validate,
  sealIssueVC,
} from "./back-controllers/sealApiControllers";

import {
  validateToken,
  getSessionData,
  generateToken,
  updateSessionData,
  getSessionNewData,
  autoLinkRequest,
  startSession,
} from "./back-services/sealServices";

import { updateDataStoreWithIsErasmusData } from "./back-services/ErasmusService";

import {
  makeUserDetails,
  buildDataStoreFromNewAPI,
} from "./helpers/DataStoreHelper";

// 00000000000000000000000000000000000000000000000000000000000000000000000000000000
import { JolocomSDK, NaivePasswordStore } from "@jolocom/sdk";
import { JolocomTypeormStorage } from "@jolocom/sdk-storage-typeorm";
import { createConnection } from "typeorm";
import * as WebSocket from "ws";
import { JolocomLib } from "@jolocom/sdk";
// 00000000000000000000000000000000000000000000000000000000000000000000000000000000
import { streamToBuffer } from "@jorgeferrero/stream-to-buffer";

let endpoint = "";

const memoryStore = new session.MemoryStore();
const cacheStore = new MemcachedStore({
  hosts: [
    process.env.MEMCACHED_URL
      ? process.env.MEMCACHED_URL
      : "http://localhost:11211",
  ],
  secret: "123, easy as ABC. ABC, easy as 123", // Optionally use transparent encryption for memcache session data
  ttl: process.env.TTL ? process.env.TTL : 300,
  maxExpiration: 300,
});
//export NODE_ENV=production
const isProduction = process.env.NODE_ENV === "production";
const SESSION_CONF = {
  secret: "this is my super super secret, secret!! shhhh",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  store: memoryStore,
  maxExpiration: 90000,
};

if (isProduction) {
  console.log(`will set sessionstore to memcache ${process.env.MEMCACHED_URL}`);
  SESSION_CONF.store = cacheStore;
}


const SEAL_EIDAS_URI = process.env.SEAL_EIDAS_URI
  ? process.env.SEAL_EIDAS_URI
  : // : "vm.project-seal.eu";
    "vm.project-seal.grnet.gr";
const SEAL_EIDAS_PORT = process.env.SEAL_EIDAS_PORT
  ? process.env.SEAL_EIDAS_PORT
  : "8443";
const SEAL_EDUGAIN_URI = process.env.SEAL_EDUGAIN_URI
  ? process.env.SEAL_EDUGAIN_URI
  : // : "vm.project-seal.eu";
    "vm.project-seal.grnet.gr";
const SEAL_EDUGAIN_PORT = process.env.SEAL_EDUGAIN_PORT
  ? process.env.SEAL_EDUGAIN_PORT
  : "10081";


// keycloack confniguration

const KeycloakMultiRealm = require("./back-services/KeycloakMultiRealm");
const ldapConfing = {
  "realm": "uaegean-seal-usability",
  "auth-server-url": "https://dss1.aegean.gr/auth",
  "ssl-required": "external",
  "resource": "seal-issuer",
  "credentials": {
    "secret": "4dfbdb77-826b-46fb-bc98-0f6959599a24"
  },
  "confidential-port": 0
}


const eidasRealmConfig = JSON.parse(fs.readFileSync("eidasKeycloak.json"));
// const taxisRealmConfig = JSON.parse(fs.readFileSync("taxisKeycloak.json"));

const keycloak = new KeycloakMultiRealm({ store: cacheStore }, [
  eidasRealmConfig,
  ldapConfing,
]);

//end of keycloak config

console.log("after  keycloak = new KeycloakMultiRealm")

app.prepare().then(async () => {
  const server = express();
  server.set("trust proxy", 1); // trust first proxy
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json({ type: "*/*" }));

  const typeOrmConfig = {
    name: "demoDb",
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: [
      "node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js",
    ],
    synchronize: true,
    logging: false,
  };

  const connection = await createConnection(typeOrmConfig);
  console.log("after  kawait connection = await createConnection(typeOrmConfig)")
  
  const sdk = new JolocomSDK({
    storage: new JolocomTypeormStorage(connection),
  });
  sdk.transports.ws.configure({ WebSocket });
  const alice = await sdk.createAgent("mySecretPassword", "jolo");

  console.log("after  kawait sdk.createAgent")
  
  const myPublicProfile = {
    name: "University of the Aegean",
    about: "Verifiable Credential Issuer for Academic Services",
  };

  const password = "mySecretPassword";

  // let softwareKeyProvider = SoftwareKeyProvider.newEmptyWallet(
  //   walletUtils,
  //   "id:",
  //   password
  // ).then((emptyWallet) => {
  //   console.log(emptyWallet);
  // });
  let softwareKeyProvider = await alice.keyProvider;
  // console.log(softwareKeyProvider)
  console.log("after softwareKeyProvider = await alice.keyProvider")
  const publicProfileCredential = await alice.identityWallet.create.signedCredential(
    {
      metadata: claimsMetadata.publicProfile,
      claim: myPublicProfile,
      subject: alice.identityWallet.did,
    },
    "mySecretPassword"
  );

  // Works but commented up for now
  // **************************
  // JolocomLib.didMethods.jolo.registrar
  //   .updatePublicProfile(
  //     softwareKeyProvider,
  //     password,
  //     alice.identityWallet.identity,
  //     publicProfileCredential
  //   )
  //   .then((successful) => console.log(`PYUBLIC PROFILE OK!!!!! ${successful}`)); // true

  // set session managment
  if (process.env.HTTPS_COOKIES === true) {
    SESSION_CONF.cookie.secure = true; // serve secure cookies, i.e. only over https, only for production
  }
  console.log("before use server.use(session(SESSION_CONF))")
  server.use(session(SESSION_CONF));
  console.log("after server.use(session(SESSION_CONF))")
  server.use(keycloak.middleware());


 

  //start server sent events for the server
  server.get("/events", subscribe);

  server.get(["/home", "/"], (req, res) => {
    // console.log(`server.js-home::found existing session ${req.session.id}`);
    const mockData = {};
    if (!req.session.userData) req.session.userData = mockData;
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/", req.query);
  });

  /*
    ######################################
    #### SECURE CONTROLLERS ############//
  */

  server.post("/issueVCSecure", (req, res) => {
    req.endpoint = endpoint;
    console.log("server.js -- issueVCSecure::  issueVCSecure");
    return onlyIssueVC(req, res);
  });

  // ###############################################
  server.post(
    [
      "/onlyConnectionRequest",
      "/vc/issue/onlyConnectionRequest",
      "/vc/onlyConnectionRequest",
      "/uaegean-seal-usability/onlyConnectionRequest",
    ],
    (req, res) => {
      req.endpoint = endpoint;
      req.baseUrl = process.env.BASE_PATH;
      console.log(
        "server.js -- onlyConnectionRequest::  onlyConnectionRequest"
      );
      return onlyConnectionRequest(req, res, alice);
    }
  );

  server.post(
    [
      "/onlyConnectionResponse",
      "/vc/issue/onlyConnectionResponse",
      "/vc/onlyConnectionResponse",
      "/uaegean-seal-usability/onlyConnectionResponse",
    ],
    (req, res) => {
      req.endpoint = endpoint;
      console.log(
        "server.js -- onlyConnectionResponse::  onlyConnectionResponse"
      );
      return onlyConnectionResponse(req, res, alice);
    }
  );

  // ############################################### //#endregion

  /*
    ######################################
    #### SEAL Specific Controllers ############
    ########################################
  */
  server.post(
    [
      "/seal/start-session",
      "/vc/issue/seal/start-session",
      "/uaegean-seal-usability/seal/start-session",
    ],
    async (req, res) => {
      console.log("server:: /seal/start-session");
      let result = await makeSession(req, res);
      return result;
    }
  );

  server.post(
    [
      "/seal/update-session",
      "/seal/edugain/update-session",
      "/vc/issue/seal/update-session",
      "/vc/issue/edugain/update-session",
      "/vc/eidas-edugain/seal/update-session",
      "/vc/edugain/seal/update-session",
      "/uaegean-seal-usability/seal/update-session",
      "/uaegean-seal-usability/update-session",
    ],
    async (req, res) => {
      console.log("server:: /seal/update-session");
      let result = await update(req, res);
      return result;
    }
  );

  server.get(
    [
      "/seal/make-eidas-token",
      "/vc/issue/seal/make-eidas-token",
      "/vc/make-eidas-token",
    ],
    async (req, res) => {
      console.log("server:: /vc/make-eidas-token");
      req.query.sender = process.env.SENDER_ID
        ? process.env.SENDER_ID
        : "eIDAS-IdP";
      req.query.receiver = process.env.RECEIVER_ID
        ? process.env.SENDER_ID
        : "eIDAS-IdP";
      // sessionId is provided by the caller
      let result = await makeToken(req, res);
      return result;
    }
  );

  server.get(
    [
      "/seal/make-edugain-token",
      "/vc/issue/seal/make-edugain-token",
      "/vc/make-edugain-token",
    ],
    async (req, res) => {
      console.log("server:: /vc/make-edugain-token");
      req.query.sender = process.env.SENDER_ID
        ? process.env.SENDER_ID
        : "eIDAS-IdP";
      req.query.receiver = process.env.RECEIVER_ID_EDUGAIN
        ? process.env.RECEIVER_ID_EDUGAIN
        : "edugainIDPms_001";
      // sessionId is provided by the caller
      let result = await makeToken(req, res);
      return result;
    }
  );

  server.get(["/vc/make-edugain-callback-token"], async (req, res) => {
    console.log("server:: /vc/make-edugain-token");
    req.query.sender = process.env.SENDER_ID
      ? process.env.SENDER_ID
      : "eIDAS-IdP";
    req.query.receiver = process.env.SENDER_ID
      ? process.env.SENDER_ID
      : "eIDAS-IdP";
    // sessionId is provided by the caller
    let result = await makeToken(req, res);
    return result;
  });

  server.post("/seal/issueVC", (req, res) => {
    req.endpoint = endpoint;
    console.log("server.js -- /seal/issueVC::  /seal/issueVC");
    return sealIssueVC(req, res);
  });

  server.post(
    ["/seal/offerResponse", "/offerResponse", "/issuer/offerResponse"],
    (req, res) => {
      req.endpoint = endpoint;
      req.baseUrl = process.env.BASE_PATH;
      console.log("server.js -- offerResponse");
      // console.log(req)
      return offerResponseJolo(req, res, alice);
    }
  );

  server.post("/seal/issueVCJolo", (req, res) => {
    req.endpoint = endpoint;
    req.baseUrl = process.env.BASE_PATH;
    console.log("server.js -- /seal/issueVCJolo::  /seal/issueVCJolo");
    return sealIssueVCJolo(req, res, alice);
  });

  // ### SEAL View Controllers (after calling other SEAL MSes)

  server.post(["/vc/eidas/response",  ], async (req, res) => {
    // console.log("server:: /vc/eidas/response");
    const msToken = req.body.msToken;
    // console.log(`server:: /vc/eidas/response, the token is ${msToken}`);
    // sessionId is provided by the caller
    let sessionId = await validateToken(msToken);
    let dataStore = JSON.parse(await getSessionData(sessionId, "dataStore"));
    // console.log("server.js eidas/response: ***************8");
    // console.log(dataStore);

    // let DID = await getSessionData(sessionId,"DID")
    // console.log(dataStore);
    let newSessionData = await getSessionNewData(sessionId);
    // console.log(`newSessionData`);
    // console.log(newSessionData);

    req.session.DID = true;
    req.session.userData = makeUserDetails(dataStore);
    req.session.sealSession = sessionId;

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/vc/issue/eidas", req.query);
  });

  server.get(["/vc/issue/eidas"], async (req, res) => {
    if (req.query.msToken) {
      // console.log("server.js:: /vc/issue/eidas -- got here on an existing seal session")
      // 1 retrieve SEAL sessionId
      // 1.1 check if the user has performed DID auth at a previous step.
      // 2  retrieve datastore object
      //    add results in the userData
      // 3 pass the seal session to the front end
      let sessionId = await validateToken(req.query.msToken);
      let ds = await getSessionData(sessionId, "dataStore");
      // console.log(ds)

      let did = await getSessionData(sessionId, "DID");
      if (did) {
        req.session.DID = true;
      }

      if (ds) {
        let dataStore = JSON.parse(ds);
        req.session.userData = makeUserDetails(dataStore);
      }

      req.session.sealSession = sessionId;
    }

    //if we are redirected from mobile
    if (req.query.sealSession) {
      req.session.sealSession = req.query.sealSession;
      let did = await getSessionData(req.query.sealSession, "DID");
      console.log(
        `for the session ${req.query.sealSession}  i got the DID data ${did}`
      );
      if (did) {
        req.session.DID = true;
      }
    }

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.eidasUri = SEAL_EIDAS_URI;
    req.eidasPort = SEAL_EIDAS_PORT;
    let redirect = process.env.BASE_PATH
      ? `${endpoint}/${process.env.BASE_PATH}/vc/eidas/response`
      : `${endpoint}/vc/eidas/response`;
    req.eidasRedirectUri = redirect;
    console.log(req.eidasRedirectUri);
    return app.render(req, res, "/vc/issue/eidas", req.query);
  });

  //edugain idp ms redirects with post not get!!! (eidas redirects with get)
  server.post(["/vc/edugain/response"], async (req, res) => {
    const msToken = req.query.msToken;
    console.log(`server.js:: /vc/edugain/response, the token is ${msToken}`);
    // sessionId is provided by the caller
    let sessionId = await validateToken(msToken);
    console.log("/vc/edugain/response the sesssion is" + sessionId);
    let ds = await getSessionNewData(sessionId, "dataStore");
    console.log(ds);
    // let dataStore = JSON.parse(ds);

    // let DID = await getSessionData(sessionId,"DID")
    console.log("server.js:: edugain/response----> dataStore::");
    console.log(ds);

    req.session.DID = true;
    req.session.userData = makeUserDetails(buildDataStoreFromNewAPI(ds));
    req.session.sealSession = sessionId;

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    //clear msToken so that in the server /vc/issue/edugain does not try to re valiiate it
    req.query.msToken = null;
    console.log("/vc/edugain/response will render");
    return app.render(req, res, "/vc/issue/edugain", req.query);
  });

  server.get(["/vc/issue/edugain"], async (req, res) => {
    console.log("server.js:: /vc/issue/edugain");
    if (req.query.msToken) {
      // console.log("server.js:: /vc/issue/edugain -- got here on an existing seal session")
      // 1 retrieve SEAL sessionId
      // 1.1 check if the user has performed DID auth at a previous step.
      // 2  retrieve datastore object
      //    add results in the userData
      // 3 pass the seal session to the front end
      //fetch seal session
      let sessionId = await validateToken(req.query.msToken);
      //fetch datastore from session
      let ds = await getSessionData(sessionId, "dataStore");
      // check if DID auth is completed from the session
      let did = await getSessionData(sessionId, "DID");
      if (did) {
        req.session.DID = true;
      }
      if (ds) {
        let dataStore = JSON.parse(ds);
        req.session.userData = makeUserDetails(dataStore);
      }
      console.log("the seal session is " + sessionId);
      req.session.sealSession = sessionId;
    }
    //if we are redirected from mobile
    if (req.query.sealSession) {
      console.log("seal sesion found in query");
      req.session.sealSession = req.query.sealSession;
      let did = await getSessionData(req.query.sealSession, "DID");
      if (did) {
        req.session.DID = true;
      }
    }
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.edugainUri = SEAL_EDUGAIN_URI;
    req.edugainPort = SEAL_EDUGAIN_PORT;
    let redirect = process.env.BASE_PATH
      ? `${endpoint}/${process.env.BASE_PATH}/vc/edugain/response`
      : `${endpoint}/vc/edugain/response`;
    req.edugainRedirectUri = redirect;
    console.log(`server.js edugain redirect uri ${req.edugainRedirectUri}`);
    return app.render(req, res, "/vc/issue/edugain", req.query);
  });

  server.get(["/vc/issue/isErasmusAegean"], async (req, res) => {
    if (req.query.msToken) {
      let sessionId = await validateToken(req.query.msToken);
      let ds = await getSessionData(sessionId, "dataStore");
      let did = await getSessionData(sessionId, "DID");
      if (did) {
        req.session.DID = true;
      }
      if (ds) {
        let dataStore = JSON.parse(ds);
        req.session.userData = makeUserDetails(dataStore);
      }
      req.session.sealSession = sessionId;
    }
    //if we are redirected from mobile
    if (req.query.sealSession) {
      req.session.sealSession = req.query.sealSession;
      let did = await getSessionData(req.query.sealSession, "DID");
      if (did) {
        req.session.DID = true;
      }
    }
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.eidasUri = SEAL_EIDAS_URI;
    req.eidasPort = SEAL_EIDAS_PORT;
    req.edugainUri = SEAL_EDUGAIN_URI;
    req.edugainPort = SEAL_EDUGAIN_PORT;
    let redirect = process.env.BASE_PATH
      ? `${endpoint}/${process.env.BASE_PATH}/vc/isErasmusAegean/response`
      : `${endpoint}/vc/isErasmusAegean/response`;
    req.eidasRedirectUri = redirect;
    console.log(req.eidasRedirectUri);
    return app.render(req, res, "/vc/issue/isErasmusAegean", req.query);
  });

  server.get(
    [
      "/uaegean-seal-usability/authenticate",
      "/eidas/response"
    ],
    keycloak.protect(),
    async (req, res) => {
      console.log("we accessed a protected root!");
      const sessionId = req.query.session;
      // see mockJwt.json for example response
      const idToken = req.kauth.grant.access_token.content;
      // console.log(idToken);
      let mergedData = {};
      mergedData.eidas = {};
      mergedData.eidas.given_name = idToken.given_name;
      mergedData.eidas.family_name = idToken.family_name;
      mergedData.eidas.person_identifier = idToken.email.substring(
        0,
        idToken.email.lastIndexOf("@")
      );
      mergedData.eidas.loa = "low";
      mergedData.eidas.source = "eidas";

      const eidasDetails = {
        given_name: mergedData.eidas.given_name, //"Arianna",
        family_name: mergedData.eidas.family_name, //"Garbini",
        person_identifier: mergedData.eidas.person_identifier, //"05/10/1983",
        loa: "low",
        source: "eidas",
      };
      //store response in cache
      let dataStore = await getSessionData(sessionId, "dataStore");
      if (!dataStore) {
        dataStore = {};
      }
      dataStore["eidas"] = eidasDetails;
      await updateSessionData(
        sessionId,
        "dataStore",
        jsesc(dataStore, {
          json: true,
        })
      );

      req.session.sealSession = sessionId;
      req.session.userData = mergedData;
      req.session.DID = true;
      req.session.endpoint = endpoint;
      req.session.baseUrl = process.env.BASE_PATH;

      req.url = req.url.replace(
        "uaegean-seal-usability/authenticate",
        "vc/issue/isErasmusAegean"
      );
      return app.render(req, res, "/vc/issue/isErasmusAegean", req.query);
    }
  );

  server.post(["/vc/isErasmusAegean/response"], async (req, res) => {
    console.log("server:: /vc/eidas/isErasmusAegean");
    const msToken = req.body.msToken;
    console.log(`server:: /vc/eidas/isErasmusAegean, the token is ${msToken}`);
    // sessionId is provided by the caller
    let sessionId = await validateToken(msToken);
    let dataStore = JSON.parse(await getSessionData(sessionId, "dataStore"));
    let userData = makeUserDetails(dataStore);
    if (userData.eidas) {
      updateDataStoreWithIsErasmusData(userData, req);
      req.session.DID = true;
      req.session.userData = userData;
      req.session.sealSession = sessionId;
    } else {
      let ds = await getSessionNewData(sessionId, "dataStore");
      console.log("server.js:: edugain/response----> dataStore::");
      console.log(ds);
      req.session.DID = true;
      let eduGAINData = makeUserDetails(buildDataStoreFromNewAPI(ds));
      console.log("------------------------");
      console.log(eduGAINData);
      console.log("------------------------");
      let mergedData = {};
      mergedData.eidas = {};
      mergedData.eidas.given_name = eduGAINData.edugain.givenName;
      mergedData.eidas.family_name = eduGAINData.edugain.sn;
      mergedData.eidas.person_identifier =
        eduGAINData.edugain.eduPersonEntitlement;
      mergedData.eidas.loa = "low";
      mergedData.eidas.source = "eidas";
      mergedData.eidas.affiliation = eduGAINData.edugain.schacHomeOrganization;
      /* try {
        //   await request(options, async function (error, response, body) {
        //     try {
        //       let resp = JSON.parse(body);
        //       let matchingApplication = resp.filter((application) => {
        //         console.log(
        //           `checking application.submitionStatu, found ${
        //             application.submitionStatus
        //           } result ${application.submitionStatus === "APPROVED"}`
        //         );
        //         return application.submitionStatus === "APPROVED";
        //       });
        //       if (matchingApplication) {
        //         matchingApplication.forEach((acceptedApplication) => {
        //           let startMonthOfStudy = acceptedApplication.startMonthOfStudy;
        //           let endingMonth = acceptedApplication.endMonthOfStudy;
        //           let durationOfStay = acceptedApplication.durationOfStay;
        //           let academicYear = acceptedApplication.academicYear;
        //           console.log(
        //             ` starting month--${startMonthOfStudy}--ending month--${endingMonth}--duration--${durationOfStay}--academicyear==${academicYear}--`
        //           );
        //           let startingYear = academicYear.split("-")[0];
        //           let endingYear = academicYear.split("-")[1];
        //           let activeYear = null;
        //           let activeMonth = null;
        //           if ((startMonthOfStudy === "SEP") | "OCT" | "NOV" | "DEC") {
        //             activeYear = startingYear;
        //             switch (startMonthOfStudy) {
        //               case "SEP":
        //                 activeMonth = "09";
        //                 break;
        //               case "OCT":
        //                 activeMonth = "10";
        //                 break;
        //               case "NOV":
        //                 activeMonth = "11";
        //                 break;
        //               case "DEC":
        //                 activeMonth = "12";
        //                 break;
        //             }
        //           } else {
        //             activeYear = endingYear;
        //             switch (startMonthOfStudy) {
        //               case "JAN":
        //                 activeMonth = "01";
        //                 break;
        //               case "FEB":
        //                 activeMonth = "02";
        //                 break;
        //               case "MAR":
        //                 activeMonth = "03";
        //                 break;
        //               case "APR":
        //                 activeMonth = "04";
        //                 break;
        //               case "MAY":
        //                 activeMonth = "05";
        //                 break;
        //               case "JUN":
        //                 activeMonth = "06";
        //                 break;
        //               case "JUL":
        //                 activeMonth = "07";
        //                 break;
        //               case "AUG":
        //                 activeMonth = "08";
        //                 break;
        //             }
        //           }
  
        //           if (
        //             moment(activeYear + "-" + activeMonth + "-" + "01")
        //               .add(durationOfStay, "M")
        //               .isAfter()
        //           ) {
        //             //if the accepted erasmus application will end in the future
        //             console.log(
        //               `active year: ${activeYear} and activemonth ${activeMonth}`
        //             );
        //             userData.eidas.affiliation = "UAegean ERASMUS+ Student";
        //             userData.eidas.hostingInstitution =
        //               "University of the Aegean";
        //             userData.eidas.starts = moment(
        //               activeYear + "-" + activeMonth + "-" + "01"
        //             ); //always start the first day of the month
        //             userData.eidas.expires = moment(
        //               activeYear + "-" + activeMonth + "-" + "01"
        //             ).add(durationOfStay, "M");
        //           }
        //         });
        //       } else {
        //         console.log("no matching application found");
        //       }
        //     } catch (err) {
        //       if (err) {
        //         // ERROR parsing result from AAS and proceeding with flow
        //         // display in UI and not allow credentials issuance
        //         console.log(err);
        //         req.session.error = "ERROR parsing results from AAS";
        //       }
        //     }
        //   });
        // } catch (err) {
        //   // error fetch user from aas by eID
        //   // display in UI and not allow credentials issuance
        //   console.log("ERROR1::");
        //   console.log(err);
        //   if (userData.eidas.person_identifier !== "GR/GR/ERMIS-58333947")
        //     req.session.error = "ERROR fetching results";
        // }

      // }



      // if (!userData.eidas.expires) {
      //   req.session.error =
      //     "ERROR all accepted ERASMUS applications have ended";
      // }

      // //add data to session
      // req.session.userData = userData;
      // //add data to backend (seal sm) to retrieve them when requesting issuance
      // dataStore.clearData[0].attributes.push({
      //   name: "affiliation",
      //   friendlyName: "affiliation",
      //   encoding: "UTF-8",
      //   language: "N/A",
      //   values: ["UAegean ERASMUS+ Student"],
      // });
      // dataStore.clearData[0].attributes.push({
      //   name: "hostingInstitution",
      //   friendlyName: "hostingInstitution",
      //   encoding: "UTF-8",
      //   language: "N/A",
      //   values: ["University of the Aegean"],
      // });
      // // dataStore.clearData[0].attributes.push({
      // //   name: "expires",
      // //   friendlyName: "expires",
      // //   encoding: "UTF-8",
      // //   language: "N/A",
      // //   values: [userData.eidas.expires.format()],
      // // });
      // dataStore.clearData[0].attributes.push({
      //   name: "validFrom",
      //   friendlyName: "validFrom",
      //   encoding: "UTF-8",
      //   language: "N/A",
      //   values: [userData.eidas.starts.format()],
      // });

      // let sessionUpdated = await updateSessionData(
      //   sessionId,
      //   "dataStore",
      //   jsesc(dataStore, {
      //     json: true,
      //   })
      // );
      // console.log(` updated dataStore with`);
      // console.log(dataStore);
      
    // }
  */
      req.session.sealSession = sessionId;
      req.session.userData = mergedData; //makeUserDetails(buildDataStoreFromNewAPI(ds));
    }
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/vc/issue/isErasmusAegean", req.query);
  });

  server.get(["/vc/didAuth"], async (req, res) => {
    let msToken = req.query.msToken;
    // 1. get SEAL sessionId
    // 2. display view with only didAuth request
    // 2.1 inside this view perform didAuth and update seal session
    // 2.2 inside this view at the end of didAuth redirect to clientCallbackAddr
    if (msToken) {
      let sessionId = await validateToken(msToken);
      let clientCallbackAddr = await getSessionData(
        sessionId,
        "ClientCallbackAddr"
      );
      req.session.sealSession = sessionId;
      req.session.callback = clientCallbackAddr;
    }

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/vc/didAuth", req.query);
  });

  server.get(["/vc/issue/eidas-edugain"], async (req, res) => {
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.eidasUri = SEAL_EIDAS_URI;
    req.eidasPort = SEAL_EIDAS_PORT;
    req.edugainUri = SEAL_EDUGAIN_URI;
    req.edugainPort = SEAL_EDUGAIN_PORT;
    getIssueEidasEdugain(req, res, app);
  });

  server.post(["/vc/eidas-edugain/response"], async (req, res) => {
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.eidasUri = SEAL_EIDAS_URI;
    req.eidasPort = SEAL_EIDAS_PORT;
    req.edugainUri = SEAL_EDUGAIN_URI;
    req.edugainPort = SEAL_EDUGAIN_PORT;
    let redirect = process.env.BASE_PATH
      ? `${endpoint}/${process.env.BASE_PATH}/vc/edugain/response`
      : `${endpoint}/vc/edugain/response`;
    req.edugainRedirectUri = redirect;

    console.log(`server.js edugain redirect uri ${req.edugainRedirectUri}`);
    eidasEdugainResponse(req, res, app);
  });

  server.post(["/vc/didAuth"], async (req, res) => {
    let msToken = req.body.msToken;
    let sessionId = await validateToken(msToken);
    let clientCallbackAddr = await getSessionData(
      sessionId,
      "ClientCallbackAddr"
    );
    req.session.sealSession = sessionId;
    req.session.callback = clientCallbackAddr;
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;

    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/vc/didAuth", req.query);
  });

  server.post(["/vc/eidas-edugain/response"], async (req, res) => {
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;
    req.eidasUri = SEAL_EIDAS_URI;
    req.eidasPort = SEAL_EIDAS_PORT;
    req.edugainUri = SEAL_EDUGAIN_URI;
    req.edugainPort = SEAL_EDUGAIN_PORT;
    let redirect = process.env.BASE_PATH
      ? `${endpoint}/${process.env.BASE_PATH}/vc/edugain/response`
      : `${endpoint}/vc/edugain/response`;
    req.edugainRedirectUri = redirect;

    console.log(`server.js edugain redirect uri ${req.edugainRedirectUri}`);
    eidasEdugainResponse(req, res, app);
  });

  // ################################################################33
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  if (process.env.KEY_PATH && process.env.CERT_PATH && process.env.CERT_PASS) {
    let key = fs.readFileSync(process.env.KEY_PATH);
    let cert = fs.readFileSync(process.env.CERT_PATH);
    let passphrase = process.env.CERT_PASS;

    https
      .createServer(
        {
          key: key,
          cert: cert,
          passphrase: passphrase,
        },
        server
      )
      .listen(port, (err) => {
        if (err) throw err;
        endpoint = process.env.ENDPOINT;
        console.log(`running with SSL and port is ${port}`);
      });
  } else {
    server.listen(port, (err) => {
      if (err) throw err;

      if (isProduction) {
        console.log(
          `running in production is ${isProduction} and port is ${port}`
        );
        endpoint = process.env.ENDPOINT;
      } else {
        ngrok.connect(port).then((ngrokUrl) => {
          endpoint = ngrokUrl;
          console.log(`running, open at ${endpoint}`);
        });
      }
    });
  }
});
