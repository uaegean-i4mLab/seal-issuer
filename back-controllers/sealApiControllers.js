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
import { uintToBase36 } from "base36id";
import { autoLinkRequest } from "../back-services/sealServices";

const moment = require("moment");

const { Credentials } = require("uport-credentials");
// const decodeJWT = require("did-jwt").decodeJWT;
// const message = require("uport-transports").message.util;
// const transports = require("uport-transports").transport;
const pushTransport = require("uport-transports").transport.push;

const providerConfig = {
  rpcUrl: "https://mainnet.infura.io/v3/051806cbbf204a4886f2ab400c2c20f9",
};
const resolver = new Resolver(getResolver(providerConfig));

const credentials = new Credentials({
  appName: "'UAegean SEAL VC Issuer',",
  // did: "did:ethr:0x54e2ffCb821F9c0a8Be834a608f8229Afae35193",
  did: "did:ethr:0x51e41a6afd3c0a2862fa97846311598e31b663ec",
  signer: mySigner,
  resolver,
});

function validate(req, res) {
  const msToken = req.query.msToken;
  res.send(validateToken(msToken));
}

async function update(req, res) {
  const sessionId = req.body.sessionId;
  const variableName = req.body.variableName;
  const variableValue = req.body.variableValue;
  res.send(updateSessionData(sessionId, variableName, variableValue));
}

async function makeSession(req, res) {
  console.log("sealApiControllers makeSession");
  let response = await startSession();
  res.send(response);
}

async function makeToken(req, res) {
  console.log("sealApiControllers makeToken");
  //sessionId, sender, receiver
  let response = await generateToken(
    req.query.sessionId,
    req.query.sender,
    req.query.receiver
  );
  res.send(response);
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
async function sealIssueVC(req, res) {
  const requestedData = req.body.data;
  const vcType = req.body.vcType;

  const sealSession = req.body.sealSession;

  let dataStore = JSON.parse(await getSessionData(sealSession, "dataStore"));

  let newSessionData = await getSessionNewData(sealSession);
  let newDataStore = buildDataStoreFromNewAPI(newSessionData);
  if (newDataStore) {
    dataStore = newDataStore;
  }

  let didResp = JSON.parse(await getSessionData(sealSession, "DID"));
  console.log("sealApiControllers, DIDResp metadata :")
  console.log(didResp)

  if (vcType === "SEAL-EIDAS-EDUGAIN" || vcType === "SEAL-EDUGAIN") {
    // console.log(`sealAPIControllers.js:: will get fetched data from new API`)
    //fetched should come from the new data store not the old one
    let newSessionData = await getSessionNewData(sealSession);
    let newDataStore = buildDataStoreFromNewAPI(newSessionData);
    if (newDataStore) {
      dataStore = newDataStore;
    }
  }
  let fetchedData = makeUserDetails(dataStore);
  let vcData = generateCredentialModel(requestedData, fetchedData, vcType);
  vcData.id = uintToBase36(Math.floor(Math.random() * Math.floor(100000000)));
  let expirationDate =
    Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;

  if (vcType === "SEAL-EIDAS-EDUGAIN") {
    console.log("*******************************");
    console.log("sealAPiControllers.js:: TRYING TO LINK");
    console.log("********************************************************");
    let eIDASDataSet = null;
    let eduGAINSet = null;
    if (dataStore.clearData && dataStore.clearData.length > 0) {
      eIDASDataSet = dataStore.clearData.find((cd) => {
        return cd.type === "eIDAS";
      });
      eduGAINSet = dataStore.clearData.find((cd) => {
        return cd.type === "eduGAIN";
      });
      if (eIDASDataSet !== null && eduGAINSet != null) {
        // update the data sets so that the mandatory field is
        // added to all attributes. This is required by the linking service
        eIDASDataSet.attributes.forEach((attr) => {
          attr.mandatory = true;
          // console.log(attr)
        });
        eduGAINSet.attributes.forEach((attr) => {
          attr.mandatory = true;
        });
        eIDASDataSet.id = "eidas";
        eduGAINSet.id = "edugain";

        let eidasName = eIDASDataSet.attributes.filter((attr) => {
          // console.log(`checking attribuete ${attr.friendlyName}`)
          return attr.friendlyName === "GivenName";
        })[0].values[0];

        let edugainName = eduGAINSet.attributes.filter((attr) => {
          // console.log(`checking edugain attribuete ${attr.friendlyName}`)
          return attr.friendlyName === "givenName";
        })[0].values[0];
        let eidasSurName = eIDASDataSet.attributes.filter((attr) => {
          return attr.friendlyName === "FamilyName";
        })[0].values[0];
        let edugainSurName = eduGAINSet.attributes.filter((attr) => {
          return attr.friendlyName === "sn";
        })[0].values[0];
        console.log(
          ` eidasName ${eidasName} edugainName ${edugainName} surname eidas ${eidasSurName} edugianSurname ${edugainSurName}`
        );
        if (
          (eidasName === edugainName &&
            eidasSurName === edugainSurName &&
            eidasName &&
            edugainName) ||
          (eidasName.toLowerCase().indexOf(edugainName.toLowerCase()) >= 0 &&
            eidasSurName.toLowerCase().indexOf(edugainSurName.toLowerCase()) >=
              0)
        ) {
          
          // vcData.metadata = {
          //   issued: res["SEAL-EDUGAIN-EIDAS"].metadata.issued,
          //   lloa: res["SEAL-EDUGAIN-EIDAS"].metadata.lloa,
          // };

          console.log("VC DATA")
          console.log(vcData)
          // await autoLinkRequest(sealSession, eIDASDataSet, eduGAINSet)
          //   .then((res) => {
          //     console.log(
          //       "sealAPiControllers.js -- sealIssueVC::  link succedeed"
          //     );
             
          //   })
          //   .catch((err) => {
          //     console.log(
          //       "sealAPiControllers.js -- sealIssueVC:: linking failed NO AUTOMATED MATCH"
          //     );
          //     vcData = null;
          //   });
        } else {
          console.log(
            "sealAPiControllers.js -- sealIssueVC:: linking failed NO MATCH"
          );
          vcData = null;
        }
      } else {
        console.log(
          "sealAPiControllers.js -- sealIssueVC:: linking failed EMPTY DATASETS"
        );
        vcData = null;
      }
    }
  }

  if (vcType !== "SEAL-isErasmusAegean") {
    if (vcData != null) {

      console.log("WILL issue non erasums with data:")
      console.log(vcData)

      credentials
        .createVerification({
          sub: didResp.did,
          exp: expirationDate,
          claim: vcData,
          vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
        })
        .then((attestation) => {
          let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
          console.log(`sealApiControllers.js pushing credential jwt::`);
          console.log(attestation);
          return push(attestation);
        })
        .then((pushed) => {
          console.log(
            `sealApiControllers.js -- sealIssueVC:: user should receive claim in any moment`
          );
          publish(JSON.stringify({ uuid: sealSession, status: "sent" }));
          res.sendStatus(200);
        });
    } else {
      console.log("VC DATA WAS NULL WILL SEND 500");
      res.sendStatus(500);
    }
  } else {
    expirationDate = moment(fetchedData.eidas.expires).unix();

    credentials
      .createVerification({
        sub: didResp.did,
        exp: expirationDate,
        claim: {
          "SEAL-UAEGEAN_Minimal_ERASMUS_ID": {
            status: {
              Affiliation: "UAegean ERASMUS+ STUDENT",
              StartDate: moment(fetchedData.eidas.starts).format("YYYY-MM-DD"),
              Expires: moment(fetchedData.eidas.expires).format("YYYY-MM-DD"),
            },
            id: uintToBase36(Math.floor(Math.random() * Math.floor(100000000))),
          },
        },
        vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
      })
      .then((attestation) => {
        let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
        console.log(
          `sealApiControllers.js -- sealIssueVC:: pushingn to wallet::`
        );
        console.log(`sealApiControllers.js pushing credential jwt::`);
        console.log(attestation);
        return push(attestation);
      });

    credentials
      .createVerification({
        sub: didResp.did,
        exp: expirationDate,
        claim: {
          "SEAL-UAEGEAN_ERASMUS_ID": {
            personal_information: {
              GivenName: vcData["SEAL-isErasmusAegean"].eidas.given_name,
              FamilyName: vcData["SEAL-isErasmusAegean"].eidas.family_name,
              DateOfBirth: vcData["SEAL-isErasmusAegean"].eidas.date_of_birth,
              source: "eIDAS",
              loa: vcData["SEAL-isErasmusAegean"].eidas.loa,
            },
            academic_information: {
              affiliation: vcData["SEAL-isErasmusAegean"].eidas.affiliation,
              hostingInstitution:
                vcData["SEAL-isErasmusAegean"].eidas.hostingInstitution,
              StartDate: moment(fetchedData.eidas.starts).format("YYYY-MM-DD"),
              Expires: moment(fetchedData.eidas.expires).format("YYYY-MM-DD"),
            },
            metadata: {
              id: uintToBase36(
                Math.floor(Math.random() * Math.floor(100000000))
              ),
            },
          },
        },
        vc: ["/ipfs/Qmdyp47YPVswPSjCwbz5roNQ7ZP73VBJQGTo8fESexY92j"],
      })
      .then((attestation) => {
        let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
        console.log(
          `sealApiControllers.js -- sealIssueVC:: pushingn to wallet::`
        );
        console.log(`sealApiControllers.js pushing credential jwt::`);
        console.log(attestation);
        return push(attestation);
      })
      .then((pushed) => {
        console.log(
          `sealApiControllers.js -- sealIssueVC:: user should receive claim in any moment`
        );
        publish(JSON.stringify({ uuid: sealSession, status: "sent" }));
        res.sendStatus(200);
      })
      .catch((error) => {
        console.log(error);
        res.sendStatus(200);
      });
  }
}

export { makeSession, update, validate, makeToken, sealIssueVC };
