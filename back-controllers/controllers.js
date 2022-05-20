const { Credentials } = require("uport-credentials");
const decodeJWT = require("did-jwt").decodeJWT;
const message = require("uport-transports").message.util;
const transports = require("uport-transports").transport;
const pushTransport = require("uport-transports").transport.push;
import { mySigner } from "../back-services/hsmSigner";
import { publish } from "../back-services/server-sent-events";
import { generateCredentialModel } from "../model/credentialModel";
import UserCache from "../model/userCache";
const uuidv1 = require("uuid/v1");
import DIDResponse from "../model/DIDResponse";
import { getCache } from "../helpers/CacheHelper";
import {
  updateSessionData,
  getSessionData,
} from "../back-services/sealServices";
// import { Resolver } from 'did-resolver'
// import { getResolver } from 'ethr-did-resolver'
var qr = require("qr-image");
import jwt_decode from "jwt-decode";

const imageDataURI = require("image-data-uri");
import { streamToBuffer } from "@jorgeferrero/stream-to-buffer";
const jsesc = require("jsesc");

const claimsCache = getCache();
// const providerConfig = { rpcUrl: 'https://mainnet.infura.io/v3/051806cbbf204a4886f2ab400c2c20f9' }
// const resolver = new Resolver(getResolver(providerConfig))
const Resolver = require("did-resolver");
const ethrDid = require("ethr-did-resolver").getResolver();
let resolver = new Resolver.Resolver(ethrDid);
const credentials = new Credentials({
  appName: "'UAegean SEAL VC Issuer',",
  // did: "did:ethr:0x54e2ffCb821F9c0a8Be834a608f8229Afae35193",
  did: "did:ethr:0x51e41a6afd3c0a2862fa97846311598e31b663ec",
  signer: mySigner,
  resolver,
});

function root(req, res) {
  credentials
    .createDisclosureRequest({
      notifications: true,
      callbackUrl: req.endpoint + "/callback",
      // vc: [
      //   "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzE4MTQ5MTIsInN1YiI6ImRpZDpldGhyOjB4ZDUwMmEyYzcxZThjOTBlODI1MDBhNzA2ODNmNzVkZTM4ZDU3ZGQ5ZiIsImNsYWltIjp7Im5hbWUiOiJUaGUgVW5pdmVyc2l0eSBvZiB0aGUgQWVnZWFuIiwicHJvZmlsZUltYWdlIjp7Ii8iOiIvaXBmcy9RbVljcHZSaGg2V1N1VjVIaHFLS2hzZHdxSFg4UTQxRTZ0ellnUThxbWlNNzROIn0sImJhbm5lckltYWdlIjp7Ii8iOiIvaXBmcy9RbVh1SDRFZnJMUXQyZmFmZUdzMUd5SGpxNzFDZEtwOUUzZXNpcTV2WVFETFVNIn0sInVybCI6ImFlZ2Vhbi5nci9jaXR5In0sImlzcyI6ImRpZDpldGhyOjB4ZDUwMmEyYzcxZThjOTBlODI1MDBhNzA2ODNmNzVkZTM4ZDU3ZGQ5ZiJ9.LmSTmjPPqBut2_wcqwrYIFrW9oBTULk1V_sXBsrFaW0rUNe-3Zh4SiBXYRawx_VjvCC9Yn1K3yzqfRpm-uV9zgE"
      // ],
      act: "none", // specifically, this needs to point to a JWT stored on ipfs that contains the service data
      // signed with the same key used in the DID
    })
    .then((requestToken) => {
      console.log("**************Request******************");
      console.log(decodeJWT(requestToken)); //log request token to console
      const uri = message.paramsToQueryString(
        message.messageToURI(requestToken),
        { callback_type: "post" }
      );
      console.log(uri);
      const qr = transports.ui.getImageDataURI(uri);
      res.send(`<div><img src="${qr}"/></div>`);
    });
}

// makes a QR code containing a uport Connection  request
// and cachces which attirbutes are to be added to the VC after the user
// accepts the conneciton request
// if this is in a mobile enviroment an custom url containing the request
// will be sent. This url will be sent to the OS using by the receiver of it
function issueVC(req, res) {
  console.log(`controller.js - issueVC:: `);
  // console.log(req.body);
  let requestedData = req.body.data;
  let vcType = req.body.vcType;
  let isMobile = req.body.isMobile ? true : false;
  // let sessionId = req.session.id;
  let fetchedData = req.session.userData;
  let matchingUserAttributes = generateCredentialModel(
    requestedData,
    fetchedData,
    vcType
  );
  // console.log(
  //   `controllers.js- issueVC::   the actual values that will be added to the vc are`
  // );
  // console.log(matchingUserAttributes);

  // create the connection request. This will be used
  // to push the VC to the user, once this Connection Request has been accepted
  let uuid = uuidv1();

  claimsCache.set(uuid, matchingUserAttributes, 10000);

  let callback = req.baseUrl
    ? `${req.endpoint}/${req.baseUrl}/requestIssueResponse?uuid=${uuid}`
    : req.endpoint + "/requestIssueResponse?uuid=" + uuid;

  credentials
    .createDisclosureRequest({
      notifications: true,
      callbackUrl: callback,
      vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
      act: "none",
    })
    .then((requestToken) => {
      console.log(
        "controllers.js: ************ Generating Request******************"
      );
      const uri = message.paramsToQueryString(
        message.messageToURI(requestToken),
        { callback_type: "post" }
      );

      if (isMobile) {
        // const urlTransport = transport.url.send()
        // res.send((urlTransport(uri)));
        res.send({ qr: uri, uuid: uuid });
      } else {
        const qr = transports.ui.getImageDataURI(uri);
        res.send({ qr: qr, uuid: uuid });
      }
    });
}

async function issueVCJolo(req, res, alice) {
  console.log(`controller.js - issueVC:: `);
  // console.log(req.body);

  let requestedData = req.body.data;
  let vcType = req.body.vcType;
  console.log(`issueVCJolo VcType: ${vcType}`);
  let credType =
    vcType.indexOf("isErasmus") >= 0
      ? "UAegean_myID_Card"
      : vcType.indexOf("EIDAS-EDUGAIN") >= 0
      ? "UAegean_myLinkedID"
      : vcType.indexOf("EIDAS") >= 0
      ? "UAegean_myeIDAS_ID"
      : "UAegean_myeduGAIN_ID";
  console.log("HEY I WILL issue a vc with type:: " + credType);
  let isMobile = req.body.isMobile ? true : false;
  let sealSessionId = req.body.sealSession;
  let fetchedData = req.session.userData;
  let matchingUserAttributes = generateCredentialModel(
    requestedData,
    fetchedData,
    vcType
  );

  let callback = req.baseUrl
    ? `${req.endpoint}/${req.baseUrl}/offerResponse?vcType=${vcType}&seal=${sealSessionId}`
    : req.endpoint + `/offerResponse?vcType=${vcType}&seal=${sealSessionId}`;

  let did = await getSessionData(sealSessionId, "DID");
  await updateSessionData(
    sealSessionId,
    "user",
    jsesc(matchingUserAttributes, {
      json: true,
    })
  );

  console.log("=====>controllers.js MatchingUserAttributes<==========");
  console.log(matchingUserAttributes);

  let propertiesForCredOffer = [];
  if (credType === "UAegean_myeduGAIN_ID") {
    propertiesForCredOffer.push({
      path: ["$.schacHomeOrganization"],
      label: "Schac Home Organization",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.mail"],
      label: "Institutional Email",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.givenName"],
      label: "Given Name",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.sn"],
      label: "Surname",
      value: "",
    });
  }
  if (credType === "UAegean_myeIDAS_ID") {
    propertiesForCredOffer.push({
      path: ["$.given_name"],
      label: "Given Name",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.family_name"],
      label: "Family Name",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.person_identifier"],
      label: "Person Identifier",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.loa"],
      label: "LoA",
      value: "",
    });
  }

  if (credType === "UAegean_myID_Card") {
    /*
    claimValues.family_name = userData.eidas.family_name;
    claimValues.given_name = userData.eidas.given_name;
    claimValues.date_of_birth = userData.eidas.date_of_birth;
    claimValues.person_identifier = userData.eidas.person_identifier;
    claimValues.loa = userData.eidas.loa;
    claimValues.affiliation = userData.eidas.affiliation;
    claimValues.hostingInstitution = userData.eidas.hostingInstitution;
    claimValues.starts = userData.eidas.starts;
    claimValues.expires = userData.eidas.expires;
*/

    propertiesForCredOffer.push({
      path: ["$.given_name"],
      label: "Given Name",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.family_name"],
      label: "Family Name",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.person_identifier"],
      label: "Person Identifier",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.date_of_birth"],
      label: "Date of Birth",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.loa"],
      label: "Level of Assurance",
      value: "",
    });

    propertiesForCredOffer.push({
      path: ["$.affiliation"],
      label: "Affiliation",
      value: "",
    });
    propertiesForCredOffer.push({
      path: ["$.hostingInstitution"],
      label: "Hosting Institution",
      value: "",
    });

    propertiesForCredOffer.push({
      path: ["$.starts"],
      label: "Program Start",
      value: "",
    });

    propertiesForCredOffer.push({
      path: ["$.expires"],
      label: "Program Termination",
      value: "",
    });
  }

  let aliceCredOffer = await alice.credOfferToken({
    callbackURL: callback,
    offeredCredentials: [
      {
        type: credType,
        renderInfo: {
          renderAs: "document",
        },
        credential: {
          name: credType,
          display: {
            properties: propertiesForCredOffer,
          },
        },
        // userAttributes: matchingUserAttributes[vcType],
        // userDID: did,
      },
    ],
  });

  console.log("controllers.js::===> The Credential Offer is <=======");
  console.log(aliceCredOffer._payload.interactionToken._offeredCredentials);

  if (vcType.indexOf("isErasmusAegean") >= 0) {
    console.log("issueVCJOLO---- offer is isEramsus ");
    aliceCredOffer = await alice.credOfferToken({
      callbackURL: callback,
      offeredCredentials: [
        {
          type: credType,
          renderInfo: {
            renderAs: "document",
          },
          credential: {
            name: credType,
            display: {
              properties: propertiesForCredOffer,
            },
          },
        },
        {
          type: "UAegean_Disposable_ID",
          renderInfo: {
            renderAs: "document",
          },
          credential: {
            name: "UAegean_Disposable_ID",
            display: {
              properties: [
                { path: ["$.affiliation"], label: "Affiliation", value: "" },

                {
                  path: ["$.hostingInstitution"],
                  label: "Hosting Institution",
                  value: "",
                },

                { path: ["$.starts"], label: "Program Start", value: "" },

                {
                  path: ["$.expires"],
                  label: "Program Termination",
                  value: "",
                },
              ],
            },
          },
        },
      ],
    });
  }

  var code = qr.image(aliceCredOffer.encode(), {
    type: "png",
    ec_level: "L",
    size: 100,
    margin: 3,
  });
  // let dataBuffer = new Buffer(code);
  // PNG | GIF | etc.
  let mediaType = "PNG";
  // RETURNS :: image data URI :: 'data:image/png;base64,PNGDATAURI/wD/'
  let encodedQR = imageDataURI.encode(await streamToBuffer(code), mediaType);
  // res.cookie('userAttr',matchingUserAttributes);
  res.send({ qr: encodedQR });
}

async function offerResponseJolo(req, res, alice) {
  console.log("offerResponseJolo");

  let sealSessionId = req.query.seal;
  let vcType = req.query.vcType;
  let matchingUserAttributes = JSON.parse(
    await getSessionData(sealSessionId, "user")
  )[vcType]; //jwt_decode(req.body.token).interactionToken.selectedCredentials[0].userAttributes[userAttributesKey];
  // console.log(matchingUserAttributes);

  let userDID = await getSessionData(sealSessionId, "DID");

  if (vcType.indexOf("EIDAS") >= 0 && vcType.indexOf("EDUGAIN") >= 0) {
    console.log("found linking!! ");
    if (
      !(
        matchingUserAttributes.eidas.family_name &&
        matchingUserAttributes.edugain.sn &&
        matchingUserAttributes.eidas.family_name.toLowerCase() ===
          matchingUserAttributes.edugain.sn.toLowerCase() &&
        matchingUserAttributes.eidas.given_name &&
        matchingUserAttributes.edugain.givenName &&
        matchingUserAttributes.eidas.given_name.toLowerCase() ===
          matchingUserAttributes.edugain.givenName.toLowerCase()
      )
    ) {
      console.log("linking failed!! no match");
      res.sendStatus(403);
      return "";
    }
  }
  const alicesIssuance = await getCredentialIssuanceFromVCType(
    alice,
    vcType,
    matchingUserAttributes,
    userDID,
    req,
    sealSessionId
  );
  res.send({ token: alicesIssuance.encode() });
}

async function getCredentialIssuanceFromVCType(
  alice,
  vcType,
  userData,
  userDID,
  req,
  sessionId
) {
  //{"SEAL-EIDAS-EDUGAIN":
  //{"eidas":{"given_name":"ΧΡΙΣΤΙΝΑ CHRISTINA","family_name":"ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA","person_identifier":"GR/GR/ERMIS-58333947","date_of_birth":"1980-01-01",
  //"source":"eidas","loa":"low"},
  //"edugain":{"mail":"seal-test0@example.com","givenName":"ΧΡΙΣΤΙΝΑ CHRISTINA",
  //"sn":"ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA","displayName":"ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA",
  //"eduPersonEntitlement":"urn:mace:grnet.gr:seal:test","source":"edugain","loa":"low"},
  //"linkLoa":"low"}}
  console.log("getCredentialIssuanceFromVCType");
  let credType =
    vcType.indexOf("isErasmus") >= 0
      ? "UAegean_myID_Card"
      : vcType.indexOf("EIDAS-EDUGAIN") >= 0
      ? "UAegean_myLinkedID"
      : vcType.indexOf("EIDAS") >= 0
      ? "UAegean_myeIDAS_ID"
      : "UAegean_myeduGAIN_ID";
  console.log("HEY I WILL issue a vc with type:: " + credType);
  const simpleExampleCredMetadata = {
    type: ["Credential", credType],
    name: credType,
    context: [
      {
        SimpleExample: `https://seal.project.eu/terms/${credType}`,
        schema: "https://schema.org/",
        source: "schema:source",
      },
    ],
  };

  let claimValues = {
    // source: userData.source,
  };

  if (vcType.indexOf("EIDAS") >= 0 || vcType.indexOf("isErasmusAegean") >= 0) {
    simpleExampleCredMetadata.context[0].family_name = "schema:familyName";
    simpleExampleCredMetadata.context[0].given_name = "schema:name";
    simpleExampleCredMetadata.context[0].date_of_birth = "schema:brithDate";
    simpleExampleCredMetadata.context[0].person_identifier = "schema:Person";
    simpleExampleCredMetadata.context[0].loa = "schema:loa";
    claimValues.family_name = userData.eidas.family_name;
    claimValues.given_name = userData.eidas.given_name;
    if (userData.eidas.date_of_birth)
      claimValues.date_of_birth = userData.eidas.date_of_birth;
    if (userData.eidas.person_identifier)
      claimValues.person_identifier = userData.eidas.person_identifier;
    if (userData.eidas.loa) claimValues.loa = userData.eidas.loa;
  }
  if (vcType.indexOf("isErasmusAegean") >= 0) {
    if (userData.eidas.affiliation)
      claimValues.affiliation = userData.eidas.affiliation;
    claimValues.hostingInstitution = "University of the Aegean"; //userData.eidas.hostingInstitution;
    claimValues.starts = "01/10/2021"; //userData.eidas.starts;
    claimValues.expires = "25/08/2022"; //userData.eidas.expires;
  }
 
 

  const alicesCredAboutBob = await alice.signedCredential(
    {
      metadata: simpleExampleCredMetadata,
      subject: userDID,
      claim: claimValues,
    },
    "mySecretPassword"
  );

  // console.log("controller.js ====> Alice Cred about Bob WILL ISSUE::")
  // console.log(alicesCredAboutBob)
  // console.log(claimValues)

  const minIdCredential = {
    type: ["Credential", "UAegean_Disposable_ID"],
    name: `UAegean_Disposable_ID`,
    context: [
      {
        SimpleExample: `https://seal.project.eu/terms/${credType}`,
        schema: "https://schema.org/",
        source: "schema:source",
      },
    ],
  };

  let minCredValues = {
    // source: userData.source,
  };
  if (userData.eidas) {
    minCredValues.loa = userData.eidas.loa;
    // minCredValues.affiliation = userData.eidas.affiliation;
    minCredValues.hostingInstitution = "University of the Aegean"; //userData.eidas.hostingInstitution;
    minCredValues.starts = "01/10/2021"; //userData.eidas.starts;
    minCredValues.expires = "25/02/2022"; //userData.eidas.expires;
  }

  const alicesInteraction = await alice.processJWT(req.body.token);
  if (vcType.indexOf("isErasmusAegean") >= 0) {
    const minCrede = await alice.signedCredential(
      {
        metadata: minIdCredential,
        subject: userDID,
        claim: minCredValues,
      },
      "mySecretPassword"
    );

    publish(
      JSON.stringify({
        uuid: sessionId,
        sessionId: sessionId,
        status: "sent",
      })
    );

    return await alicesInteraction.createCredentialReceiveToken([
      alicesCredAboutBob,
      minCrede,
    ]);
  } else {
    console.log("controllers.js JOLOCOM, will send credential");
    console.log(alicesCredAboutBob);
    // console.log("with claims values")
    // console.log(claimValues)

    publish(
      JSON.stringify({
        uuid: sessionId,
        sessionId: sessionId,
        status: "sent",
      })
    );

    return await alicesInteraction.createCredentialReceiveToken([
      alicesCredAboutBob,
    ]);
  }
}

// accepts the response form a connection request form the uportwallet
// based on a session uuid retrieves the user attributes
// and then generates a VC and sends it to the device of the user
function credentialsIssuanceConnectionResponse(req, res) {
  const jwt = req.body.access_token;
  const uuid = req.query.uuid;
  const matchingUserAttributes = claimsCache.get(uuid);
  console.log("controllers.js:: **************RESPONSE******************");
  credentials
    .authenticateDisclosureResponse(jwt)
    .then((creds) => {
      console.log(
        "controllers.js credentialsIssuanceConnectionResp:: cached user attributes"
      );
      console.log(matchingUserAttributes);

      // Create and push the generated credential to the users wallet
      credentials
        .createVerification({
          sub: creds.did,
          exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
          claim: matchingUserAttributes,
          vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
        })
        .then((attestation) => {
          let push = pushTransport.send(creds.pushToken, creds.boxPub);
          console.log(attestation);
          return push(attestation);
        })
        .then((pushed) => {
          console.log(`user should receive claim in any moment`);
          publish(JSON.stringify({ uuid: uuid, status: "sent" }));
          res.send(200);
        });
    })
    .catch((err) => {
      console.log(err);
      publish(JSON.stringify({ uuid: uuid, status: "rejected" }));
    });
}

// makes a QR code containing a uport Connection  request
// and cachces which attirbutes are to be added to the VC after the user
// accepts the conneciton request
function makeConnectionRequest(req, res) {
  // create the connection request. This will be used
  // to push the VC to the user, once this Connection Request has been accepted
  let uuid = uuidv1();
  credentials
    .createDisclosureRequest({
      notifications: true,
      callbackUrl: req.endpoint + "/cacheUserConnectionRequest?uuid=" + uuid,
      vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
      act: "none",
    })
    .then((requestToken) => {
      console.log(
        "controllers.js: makeConnectionRequest ************ Generating Request******************"
      );
      const uri = message.paramsToQueryString(
        message.messageToURI(requestToken),
        { callback_type: "post" }
      );
      const qr = transports.ui.getImageDataURI(uri);
      res.send({ qr: qr, uuid: uuid });
    });
}

// caches the users conneciton request to the current session
// this way the user can authenticate at a later stage (at e.g. eIDAS) and
// then get issued the VC. i.e. this way the user session becomes binded with their DID
// and there cannot be any session highjacking
function cacheUserConnectionRequest(req, res) {
  const jwt = req.body.access_token;
  const uuid = req.query.uuid;
  credentials
    .authenticateDisclosureResponse(jwt)
    .then((creds) => {
      console.log(
        "controllers.js cacheUserConnectionRequest:: cached user did response for the current session"
      );
      let userDetails = new UserCache(uuid, null, creds);
      claimsCache.set(uuid, userDetails, 1200000); // cached for 20 minutes
      publish(JSON.stringify({ uuid: uuid, status: "connected" }));
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      publish(JSON.stringify({ uuid: uuid, status: "error" }));
      res.sendStatus(500);
    });
}

/*
      #############################
      ######## SECURE FLOW ########
      ###########################//#endregion
*/

/* generates a uPort connection Request and pushes it to the mobile (either as QR or custom url),
   the receiving endpoint -- onlyConnectionResponse -- will cache the DID auth response
   -- additionally it generates a UUID used to match (secretly the client session)
   -- caches the combination uuid -- sessionId (key:: uuid)
*/

async function onlyConnectionRequest(req, res, alice) {
  let sealSession = req.body.sealSession;
  let vcType = req.body.vcType;
  console.log(`sealSession is ${sealSession}`);
  console.log(`vcType is ${vcType}`);
  let isMobile = req.body.isMobile ? true : false;
  let callback = req.baseUrl
    ? `${req.endpoint}/${req.baseUrl}/onlyConnectionResponse?sealSession=${sealSession}`
    : req.endpoint + "/onlyConnectionResponse?sealSession=" + sealSession;
  let redirectUri = req.baseUrl
    ? `${req.endpoint}/${req.baseUrl}/vc/issue/${vcType}?sealSession=${sealSession}`
    : req.endpoint + `/vc/issue/${vcType}?sealSession=` + sealSession;

  const authRequest = await alice.authRequestToken({
    callbackURL: `${callback}`,
    description: "connect with SEAL/myIDs SSI Issuer?",
  });
  // console.log(authRequest);
  var code = qr.image(authRequest.encode(), {
    type: "png",
    ec_level: "H",
    size: 10,
    margin: 10,
  });

  // let dataBuffer = new Buffer(code);
  // PNG | GIF | etc.
  let mediaType = "PNG";
  // RETURNS :: image data URI :: 'data:image/png;base64,PNGDATAURI/wD/'
  let encodedQR = imageDataURI.encode(await streamToBuffer(code), mediaType);

  // store in the sessionManager the (sealSession,issuerSession)
  let sessionUpdated = await updateSessionData(
    sealSession,
    "issuerSession",
    req.session.id
  );

  // console.log("server-onlyConnectionRequest:: ");
  // console.log(sessionUpdated);
  res.send({ qr: encodedQR, uuid: sealSession });
}
/*
    Receives a uPort connection response and caches the DID authe details for future use
    Caches it, in the seal session manager with key (var) DID:
    - suject DID
    - pushToken
    - boxPub
    Requires: sealSession in req.body
    Sends: SSE with sealSession and status connected
    Updates: updates the session with the variable session.did = true
*/
async function onlyConnectionResponse(req, res, alice) {
  console.log("controllers.js onlyConnectionResponse ");
  const sealSessionId = req.query.sealSession; //get the sesionId that is picked up from the response uri
  // retrieve the server sessionId from the SesssionManager
  let serverSession = await getSessionData(sealSessionId, "issuerSession");

  const didAuthResponse = await alice.processJWT(req.body.token);
  // console.log(didAuthResponse)
  // console.log(didAuthResponse.participants.responder.didDocument.did);
  const did = didAuthResponse.participants.responder.didDocument.did;
  // const bobsAuthResponse = await didAuthResponse.createAuthenticationResponse();
  // console.log(bobsAuthResponse);

  let sessionUpdated = await updateSessionData(sealSessionId, "DID", did);

  req.session.did = true;
  publish(
    JSON.stringify({
      uuid: sealSessionId,
      sessionId: serverSession,
      status: "connected",
    })
  );
  // console.log((await didAuthResponse.createResolutionResponse()).encode());
  // res.send((await didAuthResponse.createResolutionResponse()).encode() );
  let responseToken = await didAuthResponse.createAuthenticationResponse();

  res.set({
    "access-control-expose-headers": "WWW-Authenticate,Server-Authorization",
    "content-type": "text/html; charset=utf-8",
    vary: "origin",
    "strict-transport-security": "max-age=31536000",
    "cache-control": "no-cache",
    "content-length": "0",
    "content-type": "text/html; charset=utf-8",
  });
  res.status(200).end();
}

/*
 Accepts:
   - post param: data containing the user VC requested data
  Gets from session:
   - the received user attributes
  Gets from the cache, using the session (uuid) of the client:
   - the DID auth response
  and pushes to the wallet of the user the VC based on the retrieved attributes  
*/
function onlyIssueVC(req, res) {
  const requestedData = req.body.data;
  const vcType = req.body.vcType;
  // const sessionId = req.session.id;
  const uuid = req.query.uuid; //get the sesionId that is picked up from the response uri
  let fetchedData = req.session.userData;
  let vcData = generateCredentialModel(requestedData, fetchedData, vcType);
  console.log(`controllers.js -- onlyIssueVC:: vcData::`);
  console.log(vcData);
  // get the user DID authentication details
  console.log(`did-${uuid}`);
  const didResp = claimsCache.get(`did-${uuid}`);
  // Create and push the generated credential to the users wallet
  credentials
    .createVerification({
      sub: didResp.did,
      exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
      claim: vcData,
      vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
    })
    .then((attestation) => {
      let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
      console.log(`controllers.js -- onlyIssueVC:: pushingn to wallet::`);
      console.log(attestation);
      return push(attestation);
    })
    .then((pushed) => {
      console.log(
        `controllers.js -- onlyIssueVC:: user should receive claim in any moment`
      );
      publish(JSON.stringify({ uuid: uuid, status: "sent" }));
      res.send(200);
    });
}

export {
  root,
  credentialsIssuanceConnectionResponse,
  issueVC,
  cacheUserConnectionRequest,
  makeConnectionRequest,
  onlyConnectionRequest,
  onlyConnectionResponse,
  onlyIssueVC,
  issueVCJolo,
  offerResponseJolo,
};
