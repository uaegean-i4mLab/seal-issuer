import {
  validateToken,
  updateSessionData,
  startSession,
  generateToken,
  getSessionData,
  getSessionNewData,
} from "../back-services/sealServices";
import {
  makeUserDetails,
  buildDataStoreFromNewAPI,
} from "../helpers/DataStoreHelper";
import { publish } from "../back-services/server-sent-events";
import { generateCredentialModel } from "../model/credentialModel";
import { mySigner } from "../back-services/hsmSigner";
import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";
const { Credentials } = require("uport-credentials");
const pushTransport = require("uport-transports").transport.push;

const isSecure = process.env.SECURE;

const providerConfig = {
  rpcUrl: "https://mainnet.infura.io/v3/051806cbbf204a4886f2ab400c2c20f9",
};
const resolver = new Resolver(getResolver(providerConfig));

const credentials = new Credentials({
  appName: "'UAegean SEAL VC Issuer',",
  // did: "did:ethr:0x54e2ffCb821F9c0a8Be834a608f8229Afae35193",
  did:"did:ethr:0x51e41a6afd3c0a2862fa97846311598e31b663ec",
  signer: mySigner,
  resolver,
});

async function eidasEdugainResponse(req, res, app) {
  const msToken = req.body.msToken;
  console.log(
    `VCIssuingControllers.js eidasEdugainResponse:: the token is ${msToken}`
  );
  let sessionId = await validateToken(msToken);
  let dataStore = JSON.parse(await getSessionData(sessionId, "dataStore"));
  let edugainDataStore = await getSessionNewData(
    sessionId,
    "dataStore"
  );
  // console.log("VCIssuingControllers.js eidasEdugainResponse datastore");
  // console.log(dataStore);

  // console.log("VCIssuingControllers.js eidasEdugainResponse newDatadatastore");
  // console.log(edugainDataStore);


  if (Object.keys(dataStore).length === 0 && dataStore.constructor === Object) {
    //datastore was empty try with authentication set
    // console.log(`vcIssuingControllers.js:: the authentication set is`);
    
    // console.log(edugainDataStore);
    if (edugainDataStore) {
      dataStore = edugainDataStore;
    }
  }

  let newSessionData = await getSessionNewData(sessionId);
  let newDataStore = buildDataStoreFromNewAPI(newSessionData);
  if (newDataStore) {
    dataStore = newDataStore;
  }

  req.session.DID = true;
  req.session.userData = makeUserDetails(dataStore);
  req.session.sealSession = sessionId;

  let redirect = process.env.BASE_PATH
    ? `${req.session.endpoint}/${process.env.BASE_PATH}/vc/eidas-edugain/response`
    : `${req.session.endpoint}/vc/eidas-edugain/response`;
  req.eidasRedirectUri = redirect;
  req.edugainRedirectUri = redirect;

  return app.render(req, res, "/vc/issue/eidas-edugain", req.query);
}

async function getIssueEidasEdugain(req, res, app) {
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

  let redirect = process.env.BASE_PATH
    ? `${req.session.endpoint}/${process.env.BASE_PATH}/vc/eidas-edugain/response`
    : `${req.session.endpoint}/vc/eidas-edugain/response`;
  req.eidasRedirectUri = redirect;
  req.edugainRedirectUri = redirect;
  // console.log(req.eidasRedirectUri);
  return app.render(req, res, "/vc/issue/eidas-edugain", req.query);
}





export { getIssueEidasEdugain, eidasEdugainResponse };
